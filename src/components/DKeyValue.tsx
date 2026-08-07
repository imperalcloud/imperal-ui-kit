'use client';

import type { UIComponent } from '../types';

export const DKeyValue: UIComponent = ({ node }) => {
  const { items = [], columns = 1 } = node.props as { items?: any[]; columns?: number };
  return (
    <div className="px-3 grid gap-y-1.5 gap-x-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((item: any, i: number) => (
        <div key={i} className="flex justify-between items-baseline py-1 border-b border-hair/50">
          <span className="text-xs text-muted">{item.key}</span>
          <span className="text-xs text-body font-medium">{String(item.value)}</span>
        </div>
      ))}
    </div>
  );
};
