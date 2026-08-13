'use client';

import { useContext, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import type { UIComponent } from '../types';
import { FormContext } from './DForm';
import { nodeIdentity, useSyncedState } from '../hooks';
import { Field } from './primitives';

interface SelectOption {
  value: string;
  label: string;
}

export const DMultiSelect: UIComponent = ({ node }) => {
  const form = useContext(FormContext);
  const {
    options: rawOptions = [],
    values: rawInitValues = [],
    placeholder = '',
    param_name = 'values',
    label,
    description,
    error,
    required = false,
    disabled = false,
  } = node.props as {
    options?: SelectOption[];
    values?: string[];
    placeholder?: string;
    param_name?: string;
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
  };

  const options: SelectOption[] = Array.isArray(rawOptions) ? rawOptions : [];
  const initValues = useMemo<string[]>(() => Array.isArray(rawInitValues) ? rawInitValues : rawInitValues ? [String(rawInitValues)] : [], [rawInitValues]);
  const [localValues, setLocalValues] = useSyncedState<string[]>(initValues, nodeIdentity(node));
  useEffect(() => {
    if (form && form.values[param_name] === undefined) form.setField(param_name, initValues);
  }, [form, initValues, param_name]);

  const rawSelected = form ? (form.values[param_name] ?? initValues) : localValues;
  const selected: string[] = Array.isArray(rawSelected) ? rawSelected : rawSelected ? [String(rawSelected)] : [];

  const toggle = (val: string) => {
    const next = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val];
    if (form) {
      form.setField(param_name, next);
    } else {
      setLocalValues(next);
    }
  };

  const available = options.filter(o => !selected.includes(o.value));

  return (
    <Field label={label} description={description} error={error} required={required}>{ids => (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(v => {
            const opt = options.find(o => o.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/50 text-primary text-xs rounded-full"
              >
                {opt?.label || v}
                <button type="button" onClick={() => toggle(v)} aria-label={`Remove ${opt?.label || v}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {available.length > 0 && (
        <select
          id={ids.id}
          aria-describedby={[ids.descriptionId, ids.errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={Boolean(error)}
          required={required}
          disabled={disabled}
          onChange={e => {
            if (e.target.value) toggle(e.target.value);
            e.target.value = '';
          }}
          className="field-chrome w-full border rounded-md px-3 py-2 text-sm text-body focus:border-primary focus:ring-1 focus:ring-focus focus:outline-none"
        >
          <option value="">{placeholder || 'Add...'}</option>
          {available.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
    )}</Field>
  );
};
