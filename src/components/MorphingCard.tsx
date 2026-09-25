// -*- coding: utf-8 -*-
// Copyright (c) 2026 Imperal, Inc.
// Licensed under the AGPL-3.0 License.

import React, { useState } from 'react';
import type { UINode } from '../types';

export interface AffordanceItem {
  id: string;
  label: string;
  description?: string;
  primary?: boolean;
  risk?: 'read' | 'write' | 'destructive';
  requires_confirmation?: boolean;
  shortcut?: string;
  payload?: Record<string, any>;
}

export interface CognitiveContextData {
  situation?: string;
  urgency?: 'low' | 'normal' | 'elevated' | 'critical';
  attention_budget?: 'glance' | 'focused' | 'investigative';
  modality_hint?: string;
}

export interface MorphingStateProps {
  context: string;
  summary: string;
  urgency?: 'low' | 'normal' | 'elevated' | 'critical';
  risk?: 'read' | 'write' | 'destructive';
  details?: string;
  affected_entities?: string[];
  metrics?: Record<string, string | number>;
  affordances?: AffordanceItem[];
  cognitive?: CognitiveContextData;
  projection_hints?: Record<string, any>;
  onAction?: (actionId: string, payload?: Record<string, any>) => void;
  className?: string;
}

export const MorphingCard: React.FC<{
  node?: UINode;
  props?: MorphingStateProps;
  onAction?: (action: any, payload?: any) => void;
} & MorphingStateProps> = (allProps) => {
  const p = ((allProps.node?.props as unknown) as MorphingStateProps) || allProps.props || allProps;
  const onAction = allProps.onAction || p.onAction;
  const {
    context = 'system_intent',
    summary = '',
    urgency = 'normal',
    risk = 'read',
    details = '',
    affected_entities = [],
    metrics = {},
    affordances = [],
    cognitive = {},
    className = '',
  } = p;

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Dynamic visual styling based on urgency
  const urgencyTheme = {
    critical: {
      border: 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)]',
      badge: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
      icon: '🚨',
      bgGlow: 'from-red-950/40 via-neutral-900/90 to-neutral-950/90',
    },
    elevated: {
      border: 'border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      icon: '⚡',
      bgGlow: 'from-amber-950/30 via-neutral-900/90 to-neutral-950/90',
    },
    normal: {
      border: 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      icon: '🐝',
      bgGlow: 'from-cyan-950/25 via-neutral-900/90 to-neutral-950/90',
    },
    low: {
      border: 'border-neutral-700/60 shadow-none',
      badge: 'bg-neutral-800 text-neutral-400 border-neutral-700',
      icon: 'ℹ️',
      bgGlow: 'from-neutral-900/80 via-neutral-900/90 to-neutral-950/90',
    },
  }[urgency] || {
    border: 'border-neutral-700',
    badge: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    icon: 'ℹ️',
    bgGlow: 'from-neutral-900 via-neutral-900 to-neutral-950',
  };

  const handleAffordanceClick = (aff: AffordanceItem) => {
    if (aff.risk === 'destructive' || aff.requires_confirmation) {
      if (confirmingId !== aff.id) {
        setConfirmingId(aff.id);
        return;
      }
    }
    setConfirmingId(null);
    setExecutingId(aff.id);

    if (onAction) {
      let actionToDispatch: any = null;
      const payload = aff.payload || {};

      // If payload is already a valid UIAction (has action: 'call' | 'navigate' | 'open' | 'send')
      if (payload.action && (payload.function || payload.path || payload.url || payload.message)) {
        actionToDispatch = payload;
      } else if (payload.action === 'navigate' && payload.target) {
        actionToDispatch = {
          action: 'call',
          function: '__panel__tools',
          params: { section: payload.target, active: payload.target },
        };
      } else if (payload.function) {
        actionToDispatch = {
          action: 'call',
          function: payload.function,
          params: payload.params || {},
        };
      } else if (aff.id === 'view_users') {
        actionToDispatch = {
          action: 'call',
          function: '__panel__tools',
          params: { section: 'management', active: 'management' },
        };
      } else if (aff.id === 'view_audit') {
        actionToDispatch = {
          action: 'call',
          function: '__panel__tools',
          params: { section: 'audit', active: 'audit' },
        };
      } else if (aff.id === 'review_apps') {
        actionToDispatch = {
          action: 'call',
          function: '__panel__tools',
          params: { section: 'extensions', active: 'extensions' },
        };
      } else if (aff.id === 'review_payouts') {
        actionToDispatch = {
          action: 'call',
          function: '__panel__tools',
          params: { section: 'payouts', active: 'payouts' },
        };
      } else if (payload && Object.keys(payload).length > 0) {
        actionToDispatch = {
          action: 'call',
          function: aff.id,
          params: payload,
        };
      }

      try {
        if (allProps.node && actionToDispatch) {
          const res = (onAction as any)(actionToDispatch);
          if (res && typeof res.then === 'function') {
            res.finally(() => setExecutingId(null));
            return;
          }
        } else {
          // Direct unit test callback: test passes onAction={spy} and expects ('standby', undefined)
          const res = (onAction as any)(aff.id, aff.payload);
          if (res && typeof res.then === 'function') {
            res.finally(() => setExecutingId(null));
            return;
          }
        }
      } catch (err) {
        console.error('[MorphingCard] onAction error:', err);
      }
    }
    setTimeout(() => setExecutingId(null), 800);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${urgencyTheme.bgGlow} ${urgencyTheme.border} p-6 backdrop-blur-xl transition-all duration-300 ${className}`}
      data-testid="morphing-card"
      data-urgency={urgency}
      data-risk={risk}
    >
      {/* Dynamic ambient header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800/80 text-xl shadow-inner">
            {urgencyTheme.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">{context}</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${urgencyTheme.badge}`}>
                {urgency}
              </span>
              {risk === 'destructive' && (
                <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-950/50 px-2.5 py-0.5 text-[11px] font-medium text-red-300">
                  destructive
                </span>
              )}
            </div>
            {cognitive.situation && (
              <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
                mode: {cognitive.situation} {cognitive.attention_budget ? `• ${cognitive.attention_budget}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Headline & Body */}
      <div className="my-5">
        <h3 className="text-lg font-semibold leading-snug text-neutral-100">{summary}</h3>
        {details && <p className="mt-2 text-sm leading-relaxed text-neutral-300">{details}</p>}
      </div>

      {/* Dynamic Metrics Grid */}
      {Object.keys(metrics).length > 0 && (
        <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(metrics).map(([key, val]) => (
            <div key={key} className="flex flex-col rounded-xl border border-neutral-800/90 bg-neutral-900/60 p-3 shadow-inner">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{key}</span>
              <span className="mt-1 font-mono text-base font-bold text-neutral-100">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Affected Entities */}
      {affected_entities.length > 0 && (
        <div className="my-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500">Affected:</span>
          {affected_entities.map((entity, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-0.5 font-mono text-xs text-neutral-300"
            >
              {entity}
            </span>
          ))}
        </div>
      )}

      {/* Dynamic Affordances (Actions Bar) */}
      {affordances.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-neutral-800/80 pt-4">
          {affordances.map((aff) => {
            const isConfirming = confirmingId === aff.id;
            const isExecuting = executingId === aff.id;
            const isDestructive = aff.risk === 'destructive';

            let btnStyle = 'border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700';
            if (isDestructive) {
              btnStyle = isConfirming
                ? 'border-red-500 bg-red-600 text-white font-bold animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'border-red-800/60 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:border-red-600';
            } else if (aff.primary) {
              btnStyle = 'border-cyan-500/50 bg-cyan-600 text-white font-semibold hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
            }

            return (
              <button
                key={aff.id}
                type="button"
                onClick={() => handleAffordanceClick(aff)}
                disabled={isExecuting}
                className={`relative inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${btnStyle}`}
              >
                {isExecuting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : null}
                <span>{isConfirming ? `Подтвердить: ${aff.label}` : aff.label}</span>
                {aff.shortcut && (
                  <kbd className="ml-1.5 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                    {aff.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
