'use client';

import React from 'react';
import type { UIComponent } from '../types';

type BadgeColor = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange';

const COLOR_CLASSES: Record<BadgeColor, string> = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  green: 'bg-green-500/15 text-green-400 border-green-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  gray: 'bg-gray-700/40 text-gray-400 border-gray-700/50',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
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
