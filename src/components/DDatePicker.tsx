'use client';

import { useContext, useState } from 'react';
import type { UIComponent, UIAction } from '../types';
import { FormContext } from './DForm';

export const DDatePicker: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    value: initValue = '',
    placeholder = '',
    on_change,
    param_name = 'date',
  } = node.props as {
    value?: string;
    placeholder?: string;
    on_change?: UIAction;
    param_name?: string;
  };

  const [localValue, setLocalValue] = useState(initValue);
  const current = form ? (form.values[param_name] ?? initValue) : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <input
      type="date"
      value={current}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    />
  );
};
