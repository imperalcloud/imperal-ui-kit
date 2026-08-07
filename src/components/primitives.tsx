'use client';

import React, { createContext, useCallback, useContext, useId, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export interface FieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: (ids: { id: string; descriptionId?: string; errorId?: string }) => React.ReactNode;
  className?: string;
}

export function Field({ label, description, error, required, children, className = '' }: FieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`flex min-w-0 flex-col field-gap ${className}`.trim()}>
      {label && <label htmlFor={id} className="text-sm font-medium text-body">{label}{required && <span aria-hidden="true" className="text-danger"> *</span>}</label>}
      {children({ id, descriptionId, errorId })}
      {description && <p id={descriptionId} className="text-xs text-muted">{description}</p>}
      {error && <InlineError id={errorId}>{error}</InlineError>}
    </div>
  );
}

export function InlineError({ children, id }: { children: React.ReactNode; id?: string }) {
  return <p id={id} role="alert" className="flex items-start gap-1.5 text-xs text-danger"><AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{children}</p>;
}

export function Skeleton({ className = '', width, height, label = 'Loading' }: { className?: string; width?: string; height?: string; label?: string }) {
  return <span role="status" aria-label={label} className={`block animate-pulse rounded bg-raised motion-reduce:animate-none ${className}`.trim()} style={{ width, height }} />;
}

export function ActionProgress({ label = 'Working…', value }: { label?: string; value?: number }) {
  const determinate = Number.isFinite(value);
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted">
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-hair border-t-[var(--imp-color-primary)] motion-reduce:animate-none" />
      <span>{label}</span>
      {determinate && <progress aria-label={label} value={Math.max(0, Math.min(100, value!))} max={100} className="h-1.5 min-w-24 flex-1 accent-[var(--imp-color-primary)]" />}
    </div>
  );
}

type ToastTone = 'info' | 'success' | 'warning' | 'danger';
interface ToastItem { id: string; message: string; tone: ToastTone }
interface ToastContextValue { notify: (message: string, tone?: ToastTone) => string; dismiss: (id: string) => void }
const ToastContext = createContext<ToastContextValue | null>(null);

const toastIcons = { info: Info, success: CheckCircle2, warning: AlertCircle, danger: XCircle };

export function ToastProvider({ children, duration = 5000 }: { children: React.ReactNode; duration?: number }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => setItems(current => current.filter(item => item.id !== id)), []);
  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = globalThis.crypto?.randomUUID?.() ?? `toast-${Date.now()}-${Math.random()}`;
    setItems(current => [...current, { id, message, tone }]);
    if (duration > 0) globalThis.setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss, duration]);
  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--imp-z-toast)] flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite" aria-atomic="false">
        {items.map(item => {
          const Icon = toastIcons[item.tone];
          return <div key={item.id} role={item.tone === 'danger' ? 'alert' : 'status'} className={`pointer-events-auto flex w-full max-w-[min(92vw,26rem)] items-start gap-2 rounded-lg border border-default bg-panel p-3 text-sm text-body shadow-xl toast-${item.tone}`}><Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 flex-1 overflow-wrap-anywhere">{item.message}</span><button type="button" aria-label="Dismiss" onClick={() => dismiss(item.id)} className="icon-btn-sm grid place-items-center text-muted hover:bg-raised focus-ring"><X aria-hidden="true" className="size-4" /></button></div>;
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
