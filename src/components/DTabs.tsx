'use client';

import React, { useState } from 'react';
import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

interface TabDef {
  content?: UINode;
  id: string;
  label: string;
  children?: UINode[];
}

export const DTabs: UIComponent = ({ node, onAction }) => {
  const { tabs = [], default_tab } = node.props as {
    tabs?: TabDef[];
    default_tab?: string;
  };

  const [active, setActive] = useState<string>(
    typeof default_tab === 'number' ? (tabs[default_tab]?.id ?? tabs[0]?.id ?? '') : (default_tab ?? tabs[0]?.id ?? '')
  );

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div className="flex flex-col gap-0 flex-1 min-h-0">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-800/50 overflow-x-auto flex-shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={[
                'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                'border-b-2 -mb-px',
                isActive
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col pt-2">
          {renderChildren(activeTab.children || (activeTab.content ? [activeTab.content] : []), onAction)}
        </div>
      )}
    </div>
  );
};
