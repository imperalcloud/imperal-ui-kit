'use client';
import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { UIComponent } from '../types';
import { DeclarativeRenderer } from '../DeclarativeRenderer';

export const DMenu: UIComponent = ({ node, onAction }) => {
  const { items = [], trigger } = node.props as any;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger
          ? <DeclarativeRenderer node={trigger} onAction={onAction} />
          : <MoreVertical className="w-5 h-5 text-gray-400 hover:text-white" />}
      </div>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50 py-1">
          {items.map((item: any, i: number) => {
            if (item.separator) return <hr key={i} className="border-gray-700 my-1" />;
            const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;
            return (
              <button
                key={i}
                onClick={() => { setOpen(false); if (item.on_click && onAction) onAction(item.on_click); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
