'use client';

import { useContext, useState } from 'react';
import { X } from 'lucide-react';
import type { UIComponent } from '../types';
import { FormContext } from './DForm';

interface SelectOption {
  value: string;
  label: string;
}

export const DMultiSelect: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    options: rawOptions = [],
    values: rawInitValues = [],
    placeholder = '',
    param_name = 'values',
  } = node.props as {
    options?: SelectOption[];
    values?: string[];
    placeholder?: string;
    param_name?: string;
  };

  const options: SelectOption[] = Array.isArray(rawOptions) ? rawOptions : [];
  const initValues: string[] = Array.isArray(rawInitValues) ? rawInitValues : rawInitValues ? [String(rawInitValues)] : [];
  const [localValues, setLocalValues] = useState<string[]>(initValues);
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
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(v => {
            const opt = options.find(o => o.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded-full"
              >
                {opt?.label || v}
                <button onClick={() => toggle(v)} aria-label={`Remove ${opt?.label || v}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {available.length > 0 && (
        <select
          onChange={e => {
            if (e.target.value) toggle(e.target.value);
            e.target.value = '';
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
  );
};
