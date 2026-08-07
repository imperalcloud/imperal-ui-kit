'use client';

import React from 'react';
import type { UIComponent, UIAction, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DCard: UIComponent = ({ node, onAction }) => {
  const {
    title,
    subtitle,
    content,
    footer,
    on_click,
    padding = true,
    border = true,
    children,
  } = node.props as {
    title?: string;
    subtitle?: string;
    content?: UINode | UINode[];
    footer?: UINode | UINode[];
    on_click?: UIAction;
    padding?: boolean;
    border?: boolean;
    children?: UINode[];
  };

  const isClickable = !!on_click;
  const isNestedInteractive = (target: EventTarget | null, currentTarget: EventTarget | null) => {
    const element = target instanceof Element ? target : null;
    const root = currentTarget instanceof Element ? currentTarget : null;
    if (!element || !root || element === root) return false;
    return Boolean(element.closest('a,button,input,select,textarea,summary,[role="button"],[role="link"],[role="menuitem"],[tabindex]:not([tabindex="-1"])'));
  };
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isNestedInteractive(event.target, event.currentTarget)) return;
    if (on_click && onAction) void onAction(on_click);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isClickable || isNestedInteractive(event.target, event.currentTarget) || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (on_click && onAction) void onAction(on_click);
  };

  const normalizeNodes = (val: UINode | UINode[] | undefined): UINode[] | undefined => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val;
    if (typeof val === 'object' && val.type) return [val];
    return undefined;
  };

  const bodyNodes = normalizeNodes(content) ?? normalizeNodes(children);
  const footerNodes = normalizeNodes(footer);

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={[
        'flex flex-col',
        border ? 'surface-raised' : 'bg-card/60 card-shape',
        padding ? 'card-pad' : '',
        isClickable ? 'surface-interactive cursor-pointer focus-ring' : '',
      ].filter(Boolean).join(' ')}
    >
      {(title || subtitle) && (
        <header className={[
          'flex flex-col gap-0.5',
          bodyNodes || footerNodes ? 'mb-3' : '',
        ].filter(Boolean).join(' ')}>
          {title && <h3 className="text-sm font-semibold text-body">{title}</h3>}
          {subtitle && <p className="text-xs text-subtle">{subtitle}</p>}
        </header>
      )}

      {bodyNodes && bodyNodes.length > 0 && (
        <div className="flex-1 flex flex-col gap-3">
          {renderChildren(bodyNodes, onAction)}
        </div>
      )}

      {footerNodes && footerNodes.length > 0 && (
        <footer className="flex items-center gap-2 mt-3 pt-3 border-t divide-hairline">
          {renderChildren(footerNodes, onAction)}
        </footer>
      )}
    </div>
  );
};
