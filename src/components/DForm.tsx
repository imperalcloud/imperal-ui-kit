'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { UIComponent, UIAction, UINode } from '../types';
import { renderChildren, useOnConfirm } from '../DeclarativeRenderer';

export interface FormContextValue {
  values: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
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
    defaults?: Record<string, unknown>;
    confirm?: string;
    children?: UINode[];
  };

  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  const [submitting, setSubmitting] = useState(false);
  const mounted = useRef(true);
  const onConfirm = useOnConfirm();

  useEffect(() => () => { mounted.current = false; }, []);

  const setField = useCallback((key: string, value: unknown) => {
    setValues(previous => ({ ...previous, [key]: value }));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || !onAction || submitting) return;

    setSubmitting(true);
    try {
      if (confirm && !(await onConfirm(confirm))) return;
      const submitAction: UIAction = {
        action: 'call',
        function: action,
        params: values,
      };
      await Promise.resolve(onAction(submitAction));
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  return (
    <FormContext.Provider value={{ values, setField }}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {renderChildren(children, onAction)}
        <button
          type="submit"
          disabled={submitting || !action || !onAction}
          aria-busy={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : submit_label}
        </button>
      </form>
    </FormContext.Provider>
  );
};
