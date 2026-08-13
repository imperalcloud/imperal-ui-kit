import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeclarativeRenderer, type UINode } from '../index';

const renderNode = (node: UINode, onAction = vi.fn()) => {
  render(<DeclarativeRenderer node={node} onAction={onAction} />);
  return onAction;
};

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// SYSTEM REQUIREMENT — labeled input variant.
// Two shapes must both keep working: without label (legacy, still valid where
// the purpose is unambiguous) and WITH label (the default for new screens).
describe('labeled input variant', () => {
  const LABELLED: Array<[string, UINode]> = [
    ['Input', { type: 'Input', props: { label: 'Contract amount', param_name: 'amount' } }],
    ['TextArea', { type: 'TextArea', props: { label: 'Internal note', param_name: 'note' } }],
    ['Select', { type: 'Select', props: { label: 'How they pay', options: [{ value: 'card', label: 'Card' }] } }],
    ['DatePicker', { type: 'DatePicker', props: { label: 'Period end' } }],
  ];

  it.each(LABELLED)('%s binds its label to the control programmatically', (_name, node) => {
    renderNode(node);
    // getByLabelText only resolves through a real for/id (or aria) binding —
    // a visually adjacent label would NOT satisfy this.
    const control = screen.getByLabelText(/Contract amount|Internal note|How they pay|Period end/);
    expect(control.id).toBeTruthy();
    const label = document.querySelector('label')!;
    expect(label.getAttribute('for')).toBe(control.id);
  });

  it.each(LABELLED)('%s puts label and control in one .field-gap container', (_name, node) => {
    renderNode(node);
    const label = document.querySelector('label')!;
    const container = label.parentElement!;
    expect(container.className).toContain('field-gap');
    // the control lives in that same container — one field, one box
    expect(container.querySelector('input, textarea, select, button')).toBeTruthy();
  });

  it.each(LABELLED)('%s styles its label with the system token, not a hardcode', (_name, node) => {
    renderNode(node);
    const label = document.querySelector('label')!;
    expect(label.className).toContain('field-label');
    // the old per-component hardcode must be gone
    expect(label.className).not.toContain('text-sm font-medium text-body');
  });

  it('keeps the label-less variant working and unlabelled', () => {
    renderNode({ type: 'Input', props: { placeholder: 'Search…', param_name: 'q' } });
    expect(document.querySelector('label')).toBeNull();
    expect(screen.getByPlaceholderText('Search…')).toBeTruthy();
  });

  it('treats placeholder as a hint, never as the field name', () => {
    renderNode({ type: 'Input', props: { label: 'Contract amount', placeholder: 'e.g. 500.00' } });
    // the accessible name comes from the LABEL, not the placeholder
    const control = screen.getByLabelText('Contract amount') as HTMLInputElement;
    expect(control.placeholder).toBe('e.g. 500.00');
  });

  it('wires description and error to the control for assistive tech', () => {
    renderNode({ type: 'Input', props: { label: 'Period end', description: 'Leave empty to keep', error: 'Must be future' } });
    const control = screen.getByLabelText(/Period end/);
    const describedBy = control.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain('description');
    expect(screen.getByRole('alert').textContent).toContain('Must be future');
  });
});

describe('Stat semantic colour', () => {
  it('tints the value with the requested semantic colour', () => {
    renderNode({ type: 'Stat', props: { label: 'Spent', value: '34,287,494', color: 'red' } });
    expect(screen.getByText('34,287,494').className).toContain('text-danger');
  });
  it('falls back to neutral ink when no colour is asked for', () => {
    renderNode({ type: 'Stat', props: { label: 'Users', value: '42' } });
    expect(screen.getByText('42').className).toContain('text-body');
  });
});

// A destructive dialog is an ALERT dialog: no ambiguous dismissal.
describe('destructive dialog', () => {
  const destructive: UINode = {
    type: 'Dialog',
    props: { title: 'Delete 15,769 rows?', destructive: true, confirm_label: 'Delete forever', on_confirm: { action: 'call', function: 'purge' } },
  };

  it('announces itself as an alertdialog', () => {
    renderNode(destructive);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
  });

  it('cannot be dismissed by clicking the backdrop or pressing Escape', () => {
    renderNode(destructive);
    const backdrop = screen.getByRole('alertdialog').parentElement!;
    fireEvent.pointerDown(backdrop);
    expect(screen.queryByRole('alertdialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeTruthy();
  });

  it('offers no silent X escape, and marks confirm as dangerous', () => {
    renderNode(destructive);
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete forever' }).className).toContain('bg-danger');
  });

  it('an ordinary dialog stays lightly dismissable', () => {
    renderNode({ type: 'Dialog', props: { title: 'Details' } });
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

// Tree — the primitive for hierarchy that is currently flattened into lists
// (content categories, product categories). The SDK has always documented a
// per-node `icon`; the renderer used to drop it.
describe('tree hierarchy', () => {
  const tree: UINode = {
    type: 'Tree',
    props: {
      label: 'Product categories',
      nodes: [
        {
          id: 'root', label: 'Catalog', icon: 'FolderOpen', badge: 12, children: [
            { id: 'leaf', label: 'Case studies', on_click: { action: 'call', function: 'open' } },
          ],
        },
      ],
    },
  };

  it('exposes real tree semantics, not anonymous buttons', () => {
    renderNode(tree);
    expect(screen.getByRole('tree', { name: 'Product categories' })).toBeTruthy();
    const branch = screen.getByRole('treeitem', { name: /Catalog/ });
    expect(branch.getAttribute('aria-expanded')).toBe('true');
    expect(branch.getAttribute('aria-level')).toBe('1');
  });

  it('renders the per-node icon and badge the SDK documents', () => {
    renderNode(tree);
    const branch = screen.getByRole('treeitem', { name: /Catalog/ });
    // a named Lucide icon resolves to an <svg>, plus the chevron
    expect(branch.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
    expect(branch.textContent).toContain('12');
  });

  it('fires on_click for a leaf but only toggles a branch', () => {
    const onAction = renderNode(tree);
    fireEvent.click(screen.getByRole('treeitem', { name: /Catalog/ }));
    expect(onAction).not.toHaveBeenCalled();          // branch = toggle
    fireEvent.click(screen.getByRole('treeitem', { name: /Catalog/ })); // reopen
    fireEvent.click(screen.getByRole('treeitem', { name: /Case studies/ }));
    expect(onAction).toHaveBeenCalledTimes(1);        // leaf = action
  });
});
