'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { UIAction, UIComponent, UINode } from '../types';
import { DeclarativeRenderer } from '../DeclarativeRenderer';

interface MenuItem { label?: string; icon?: string; on_click?: UIAction; separator?: boolean }

export const DMenu: UIComponent = ({ node, onAction }) => {
  const { items = [], trigger } = node.props as { items?: MenuItem[]; trigger?: UINode };
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', keyboard); };
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" aria-label="Open menu" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(value => !value)} className="rounded p-1 focus-ring">
        {trigger ? <DeclarativeRenderer node={trigger} onAction={onAction} /> : <MoreVertical aria-hidden="true" className="h-5 w-5 text-gray-400" />}
      </button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 z-50 mt-1 w-48 rounded-md border border-gray-700 bg-gray-900 py-1 shadow-lg">
          {items.map((item, index) => {
            if (item.separator) return <hr key={index} className="my-1 border-gray-700" />;
            const Icon = item.icon ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>>)[item.icon] : null;
            return <button key={index} type="button" role="menuitem" onClick={() => { setOpen(false); if (item.on_click && onAction) onAction(item.on_click); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none">{Icon && <Icon aria-hidden={true} className="h-4 w-4" />}{item.label}</button>;
          })}
        </div>
      )}
    </div>
  );
};
