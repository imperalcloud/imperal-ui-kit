'use client';
import { AlertTriangle } from 'lucide-react';
import type { UIComponent } from '../types';

export const DError: UIComponent = ({ node, onAction }) => {
  const { message, title = 'Error', retry } = node.props as any;
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <AlertTriangle className="w-8 h-8 text-danger mb-2" />
      <p className="text-sm font-medium text-danger">{title}</p>
      <p className="text-xs text-muted mt-1">{message}</p>
      {retry && onAction && (
        <button
          onClick={() => onAction(retry)}
          className="focus-ring mt-3 px-3 py-1.5 text-xs text-danger border border-danger rounded-md hover:bg-danger/30"
        >
          Try again
        </button>
      )}
    </div>
  );
};
