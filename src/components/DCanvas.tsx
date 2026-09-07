'use client';

import React from 'react';
import type { UIComponent, UIAction } from '../types';

export interface CanvasNodeData {
  id: string;
  title: string;
  x?: number;
  y?: number;
  type?: 'service' | 'database' | 'worker' | 'gateway' | 'custom' | string;
  status?: 'healthy' | 'warning' | 'error' | 'idle' | string;
  metrics?: Record<string, unknown>;
  icon?: string;
  on_click?: UIAction;
}

export interface CanvasEdgeData {
  from: string;
  to: string;
  protocol?: string;
  status?: 'active' | 'congested' | 'failed' | string;
  latency_ms?: number | null;
  animated?: boolean;
}

export const DCanvas: UIComponent = ({ node, onAction }) => {
  const {
    nodes = [],
    edges = [],
    height = 500,
    show_minimap = true,
    className = '',
  } = (node.props || {}) as {
    nodes?: CanvasNodeData[];
    edges?: CanvasEdgeData[];
    height?: number;
    show_minimap?: boolean;
    className?: string;
  };

  const getNodeColor = (status?: string) => {
    switch (status) {
      case 'warning':
        return 'border-warning/50 bg-warning/10 text-warning';
      case 'error':
        return 'border-danger/50 bg-danger/10 text-danger';
      case 'idle':
        return 'border-muted/40 bg-raised/40 text-muted';
      case 'healthy':
      default:
        return 'border-success/50 bg-success/10 text-success';
    }
  };

  const nodeMap = new Map<string, CanvasNodeData>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div
      className={`relative w-full rounded-xl border border-default/50 bg-background/80 backdrop-blur-md overflow-hidden select-none ${className}`}
      style={{ height: `${height}px` }}
      data-testid="spatial-canvas"
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* SVG Edges Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {edges.map((edge, idx) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const x1 = (fromNode.x ?? 50) + 75;
          const y1 = (fromNode.y ?? 50) + 30;
          const x2 = (toNode.x ?? 250) + 75;
          const y2 = (toNode.y ?? 50) + 30;

          return (
            <g key={`${edge.from}-${edge.to}-${idx}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={edge.status === 'failed' ? 'stroke-danger' : 'stroke-primary/40'}
                strokeWidth={2}
                strokeDasharray={edge.animated ? '4,4' : undefined}
              />
              {edge.latency_ms !== null && edge.latency_ms !== undefined ? (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  fill="currentColor"
                  className="text-[10px] fill-muted font-mono"
                  textAnchor="middle"
                >
                  {edge.latency_ms}ms
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Interactive Nodes Layer */}
      <div className="absolute inset-0">
        {nodes.map((n) => {
          const posX = n.x ?? 50;
          const posY = n.y ?? 50;
          return (
            <button
              type="button"
              key={n.id}
              className={`absolute text-left cursor-pointer transition-transform hover:scale-105 rounded-lg border px-3 py-2 shadow-sm ${getNodeColor(
                n.status
              )}`}
              style={{
                left: `${posX}px`,
                top: `${posY}px`,
                width: '150px',
              }}
              onClick={() => {
                if (n.on_click && onAction) {
                  onAction(n.on_click);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && n.on_click && onAction) {
                  e.preventDefault();
                  onAction(n.on_click);
                }
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                {n.icon ? <span>{n.icon}</span> : null}
                <span className="truncate">{n.title}</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] opacity-75">
                <span className="uppercase tracking-wider">{n.type ?? 'node'}</span>
                <span>{n.status ?? 'idle'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* MiniMap placeholder/badge */}
      {show_minimap ? (
        <div className="absolute bottom-3 right-3 px-2 py-1 text-[10px] rounded bg-raised/60 text-muted border border-default/40 pointer-events-none">
          Spatial Canvas • {nodes.length} nodes
        </div>
      ) : null}
    </div>
  );
};
