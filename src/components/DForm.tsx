'use client';

import { createContext, useState, useCallback } from 'react';
import type { UIComponent, UIAction } from '../types';
import { renderChildren } from '../DeclarativeRenderer';
import { useOnConfirm } from '../DeclarativeRenderer';

export interface FormContextValue {
  values: Record<string, any>;
  setField: (key: string, value: any) => void;
}

export const FormContext = createContext<FormContextValue | null>(null);

export const DForm: UIComponent = ({ node, onAction }) => {
  const {
    action = '',
    submit_label = 'Submit',
    defaults = {},
    confirm = '',
    children = [],
  } = node.props as {
    action?: string;
    submit_label?: string;
    defaults?: Record<string, any>;
    confirm?: string;
    children?: any[];
  };

  const [values, setValues] = useState<Record<string, any>>(defaults);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const onConfirmFn = useOnConfirm();

  const setField = useCallback((key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear feedback when user edits
    if (status === 'saved' || status === 'error') setStatus('idle');
  }, [status]);

  const handleSubmit = async () => {
    if (confirm && !(await onConfirmFn(confirm))) return;
    if (action && onAction) {
      setStatus('saving');
      const submitAction: UIAction = {
        action: 'call',
        function: action,
        params: values,
      };
      onAction(submitAction);
      // Show saved feedback (action is fire-and-forget in DUI)
      setTimeout(() => setStatus('saved'), 600);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const btnLabel =
    status === 'saving' ? 'Saving…' :
    status === 'saved'  ? '✓ Saved' :
    status === 'error'  ? '✗ Error' :
    submit_label;

  const btnClass =
    status === 'saved'
      ? 'bg-green-600/30 text-green-400 border border-green-700/50'
      : status === 'error'
        ? 'bg-red-600/30 text-red-400 border border-red-700/50'
        : status === 'saving'
          ? 'bg-blue-600/50 text-white opacity-70 cursor-wait'
          : 'bg-blue-600 text-white hover:bg-blue-500';

  return (
    <FormContext.Provider value={{ values, setField }}>
      <div className="space-y-3">
        {renderChildren(children, onAction)}
        <button
          onClick={() => { void handleSubmit(); }}
          disabled={status === 'saving'}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${btnClass}`}
        >
          {btnLabel}
        </button>
      </div>
    </FormContext.Provider>
  );
};
