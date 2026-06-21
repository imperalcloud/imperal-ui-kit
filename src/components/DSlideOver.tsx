'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DSlideOver: UIComponent = ({ node, onAction }) => {
  const { title, subtitle, children, open = true, width = 'md', on_close } = node.props as any;
  const [visible, setVisible] = useState(open);

  useEffect(() => setVisible(open), [open]);

  if (!visible) return null;

  const widthClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }[width as string] || 'max-w-md';

  const handleClose = () => {
    setVisible(false);
    if (on_close && onAction) onAction(on_close);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className={`relative ${widthClass} w-full bg-gray-950 border-l border-gray-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-mono">{subtitle}</p>}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {renderChildren(children, onAction)}
        </div>
      </div>
    </div>
  );
};
