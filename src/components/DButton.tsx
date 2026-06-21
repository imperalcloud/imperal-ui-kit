'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { UIComponent, UIAction } from '../types';

type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 text-white border border-blue-600/50',
  secondary:
    'bg-gray-800/60 hover:bg-gray-700/60 text-gray-200 border border-gray-700/50',
  ghost:
    'bg-transparent hover:bg-gray-800/40 text-gray-300 border border-transparent hover:border-gray-700/40',
  danger:
    'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30',
  destructive:
    'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30',
  outline:
    'bg-transparent hover:bg-gray-800/40 text-gray-300 border border-gray-700/50',
  default:
    'bg-gray-700/60 hover:bg-gray-600/60 text-white border border-gray-600/50',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 h-7',
  md: 'text-sm px-4 py-2 h-9',
  lg: 'text-base px-5 py-2.5 h-11',
};

function resolveLucideIcon(name: string): React.FC<{ size?: number }> | null {
  // Try exact name, then PascalCase
  const icons = LucideIcons as any;
  return icons[name] || icons[name.charAt(0).toUpperCase() + name.slice(1)] || null;
}

export const DButton: UIComponent = ({ node, onAction }) => {
  const {
    label = '',
    variant = 'secondary',
    size = 'md',
    on_click,
    disabled = false,
    icon,
    icon_left,
    icon_right,
    full_width = false,
  } = node.props as {
    label?: string;
    variant?: string;
    size?: ButtonSize;
    on_click?: UIAction;
    disabled?: boolean;
    icon?: string;
    icon_left?: string;
    icon_right?: string;
    full_width?: boolean;
  };

  const handleClick = () => {
    if (on_click && onAction && !disabled) {
      onAction(on_click);
    }
  };

  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.secondary;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  const leftIconName = icon || icon_left;
  const LeftIcon = leftIconName ? resolveLucideIcon(leftIconName) : null;
  const RightIcon = icon_right ? resolveLucideIcon(icon_right) : null;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40',
        variantClass,
        sizeClass,
        full_width ? 'w-full' : '',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {LeftIcon && <LeftIcon size={iconSize} />}
      {label}
      {RightIcon && <RightIcon size={iconSize} />}
    </button>
  );
};
