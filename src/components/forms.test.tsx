import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeclarativeRenderer, type UIAction, type UINode } from '../index';

const renderNode = (node: UINode, onAction = vi.fn(), onConfirm?: (message: string) => boolean | Promise<boolean>) => {
  render(<DeclarativeRenderer node={node} onAction={onAction} onConfirm={onConfirm} />);
  return onAction;
};

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('form controls', () => {

  it('submits values through a native form and respects async confirmation', async () => {
    let release!: (value: boolean) => void;
    const confirmation = new Promise<boolean>(resolve => { release = resolve; });
    const action = renderNode({
      type: 'Form',
      props: {
        action: 'save_settings',
        confirm: 'Save?',
        children: [{ type: 'Input', props: { label: 'Name', param_name: 'name', value: 'Bee' } }],
      },
    }, vi.fn(), () => confirmation);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Webbee' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!);
    expect((screen.getByRole('button', { name: 'Submitting…' }) as HTMLButtonElement).disabled).toBe(true);
    expect(action).not.toHaveBeenCalled();
    release(true);

    await waitFor(() => expect(action).toHaveBeenCalledWith({
      action: 'call', function: 'save_settings', params: { name: 'Webbee' },
    } satisfies UIAction));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement).disabled).toBe(false));
  });

  it('uses an accessible keyboard-operable switch', () => {
    const action = renderNode({
      type: 'Toggle',
      props: { label: 'Notifications', value: false, on_change: { action: 'call', function: 'toggle' } },
    });
    const control = screen.getByRole('switch', { name: 'Notifications' });
    expect(control.getAttribute('aria-checked')).toBe('false');
    const thumb = control.firstElementChild as HTMLElement;
    expect(thumb.className).toContain('left-0');
    expect(thumb.className).toContain('translate-x-0.5');

    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.className).toContain('h-6');
    expect(control.className).toContain('w-11');
    expect(thumb.className).toContain('translate-x-[1.375rem]');
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ params: { enabled: true } }));
  });
});

describe('form value collection', () => {
  it('includes untouched control values in the submit payload', async () => {
    const action = renderNode({
      type: 'Form',
      props: {
        action: 'save',
        children: [
          { type: 'Input', props: { param_name: 'name', value: 'Bee' } },
          { type: 'Select', props: { param_name: 'region', value: 'eu', options: [{ value: 'eu', label: 'EU' }] } },
          { type: 'MultiSelect', props: { param_name: 'roles', values: ['admin'], options: [{ value: 'admin', label: 'Admin' }] } },
          { type: 'Toggle', props: { param_name: 'enabled', value: false } },
          { type: 'Slider', props: { param_name: 'limit', value: 42 } },
          { type: 'DatePicker', props: { param_name: 'date', value: '2026-08-07' } },
          { type: 'TextArea', props: { param_name: 'notes', value: 'ready' } },
        ],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(action).toHaveBeenCalledWith(expect.objectContaining({
      params: {
        name: 'Bee', region: 'eu', roles: ['admin'], enabled: false,
        limit: 42, date: '2026-08-07', notes: 'ready',
      },
    })));
  });

  it('keeps all valid tags from one pasted batch', () => {
    const action = renderNode({
      type: 'TagInput',
      props: {
        values: ['existing'], delimiters: [','], validate: '^[a-z]+$',
        on_change: { action: 'call', function: 'tags' },
      },
    });
    const input = screen.getByRole('textbox', { name: 'Tags' });
    fireEvent.paste(input, { clipboardData: { getData: () => 'alpha,beta,beta' } });
    expect(action).toHaveBeenCalledWith(expect.objectContaining({
      params: { tags: ['existing', 'alpha', 'beta'] },
    }));
  });
});
