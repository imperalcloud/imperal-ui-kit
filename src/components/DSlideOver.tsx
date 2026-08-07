'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { UIAction, UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

const WIDTHS: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

export const DSlideOver: UIComponent = ({ node, onAction }) => {
  const { title, subtitle, children, open = true, width = 'md', on_close } = node.props as {
    title?: string; subtitle?: string; children?: UINode[]; open?: boolean; width?: string; on_close?: UIAction;
  };
  const [visible, setVisible] = useState(open);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => setVisible(open), [open]);
  useEffect(() => {
    if (!visible) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setVisible(false); if (on_close && onAction) onAction(on_close); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus.current?.focus(); };
  }, [visible, onAction, on_close]);

  if (!visible) return null;
  const close = () => { setVisible(false); if (on_close && onAction) onAction(on_close); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-black/50" onClick={close} />
      <aside role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} className={`relative ${WIDTHS[width] || WIDTHS.md} w-full bg-gray-950 border-l border-gray-800 flex flex-col h-full shadow-2xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <div><h2 id={titleId} className="text-sm font-semibold text-white">{title}</h2>{subtitle && <p className="text-xs text-gray-500 mt-0.5 font-mono">{subtitle}</p>}</div>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="text-gray-400 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500/70"><X aria-hidden="true" className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{renderChildren(children, onAction)}</div>
      </aside>
    </div>
  );
};
