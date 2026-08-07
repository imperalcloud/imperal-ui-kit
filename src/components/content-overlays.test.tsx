import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeclarativeRenderer, ImperalUIRoot } from '../index';

afterEach(cleanup);

describe('content and overlays', () => {
  it('renders Html without executing unsafe markup and uses a strict iframe sandbox', () => {
    render(<DeclarativeRenderer node={{ type: 'Html', props: { content: '<p>safe</p><script>alert(1)</script>' } }} />);
    const frame = screen.getByTitle('HTML content');
    expect(frame.getAttribute('sandbox')).toBe('allow-popups');
    expect(frame.getAttribute('srcdoc')).not.toContain('<script>');
  });

  it('exposes dialog semantics and closes on Escape', () => {
    render(<DeclarativeRenderer node={{ type: 'Dialog', props: { title: 'Confirm change', content: 'Safe?' } }} />);
    expect(screen.getByRole('dialog', { name: 'Confirm change' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not lock host document scrolling for contained overlay previews', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(
      <ImperalUIRoot contained>
        <DeclarativeRenderer root={false} node={{ type: 'Dialog', props: { title: 'Preview dialog' } }} />
      </ImperalUIRoot>,
    );
    expect(document.body.style.overflow).toBe('auto');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });

  it('uses a semantic menu trigger and dispatches the chosen action', () => {
    const onAction = vi.fn();
    render(<DeclarativeRenderer onAction={onAction} node={{ type: 'Menu', props: { items: [{ label: 'Open', on_click: { action: 'navigate', path: '/open' } }] } }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open' }));
    expect(onAction).toHaveBeenCalledWith({ action: 'navigate', path: '/open' });
  });
});
