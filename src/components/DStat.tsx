'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, icons } from 'lucide-react';
import type { UIComponent } from '../types';

type TrendDirection = 'up' | 'down' | 'neutral';

const TREND_COLORS: Record<TrendDirection, string> = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-muted',
};

// Semantic tint for the metric itself. A number is not neutral: money spent
// reads red, healthy balance green. Keyed to theme tokens, never raw Tailwind
// scales, so agency themes and dark mode keep working.
const VALUE_COLORS = {
  blue: 'text-primary',
  green: 'text-success',
  red: 'text-danger',
  yellow: 'text-warning',
  purple: 'text-accent',
  gray: 'text-muted',
} as const;

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
    color?: keyof typeof VALUE_COLORS;
  };

  const trendColor = TREND_COLORS[trend_direction] ?? TREND_COLORS.neutral;
  const TrendIcon = TREND_ICONS[trend_direction] ?? Minus;

  // Resolve Lucide icon by name (e.g. "Users", "Shield", "Brain")
  const IconComponent = icon ? (icons[icon as keyof typeof icons] ?? null) : null;

  return (
    <div className="surface-raised overflow-hidden p-4 flex flex-col gap-2">
      {/* Label row */}
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0 max-w-full break-words text-xs font-medium leading-snug text-muted uppercase tracking-wide">
          {label}
        </span>
        {IconComponent && (
          <IconComponent className="h-4 w-4 shrink-0 text-muted" />
        )}
      </div>

      {/* Value */}
      <div className={`min-w-0 max-w-full break-words text-2xl font-bold leading-none ${(color && VALUE_COLORS[color]) || 'text-body'}`}>
        {value}
      </div>

      {/* Trend + description */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 min-h-0">
        {trend && (
          <span className={`flex min-w-0 items-center gap-0.5 break-words text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3 w-3 shrink-0" />
            {trend}
          </span>
        )}
        {description && (
          <span className="min-w-0 max-w-full break-words text-xs text-muted">{description}</span>
        )}
      </div>
    </div>
  );
};
