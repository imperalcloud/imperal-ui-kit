'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { UIAction, UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DDialog: UIComponent = ({ node, onAction }) => {
  const { title = '', content, confirm_label = 'Confirm', cancel_label = 'Cancel', on_confirm } = node.props as {
    title?: string; content?: UINode | string; confirm_label?: string; cancel_label?: string; on_confirm?: UIAction;
  };
  const [open, setOpen] = useState(true);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    first?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus(); }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus.current?.focus(); };
  }, [open]);

  if (!open) return null;
  const close = () => setOpen(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="mx-4 w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h3 id={titleId} className="text-sm font-semibold text-white">{title}</h3>
          <button type="button" aria-label="Close dialog" onClick={close} className="rounded p-1 focus-ring"><X aria-hidden="true" className="h-4 w-4 text-gray-400" /></button>
        </div>
        {content && <div className="px-4 py-3">{typeof content === 'object' && content.type ? renderChildren([content], onAction) : <p className="text-sm text-gray-300">{String(content)}</p>}</div>}
        <div className="flex justify-end gap-2 border-t border-gray-800 px-4 py-3">
          <button type="button" onClick={close} className="rounded px-3 py-1.5 text-sm text-gray-400 focus-ring">{cancel_label}</button>
          <button type="button" onClick={() => { if (on_confirm && onAction) onAction(on_confirm); close(); }} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white focus-ring">{confirm_label}</button>
        </div>
      </div>
    </div>
  );
};
