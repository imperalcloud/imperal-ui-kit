'use client';

import React from 'react';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

const COL_MAP: Record<string, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-2',
  '3': 'grid-cols-3',
  '4': 'grid-cols-4',
  '5': 'grid-cols-5',
  '6': 'grid-cols-6',
  '12': 'grid-cols-12',
};

const GAP_MAP: Record<string, string> = {
  '0': 'gap-0',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

export const Grid: UIComponent = ({ node, onAction }) => {
  const {
    columns = '2',
    gap = '4',
    className: extraClass,
    children,
  } = node.props as {
    columns?: string | number;
    gap?: string | number;
    className?: string;
    children?: import('../types').UINode[];
  };

  const colKey = String(columns);
  const gapKey = String(gap);

  const colClass = COL_MAP[colKey] ?? `grid-cols-${colKey}`;
  const gapClass = GAP_MAP[gapKey] ?? `gap-${gapKey}`;

  return (
    <div className={`grid ${colClass} ${gapClass} ${extraClass ?? ''}`}>
      {renderChildren(children, onAction)}
    </div>
  );
};
