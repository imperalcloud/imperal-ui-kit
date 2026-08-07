'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DTooltip: UIComponent = ({ node, onAction }) => {
  const { content = '', children, delay_ms = 250 } = node.props as { content?: string; children?: UINode | UINode[]; delay_ms?: number };
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const nodes = children ? (Array.isArray(children) ? children : [children]) : [];
  const open = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setShow(true), Math.max(0, delay_ms)); };
  const close = () => { if (timer.current) clearTimeout(timer.current); setShow(false); };
  useEffect(() => { const key = (event: KeyboardEvent) => event.key === 'Escape' && close(); document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown', key); if (timer.current) clearTimeout(timer.current); }; }, []);
  return (
    <span className="relative inline-flex" aria-describedby={show ? id : undefined} onFocusCapture={open} onBlurCapture={close} onPointerEnter={open} onPointerLeave={close}>
      {renderChildren(nodes, onAction)}
      {show && <span id={id} role="tooltip" className="tooltip-pad pointer-events-none absolute bottom-full left-1/2 z-[var(--imp-z-tooltip,var(--imp-z-popover))] mb-2 max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 text-balance bg-raised text-xs text-body shadow-lg">{content}</span>}
    </span>
  );
};
