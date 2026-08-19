import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Three bugs the graph shipped with, each reported by a user looking at a real
 * panel, each invisible to the existing tests.
 *
 * The mock is the important part: the real react-cytoscapejs runs the layout
 * ITSELF and invokes its `cy` prop on EVERY update, not just on mount. A mock
 * that only fires `cy` once cannot see bug 3 at all — which is exactly why
 * these regressions slipped through.
 */

type CyRecord = {
  layoutRuns: number;
  tapBindings: number;
  tapHandlers: Array<(evt: { target: { id: () => string } }) => void>;
};

const cyRecord: CyRecord = { layoutRuns: 0, tapBindings: 0, tapHandlers: [] };
const stylesheets: unknown[] = [];

function makeFakeCy(): Record<string, unknown> {
  const collection = {
    forEach: () => {},
    filter: () => ({ length: 0 }),
    removeClass: () => {},
    length: 0,
  };
  return {
    batch: (cb: () => void) => cb(),
    nodes: () => collection,
    edges: () => collection,
    elements: () => collection,
    layout: () => ({
      run: () => {
        cyRecord.layoutRuns += 1;
      },
    }),
    fit: () => {},
    png: () => 'data:image/png;base64,',
    on: (_evt: string, _sel: string, cb: (e: { target: { id: () => string } }) => void) => {
      cyRecord.tapBindings += 1;
      cyRecord.tapHandlers.push(cb);
    },
  };
}

const fakeCy = makeFakeCy();

vi.mock('react-cytoscapejs', () => ({
  default: (props: Record<string, unknown>) => {
    stylesheets.push(props.stylesheet);
    // Mirror the real component: it hands the instance back on every update.
    (props.cy as (cy: unknown) => void)?.(fakeCy);
    return <div data-testid="graph-canvas" aria-hidden="true" />;
  },
}));
vi.mock('cytoscape-cose-bilkent', () => ({ default: {} }));

import { DeclarativeRenderer } from './DeclarativeRenderer';

const GRAPH = {
  type: 'Graph',
  props: {
    title: 'Case graph',
    nodes: [
      { id: 'a', label: 'Alice', type: 'person', mention_count: 4 },
      { id: 'b', label: 'Bob', type: 'person', mention_count: 2 },
    ],
    edges: [{ id: 'e', source: 'a', target: 'b', label: 'knows', weight: 1 }],
    on_node_click: { action: 'call' as const, function: 'open_node', params: {} },
  },
};

function styleOf(sheet: unknown, selector: string): Record<string, unknown> {
  const rules = sheet as Array<{ selector: string; style: Record<string, unknown> }>;
  return rules.find((r) => r.selector === selector)?.style ?? {};
}

describe('graph render regressions', () => {
  it('sizes labels in px, because cytoscape cannot resolve rem', async () => {
    stylesheets.length = 0;
    render(<DeclarativeRenderer node={GRAPH} />);
    await waitFor(() => expect(stylesheets.length).toBeGreaterThan(0));

    // A canvas has no CSS engine and no root font-size: cytoscape parses the
    // number and drops the unit, so '.625rem' became a 0.625 PIXEL font. The
    // labels were drawn the whole time, just too small for a human to see.
    for (const selector of ['node', 'edge']) {
      const size = String(styleOf(stylesheets[0], selector)['font-size'] ?? '');
      expect(size, `${selector} font-size must be px`).toMatch(/^\d+(\.\d+)?px$/);
      expect(parseFloat(size), `${selector} font-size must be legible`).toBeGreaterThanOrEqual(6);
    }
  });

  it('leaves the layout to react-cytoscapejs, and never runs a second pass', async () => {
    cyRecord.layoutRuns = 0;
    const { rerender } = render(<DeclarativeRenderer node={GRAPH} />);
    await waitFor(() => expect(cyRecord.tapBindings).toBeGreaterThan(0));
    rerender(<DeclarativeRenderer node={{ ...GRAPH, props: { ...GRAPH.props } }} />);

    // react-cytoscapejs runs the layout itself, from its own `layout` prop.
    // DGraph used to run it AGAIN in an effect: two animated fit:true passes
    // per change, which on first paint looked like the graph reloading and
    // re-centring several times over.
    expect(cyRecord.layoutRuns).toBe(0);
  });

  it('binds the node-click listener once, however often it re-renders', async () => {
    cyRecord.tapBindings = 0;
    cyRecord.tapHandlers.length = 0;
    const onAction = vi.fn();

    const { rerender } = render(<DeclarativeRenderer node={GRAPH} onAction={onAction} />);
    await waitFor(() => expect(cyRecord.tapBindings).toBe(1));

    // A fresh props object each time, exactly as a panel re-render delivers it.
    for (let i = 0; i < 3; i += 1) {
      rerender(<DeclarativeRenderer node={{ ...GRAPH, props: { ...GRAPH.props } }} onAction={onAction} />);
    }
    expect(cyRecord.tapBindings, 'one listener per cy instance').toBe(1);

    cyRecord.tapHandlers[0]({ target: { id: () => 'a' } });
    // Listeners used to accumulate, so one click fired the same navigation
    // several times and the panel appeared to bounce back to itself.
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][0]).toMatchObject({
      function: 'open_node',
      params: { node_id: 'a' },
    });
  });
});
