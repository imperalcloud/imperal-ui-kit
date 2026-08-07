'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { UIAction, UIComponent, UINode } from '../types';

interface MenuItem {
  id?: string;
  label?: string;
  icon?: string;
  disabled?: boolean;
  on_click?: UIAction;
  separator?: boolean;
}

function getTriggerLabel(trigger?: UINode): string {
  if (!trigger) return 'Open menu';
  const label = trigger.props.label ?? trigger.props.title ?? trigger.props.content ?? trigger.props['aria-label'];
  return typeof label === 'string' && label.trim() ? label : 'Open menu';
}

export const DMenu: UIComponent = ({ node, onAction }) => {
  const { items = [], trigger, align = 'end' } = node.props as {
    items?: MenuItem[];
    trigger?: UINode;
    align?: 'start' | 'end';
  };
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pendingFocus = useRef<'first' | 'last' | null>(null);

  const menuItems = useCallback(() => [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])], []);
  const focusItem = useCallback((index: number) => {
    const available = menuItems();
    if (!available.length) return;
    available[(index + available.length) % available.length]?.focus();
  }, [menuItems]);
  const openAndFocus = (last = false) => {
    pendingFocus.current = last ? 'last' : 'first';
    setOpen(true);
  };
  const close = (restoreFocus = true) => {
    if (restoreFocus) triggerRef.current?.focus();
    setOpen(false);
  };

  useEffect(() => {
    if (!open || !pendingFocus.current) return;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    focusItem(target === 'last' ? -1 : 0);
  }, [open, focusItem]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, focusItem]);

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAndFocus(false);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAndFocus(true);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const available = menuItems();
    const current = available.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      close(event.key === 'Escape');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(current + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(-1);
    }
  };

  const label = getTriggerLabel(trigger);
  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => open ? close(false) : openAndFocus(false)}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm text-body transition-colors hover:bg-card focus-ring"
      >
        {trigger ? <span aria-hidden="true">{label}</span> : <MoreVertical aria-hidden="true" className="h-5 w-5" />}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`absolute z-50 mt-1 min-w-48 max-w-[min(22rem,calc(100vw-2rem))] rounded-md border border-default bg-panel py-1 shadow-lg ${align === 'start' ? 'left-0' : 'right-0'}`}
        >
          {items.map((item, index) => {
            const key = item.id ?? `${item.label ?? 'separator'}-${index}`;
            if (item.separator) return <hr key={key} className="my-1 border-default" />;
            const Icon = item.icon ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>>)[item.icon] : null;
            return (
              <button
                key={key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={-1}
                onClick={() => {
                  close(true);
                  if (item.on_click && onAction) void onAction(item.on_click);
                }}
                className="flex min-h-9 w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-body hover:bg-card focus:bg-card focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Icon && <Icon aria-hidden={true} className="h-4 w-4 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
