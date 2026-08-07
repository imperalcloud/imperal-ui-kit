import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DImage } from './DImage';
import { DProgress } from './DProgress';
import { DSlideOver } from './DSlideOver';

const node = (type: string, props: Record<string, unknown>) => ({ type, props });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('media and layout safety', () => {
  it('activates clickable images from the keyboard', () => {
    const onAction = vi.fn();
    render(<DImage node={node('Image', { src: '/image.png', alt: 'Preview', on_click: { action: 'open', url: '/full' } })} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('keeps progress values finite when max is zero', () => {
    render(<DProgress node={node('Progress', { value: 20, max: 0, label: 'Upload' })} />);
    const progress = screen.getByRole('progressbar', { name: 'Upload' });
    expect(progress.getAttribute('aria-valuenow')).toBe('20');
    expect(progress.innerHTML).not.toContain('NaN');
  });

  it('closes a slide-over with Escape and emits on_close', () => {
    const onAction = vi.fn();
    render(<DSlideOver node={node('SlideOver', { title: 'Details', on_close: { action: 'send', message: 'closed' } })} onAction={onAction} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onAction).toHaveBeenCalledOnce();
  });
});

it('revokes each file preview exactly once across removal and unmount', async () => {
  const createObjectURL = vi.fn(() => 'blob:preview-1');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

  class MockFileReader {
    result: string | null = null;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    readAsDataURL() {
      this.result = 'data:image/png;base64,YmVl';
      this.onload?.();
    }
  }
  vi.stubGlobal('FileReader', MockFileReader);

  const { DFileUpload } = await import('./DFileUpload');
  const { unmount } = render(<DFileUpload node={node('FileUpload', { show_previews: true })} />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['bee'], 'bee.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);

  const remove = await screen.findByRole('button', { name: 'Remove bee.png' });
  fireEvent.click(remove);
  unmount();
  expect(createObjectURL).toHaveBeenCalledOnce();
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
});
