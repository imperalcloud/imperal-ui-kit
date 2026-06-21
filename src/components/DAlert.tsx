'use client';

import React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import type { UIComponent } from '../types';

type AlertVariant = 'info' | 'success' | 'warn' | 'error';

const VARIANT_STYLES: Record<
  AlertVariant,
  { container: string; icon: string; IconComp: React.FC<{ className?: string }> }
> = {
  info: {
    container: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    icon: 'text-blue-400',
    IconComp: Info,
  },
  success: {
    container: 'bg-green-500/10 border-green-500/20 text-green-300',
    icon: 'text-green-400',
    IconComp: CheckCircle2,
  },
  warn: {
    container: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    icon: 'text-yellow-400',
    IconComp: AlertTriangle,
  },
  error: {
    container: 'bg-red-500/10 border-red-500/20 text-red-300',
    icon: 'text-red-400',
    IconComp: XCircle,
  },
};

export const DAlert: UIComponent = ({ node }) => {
  const [dismissed, setDismissed] = React.useState(false);

  const {
    variant = 'info',
    title,
    message = '',
    dismissible = false,
  } = node.props as {
    variant?: AlertVariant;
    title?: string;
    message?: string;
    dismissible?: boolean;
  };

  if (dismissed) return null;

  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.info;
  const { container, icon, IconComp } = styles;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${container}`}
      role="alert"
    >
      <IconComp className={`w-4 h-4 flex-shrink-0 mt-0.5 ${icon}`} />

      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold mb-0.5">{title}</p>
        )}
        {message && (
          <p className="opacity-90 leading-relaxed">{message}</p>
        )}
      </div>

      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
