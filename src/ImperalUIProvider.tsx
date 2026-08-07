'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AppIconRenderer } from './components/DAppIcon';
import type { ActionHandler, UIAction } from './types';

export type ImperalTheme = 'light' | 'dark' | 'system';
export type ImperalDirection = 'ltr' | 'rtl' | 'auto';

export interface ImperalMessages {
  close: string;
  cancel: string;
  confirm: string;
  submit: string;
  submitting: string;
  retry: string;
  loading: string;
  noData: string;
  openMenu: string;
  imageUnavailable: string;
  sectionFailed: string;
  uploadFailed: string;
}

const EN_MESSAGES: ImperalMessages = {
  close: 'Close', cancel: 'Cancel', confirm: 'Confirm', submit: 'Submit', submitting: 'Submitting…',
  retry: 'Retry', loading: 'Loading…', noData: 'No data', openMenu: 'Open menu',
  imageUnavailable: 'Image unavailable', sectionFailed: 'This section failed to render.',
  uploadFailed: 'Upload failed. Try again.',
};

export interface ImperalUIConfig {
  locale: string;
  direction: ImperalDirection;
  messages: ImperalMessages;
  onAction?: ActionHandler;
  onConfirm?: (message: string) => boolean | Promise<boolean>;
  onError?: (error: unknown, context: { nodeType?: string; action?: UIAction }) => void;
  appIconRenderer?: AppIconRenderer;
  /** Embedded previews keep focus semantics but must not lock the host document scroll. */
  contained?: boolean;
}

interface ActionState {
  pending: boolean;
  error: unknown | null;
  run: (action: UIAction) => Promise<boolean>;
  clearError: () => void;
}

const ImperalUIContext = createContext<ImperalUIConfig>({
  locale: 'en', direction: 'auto', messages: EN_MESSAGES,
});

export interface ImperalUIProviderProps {
  children: React.ReactNode;
  theme?: ImperalTheme;
  locale?: string;
  direction?: ImperalDirection;
  messages?: Partial<ImperalMessages>;
  onAction?: ActionHandler;
  onConfirm?: ImperalUIConfig['onConfirm'];
  onError?: ImperalUIConfig['onError'];
  appIconRenderer?: AppIconRenderer;
  contained?: boolean;
  className?: string;
  asChild?: boolean;
}

export function ImperalUIProvider({
  children, theme = 'system', locale = 'en', direction = 'auto', messages,
  onAction, onConfirm, onError, appIconRenderer, contained = false, className = '', asChild = false,
}: ImperalUIProviderProps) {
  const value = useMemo<ImperalUIConfig>(() => ({
    locale, direction, messages: { ...EN_MESSAGES, ...messages }, onAction, onConfirm, onError, appIconRenderer, contained,
  }), [locale, direction, messages, onAction, onConfirm, onError, appIconRenderer, contained]);

  const content = <ImperalUIContext.Provider value={value}>{children}</ImperalUIContext.Provider>;
  if (asChild) return content;
  return (
    <div className={`imperal-ui ${className}`.trim()} data-theme={theme === 'system' ? undefined : theme} lang={locale} dir={direction}>
      {content}
    </div>
  );
}

export function ImperalUIRoot(props: ImperalUIProviderProps) {
  return <ImperalUIProvider {...props} />;
}

export function useImperalUI(): ImperalUIConfig {
  return useContext(ImperalUIContext);
}

export function useUIAction(localHandler?: ActionHandler): ActionState {
  const config = useImperalUI();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const run = useCallback(async (action: UIAction) => {
    if (pending) return false;
    const handler = localHandler ?? config.onAction;
    if (!handler) return false;
    setPending(true);
    setError(null);
    try {
      await Promise.resolve(handler(action));
      return true;
    } catch (caught) {
      setError(caught);
      config.onError?.(caught, { action });
      return false;
    } finally {
      setPending(false);
    }
  }, [pending, localHandler, config]);
  return { pending, error, run, clearError: () => setError(null) };
}
