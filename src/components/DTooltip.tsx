'use client';
import { useState } from 'react';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DTooltip: UIComponent = ({ node, onAction }) => {
  const { content, children } = node.props as any;
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children && renderChildren(children, onAction)}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-gray-200 rounded shadow-lg whitespace-nowrap z-50">
          {content}
        </div>
      )}
    </div>
  );
};
