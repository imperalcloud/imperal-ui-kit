import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeclarativeRenderer } from '../index';

afterEach(cleanup);

describe('data components', () => {
  it('renders SDK list grouping and keyboard-activates items', () => {
    const onAction = vi.fn();
    render(<DeclarativeRenderer onAction={onAction} node={{ type: 'List', props: {
      grouped_by: 'region',
      items: [
        { id: '1', title: 'EU node', region: 'EU', on_click: { action: 'call', function: 'open' } },
        { id: '2', title: 'US node', region: 'US' },
      ],
    } }} />);
    expect(screen.getByText('EU')).toBeTruthy();
    expect(screen.getByText('US')).toBeTruthy();
    const row = screen.getByRole('button', { name: /EU node/ });
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onAction).toHaveBeenCalledWith({ action: 'call', function: 'open' });
  });

  it('keeps editable boolean cells inside a touch-safe switch track', () => {
    render(<DeclarativeRenderer node={{ type: 'DataTable', props: {
      columns: [{ key: 'active', label: 'Active', editable: true, edit_type: 'toggle' }],
      rows: [{ id: '1', active: true }],
    } }} />);
    const control = screen.getByRole('switch', { name: 'Toggle Active' });
    const thumb = control.firstElementChild as HTMLElement;
    expect(control.className).toContain('h-6');
    expect(control.className).toContain('w-11');
    expect(thumb.className).toContain('left-0');
    expect(thumb.className).toContain('translate-x-[1.375rem]');
  });

  it('sorts data table while preserving the edited source row identity', () => {
    const onAction = vi.fn();
    render(<DeclarativeRenderer onAction={onAction} node={{ type: 'DataTable', props: {
      columns: [{ key: 'name', label: 'Name', sortable: true, editable: true }],
      rows: [{ id: 'b', name: 'Zulu' }, { id: 'a', name: 'Alpha' }],
      on_cell_edit: { action: 'call', function: 'edit' },
    } }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    fireEvent.click(screen.getByText('Alpha'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Beta' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      params: { row_id: 'a', column_key: 'name', value: 'Beta' },
    }));
  });
});
