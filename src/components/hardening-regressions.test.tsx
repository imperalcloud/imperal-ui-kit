import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { DeclarativeRenderer } from '../DeclarativeRenderer';
import { registerComponent } from '../registry';
import { DCard } from './DCard';
import { DFileUpload } from './DFileUpload';
import { DImage } from './DImage';
import { DMenu } from './DMenu';
import { DTabs } from './DTabs';

const node = (type: string, props: Record<string, unknown>) => ({ type, props });

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('production hardening regressions', () => {
  it('fires only the nested control action inside a clickable card', () => {
    const onAction = vi.fn();
    const { container } = render(<DCard onAction={onAction} node={node('Card', {
      title: 'Account',
      on_click: { action: 'call', function: 'open' },
      children: [node('Button', { label: 'Delete', on_click: { action: 'call', function: 'delete' } })],
    })} />);
    fireEvent.click(container.querySelector('button')!);
    expect(onAction.mock.calls.map(call => call[0].function)).toEqual(['delete']);
  });

  it('does not nest an interactive trigger inside another menu button', () => {
    const { container } = render(<DMenu node={node('Menu', {
      trigger: node('Button', { label: 'Actions' }),
      items: [{ label: 'Open' }],
    })} />);
    expect(container.querySelector('button button')).toBeNull();
  });

  it('supports menu arrow navigation and restores trigger focus on Escape', () => {
    render(<DMenu node={node('Menu', { items: [{ label: 'One' }, { label: 'Two' }] })} />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'One' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });

  it('selects a valid tab when refreshed tab ids replace the active id', () => {
    const { rerender } = render(<DTabs node={node('Tabs', { tabs: [{ id: 'a', label: 'A', children: [node('Text', { content: 'Alpha' })] }] })} />);
    rerender(<DTabs node={node('Tabs', { tabs: [{ id: 'b', label: 'B', children: [node('Text', { content: 'Beta' })] }] })} />);
    expect(screen.getByRole('tab', { name: 'B' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toContain('Beta');
  });

  it('resets a failed node boundary when node identity changes', () => {
    const Bad = () => { throw new Error('boom'); };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registerComponent('hardening_bad', Bad);
    const { rerender } = render(<DeclarativeRenderer node={{ id: 'bad', type: 'hardening_bad', props: {} }} />);
    expect(screen.getByRole('alert').textContent).toContain('This section failed to render.');
    rerender(<DeclarativeRenderer node={{ id: 'good', type: 'Alert', props: { message: 'Recovered', type: 'success' } }} />);
    expect(screen.getByText('Recovered')).toBeTruthy();
    errorSpy.mockRestore();
  });

  it('resets upload rows when node identity changes', async () => {
    class Reader {
      result = 'data:text/plain;base64,eA==';
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      readAsDataURL() { this.onload?.(); }
    }
    vi.stubGlobal('FileReader', Reader);
    const { container, rerender } = render(<DFileUpload node={{ id: 'first', type: 'FileUpload', props: {} }} />);
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'old.txt', { type: 'text/plain' })] } });
    await screen.findByText('old.txt');
    rerender(<DFileUpload node={{ id: 'second', type: 'FileUpload', props: {} }} />);
    expect(screen.queryByText('old.txt')).toBeNull();
  });

  it('marks upload rows failed when the async action rejects', async () => {
    class Reader {
      result = 'data:text/plain;base64,eA==';
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      readAsDataURL() { this.onload?.(); }
    }
    vi.stubGlobal('FileReader', Reader);
    const onAction = vi.fn().mockRejectedValue(new Error('network down'));
    const { container } = render(<DFileUpload onAction={onAction} node={node('FileUpload', {
      on_upload: { action: 'call', function: 'upload' },
    })} />);
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [new File(['x'], 'failed.txt', { type: 'text/plain' })] } });
    await waitFor(() => expect(screen.getByText('Upload failed. Try again.')).toBeTruthy());
  });

  it('recovers media after its source changes', () => {
    const { rerender } = render(<DImage node={node('Image', { src: '/bad.png', alt: 'Preview' })} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Image unavailable')).toBeTruthy();
    rerender(<DImage node={node('Image', { src: '/good.png', alt: 'Preview' })} />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('/good.png');
  });
});
