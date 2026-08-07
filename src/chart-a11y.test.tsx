import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DeclarativeRenderer } from './DeclarativeRenderer';

let consoleSpy: ReturnType<typeof vi.spyOn>;
beforeAll(() => {
  consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 });
});
afterAll(() => consoleSpy.mockRestore());

describe('chart accessibility', () => {
  it('provides a named graphic and a data-table fallback', () => {
    render(<DeclarativeRenderer node={{ type: 'Chart', props: { title: 'Traffic', x_key: 'day', data: [{ day: 'Mon', visits: 4 }], show_data_table: true } }} />);
    expect(screen.getByRole('img', { name: /Traffic/ })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Traffic data' })).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });
});
