import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DCard } from './DCard';
import { DLink } from './DLink';
import { DSection } from './DSection';
import { DTabs } from './DTabs';

const action = { action: 'call' as const, function: 'open' };

describe('core component contracts and accessibility', () => {
  it('implements the SDK collapsible Section contract', () => {
    render(<DSection node={{ type: 'Section', props: { title: 'Details', collapsible: true, children: [{ type: 'Text', props: { content: 'Secret' } }] } }} />);
    const button = screen.getByRole('button', { name: 'Details' });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Secret')).toBeNull();
  });

  it('activates clickable cards from the keyboard', () => {
    const onAction = vi.fn();
    render(<DCard node={{ type: 'Card', props: { title: 'Open card', on_click: action } }} onAction={onAction} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open card' }), { key: 'Enter' });
    expect(onAction).toHaveBeenCalledWith(action);
  });

  it('does not emit unsafe href schemes', () => {
    render(<DLink node={{ type: 'Link', props: { label: 'Unsafe', href: 'javascript:alert(1)' } }} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Unsafe').tagName).toBe('SPAN');
  });

  it('exposes tab semantics and arrow-key navigation', () => {
    render(<DTabs node={{ type: 'Tabs', props: { tabs: [
      { id: 'one', label: 'One', children: [{ type: 'Text', props: { content: 'First' } }] },
      { id: 'two', label: 'Two', children: [{ type: 'Text', props: { content: 'Second' } }] },
    ] } }} />);
    const first = screen.getByRole('tab', { name: 'One' });
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toContain('Second');
  });
});
