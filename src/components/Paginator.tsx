'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  /** Optional extra info after item count (e.g. "· 5 unread") */
  extra?: string;
}

/**
 * System Paginator — unified pagination across all Imperal UI.
 * Used by DList (Declarative UI) and any React component.
 */
export default function Paginator({ page, totalPages, totalItems, loading, onPageChange, extra }: Props) {
  if (totalPages <= 1 && totalItems <= 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-t border-gray-800/40 flex-shrink-0">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1 || loading}
        className="p-0.5 rounded text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={14} />
      </button>
      <span className="text-[10px] text-gray-500 tabular-nums">
        {page}/{Math.max(1, totalPages)}
      </span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || loading}
        className="p-0.5 rounded text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
        <ChevronRight size={14} />
      </button>
      {totalItems > 0 && (
        <>
          <span className="text-gray-700 text-[10px]">·</span>
          <span className="text-[10px] text-gray-600 truncate">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
            {extra ? ` ${extra}` : ''}
          </span>
        </>
      )}
    </div>
  );
}
