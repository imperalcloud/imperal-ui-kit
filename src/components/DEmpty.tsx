'use client';
import { InboxIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { UIComponent } from '../types';

export const DEmpty: UIComponent = ({ node, onAction }) => {
  const { message = 'No data', icon, action } = node.props as any;
  const IconComp = icon ? (LucideIcons as any)[icon] || InboxIcon : InboxIcon;
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <IconComp className="w-10 h-10 text-gray-600 mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
      {action && onAction && (
        <button
          onClick={() => onAction(action)}
          className="mt-3 px-3 py-1.5 text-xs text-blue-400 border border-blue-800 rounded-md hover:bg-blue-900/30"
        >
          {action.params?.label || 'Try again'}
        </button>
      )}
    </div>
  );
};
