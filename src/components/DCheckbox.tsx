'use client';
import React, { useContext, useEffect, useId } from 'react';
import type { UIAction, UIComponent } from '../types';
import { nodeIdentity, useSyncedState } from '../hooks';
import { useUIAction } from '../ImperalUIProvider';
import { FormContext } from './DForm';
import { InlineError } from './primitives';

/**
 * A single boolean checkbox — consent, opt-in, one independent flag.
 *
 * Deliberately NOT built on the <Field> primitive. Field stacks the label
 * ABOVE its control, which is right for a text input and wrong for a
 * checkbox: a checkbox reads as one sentence with its label, and a label
 * floating above an empty box is a well-known usability failure. So the
 * label sits beside the box here — while keeping everything else Field
 * guarantees: the .field-gap container, a real for/id binding (clicking the
 * text ticks the box), aria-describedby for help text, and the shared
 * InlineError treatment.
 *
 * Distinct from DToggle: a toggle applies immediately, a checkbox is a form
 * value submitted with the rest of the form.
 */
function toBool(v: unknown): boolean {
  if (typeof v === 'string') return v === 'true' || v === '1';
  return !!v;
}

export const DCheckbox: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const action = useUIAction(onAction);
  const {
    label = '',
    value: initial = false,
    on_change,
    param_name = 'checked',
    description,
    error,
    required = false,
    disabled = false,
  } = node.props as {
    label?: string; value?: boolean; on_change?: UIAction; param_name?: string;
    description?: string; error?: string; required?: boolean; disabled?: boolean;
  };

  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const [local, setLocal] = useSyncedState(toBool(initial), nodeIdentity(node));

  // Register the initial value so an unticked box still appears in the submit
  // payload — otherwise the server sees `undefined` instead of `false`.
  useEffect(() => {
    if (form && form.values[param_name] === undefined) form.setField(param_name, toBool(initial));
  }, [form, initial, param_name]);

  const checked = toBool(form ? (form.values[param_name] ?? initial) : local);

  return (
    <div className="flex min-w-0 flex-col field-gap">
      <div className="flex items-start gap-2">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          disabled={disabled || action.pending}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={Boolean(error || action.error)}
          onChange={event => {
            const next = event.target.checked;
            if (form) form.setField(param_name, next); else setLocal(next);
            if (on_change) void action.run({ ...on_change, params: { ...(on_change.params ?? {}), [param_name]: next } });
          }}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[var(--imp-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
        />
        {label && (
          <label htmlFor={id} className="cursor-pointer text-sm text-body">
            {label}{required && <span className="field-required"> *</span>}
          </label>
        )}
      </div>
      {description && <p id={descriptionId} className="text-xs text-muted">{description}</p>}
      {error && <InlineError id={errorId}>{error}</InlineError>}
    </div>
  );
};
