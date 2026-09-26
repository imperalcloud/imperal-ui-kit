'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, Check, ChevronRight, X, Sparkles, Activity } from 'lucide-react';
import type { UIComponent, UIAction } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

/**
 * ICNLI Fluid Terminal Canvas — DStage Component.
 *
 * An ephemeral generative HUD stage that mounts in the neo-terminal stream
 * and evaporates into a clean terminal audit receipt upon context shift or dismissal.
 */
export const DStage: UIComponent = ({ node, onAction }) => {
  const {
    id = 'stage',
    title = 'Active Control HUD',
    command = 'system.control',
    hotkeys = {},
    status = 'active',
    telemetry = {},
    receipt = '',
    auto_collapse = true,
  } = (node.props || {}) as {
    id?: string;
    title?: string;
    command?: string;
    hotkeys?: Record<string, string | { action: string; params?: any }>;
    status?: string;
    telemetry?: Record<string, any>;
    receipt?: string;
    auto_collapse?: boolean;
  };

  const [collapsed, setCollapsed] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<string | null>(null);

  // Keyboard hotkey handler
  useEffect(() => {
    if (collapsed || !hotkeys || Object.keys(hotkeys).length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'escape') {
        e.preventDefault();
        setCollapsed(true);
        return;
      }

      if (hotkeys[key]) {
        e.preventDefault();
        const trigger = hotkeys[key];
        if (typeof trigger === 'string') {
          if (onAction) {
            onAction({ action: trigger, params: { stage_id: id } });
          }
        } else if (typeof trigger === 'object' && trigger.action) {
          if (onAction) {
            onAction({ action: trigger.action, params: { ...(trigger.params || {}), stage_id: id } });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, hotkeys, id, onAction]);

  const handleEvaporate = () => {
    const defaultReceipt = receipt || `❯ ${command}: ${title} ── completed [OK] ✓`;
    setActiveReceipt(defaultReceipt);
    setCollapsed(true);
  };

  // If collapsed/evaporated: render clean terminal receipt
  if (collapsed) {
    const displayText = activeReceipt || receipt || `❯ ${command}: ${title} ── [OK] ✓`;
    return (
      <div className="my-2 px-3 py-1.5 rounded bg-black/40 border border-white/5 font-mono text-xs text-muted hover:text-body transition-colors flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-emerald-400 flex-shrink-0" />
          <span className="text-zinc-300 font-medium">{displayText}</span>
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider"
        >
          [Restore HUD]
        </button>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-white/10 bg-[#0A0C10]/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      {/* ── Terminal HUD Header ── */}
      <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">LIVE HUD</span>
          </div>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-xs text-zinc-400">{command}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-xs font-semibold text-zinc-100">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {Object.entries(telemetry).map(([k, v]) => (
            <span key={k} className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5">
              {k}: <strong className="text-emerald-400">{String(v)}</strong>
            </span>
          ))}
          <button
            onClick={handleEvaporate}
            title="Collapse Stage into Terminal Receipt (Esc)"
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Active Declarative Interactive Canvas ── */}
      <div className="p-4 bg-gradient-to-b from-transparent to-black/30">
        {node.children && node.children.length > 0 ? (
          renderChildren(node.children, onAction)
        ) : (
          <div className="text-xs text-zinc-500 font-mono py-2">No active components mounted in stage.</div>
        )}
      </div>

      {/* ── Hotkey Bar ── */}
      {hotkeys && Object.keys(hotkeys).length > 0 && (
        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center gap-3 overflow-x-auto select-none font-mono text-[11px] text-zinc-400">
          <span className="text-zinc-600 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" /> Hotkeys:
          </span>
          {Object.entries(hotkeys).map(([key, act]) => {
            const label = typeof act === 'string' ? act : act.action;
            return (
              <span key={key} className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-bold shadow-sm">
                  {key.toUpperCase()}
                </kbd>
                <span className="text-zinc-400">{label}</span>
              </span>
            );
          })}
          <span className="ml-auto text-zinc-600 flex items-center gap-1 text-[10px]">
            <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">ESC</kbd> dismiss
          </span>
        </div>
      )}
    </div>
  );
};
