import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-cytoscapejs', () => ({ default: () => <div data-testid="graph-canvas" aria-hidden="true" /> }));
vi.mock('cytoscape-cose-bilkent', () => ({ default: {} }));

import { DeclarativeRenderer } from './DeclarativeRenderer';

describe('graph accessibility', () => {
  it('provides entity and relationship alternatives', async () => {
    render(<DeclarativeRenderer node={{ type: 'Graph', props: { title: 'Case graph', nodes: [{ id: 'a', label: 'Alice', type: 'person' }], edges: [{ id: 'e', source: 'a', target: 'b', label: 'knows' }] } }} />);
    expect(screen.getByRole('figure', { name: 'Case graph' })).toBeTruthy();
    expect(screen.getByText('Alice — person')).toBeTruthy();
    expect(screen.getByText('a → b — knows')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('graph-canvas')).toBeTruthy());
  });
});
