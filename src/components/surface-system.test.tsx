import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
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
describe('field system', () => {
  // Every text-entry control must take its fill, hairline and placeholder from
  // the input tokens — never hand-rolled (bg-panel / bg-card/60 / bg-raised),
  // which is what made fields look like five different widgets.
  it('renders inputs and textareas through the shared control chrome', () => {
    const { container: input } = render(<DeclarativeRenderer node={node('Input', {
      placeholder: 'Search', param_name: 'q',
    })} />);
    const field = input.querySelector('input') as HTMLInputElement;
    expect(field.className).toContain('control-base');
    expect(field.className).not.toMatch(/bg-(panel|card|raised)/);

    const { container: area } = render(<DeclarativeRenderer node={node('TextArea', {
      placeholder: 'Notes', param_name: 'notes',
    })} />);
    const textarea = area.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.className).toContain('control-base');
    expect(textarea.className).not.toMatch(/bg-(panel|card|raised)/);
  });

  it('keeps bespoke fields on the shared field chrome', () => {
    const { container } = render(<DeclarativeRenderer node={node('List', {
      items: [{ title: 'Alpha' }],
      searchable: true,
    })} />);
    const search = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    if (search) {
      expect(search.className).toContain('field-chrome');
      expect(search.className).not.toMatch(/bg-card\/60|placeholder:text-subtle/);
    }
  });

  it.skipIf(!existsSync(resolve(here, '../../dist/styles.css')))(
    'defines the recessed field palette per theme', () => {
      const css = readFileSync(resolve(here, '../../dist/styles.css'), 'utf8');
      // Dark: the exact values the design calls for.
      expect(css).toMatch(/--imp-color-surface-input:\s*hsl\(240 6% 5%/);
      expect(css).toMatch(/--imp-color-text-placeholder:\s*hsl\(240 5% 50%/);
      // The control reads the tokens rather than a literal colour.
      expect(css).toMatch(/\.control-base\b[^}]*var\(--imp-color-surface-input\)/);
    },
  );
});

describe('theme scoping', () => {
  // Regression: postcss-prefixwrap used to rewrite `:root[data-theme="light"]`
  // into `.imperal-ui[data-theme="light"]`, which matches nothing (the attribute
  // lives on <html>). The scoped `.imperal-ui:not([data-theme])` copy then won
  // by inheritance and light mode rendered dark cards on a light page.
  const dist = resolve(here, '../../dist/styles.css');
  // dist only exists after a build; on a clean checkout the authoritative
  // gate is scripts/scope-css.mjs, which fails the build itself.
  const built = existsSync(dist);

  it.skipIf(!built)('keeps theme palettes on global :root selectors', () => {
    const css = readFileSync(dist, 'utf8');
    expect(css).toMatch(/:root\[data-theme=["']?light["']?\]/);
    expect(css).not.toMatch(/\.imperal-ui\[data-theme/);
    expect(css).not.toMatch(/\.imperal-ui:not\(\[data-theme\]\)/);
  });

  it.skipIf(!built)('defines a distinct card palette for each theme', () => {
    const css = readFileSync(dist, 'utf8');
    const values = [...css.matchAll(/--imp-color-surface-card:\s*([^;]+);/g)].map((m) => m[1].trim().toLowerCase());
    // At least one light (#ffffff) and one dark (#141415) declaration.
    expect(values.some((v) => v === '#ffffff' || v === '#fff')).toBe(true);
    expect(values.some((v) => v === '#141415')).toBe(true);
  });
});

describe('light theme legibility', () => {
  const dist = resolve(here, '../../dist/styles.css');
  const built = existsSync(dist);

  const lum = (hex: string) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return [16, 8, 0]
      .map((shift) => ((n >> shift) & 255) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((acc, v, i) => acc + [0.2126, 0.7152, 0.0722][i] * v, 0);
  };

  // Regression: hover/selected chips map to --imp-color-surface-2 (the Tailwind
  // bridge sends `hover:bg-gray-800` there). In the light theme surface-2 was
  // pure #ffffff, so hovering a menu link painted white on a near-white page and
  // the label disappeared. In LIGHT the ramp must DESCEND away from the page.
  it.skipIf(!built)('keeps the light hover surface darker than the page', () => {
    const css = readFileSync(dist, 'utf8');
    const light = css.match(/:root\[data-theme=["']?light["']?\]\s*\{([^}]*)\}/);
    expect(light).toBeTruthy();
    const body = light![1];
    const read = (name: string) => body.match(new RegExp(`--imp-color-${name}:\\s*([^;]+);`))?.[1].trim() ?? '';

    const page = read('surface-0');
    const hover = read('surface-2');
    expect(page).toMatch(/^#/);
    expect(hover).toMatch(/^#/);
    // The hover chip must be a DARKER step, never white-on-white.
    expect(lum(hover)).toBeLessThan(lum(page));
    expect(hover.toLowerCase()).not.toBe('#ffffff');
  });

  // Regression: the bridge maps one variable per grey shade, shared by bg-* and
  // text-*. The dark shades point at SURFACE tokens, so `text-gray-900` rendered
  // as a background colour — white ink on a white page. Utilities pin the ink.
  it.skipIf(!built)('pins dark grey text utilities to ink tokens', () => {
    const css = readFileSync(dist, 'utf8');
    expect(css).toMatch(/\.text-gray-900[^{]*\{[^}]*var\(--imp-color-text\)/);
    expect(css).toMatch(/\.text-gray-700[^{]*\{[^}]*var\(--imp-color-text-subtle\)/);
  });
});

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
