'use client';
import React, { useContext, useEffect } from 'react';
import type { UIAction, UIComponent } from '../types';
import { nodeIdentity, useSyncedState } from '../hooks';
import { useUIAction } from '../ImperalUIProvider';
import { FormContext } from './DForm';
import { Field } from './primitives';
interface Option { value: string; label: string; disabled?: boolean }
export const DSelect: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext); const action = useUIAction(onAction);
  const { options = [], value: initial = '', placeholder = 'Select…', on_change, param_name = 'value', label, description, error, required = false, disabled = false } = node.props as { options?: Option[]; value?: string; placeholder?: string; on_change?: UIAction; param_name?: string; label?: string; description?: string; error?: string; required?: boolean; disabled?: boolean };
  const [local, setLocal] = useSyncedState(initial, nodeIdentity(node));
  useEffect(() => { if (form && form.values[param_name] === undefined) form.setField(param_name, initial); }, [form, initial, param_name]);
  const value = String(form ? (form.values[param_name] ?? initial) : local);
  return <Field label={label} description={description} error={error ?? (action.error instanceof Error ? action.error.message : undefined)} required={required}>{ids => <select id={ids.id} aria-describedby={[ids.descriptionId, ids.errorId].filter(Boolean).join(' ') || undefined} aria-invalid={Boolean(error || action.error)} required={required} disabled={disabled || action.pending} value={value} onChange={event => { const next=event.target.value; if (form) form.setField(param_name, next); else setLocal(next); if(on_change) void action.run({...on_change,params:{...(on_change.params??{}),[param_name]:next}}); }} className={`control-base appearance-none ${error ? 'control-error' : ''}`}>{placeholder && <option value="" disabled>{placeholder}</option>}{options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</select>}</Field>;
};
