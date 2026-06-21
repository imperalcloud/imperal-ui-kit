'use client';

import React, { useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UIComponent, UIAction } from '../types';
import { FormContext } from './DForm';

interface SelectOption {
  value: string;
  label: string;
}

export const DSelect: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    options = [],
    value: initValue = '',
    placeholder = 'Select...',
    on_change,
    param_name = 'value',
    label,
  } = node.props as {
    options?: SelectOption[];
    value?: string;
    placeholder?: string;
    on_change?: UIAction;
    param_name?: string;
    label?: string;
  };

  const [localValue, setLocalValue] = useState(initValue);
  // GAP-2: register initial value with the form so selects that user doesn't
  // touch still appear in submit payload.
  React.useEffect(() => {
    if (form && form.values[param_name] === undefined && initValue !== undefined) {
      form.setField(param_name, initValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const currentValue = form ? (form.values[param_name] ?? initValue) : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (form) {
      form.setField(param_name, v);
    } else {
      setLocalValue(v);
    }
    if (on_change && onAction) {
      onAction({ ...on_change, params: { ...(on_change.params || {}), [param_name]: v } });
    }
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <label className="text-xs text-gray-400">{label}</label>}
      <div className="relative min-w-0">
        <select
          value={currentValue}
          onChange={handleChange}
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};
