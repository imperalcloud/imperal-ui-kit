'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, icons } from 'lucide-react';
import type { UIComponent } from '../types';

type TrendDirection = 'up' | 'down' | 'neutral';

const TREND_COLORS: Record<TrendDirection, string> = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-gray-500',
};

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export const DStat: UIComponent = ({ node }) => {
  const {
    label = '',
    value = '',
    trend,
    trend_direction = 'neutral',
    description,
    icon,
    color,
  } = node.props as {
    label?: string;
    value?: string | number;
    trend?: string;
    trend_direction?: TrendDirection;
    description?: string;
    icon?: string;
    color?: string;
  };

  const trendColor = TREND_COLORS[trend_direction] ?? TREND_COLORS.neutral;
  const TrendIcon = TREND_ICONS[trend_direction] ?? Minus;

  // Resolve Lucide icon by name (e.g. "Users", "Shield", "Brain")
  const IconComponent = icon ? (icons[icon as keyof typeof icons] ?? null) : null;

  return (
    <div className="bg-gray-800/40 border border-gray-800/50 rounded-lg p-4 flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        {IconComponent && (
          <IconComponent className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-white leading-none">
        {value}
      </div>

      {/* Trend + description */}
      <div className="flex items-center gap-2 min-h-0">
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trend}
          </span>
        )}
        {description && (
          <span className="text-xs text-gray-500 truncate">{description}</span>
        )}
      </div>
    </div>
  );
};
