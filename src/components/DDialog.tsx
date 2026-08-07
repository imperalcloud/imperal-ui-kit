'use client';

import { useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { UIAction, UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';
import { useImperalUI } from '../ImperalUIProvider';
import { useModalFocus } from '../hooks';

export const DDialog: UIComponent = ({ node, onAction }) => {
  const ui = useImperalUI();
  const { title = '', content, confirm_label = ui.messages.confirm, cancel_label = ui.messages.cancel, on_confirm } = node.props as {
    title?: string; content?: UINode | string; confirm_label?: string; cancel_label?: string; on_confirm?: UIAction;
  };
  const [open, setOpen] = useState(true);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useModalFocus(open, panelRef, close);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[var(--imp-z-modal)] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onPointerDown={event => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title || 'Dialog'} className="flex max-h-[min(90dvh,52rem)] w-full max-w-[min(100vw,32rem)] flex-col overflow-hidden rounded-t-xl border border-hair bg-panel shadow-xl sm:rounded-xl">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-hair px-4 py-3">
          <h3 id={titleId} className="min-w-0 truncate text-sm font-semibold text-body">{title}</h3>
          <button type="button" aria-label={ui.messages.close} onClick={close} className="icon-btn-sm grid shrink-0 place-items-center text-muted hover:bg-raised focus-ring"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        {content && <div className="min-h-0 overflow-y-auto px-4 py-3">{typeof content === 'object' && content.type ? renderChildren([content], onAction) : <p className="text-sm text-body">{String(content)}</p>}</div>}
        <div className="flex flex-col-reverse gap-2 border-t border-hair px-4 py-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} className="btn-shape btn-pad-md border border-default bg-transparent text-body hover:bg-raised focus-ring">{cancel_label}</button>
          <button type="button" onClick={() => { if (on_confirm) void (onAction ?? ui.onAction)?.(on_confirm); close(); }} className="btn-shape btn-pad-md bg-primary hover:bg-primary-hover focus-ring">{confirm_label}</button>
        </div>
      </div>
    </div>
  );
};
