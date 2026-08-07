import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('recharts', async importOriginal => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

import { DeclarativeRenderer } from './DeclarativeRenderer';

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 });
});

describe('chart accessibility', () => {
  it('provides a named graphic and a data-table fallback', () => {
    render(<DeclarativeRenderer node={{ type: 'Chart', props: { title: 'Traffic', x_key: 'day', data: [{ day: 'Mon', visits: 4 }], show_data_table: true } }} />);
    expect(screen.getByRole('img', { name: /Traffic/ })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Traffic data' })).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });
});
