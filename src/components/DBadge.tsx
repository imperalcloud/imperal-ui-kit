'use client';

import React from 'react';
import type { UIComponent } from '../types';

type BadgeColor = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange';

const COLOR_CLASSES: Record<BadgeColor, string> = {
  blue: 'bg-primary/15 text-primary border-primary/20',
  green: 'bg-success/15 text-success border-success/20',
  red: 'bg-danger/15 text-danger border-danger/20',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  gray: 'bg-raised/40 text-muted border-default/50',
  purple: 'bg-accent/15 text-primary border-primary/20',
  orange: 'bg-warning/15 text-warning border-warning/20',
};

type BadgeSize = 'sm' | 'md';

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
};

export const DBadge: UIComponent = ({ node }) => {
  const {
    label = '',
    color = 'gray',
    size = 'sm',
    dot,
  } = node.props as {
    label?: string;
    color?: BadgeColor;
    size?: BadgeSize;
    dot?: boolean;
  };

  const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClass} ${sizeClass}`}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full bg-current`}
        />
      )}
      {label}
    </span>
  );
};
