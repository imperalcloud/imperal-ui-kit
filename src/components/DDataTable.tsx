'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { UIComponent, UIAction, Column } from '../types';

type SortDir = 'asc' | 'desc' | null;

interface SortState {
  key: string;
  dir: SortDir;
}

interface EditState {
  rowIdx: number;
  colKey: string;
}

export const DDataTable: UIComponent = ({ node, onAction }) => {
  const {
    columns = [],
    rows = [],
    on_row_click,
    on_cell_edit,
    empty_text = 'No data',
    sticky_header = false,
    max_height,
  } = node.props as {
    columns?: Column[];
    rows?: Record<string, unknown>[];
    on_row_click?: UIAction;
    on_cell_edit?: UIAction;
    empty_text?: string;
    sticky_header?: boolean;
    max_height?: string;
  };

  const [sort, setSort] = useState<SortState>({ key: '', dir: null });
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const aStr = String(av ?? '');
      const bStr = String(bv ?? '');
      const cmp = isNaN(Number(aStr)) || isNaN(Number(bStr))
        ? aStr.localeCompare(bStr)
        : Number(aStr) - Number(bStr);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  const handleSort = (col: Column) => {
    if (!col.sortable) return;
    setSort((prev) => {
      if (prev.key !== col.key) return { key: col.key, dir: 'asc' };
      if (prev.dir === 'asc') return { key: col.key, dir: 'desc' };
      return { key: '', dir: null };
    });
  };

  const handleRowClick = (row: Record<string, unknown>) => {
    if (on_row_click && onAction) {
      onAction({ ...on_row_click, params: { ...on_row_click.params, row } });
    }
  };

  const startEdit = (rowIdx: number, col: Column, row: Record<string, unknown>) => {
    if (!col.editable || !on_cell_edit) return;
    setEditing({ rowIdx, colKey: col.key });
    setEditValue(String(row[col.key] ?? ''));
  };

  const commitEdit = (row: Record<string, unknown>, col: Column, value: string) => {
    if (!on_cell_edit || !onAction) return;
    setEditing(null);
    onAction({
      ...on_cell_edit,
      params: {
        ...on_cell_edit.params,
        row_id: row.id,
        column_key: col.key,
        value,
      },
    });
  };

  const handleToggle = (row: Record<string, unknown>, col: Column) => {
    if (!on_cell_edit || !onAction) return;
    const current = row[col.key];
    const newValue = !current;
    onAction({
      ...on_cell_edit,
      params: {
        ...on_cell_edit.params,
        row_id: row.id,
        column_key: col.key,
        value: newValue,
      },
    });
  };

  const isClickable = !!on_row_click;

  return (
    <div
      className="overflow-auto rounded-lg border border-gray-800/50"
      style={max_height ? { maxHeight: max_height } : undefined}
    >
      <table className="w-full text-sm border-collapse">
        <thead className={sticky_header ? 'sticky top-0 z-10' : ''}>
          <tr className="bg-gray-800/60 border-b border-gray-800/50">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                style={col.width ? { width: col.width } : undefined}
                className={[
                  'px-3 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide',
                  'whitespace-nowrap select-none',
                  col.sortable ? 'cursor-pointer hover:text-gray-200 transition-colors' : '',
                ].join(' ')}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="flex flex-col">
                      {sort.key === col.key && sort.dir === 'asc' ? (
                        <ChevronUp className="w-3 h-3 text-blue-400" />
                      ) : sort.key === col.key && sort.dir === 'desc' ? (
                        <ChevronDown className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 text-gray-600" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-gray-600 text-sm"
              >
                {empty_text}
              </td>
            </tr>
          ) : (
            sorted.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={isClickable ? () => handleRowClick(row) : undefined}
                className={[
                  'border-b border-gray-800/30 last:border-b-0',
                  'transition-colors',
                  isClickable
                    ? 'cursor-pointer hover:bg-gray-800/40'
                    : 'hover:bg-gray-800/20',
                ].join(' ')}
              >
                {columns.map((col) => {
                  const isEditing =
                    editing?.rowIdx === rowIdx && editing?.colKey === col.key;

                  // toggle edit_type
                  if (col.editable && col.edit_type === 'toggle') {
                    const boolVal = Boolean(row[col.key]);
                    return (
                      <td
                        key={col.key}
                        className="px-3 py-2.5 text-gray-300 text-sm"
                        onClick={(e) => { e.stopPropagation(); handleToggle(row, col); }}
                      >
                        <button
                          type="button"
                          aria-checked={boolVal}
                          className={[
                            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                            boolVal ? 'bg-blue-500' : 'bg-gray-600',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                              boolVal ? 'translate-x-4' : 'translate-x-1',
                            ].join(' ')}
                          />
                        </button>
                      </td>
                    );
                  }

                  // text edit_type (default)
                  if (col.editable && col.edit_type !== 'toggle') {
                    if (isEditing) {
                      return (
                        <td
                          key={col.key}
                          className="px-3 py-2 text-gray-300 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(row, col, editValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit(row, col, editValue);
                              if (e.key === 'Escape') setEditing(null);
                            }}
                            className="w-full bg-gray-700 border border-blue-500 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none"
                          />
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.key}
                        className="px-3 py-2.5 text-gray-300 text-sm cursor-text hover:bg-gray-700/40 group"
                        onClick={(e) => { e.stopPropagation(); startEdit(rowIdx, col, row); }}
                      >
                        <span className="flex items-center gap-1">
                          {String(row[col.key] ?? '')}
                          <span className="opacity-0 group-hover:opacity-40 text-gray-400 text-xs">✎</span>
                        </span>
                      </td>
                    );
                  }

                  // non-editable cell
                  return (
                    <td
                      key={col.key}
                      className="px-3 py-2.5 text-gray-300 text-sm"
                    >
                      {String(row[col.key] ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
