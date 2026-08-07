import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeclarativeRenderer } from '../index';

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const node = (type: string, props: Record<string, unknown>) => ({ type, props });

/**
 * Container chrome (border + radius + elevation) is defined ONCE, in the
 * .surface-* utilities. These tests are the guard rail: they fail if a
 * component starts hand-rolling `bg-card/40 border border-hair/50 rounded-lg`
 * again, which is how the kit drifted to 18 border colours and 8 radii.
 */
describe('surface system', () => {
  it('renders stat cards through the canonical raised surface', () => {
    const { container } = render(<DeclarativeRenderer node={node('Stat', { label: 'Monitors', value: 2 })} />);
    // The renderer wraps output in its scoped .imperal-ui root; assert on the card itself.
    const card = container.querySelector('.surface-raised') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.className).not.toMatch(/border-hair/);
    expect(card.className).not.toMatch(/rounded-lg/);
    expect(card.className).not.toMatch(/bg-card\/40/);
  });

  it('gives bordered cards the raised surface and clickable cards the interactive one', () => {
    const { container: plain } = render(<DeclarativeRenderer node={node('Card', { title: 'Plain', border: true })} />);
    expect(plain.querySelector('.surface-raised')).toBeTruthy();

    const { container: clickable } = render(<DeclarativeRenderer node={node('Card', {
      title: 'Clickable', border: true, on_click: { action: 'call', function: 'open' },
    })} />);
    const card = clickable.querySelector('.surface-interactive') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.className).toContain('surface-raised');
  });

  it('wraps tabular data in the same bordered surface', () => {
    const { container } = render(<DeclarativeRenderer node={node('DataTable', {
      columns: [{ key: 'name', label: 'Name' }],
      rows: [{ id: '1', name: 'EU node' }],
    })} />);
    expect(container.querySelector('.surface')).toBeTruthy();
    expect(screen.getByText('EU node')).toBeTruthy();
  });

  it('uses one hairline colour for every divider in the kit', () => {
    const files = ['DGraph.tsx', 'DList.tsx', 'DTabs.tsx', 'Paginator.tsx', 'DDataTable.tsx', 'DCard.tsx', 'CodeBlock.tsx'];
    for (const file of files) {
      const source = readFileSync(resolve(here, file), 'utf8');
      expect(source, `${file} must not use opacity-modified hairlines`).not.toMatch(/border-hair\/\d+/);
    }
  });

  it('keeps the dark hairline lighter than the card fill so it stays visible', () => {
    const tokens = readFileSync(resolve(here, '../../vendor/design-tokens/tokens.css'), 'utf8');
    const darkBlocks = tokens.split(/(?=:root|@media)/).filter(
      block => block.includes('--imp-color-surface-2: var(--imp-gray-800)'),
    );
    expect(darkBlocks.length).toBeGreaterThan(0);
    for (const block of darkBlocks) {
      const match = block.match(/--imp-color-border-subtle:\s*([^;]+);/);
      expect(match).toBeTruthy();
      expect(match![1].trim()).not.toBe('var(--imp-gray-800)');
    }
  });

  it('defines elevation and sheen so cards read as objects, not rectangles', () => {
    const utilities = readFileSync(resolve(here, '../../vendor/design-tokens/semantic-utilities.css'), 'utf8');
    expect(utilities).toContain('.surface-raised');
    expect(utilities).toContain('.surface-overlay');
    expect(utilities).toContain('.surface-interactive');
    expect(utilities).toMatch(/\.surface[\s\S]{0,800}min-width:\s*0/);
  });
});
