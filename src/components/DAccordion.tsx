'use client';
import { useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DAccordion: UIComponent = ({ node, onAction }) => {
  const { sections = [], allow_multiple = false } = node.props as any;
  const [open, setOpen] = useState<Set<string>>(new Set());
  const baseId = useId();

  const toggle = (id: string) => {
    setOpen(prev => {
      const next = new Set(allow_multiple ? prev : []);
      if (prev.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="divide-y divide-gray-800">
      {sections.map((s: any, index: number) => {
        const itemId = String(s.id ?? index);
        const panelId = `${baseId}-panel-${itemId}`;
        const buttonId = `${baseId}-button-${itemId}`;
        const expanded = open.has(itemId);
        return (
        <div key={itemId}>
          <button
            type="button"
            id={buttonId}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => toggle(itemId)}
            className="focus-ring flex items-center gap-2 w-full py-2.5 px-1 text-sm text-body hover:text-body"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
            <span className="font-medium">{s.title}</span>
          </button>
          {expanded && (
            <div id={panelId} role="region" aria-labelledby={buttonId} className="pl-6 pb-3 space-y-2">{renderChildren(s.children, onAction)}</div>
          )}
        </div>
        );
      })}
    </div>
  );
};
