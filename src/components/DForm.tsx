'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { UIComponent, UIAction, UINode } from '../types';
import { renderChildren, useOnConfirm } from '../DeclarativeRenderer';
import { nodeIdentity } from '../hooks';
import { useImperalUI } from '../ImperalUIProvider';
import { InlineError } from './primitives';

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
  const [submitError, setSubmitError] = useState<unknown>(null);
  const ui = useImperalUI();
  const mounted = useRef(true);
  const resetSignature = `${nodeIdentity(node)}:${JSON.stringify(defaults)}`;
  const previousResetSignature = useRef(resetSignature);
  const onConfirm = useOnConfirm();

  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => {
    if (previousResetSignature.current === resetSignature) return;
    previousResetSignature.current = resetSignature;
    setValues(defaults);
  }, [defaults, resetSignature]);

  const setField = useCallback((key: string, value: unknown) => {
    setValues(previous => ({ ...previous, [key]: value }));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || !onAction || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (confirm && !(await onConfirm(confirm))) return;
      const submitAction: UIAction = {
        action: 'call',
        function: action,
        params: values,
      };
      await Promise.resolve(onAction(submitAction));
    } catch (error) {
      setSubmitError(error);
      ui.onError?.(error, { action: { action: 'call', function: action, params: values } });
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  return (
    <FormContext.Provider value={{ values, setField }}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {renderChildren(children, onAction)}
        {Boolean(submitError) && <InlineError>{submitError instanceof Error ? submitError.message : ui.messages.sectionFailed}</InlineError>}
        <button
          type="submit"
          disabled={submitting || !action || !onAction}
          aria-busy={submitting}
          className="button-base bg-primary text-sm text-on-primary"
        >
          {submitting ? ui.messages.submitting : (submit_label || ui.messages.submit)}
        </button>
      </form>
    </FormContext.Provider>
  );
};
