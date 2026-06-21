'use client';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DAccordion: UIComponent = ({ node, onAction }) => {
  const { sections = [], allow_multiple = false } = node.props as any;
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpen(prev => {
      const next = new Set(allow_multiple ? prev : []);
      if (prev.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="divide-y divide-gray-800">
      {sections.map((s: any) => (
        <div key={s.id}>
          <button
            onClick={() => toggle(s.id)}
            className="flex items-center gap-2 w-full py-2.5 px-1 text-sm text-gray-300 hover:text-white"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${open.has(s.id) ? 'rotate-90' : ''}`}
            />
            <span className="font-medium">{s.title}</span>
          </button>
          {open.has(s.id) && (
            <div className="pl-6 pb-3 space-y-2">{renderChildren(s.children, onAction)}</div>
          )}
        </div>
      ))}
    </div>
  );
};
