import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  layoutStopBindings: number;
  tapHandlers: Array<(evt: { target: { id: () => string } }) => void>;
  layoutStopHandlers: Array<() => void>;
  zoomSets: number[];
  centers: number;
  zoom: number;
};

// Bindings are counted PER EVENT, not in one lump. DGraph now binds two
// listeners on a cy instance — 'tap' for clicks and 'layoutstop' for the
// readability floor — and a single counter would let a genuine accumulation of
// tap listeners hide behind the second binding. That accumulation is exactly
// the bug this file exists to catch.
const cyRecord: CyRecord = {
  layoutRuns: 0,
  tapBindings: 0,
  layoutStopBindings: 0,
  tapHandlers: [],
  layoutStopHandlers: [],
  zoomSets: [],
  centers: 0,
  zoom: 1,
};
const stylesheets: unknown[] = [];
// The props react-cytoscapejs is handed, so the zoom envelope (maxZoom, wheel
// sensitivity) can be asserted too: the user could not zoom in at all, and a
// throttled wheel plus a low ceiling were half of that.
const graphProps: Array<Record<string, unknown>> = [];

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
    // Reads the current zoom when called with no argument, records the value
    // when called with one — the same contract cytoscape has, so the
    // readability floor can be observed instead of assumed.
    zoom: (level?: number) => {
      if (typeof level === 'number') {
        cyRecord.zoomSets.push(level);
        cyRecord.zoom = level;
        return level;
      }
      return cyRecord.zoom;
    },
    center: () => {
      cyRecord.centers += 1;
    },
    // cytoscape's real `on` is overloaded: (evt, selector, cb) for elements and
    // (evt, cb) for graph-level events like layoutstop. The fake honours both,
    // or the layoutstop handler would be filed under the wrong key.
    on: (evt: string, second: unknown, third?: unknown) => {
      const cb = (typeof second === 'function' ? second : third) as
        | ((e: { target: { id: () => string } }) => void)
        | (() => void);
      if (evt === 'layoutstop') {
        cyRecord.layoutStopBindings += 1;
        cyRecord.layoutStopHandlers.push(cb as () => void);
        return;
      }
      cyRecord.tapBindings += 1;
      cyRecord.tapHandlers.push(cb as (e: { target: { id: () => string } }) => void);
    },
  };
}

const fakeCy = makeFakeCy();

vi.mock('react-cytoscapejs', () => ({
  default: (props: Record<string, unknown>) => {
    stylesheets.push(props.stylesheet);
    graphProps.push(props);
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

// This config sets neither `globals` nor a setup file, so testing-library's
// auto-cleanup is NOT active: without this, every component a previous test
// mounted stays mounted. They matter here because DGraph mounts its canvas only
// after an async import resolves, so those stale components keep pushing their
// own props into the records afterwards — and a test waiting for "any captured
// layout" would read a neighbour's instead of its own.
afterEach(cleanup);

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

  /**
   * Bug 4, reported after bugs 1-3 were fixed: "I can see the text now, but it
   * is so small that I cannot read it even at maximum zoom."
   *
   * Measured in headless Chromium (tools/graph_zoom_probe.py) on the real
   * 14-node MCP-Configs payload in a 900x600 box: `fit` settled at zoom 0.2,
   * so the 10px font arrived as a 2px letter. Cytoscape multiplies label size
   * by viewport zoom, which no font size alone can outrun — a matrix over
   * font, height, layout spacing and wrapping (graph_readability_matrix.py)
   * failed to clear 12px in EVERY combination, because fit always zoomed back
   * out to swallow the graph.
   *
   * So the fix is a floor on zoom, not a bigger font, and this is the test for
   * it: legibility wins over completeness.
   */
  it('never lets fit shrink labels below readable, and can be zoomed by hand', async () => {
    stylesheets.length = 0;
    cyRecord.layoutStopBindings = 0;
    cyRecord.layoutStopHandlers.length = 0;
    cyRecord.zoomSets.length = 0;
    cyRecord.centers = 0;

    render(<DeclarativeRenderer node={GRAPH} />);
    await waitFor(() => expect(cyRecord.layoutStopBindings).toBe(1));

    const nodeFont = parseFloat(String(styleOf(stylesheets[0], 'node')['font-size'] ?? '0'));
    expect(nodeFont, 'node labels must be at least readable at zoom 1').toBeGreaterThanOrEqual(12);

    // fit landed deep below the floor, as it really does on a dense graph.
    cyRecord.zoom = 0.2;
    cyRecord.layoutStopHandlers[0]();

    expect(cyRecord.zoomSets, 'the floor must be applied after a layout').toHaveLength(1);
    const clamped = cyRecord.zoomSets[0];
    expect(clamped * nodeFont, 'effective label size after clamping').toBeGreaterThanOrEqual(12);
    expect(cyRecord.centers, 'clamping must re-centre, or the graph jumps off-screen').toBe(1);
  });

  it('leaves a comfortable zoom alone — the floor is a floor, not a reset', async () => {
    cyRecord.layoutStopBindings = 0;
    cyRecord.layoutStopHandlers.length = 0;
    cyRecord.zoomSets.length = 0;

    render(<DeclarativeRenderer node={GRAPH} />);
    await waitFor(() => expect(cyRecord.layoutStopBindings).toBe(1));

    // A sparse graph fits at a perfectly readable zoom (measured: 1.42 for the
    // 5-node repo). Touching it would fight the user's own view. Without this
    // control the test above would pass even if the clamp ran unconditionally.
    cyRecord.zoom = 1.42;
    cyRecord.layoutStopHandlers[0]();

    expect(cyRecord.zoomSets, 'a readable zoom must not be rewritten').toHaveLength(0);
  });

  it('gives the viewport room to zoom in, and an unthrottled wheel', async () => {
    graphProps.length = 0;
    render(<DeclarativeRenderer node={GRAPH} />);
    await waitFor(() => expect(graphProps.length).toBeGreaterThan(0));

    const props = graphProps[0];
    // The toolbar had NO zoom control at all, so the ceiling and the wheel were
    // the only ways in: a 3x ceiling on a 13px font is 39px, and a wheel
    // sensitivity of 0.2 is five times slower than cytoscape's own default.
    expect(Number(props.maxZoom), 'ceiling must allow real inspection').toBeGreaterThanOrEqual(6);
    expect(Number(props.wheelSensitivity), 'wheel must not be throttled').toBeGreaterThanOrEqual(1);
  });

  /**
   * THE root cause of the unreadable labels, and the least obvious one: the
   * layout, not the font.
   *
   * `levelWidth: () => 1` gives every distinct mention_count its own concentric
   * ring. Measured in headless Chromium on the real 14-node MCP-Configs payload
   * at 900x600 (tools/graph_density_probe.py):
   *
   *   levelWidth 1, label dims on   box 3604x3802  fit 0.20  ->  2/14 in frame
   *   levelWidth 1, label dims off  box 1468x1473  fit 0.37  ->  6/14 in frame
   *   ring width from spread, off   box  423x336   fit 1.61  -> 14/14 in frame
   *
   * A radius no viewport can hold forces fit to zoom out, and cytoscape scales
   * label text with zoom, so no font size could ever win. Capping the RING
   * COUNT is what makes the text readable and the whole graph fit at once.
   */
  it('caps concentric rings by data spread, so fit cannot shrink the text', async () => {
    graphProps.length = 0;
    // mention_count 4 and 2 in the fixture, but the rule must hold for a wide
    // spread too — that is where per-value rings explode.
    const wide = {
      ...GRAPH,
      props: {
        ...GRAPH.props,
        layout: 'concentric',
        nodes: [
          { id: 'a', label: 'alpha', type: 'person', mention_count: 50 },
          { id: 'b', label: 'beta', type: 'person', mention_count: 31 },
          { id: 'c', label: 'gamma', type: 'person', mention_count: 24 },
          { id: 'd', label: 'delta', type: 'person', mention_count: 17 },
          { id: 'e', label: 'epsilon', type: 'person', mention_count: 11 },
          { id: 'f', label: 'zeta', type: 'person', mention_count: 10 },
        ],
        edges: [{ id: 'e1', source: 'a', target: 'b', label: 'x', weight: 1 }],
      },
    };
    render(<DeclarativeRenderer node={wide} />);

    // Wait for THIS graph's layout, not merely for something to arrive: the
    // canvas mounts only after an async import resolves, so "any entry" can be
    // satisfied before the concentric pass has rendered at all.
    const concentricOf = () =>
      graphProps
        .map((p) => p.layout as Record<string, unknown> | undefined)
        .find((l) => l?.name === 'concentric');
    await waitFor(() => expect(concentricOf()).toBeTruthy());
    const layout = concentricOf() as Record<string, unknown>;

    // The layout must NOT reserve each node's full label width: with file-path
    // labels that alone inflated the box from 1468px to 3604px.
    expect(layout.nodeDimensionsIncludeLabels, 'label dims inflate the box').toBe(false);

    // Ring width scales with the spread, so the ring COUNT stays bounded.
    const levelWidth = layout.levelWidth as () => number;
    expect(typeof levelWidth).toBe('function');
    const width = levelWidth();
    const mentions = [50, 31, 24, 17, 11, 10];
    const rings = new Set(mentions.map((m) => Math.floor(m / width))).size;
    expect(width, 'a per-value ring width is the bug').toBeGreaterThan(1);
    expect(rings, 'radius must stay bounded, or fit zooms the text away').toBeLessThanOrEqual(5);
  });

  /**
   * Grid is the layout the panel opens on, so it needs the same scrutiny
   * concentric got — an untuned grid is the SECOND way fit can shrink the text.
   *
   * cytoscape's grid spreads nodes to fill the container's aspect ratio, so the
   * layout box grows with the VIEWPORT instead of with the data. Measured in
   * headless Chromium on the real 14-node MCP-Configs payload
   * (tools/graph_zoom_probe.py, `grid`):
   *
   *   untuned, 900x600   box  873x465  fit 0.96  ->  12.5px  (ON the floor)
   *   untuned, 1100x600  box 1033x465  fit 1.01  ->  13.1px  (box grew with it)
   *   tuned,   900x600   box  411x195  fit 2.04  ->  26.6px
   *   tuned,   1100x600  box  411x195  fit 2.53  ->  32.9px
   *
   * `condense` is what decouples the box from the container; avoidOverlap plus
   * padding replaces the label-width reservation that
   * nodeDimensionsIncludeLabels:false deliberately gives up.
   */
  it('condenses the grid, so the box follows the data and not the viewport', async () => {
    graphProps.length = 0;
    render(<DeclarativeRenderer node={{ ...GRAPH, props: { ...GRAPH.props, layout: 'grid' } }} />);

    const gridOf = () =>
      graphProps
        .map((p) => p.layout as Record<string, unknown> | undefined)
        .find((l) => l?.name === 'grid');
    await waitFor(() => expect(gridOf()).toBeTruthy());
    const layout = gridOf() as Record<string, unknown>;

    expect(layout.condense, 'without condense the box grows with the viewport').toBe(true);
    expect(layout.avoidOverlap, 'wrapped labels in adjacent cells collide').toBe(true);
    expect(Number(layout.avoidOverlapPadding), 'labels need breathing room').toBeGreaterThan(0);
    expect(layout.nodeDimensionsIncludeLabels, 'label dims inflate the box').toBe(false);
  });

  it('opens on grid, the layout measured most readable of the deterministic ones', async () => {
    graphProps.length = 0;
    // GRAPH deliberately sets NO layout: this asserts the DEFAULT, not a prop.
    render(<DeclarativeRenderer node={GRAPH} />);
    await waitFor(() => expect(graphProps.length).toBeGreaterThan(0));

    const names = graphProps
      .map((p) => (p.layout as Record<string, unknown> | undefined)?.name)
      .filter(Boolean);
    expect(names.length, 'no layout was ever handed to cytoscape').toBeGreaterThan(0);
    // cose-bilkent drifts out of frame on first paint, which is why the panel
    // must not open on it.
    expect(names, 'the panel must open on grid').toContain('grid');
    expect(names, 'a force-directed first paint drifts out of frame').not.toContain('cose-bilkent');
  });
});
