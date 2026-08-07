'use client';

import React, { Suspense, lazy } from 'react';
import type { DeclarativeRendererProps } from './DeclarativeRenderer';
import { Skeleton } from './components/primitives';

const Renderer = lazy(() =>
  import('./DeclarativeRenderer').then(module => ({ default: module.DeclarativeRenderer })),
);

export interface LazyDeclarativeRendererProps extends DeclarativeRendererProps {
  fallback?: React.ReactNode;
}

/**
 * Opt-in split renderer for hosts that prioritise a small initial JavaScript payload.
 * The complete canonical renderer is loaded on demand, preserving provider, registry,
 * error-boundary and action semantics rather than maintaining a second render path.
 */
export function LazyDeclarativeRenderer({ fallback, ...props }: LazyDeclarativeRendererProps) {
  const loading = fallback ?? (
    <Skeleton className="min-h-[clamp(7.5rem,20vw,15rem)] w-full" />
  );

  return (
    <Suspense fallback={loading}>
      <Renderer {...props} />
    </Suspense>
  );
}
