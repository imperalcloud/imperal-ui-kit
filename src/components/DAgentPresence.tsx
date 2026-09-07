'use client';

import React from 'react';
import type { UIComponent } from '../types';

export const DAgentPresence: UIComponent = ({ node }) => {
  const {
    status = 'active',
    action = '',
    progress = null,
    avatar = '🐝',
    className = '',
  } = (node.props || {}) as {
    status?: 'idle' | 'thinking' | 'executing' | 'completed' | 'failed' | string;
    action?: string;
    progress?: number | null;
    avatar?: string;
    className?: string;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'executing':
      case 'thinking':
        return 'text-warning bg-warning/15 border-warning/25';
      case 'completed':
        return 'text-success bg-success/15 border-success/25';
      case 'failed':
        return 'text-danger bg-danger/15 border-danger/25';
      default:
        return 'text-primary bg-primary/15 border-primary/25';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm transition-all duration-300 ${getStatusColor()} ${className}`}
      data-testid="agent-presence"
    >
      <span className="text-sm select-none">{avatar}</span>
      <div className="flex items-center gap-1.5">
        <span className="capitalize font-semibold">{status}</span>
        {action ? <span className="opacity-75 truncate max-w-[200px]">— {action}</span> : null}
      </div>
      {typeof progress === 'number' ? (
        <div className="flex items-center gap-1 ml-1 text-[10px] font-mono opacity-80">
          <span>{Math.round(progress)}%</span>
        </div>
      ) : null}
    </div>
  );
};
