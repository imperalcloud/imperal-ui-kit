'use client';

import React, { createContext, useContext } from 'react';
import type { UINode, UIAction } from './types';
import { getComponent } from './registry';
import { registerAllComponents } from './register-all';

let _registered = false;
function ensureRegistered() {
  if (!_registered) {
    registerAllComponents();
    _registered = true;
  }
}

// ── onConfirm context ──────────────────────────────────────────────────────
export type OnConfirmFn = (message: string) => boolean | Promise<boolean>;

const defaultOnConfirm: OnConfirmFn = (m) =>
  typeof window !== 'undefined' && typeof window.confirm === 'function'
    ? window.confirm(m)
    : true;

export const OnConfirmContext = createContext<OnConfirmFn>(defaultOnConfirm);

export function useOnConfirm(): OnConfirmFn {
  return useContext(OnConfirmContext);
}

interface BoundaryProps {
  nodeType: string;
  children: React.ReactNode;
}
interface BoundaryState {
  failed: boolean;
}

class NodeErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[DeclarativeRenderer] node "${this.props.nodeType}" failed to render`, error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="text-xs text-red-400 border border-red-800/50 rounded px-2 py-1 bg-red-950/30">
          This section failed to render.
        </div>
      );
    }
    return this.props.children;
  }
}

interface DeclarativeRendererProps {
  node: UINode | null | undefined;
  onAction?: (action: UIAction) => void;
  onConfirm?: OnConfirmFn;
}

export function DeclarativeRenderer({ node, onAction, onConfirm }: DeclarativeRendererProps) {
  ensureRegistered();
  if (!node || !node.type) return null;

  const Component = getComponent(node.type);

  const content = (() => {
    if (!Component) {
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="text-xs text-red-400 border border-red-800/50 rounded px-2 py-1 bg-red-950/30">
            Unknown component: <code>{node.type}</code>
          </div>
        );
      }
      return null;
    }

    return (
      <NodeErrorBoundary nodeType={node.type}>
        <Component node={node} onAction={onAction} />
      </NodeErrorBoundary>
    );
  })();

  if (content === null) return null;

  if (onConfirm) {
    return (
      <OnConfirmContext.Provider value={onConfirm}>
        {content}
      </OnConfirmContext.Provider>
    );
  }

  return <>{content}</>;
}

function normalizeChildren(children: UINode | UINode[] | undefined | null): UINode[] {
  if (!children) return [];
  if (Array.isArray(children)) return children;
  return [children];
}

export function renderChildren(
  children: UINode | UINode[] | undefined | null,
  onAction?: (action: UIAction) => void
): React.ReactNode {
  const arr = normalizeChildren(children);
  if (arr.length === 0) return null;
  return arr.map((child, idx) => (
    <DeclarativeRenderer key={idx} node={child} onAction={onAction} />
  ));
}
