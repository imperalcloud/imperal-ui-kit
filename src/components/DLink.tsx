'use client';

import type React from 'react';
import type { UIAction, UIComponent } from '../types';

function safeHref(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const href = value.trim();
  if (!href) return undefined;
  if (/^(?:https?:|mailto:|tel:|\/|#)/i.test(href)) return href;
  return undefined;
}

export const DLink: UIComponent = ({ node, onAction }) => {
  const { label, href, on_click } = node.props as {
    label?: string;
    href?: string;
    on_click?: UIAction;
  };
  const resolvedHref = safeHref(href);
  const actionable = Boolean(on_click && onAction);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (actionable) {
      event.preventDefault();
      onAction?.(on_click as UIAction);
    }
  };

  if (!resolvedHref && !actionable) {
    return <span className="text-sm text-muted">{label}</span>;
  }

  return (
    <a
      href={resolvedHref || '#'}
      onClick={handleClick}
      className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus-ring"
    >
      {label}
    </a>
  );
};
