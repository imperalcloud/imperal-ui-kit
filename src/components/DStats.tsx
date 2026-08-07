'use client';

import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DStats: UIComponent = ({ node, onAction }) => {
  const { children = [], columns = 0 } = node.props as { children?: UINode[]; columns?: number };
  const cols = Math.max(1, columns > 0 ? columns : Math.min(children.length, 4));
  const gapRem = (cols - 1) * 0.75;
  const preferredTrack = `max(8rem, calc((100% - ${gapRem}rem) / ${cols}))`;

  return (
    <div
      className="grid min-w-0 max-w-full gap-3"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${preferredTrack}), 1fr))`,
      }}
    >
      {renderChildren(children, onAction)}
    </div>
  );
};
