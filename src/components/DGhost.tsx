'use client';

import React from 'react';
import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

export const DGhost: UIComponent = ({ node, onAction }) => {
  const {
    child,
    reason = 'Webbee executing...',
    pulse = true,
    opacity = 0.6,
    className = '',
  } = (node.props || {}) as {
    child?: UINode;
    reason?: string;
    pulse?: boolean;
    opacity?: number;
    className?: string;
  };

  return (
    <div
      className={`relative rounded-lg transition-all duration-300 ${pulse ? 'animate-pulse' : ''} ${className}`}
      style={{ opacity: typeof opacity === 'number' ? opacity : 0.6 }}
      data-testid="ghost-wrapper"
    >
      {child ? renderChildren(child, onAction) : null}
      {reason ? (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-warning/15 text-warning border border-warning/25 backdrop-blur-sm pointer-events-none shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-ping" />
          <span>{reason}</span>
        </div>
      ) : null}
    </div>
  );
};
