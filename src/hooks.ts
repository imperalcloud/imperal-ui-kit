'use client';

import { useEffect, useRef, useState } from 'react';
import type { UINode } from './types';

export function nodeIdentity(node: UINode): string {
  return `${node.id ?? node.key ?? node.type}:${node.revision ?? ''}`;
}

/** Local state that follows declarative value refreshes instead of treating props as mount-only. */
export function useSyncedState<T>(value: T, identity?: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(value);
  useEffect(() => setState(value), [value, identity]);
  return [state, setState];
}

const FOCUSABLE = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"])';

export function useModalFocus(active: boolean, container: React.RefObject<HTMLElement | null>, onEscape: () => void): void {
  const previousFocus = useRef<HTMLElement | null>(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = container.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        escapeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(element => element.offsetParent !== null || element === document.activeElement);
      if (!focusable.length) { event.preventDefault(); panel.focus(); return; }
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === firstItem || document.activeElement === panel)) {
        event.preventDefault(); lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault(); firstItem.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [active, container]);
}

export function useStableArray<T>(value: T[]): T[] {
  const signature = JSON.stringify(value);
  const ref = useRef({ signature, value });
  if (ref.current.signature !== signature) ref.current = { signature, value };
  return ref.current.value;
}
