'use client';

import React from 'react';
import type { UIComponent } from '../types';

type ProgressVariant = 'bar' | 'circular';
type ProgressColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

const BAR_COLOR_CLASSES: Record<ProgressColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
};

export const DProgress: UIComponent = ({ node }) => {
  const {
    value = 0,
    max = 100,
    variant = 'bar',
    color = 'blue',
    label,
    show_value = false,
    size = 'md',
  } = node.props as {
    value?: number;
    max?: number;
    variant?: ProgressVariant;
    color?: ProgressColor;
    label?: string;
    show_value?: boolean;
    size?: 'sm' | 'md' | 'lg';
  };

  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = BAR_COLOR_CLASSES[color] ?? BAR_COLOR_CLASSES.blue;

  if (variant === 'circular') {
    return <CircularProgress value={pct} color={color} label={label} show_value={show_value} size={size} />;
  }

  const heightClass = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="flex flex-col gap-1.5">
      {(label || show_value) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-gray-400">{label}</span>}
          {show_value && (
            <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-800/60 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ---- Circular variant ----
const CIRCLE_SIZES: Record<string, number> = { sm: 40, md: 56, lg: 72 };
const STROKE_WIDTHS: Record<string, number> = { sm: 3, md: 4, lg: 5 };

const CIRCLE_COLORS: Record<ProgressColor, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  purple: '#a855f7',
};

interface CircularProps {
  value: number;
  color: ProgressColor;
  label?: string;
  show_value?: boolean;
  size?: string;
}

function CircularProgress({ value, color, label, show_value, size = 'md' }: CircularProps) {
  const diameter = CIRCLE_SIZES[size] ?? 56;
  const stroke = STROKE_WIDTHS[size] ?? 4;
  const r = (diameter - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const strokeColor = CIRCLE_COLORS[color] ?? CIRCLE_COLORS.blue;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: diameter, height: diameter }}>
        <svg width={diameter} height={diameter} className="-rotate-90">
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={r}
            stroke="rgb(31 41 55 / 0.6)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={r}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {show_value && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">{Math.round(value)}%</span>
          </div>
        )}
      </div>
      {label && <span className="text-xs text-gray-400">{label}</span>}
    </div>
  );
}
