'use client';

import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DStats: UIComponent = ({ node, onAction }) => {
  const { children = [], columns = 0 } = node.props as { children?: UINode[]; columns?: number };
  const cols = Math.max(1, columns > 0 ? columns : Math.min(children.length, 4));
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {renderChildren(children, onAction)}
    </div>
  );
};
