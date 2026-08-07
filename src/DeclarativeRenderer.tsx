'use client';

import React, { createContext, useContext } from 'react';
import { ImperalUIProvider, useImperalUI as requireImperalUI, type ImperalUIProviderProps } from './ImperalUIProvider';
import type { UINode } from './types';
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
  identity: string;
  fallbackMessage: string;
  onError?: (error: unknown, context: { nodeType?: string }) => void;
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
    this.props.onError?.(error, { nodeType: this.props.nodeType });
    if (!this.props.onError && process.env.NODE_ENV !== 'test') {
      console.error(`[DeclarativeRenderer] node "${this.props.nodeType}" failed to render`, error, info);
    }
  }

  componentDidUpdate(previous: BoundaryProps) {
    if (this.state.failed && previous.identity !== this.props.identity) this.setState({ failed: false });
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="rounded border border-danger/40 bg-danger/10 px-2 py-1 text-xs text-danger">
          {this.props.fallbackMessage}
        </div>
      );
    }
    return this.props.children;
  }
}

export interface DeclarativeRendererProps {
  node: UINode | null | undefined;
  onAction?: import('./types').ActionHandler;
  onConfirm?: OnConfirmFn;
  root?: boolean;
  theme?: ImperalUIProviderProps['theme'];
  locale?: string;
  direction?: ImperalUIProviderProps['direction'];
}

function RendererNode({ node, onAction, fallbackMessage, onError }: {
  node: UINode;
  onAction?: import('./types').ActionHandler;
  fallbackMessage: string;
  onError?: (error: unknown, context: { nodeType?: string }) => void;
}) {
  const Component = getComponent(node.type);
  if (!Component) {
    if (process.env.NODE_ENV === 'development') return <div role="alert" className="rounded border border-danger/40 bg-danger/10 px-2 py-1 text-xs text-danger">Unknown component: <code>{node.type}</code></div>;
    return null;
  }
  return (
    <NodeErrorBoundary nodeType={node.type} identity={`${node.id ?? node.key ?? node.type}:${node.revision ?? ''}`} fallbackMessage={fallbackMessage} onError={onError}>
      <Component node={node} onAction={onAction} />
    </NodeErrorBoundary>
  );
}

function ContextualRendererNode({ node, onAction }: { node: UINode; onAction?: import('./types').ActionHandler }) {
  const { messages, onError, onAction: contextAction } = requireImperalUI();
  return <RendererNode node={node} onAction={onAction ?? contextAction} fallbackMessage={messages.sectionFailed} onError={onError} />;
}

export function DeclarativeRenderer({ node, onAction, onConfirm, root = true, theme, locale, direction }: DeclarativeRendererProps) {
  ensureRegistered();
  if (!node || !node.type) return null;

  const content = root
    ? <RendererNode node={node} onAction={onAction} fallbackMessage="This section failed to render." />
    : <ContextualRendererNode node={node} onAction={onAction} />;

  if (content === null) return null;

  const confirmed = onConfirm
    ? <OnConfirmContext.Provider value={onConfirm}>{content}</OnConfirmContext.Provider>
    : content;
  if (!root) return <>{confirmed}</>;
  return (
    <ImperalUIProvider theme={theme} locale={locale} direction={direction} onAction={onAction} onConfirm={onConfirm}>
      {confirmed}
    </ImperalUIProvider>
  );
}

function normalizeChildren(children: UINode | UINode[] | undefined | null): UINode[] {
  if (!children) return [];
  if (Array.isArray(children)) return children;
  return [children];
}

export function renderChildren(
  children: UINode | UINode[] | undefined | null,
  onAction?: import('./types').ActionHandler
): React.ReactNode {
  const arr = normalizeChildren(children);
  if (arr.length === 0) return null;
  return arr.map((child, idx) => (
    <DeclarativeRenderer
      key={child.key ?? child.id ?? `${child.type}-${idx}`}
      node={child}
      onAction={onAction}
      root={false}
    />
  ));
}
