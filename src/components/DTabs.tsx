'use client';

import React, { useId, useState } from 'react';
import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

interface TabDef {
  content?: UINode;
  id: string;
  label: string;
  children?: UINode[];
}

export const DTabs: UIComponent = ({ node, onAction }) => {
  const { tabs = [], default_tab } = node.props as { tabs?: TabDef[]; default_tab?: string | number };
  const baseId = useId();
  const normalizedTabs = tabs.map((tab, index) => ({ ...tab, id: tab.id || `tab-${index}` }));
  const [active, setActive] = useState<string>(
    typeof default_tab === 'number'
      ? (normalizedTabs[default_tab]?.id ?? normalizedTabs[0]?.id ?? '')
      : (default_tab ?? normalizedTabs[0]?.id ?? ''),
  );
  const activeTab = normalizedTabs.find(tab => tab.id === active);

  const moveFocus = (current: number, delta: number) => {
    if (!normalizedTabs.length) return;
    const next = normalizedTabs[(current + delta + normalizedTabs.length) % normalizedTabs.length];
    setActive(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  return (
    <div className="flex flex-col gap-0 flex-1 min-h-0">
      <div role="tablist" className="flex gap-0 border-b border-gray-800/50 overflow-x-auto flex-shrink-0">
        {normalizedTabs.map((tab, index) => {
          const isActive = tab.id === active;
          return (
            <button
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              key={tab.id}
              onClick={() => setActive(tab.id)}
              onKeyDown={event => {
                if (event.key === 'ArrowRight') { event.preventDefault(); moveFocus(index, 1); }
                if (event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(index, -1); }
                if (event.key === 'Home') { event.preventDefault(); moveFocus(0, -index); }
                if (event.key === 'End') { event.preventDefault(); moveFocus(0, normalizedTabs.length - 1 - index); }
              }}
              className={[
                'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px focus-ring',
                isActive ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeTab.id}`}
          aria-labelledby={`${baseId}-tab-${activeTab.id}`}
          className="flex-1 min-h-0 overflow-hidden flex flex-col pt-2"
        >
          {renderChildren(activeTab.children || (activeTab.content ? [activeTab.content] : []), onAction)}
        </div>
      )}
    </div>
  );
};
