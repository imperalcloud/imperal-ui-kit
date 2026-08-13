'use client';
import React, { useContext, useEffect, useId } from 'react';
import type { UIAction, UIComponent } from '../types';
import { nodeIdentity, useSyncedState } from '../hooks';
import { useUIAction } from '../ImperalUIProvider';
import { FormContext } from './DForm';
import { InlineError } from './primitives';

interface Option { value: string; label: string; description?: string; disabled?: boolean }

/**
 * Pick exactly ONE option from a small set, with every choice visible.
 *
 * Not built on <Field> for the same reason DCheckbox isn't: Field binds ONE
 * label to ONE control via for/id, and a radio group has N controls. The
 * group's own label is a plain element referenced by aria-labelledby on a
 * role="radiogroup" wrapper — the native pattern — while each option keeps
 * its own for/id pair.
 *
 * Native <input type="radio"> with a shared `name` is used deliberately:
 * arrow-key navigation, the roving tab stop and group semantics come from the
 * browser, correct on every assistive technology, rather than being
 * re-implemented in JavaScript.
 */
export const DRadioGroup: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const action = useUIAction(onAction);
  const {
    options = [],
    value: initial = '',
    on_change,
    param_name = 'value',
    label,
    description,
    error,
    required = false,
    disabled = false,
    orientation = 'vertical',
  } = node.props as {
    options?: Option[]; value?: string; on_change?: UIAction; param_name?: string;
    label?: string; description?: string; error?: string; required?: boolean;
    disabled?: boolean; orientation?: 'vertical' | 'horizontal';
  };

  const id = useId();
  const labelId = label ? `${id}-label` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const [local, setLocal] = useSyncedState(initial, nodeIdentity(node));

  useEffect(() => {
    if (form && form.values[param_name] === undefined) form.setField(param_name, initial);
  }, [form, initial, param_name]);

  const value = String(form ? (form.values[param_name] ?? initial) : local);

  return (
    <div className="flex min-w-0 flex-col field-gap">
      {label && (
        <span id={labelId} className="field-label">
          {label}{required && <span className="field-required"> *</span>}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={Boolean(error || action.error)}
        aria-required={required || undefined}
        className={orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2'}
      >
        {options.map(option => {
          const optionId = `${id}-${option.value}`;
          const optionDescId = option.description ? `${optionId}-description` : undefined;
          return (
            <div key={option.value} className="flex items-start gap-2">
              <input
                id={optionId}
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                disabled={disabled || option.disabled || action.pending}
                aria-describedby={optionDescId}
                onChange={() => {
                  const next = option.value;
                  if (form) form.setField(param_name, next); else setLocal(next);
                  if (on_change) void action.run({ ...on_change, params: { ...(on_change.params ?? {}), [param_name]: next } });
                }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--imp-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex min-w-0 flex-col">
                <label htmlFor={optionId} className="cursor-pointer text-sm text-body">{option.label}</label>
                {option.description && <span id={optionDescId} className="text-xs text-muted">{option.description}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {description && <p id={descriptionId} className="text-xs text-muted">{description}</p>}
      {error && <InlineError id={errorId}>{error}</InlineError>}
    </div>
  );
};
