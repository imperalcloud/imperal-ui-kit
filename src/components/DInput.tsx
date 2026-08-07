'use client';
import React, { useContext, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import type { UIAction, UIComponent } from '../types';
import { nodeIdentity, useSyncedState } from '../hooks';
import { useUIAction } from '../ImperalUIProvider';
import { FormContext } from './DForm';
import { Field } from './primitives';

export const DInput: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const { placeholder = '', on_submit, param_name = 'value', value: initial = '', label, description, error, required = false, disabled = false, readonly = false, variant = 'default', type = 'text' } = node.props as {
    placeholder?: string; on_submit?: UIAction; param_name?: string; value?: string | number; label?: string; description?: string; error?: string; required?: boolean; disabled?: boolean; readonly?: boolean; variant?: 'default' | 'ghost'; type?: 'text'|'password'|'email'|'number'|'url'|'search'|'tel';
  };
  const [localValue, setLocalValue] = useSyncedState(String(initial), nodeIdentity(node));
  const inputRef = useRef<HTMLInputElement>(null);
  const action = useUIAction(onAction);
  useEffect(() => { if (form && form.values[param_name] === undefined) form.setField(param_name, initial); }, [form, initial, param_name]);
  const value = form ? (form.values[param_name] ?? initial) : localValue;
  const setValue = (next: string) => form ? form.setField(param_name, next) : setLocalValue(next);
  const submit = async () => {
    if (!String(value).trim() || !on_submit || form || disabled || readonly) return;
    const ok = await action.run({ ...on_submit, params: { ...(on_submit.params ?? {}), [param_name]: String(value).trim() } });
    if (ok) { setLocalValue(''); inputRef.current?.focus(); }
  };
  return <Field label={label} description={description} error={error ?? (action.error instanceof Error ? action.error.message : undefined)} required={required}>
    {ids => <div className="flex min-w-0 items-center gap-2"><input ref={inputRef} id={ids.id} aria-describedby={[ids.descriptionId, ids.errorId].filter(Boolean).join(' ') || undefined} aria-invalid={Boolean(error || action.error)} type={type} required={required} disabled={disabled || action.pending} readOnly={readonly} autoComplete={type === 'password' ? 'new-password' : undefined} spellCheck={type === 'password' ? false : undefined} value={String(value)} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }} placeholder={placeholder} className={`${variant === 'ghost' ? 'control-base border-transparent bg-transparent' : 'control-base'} ${error ? 'control-error' : ''}`} />{!form && on_submit && <button type="button" aria-label="Submit input" onClick={() => void submit()} disabled={!String(value).trim() || disabled || readonly || action.pending} className="button-base min-h-11 min-w-11 bg-primary px-3 text-on-primary"><Send aria-hidden="true" className="size-4" /></button>}</div>}
  </Field>;
};
