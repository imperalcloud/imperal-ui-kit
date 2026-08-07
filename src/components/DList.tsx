'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, ChevronRight, Check, X, icons } from 'lucide-react';
import Paginator from './Paginator';
import type { UIComponent, UIAction, ListItemData, UINode } from '../types';
import { DeclarativeRenderer, renderChildren, useOnConfirm } from '../DeclarativeRenderer';

// ─── Types ───────────────────────────────────────────────────────────── //

interface HoverAction {
  icon: string;
  on_click?: UIAction;
  confirm?: string;
  label?: string;
}

interface BulkActionDef {
  label: string;
  icon?: string;
  action: UIAction;
  variant?: string;
}

interface DListItemProps {
  item: ListItemData & {
    actions?: HoverAction[];
    draggable?: boolean;
    droppable?: boolean;
    on_drop?: UIAction;
    icon?: string;
    expandable?: boolean;
    expanded_content?: UINode | UINode[];
  };
  onAction?: (action: UIAction) => void;
  selectable?: boolean;
  isSelected?: boolean;
  hasSelection?: boolean;
  onToggleSelect?: (id: string) => void;
}

// ─── Checkbox ────────────────────────────────────────────────────────── //

function SelectCheckbox({ checked, onChange, className = '' }:
  { checked: boolean; onChange: () => void; className?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? 'Deselect item' : 'Select item'}
      onClick={e => { e.stopPropagation(); onChange(); }}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-focus/70 ${
        checked ? 'bg-primary border-primary' : 'border-strong hover:border-strong'
      } ${className}`}
    >
      {checked && <Check aria-hidden="true" size={10} className="text-body" strokeWidth={3} />}
    </button>
  );
}

// ─── List Item (system component) ────────────────────────────────────── //

function DListItem({ item, onAction, selectable, isSelected, hasSelection, onToggleSelect }: DListItemProps) {
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const onConfirmFn = useOnConfirm();

  const isExpandable = !!item.expandable;

  const handleClick = () => {
    if (hasSelection && selectable && onToggleSelect) {
      onToggleSelect(item.id);
      return;
    }
    if (isExpandable) {
      setExpanded(!expanded);
    } else if (item.on_click && onAction) {
      onAction(item.on_click);
    }
  };

  const handleHoverAction = async (e: React.MouseEvent, act: HoverAction) => {
    e.stopPropagation();
    if (!act.on_click || !onAction) return;
    if (act.confirm && !(await onConfirmFn(act.confirm))) return;
    onAction(act.on_click);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!item.droppable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!item.on_drop || !onAction) return;
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === item.id) return;
    onAction({
      ...item.on_drop,
      params: { ...(item.on_drop.params || {}), dragged_id: draggedId, target_id: item.id },
    });
  };

  const isClickable = !!item.on_click || isExpandable || (hasSelection && selectable);
  const actions = item.actions || [];
  const ItemIcon = item.icon ? (icons[item.icon as keyof typeof icons] ?? null) : null;

  const expandedNodes = item.expanded_content
    ? (Array.isArray(item.expanded_content) ? item.expanded_content : [item.expanded_content])
    : [];

  return (
    <div
      draggable={item.draggable || false}
      onDragStart={item.draggable ? handleDragStart : undefined}
      onDragOver={item.droppable ? handleDragOver : undefined}
      onDragLeave={item.droppable ? handleDragLeave : undefined}
      onDrop={item.droppable ? handleDrop : undefined}
      className={[
        'border-b border-hair/50 transition-all relative select-none',
        item.selected || isSelected ? 'bg-primary/10 border-l-2 border-l-blue-500' : '',
        dragOver ? 'bg-primary/20 ring-1 ring-focus/50' : '',
        item.draggable ? 'cursor-grab active:cursor-grabbing' : '',
      ].join(' ')}
    >
      <div
        onClick={isClickable ? handleClick : undefined}
        onKeyDown={isClickable ? event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleClick(); }
        } : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-expanded={isExpandable ? expanded : undefined}
        className={[
          'group row-pad',
          isClickable ? 'cursor-pointer hover:bg-card' : '',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          {selectable && onToggleSelect && (
            <div className={`flex-shrink-0 transition-opacity ${hasSelection ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <SelectCheckbox checked={!!isSelected} onChange={() => onToggleSelect(item.id)} />
            </div>
          )}

          {selectable && item.badge && !hasSelection && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 group-hover:opacity-0 transition-opacity" />
          )}

          {isExpandable && (
            <ChevronRight
              size={14}
              className={`flex-shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          )}

          {ItemIcon && <ItemIcon size={14} className="flex-shrink-0 text-muted" />}

          {item.avatar && <DeclarativeRenderer node={item.avatar as UINode} onAction={onAction} />}

          <div className="flex-1 min-w-0">
            <p className={`text-xs truncate ${item.selected || isSelected ? 'font-semibold text-body' : item.badge ? 'font-semibold text-body' : 'font-normal text-body'}`}>
              {item.title}
              {!selectable && item.badge && <> <DeclarativeRenderer node={item.badge as UINode} onAction={onAction} /></>}
            </p>
            {item.subtitle && <p className="text-xs text-muted truncate mt-0.5">{item.subtitle}</p>}
          </div>

          {item.meta && (
            <span className={`text-xs text-muted whitespace-nowrap flex-shrink-0 ${actions.length > 0 ? 'group-hover:hidden' : ''}`}>
              {item.meta}
            </span>
          )}

          {actions.length > 0 && (
            <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
              {actions.map((act, i) => {
                const Icon = icons[act.icon as keyof typeof icons] ?? icons.Circle;
                return (
                  <button key={i} onClick={e => { void handleHoverAction(e, act); }} title={act.label || act.icon}
                    className="p-1 rounded text-subtle hover:text-danger hover:bg-danger/10 transition-colors">
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {expanded && expandedNodes.length > 0 && (
        <div className="px-3 py-2 border-t border-hair/30 bg-panel/30">
          {renderChildren(expandedNodes, onAction)}
        </div>
      )}
    </div>
  );
}

// ─── Bulk Action Bar ─────────────────────────────────────────────────── //

function BulkActionBar({ selectedCount, totalCount, onSelectAll, onClear, bulkActions, onBulkAction }:
  { selectedCount: number; totalCount: number; onSelectAll: () => void; onClear: () => void;
    bulkActions: BulkActionDef[]; onBulkAction: (action: UIAction) => void }) {

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="sticky top-0 z-10 px-3 py-2 border-b border-primary/30 bg-app flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button onClick={onSelectAll}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary transition-colors flex-shrink-0">
          <SelectCheckbox checked={allSelected} onChange={onSelectAll} />
          <span className="font-medium tabular-nums">{allSelected ? 'All' : selectedCount.toString()}</span>
        </button>
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {bulkActions.map((ba, i) => {
            const Icon = ba.icon ? (icons[ba.icon as keyof typeof icons] ?? null) : null;
            return (
              <button key={i} onClick={() => onBulkAction(ba.action)} title={ba.label}
                className="text-[.6875rem] px-2 py-1 bg-card hover:bg-raised text-body hover:text-body rounded-md transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                {Icon && <Icon size={12} />}
                {ba.label}
              </button>
            );
          })}
        </div>
        <button onClick={onClear} title="Clear selection"
          className="text-subtle hover:text-muted transition-colors flex-shrink-0 p-0.5 rounded hover:bg-card">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── DList Component ─────────────────────────────────────────────────── //

export const DList: UIComponent = ({ node, onAction }) => {
  const {
    items: rawItems = [],
    searchable = false,
    search_placeholder = 'Search...',
    empty_text = 'No items',
    title,
    max_height,
    page_size = 0,
    on_end_reached,
    selectable = false,
    bulk_actions: rawBulkActions,
    total_items = 0,
    extra_info = '',
    grouped_by = '',
  } = node.props as {
    items?: any[];
    searchable?: boolean;
    search_placeholder?: string;
    empty_text?: string;
    title?: string;
    max_height?: string;
    page_size?: number;
    on_end_reached?: UIAction;
    selectable?: boolean;
    bulk_actions?: BulkActionDef[];
    total_items?: number;
    extra_info?: string;
    grouped_by?: string;
  };

  const items = useMemo(() =>
    rawItems.map((item: any) => item.type === 'ListItem' && item.props ? item.props : item),
    [rawItems],
  );

  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { setSelectedIds(new Set()); }, [rawItems]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i: any) =>
      i.title?.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q) || i.meta?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => { setCurrentPage(1); }, [query]);

  const paginated = page_size > 0;
  const totalPages = paginated ? Math.max(1, Math.ceil(filtered.length / page_size)) : 1;
  const displayItems = paginated ? filtered.slice((currentPage - 1) * page_size, currentPage * page_size) : filtered;

  const hasSelection = selectedIds.size > 0;
  const bulkActions = rawBulkActions || [];

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i: any) => i.id)));
    }
  }, [filtered, selectedIds.size]);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkAction = useCallback((action: UIAction) => {
    if (!onAction) return;
    const ids = Array.from(selectedIds);
    const enriched: UIAction = {
      ...action,
      params: { ...(action.params || {}), message_ids: ids },
    };
    onAction(enriched);
    setSelectedIds(new Set());
  }, [selectedIds, onAction]);

  // ─── Infinite scroll sentinel ─────────────────────────────────────── //
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!on_end_reached || !onAction || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onAction(on_end_reached);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [on_end_reached, onAction]);

  const showFooterPaginator = total_items > 0 || extra_info;
  const footerTotalItems = total_items > 0 ? total_items : items.length;

  return (
    <div className={`flex flex-col ${max_height ? "flex-shrink-0" : "flex-1 min-h-0"}`}>
      {/* System search bar */}
      {searchable && (
        <div className="sticky top-0 z-[5] bg-app px-3 pt-2.5 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={search_placeholder}
              className="w-full bg-card/60 border border-default/50 rounded-md pl-8 pr-3 py-1.5 text-xs text-body placeholder:text-subtle focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
        </div>
      )}

      {/* Title */}
      {title && (
        <div className="px-3 pb-1 flex-shrink-0">
          <span className="text-[.625rem] font-medium text-muted uppercase tracking-wider">{title}</span>
        </div>
      )}

      {/* Bulk action bar — sticky at top, always visible when selection active */}
      {selectable && hasSelection && bulkActions.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filtered.length}
          onSelectAll={handleSelectAll}
          onClear={handleClearSelection}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
        />
      )}

      {/* List body — scrollable */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0"
        style={max_height ? { maxHeight: max_height } : undefined}>
        {displayItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-subtle">{empty_text}</div>
        ) : (
          displayItems.map((item: any, index: number) => {
            const previous = displayItems[index - 1];
            const group = grouped_by ? String(item[grouped_by] ?? '') : '';
            const showGroup = grouped_by && (!previous || String(previous[grouped_by] ?? '') !== group);
            return (
              <React.Fragment key={item.id ?? index}>
                {showGroup && <div className="px-3 py-1 text-[.625rem] font-medium uppercase tracking-wider text-muted bg-panel/60">{group || 'Other'}</div>}
                <DListItem
                  item={item}
                  onAction={onAction}
                  selectable={selectable}
                  isSelected={selectedIds.has(item.id)}
                  hasSelection={hasSelection}
                  onToggleSelect={selectable ? toggleSelect : undefined}
                />
              </React.Fragment>
            );
          })
        )}

        {on_end_reached && <div ref={sentinelRef} className="h-px shrink-0" aria-hidden="true" />}
      </div>

      {/* System paginator — sticky bottom, always visible */}
      {paginated && filtered.length > page_size && (
        <div className="mt-auto sticky bottom-0 z-10 bg-app border-t border-hair/30 flex-shrink-0">
          <Paginator page={currentPage} totalPages={totalPages} totalItems={filtered.length}
            onPageChange={p => setCurrentPage(Math.max(1, Math.min(p, totalPages)))} />
        </div>
      )}

      {/* Footer paginator — total items + extra info (for infinite scroll lists) */}
      {!paginated && showFooterPaginator && (
        <div className="mt-auto sticky bottom-0 z-10 bg-app border-t border-hair/30 flex-shrink-0">
          <Paginator
            page={1}
            totalPages={on_end_reached ? 2 : 1}
            totalItems={footerTotalItems}
            loading={false}
            onPageChange={() => { if (on_end_reached && onAction) onAction(on_end_reached); }}
            extra={extra_info || undefined}
          />
        </div>
      )}
    </div>
  );
};
