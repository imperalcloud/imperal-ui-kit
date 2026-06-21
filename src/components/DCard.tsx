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
  const handleClick = () => { if (on_click && onAction) onAction(on_click); };

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
      onClick={isClickable ? handleClick : undefined}
      className={[
        'flex flex-col bg-card/60 card-shape',
        border ? 'border border-hair' : '',
        padding ? 'card-pad' : '',
        isClickable ? 'cursor-pointer hover:bg-card transition-colors' : '',
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
        <footer className="flex items-center gap-2 mt-3 pt-3 border-t border-hair">
          {renderChildren(footerNodes, onAction)}
        </footer>
      )}
    </div>
  );
};
