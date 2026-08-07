'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { UIComponent, UIAction } from '../types';
import { useImperalUI, useUIAction } from '../ImperalUIProvider';

const VARIANTS: Record<string, string> = {
  primary: 'bg-primary border border-primary text-on-primary',
  secondary: 'button-secondary', default: 'button-secondary', outline: 'button-secondary',
  ghost: 'button-ghost', danger: 'button-danger', destructive: 'button-danger',
};
const SIZES = { sm: 'text-xs px-3', md: 'text-sm px-4', lg: 'text-base px-5 min-h-12' } as const;
function icon(name?: string) { if (!name) return null; const icons = LucideIcons as unknown as Record<string, React.FC<{ size?: number; 'aria-hidden'?: boolean }>>; return icons[name] ?? icons[name[0].toUpperCase() + name.slice(1)] ?? null; }

export const DButton: UIComponent = ({ node, onAction }) => {
  const ui = useImperalUI();
  const { pending, error, run } = useUIAction(onAction);
  const { label = '', variant = 'secondary', size = 'md', on_click, disabled = false, loading = false, loading_label, icon: iconName, icon_left, icon_right, full_width = false, type = 'button' } = node.props as {
    label?: string; variant?: string; size?: keyof typeof SIZES; on_click?: UIAction; disabled?: boolean; loading?: boolean; loading_label?: string; icon?: string; icon_left?: string; icon_right?: string; full_width?: boolean; type?: 'button' | 'submit' | 'reset';
  };
  const busy = loading || pending;
  const Left = icon(iconName ?? icon_left); const Right = icon(icon_right); const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  return <div className={full_width ? 'w-full' : 'inline-flex flex-col'}>
    <button type={type} data-size={size} aria-busy={busy} aria-disabled={disabled || busy} disabled={disabled || busy} onClick={() => { if (on_click) void run(on_click); }} className={`button-base ${VARIANTS[variant] ?? VARIANTS.secondary} ${SIZES[size]} ${full_width ? 'w-full' : ''}`}>
      {busy ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> : Left ? <Left size={iconSize} aria-hidden={true} /> : null}
      <span>{busy ? (loading_label ?? ui.messages.loading) : label}</span>{!busy && Right ? <Right size={iconSize} aria-hidden={true} /> : null}
    </button>
    {Boolean(error) && <span role="alert" className="mt-1 text-xs text-danger">{error instanceof Error ? error.message : ui.messages.sectionFailed}</span>}
  </div>;
};
