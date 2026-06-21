'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DDialog: UIComponent = ({ node, onAction }) => {
  const { title, content, confirm_label = 'Confirm', cancel_label = 'Cancel', on_confirm } = node.props as any;
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={() => setOpen(false)}>
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>
        {content && (
          <div className="px-4 py-3">
            {typeof content === 'object' && content.type
              ? renderChildren([content], onAction)
              : <p className="text-sm text-gray-300">{String(content)}</p>}
          </div>
        )}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-800">
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
          >
            {cancel_label}
          </button>
          <button
            onClick={() => { if (on_confirm && onAction) onAction(on_confirm); setOpen(false); }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500"
          >
            {confirm_label}
          </button>
        </div>
      </div>
    </div>
  );
};
