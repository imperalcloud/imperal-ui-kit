'use client';
import { Loader2 } from 'lucide-react';
import type { UIComponent } from '../types';

export const DLoading: UIComponent = ({ node }) => {
  const { message = 'Loading...', variant = 'spinner' } = node.props as any;
  if (variant === 'skeleton') {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 py-4 justify-center">
      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      <span className="text-sm text-gray-400">{message}</span>
    </div>
  );
};
