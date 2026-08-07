'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { UIAction, UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';
import { useImperalUI } from '../ImperalUIProvider';
import { useModalFocus } from '../hooks';

const WIDTHS: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

export const DSlideOver: UIComponent = ({ node, onAction }) => {
  const ui = useImperalUI();
  const { title, subtitle, children, open = true, width = 'md', on_close } = node.props as {
    title?: string; subtitle?: string; children?: UINode[]; open?: boolean; width?: string; on_close?: UIAction;
  };
  const [visible, setVisible] = useState(open);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => setVisible(open), [open, node.id, node.key, node.revision]);
  const close = () => { setVisible(false); if (on_close) void (onAction ?? ui.onAction)?.(on_close); };
  useModalFocus(visible, panelRef, close);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[var(--imp-z-modal)] flex justify-end" role="presentation">
      <button type="button" aria-label={ui.messages.close} className="absolute inset-0 bg-black/60" onClick={close} />
      <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title || 'Panel'} className={`relative ${WIDTHS[width] || WIDTHS.md} flex h-[100dvh] w-[min(100vw,42rem)] flex-col border-l border-hair bg-app shadow-2xl`}>
        <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-hair px-4 py-3">
          <div className="min-w-0"><h2 id={titleId} className="truncate text-sm font-semibold text-body">{title}</h2>{subtitle && <p className="mt-0.5 truncate font-mono text-xs text-muted">{subtitle}</p>}</div>
          <button type="button" onClick={close} aria-label={ui.messages.close} className="icon-btn-sm grid shrink-0 place-items-center text-muted hover:bg-raised focus-ring"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{renderChildren(children, onAction)}</div>
      </aside>
    </div>
  );
};
