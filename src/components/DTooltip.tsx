'use client';

import { useId, useState } from 'react';
import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DTooltip: UIComponent = ({ node, onAction }) => {
  const { content = '', children } = node.props as { content?: string; children?: UINode | UINode[] };
  const [show, setShow] = useState(false);
  const id = useId();
  const nodes = children ? (Array.isArray(children) ? children : [children]) : [];
  return (
    <span className="relative inline-block" tabIndex={0} aria-describedby={id} onFocus={() => setShow(true)} onBlur={() => setShow(false)} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {renderChildren(nodes, onAction)}
      {show && <span id={id} role="tooltip" className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 shadow-lg">{content}</span>}
    </span>
  );
};
