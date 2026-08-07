import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeclarativeRenderer } from './DeclarativeRenderer';

afterEach(cleanup);

describe('declarative refresh state contract', () => {
  it('syncs standalone control values from refreshed props', () => {
    const { rerender } = render(<DeclarativeRenderer node={{ id: 'name', type: 'Input', props: { label: 'Name', value: 'Bee' } }} />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Draft' } });
    expect(input.value).toBe('Draft');
    rerender(<DeclarativeRenderer node={{ id: 'name', revision: 2, type: 'Input', props: { label: 'Name', value: 'Webbee' } }} />);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Webbee');
  });

  it('preserves form edits on an equivalent rerender and resets on revision', () => {
    const onAction = vi.fn();
    const makeNode = (revision?: number) => ({ id: 'profile', revision, type: 'Form', props: {
      action: 'save', defaults: { name: 'Bee' },
      children: [{ id: 'name', type: 'Input', props: { label: 'Name', param_name: 'name' } }],
    } });
    const { rerender } = render(<DeclarativeRenderer node={makeNode()} onAction={onAction} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Draft' } });
    rerender(<DeclarativeRenderer node={makeNode()} onAction={onAction} />);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Draft');
    rerender(<DeclarativeRenderer node={makeNode(2)} onAction={onAction} />);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Bee');
  });

  it('resets disclosure state for a revised node', () => {
    const make = (revision?: number) => ({ id: 'details', revision, type: 'Section', props: { title: 'Details', collapsible: true, children: [{ type: 'Text', props: { content: 'Body' } }] } });
    const { rerender } = render(<DeclarativeRenderer node={make()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.queryByText('Body')).toBeNull();
    rerender(<DeclarativeRenderer node={make(2)} />);
    expect(screen.getByText('Body')).toBeTruthy();
  });
});
