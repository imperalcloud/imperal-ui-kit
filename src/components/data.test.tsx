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

  it('contains stat content when its grid column becomes narrow', () => {
    const { container } = render(<DeclarativeRenderer node={{ type: 'Stat', props: {
      label: 'Warning status that must stay contained',
      value: '12345678901234567890',
      trend: 'ExtremelyLongTrendWithoutSpaces',
      description: 'DescriptionWithoutAnyNaturalBreakPoint',
      icon: 'TriangleAlert',
    } }} />);
    const card = container.querySelector('.overflow-hidden') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.className).toContain('min-w-0');
    expect(card.className).toContain('max-w-full');
    expect(screen.getByText('Warning status that must stay contained').className).toContain('break-words');
    expect(screen.getByText('12345678901234567890').className).toContain('break-words');
    expect(screen.getByText('ExtremelyLongTrendWithoutSpaces').parentElement?.className).toContain('flex-wrap');
    expect(screen.getByText('DescriptionWithoutAnyNaturalBreakPoint').className).toContain('break-words');
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
