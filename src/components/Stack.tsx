'use client';

import React from 'react';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

const GAP_MAP: Record<string, string> = {
  '0': 'gap-0',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

const ALIGN_MAP: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const JUSTIFY_MAP: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export const Stack: UIComponent = ({ node, onAction }) => {
  const {
    direction = 'v',
    gap = '3',
    align,
    justify,
    wrap,
    sticky,
    className: extraClass,
    children,
  } = node.props as {
    direction?: string;
    gap?: string;
    align?: string;
    justify?: string;
    wrap?: boolean;
    sticky?: boolean;
    className?: string;
    children?: import('../types').UINode[];
  };

  const isHorizontal = direction === 'h' || direction === 'horizontal';

  const defaultPadding = isHorizontal
    ? (sticky ? 'py-2.5' : 'py-1.5')
    : '';

  const shouldWrap = isHorizontal ? (wrap !== false) : (wrap === true);

  const classes = [
    'flex min-w-0',
    isHorizontal ? 'flex-row items-center' : 'flex-col flex-1 min-h-0',
    GAP_MAP[String(gap)] ?? `gap-${gap}`,
    align ? (ALIGN_MAP[align] ?? '') : '',
    justify ? (JUSTIFY_MAP[justify] ?? '') : '',
    shouldWrap ? 'flex-wrap' : '',
    sticky ? 'sticky top-0 z-10 bg-gray-950' : '',
    extraClass || defaultPadding,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {renderChildren(children, onAction)}
    </div>
  );
};
