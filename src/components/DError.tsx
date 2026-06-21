'use client';
import { AlertTriangle } from 'lucide-react';
import type { UIComponent } from '../types';

export const DError: UIComponent = ({ node, onAction }) => {
  const { message, title = 'Error', retry } = node.props as any;
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
      <p className="text-sm font-medium text-red-400">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{message}</p>
      {retry && onAction && (
        <button
          onClick={() => onAction(retry)}
          className="mt-3 px-3 py-1.5 text-xs text-red-400 border border-red-800 rounded-md hover:bg-red-900/30"
        >
          Try again
        </button>
      )}
    </div>
  );
};
