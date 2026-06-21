'use client';

import { useContext, useState } from 'react';
import type { UIComponent, UIAction } from '../types';
import { FormContext } from './DForm';

export const DTextArea: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    placeholder = '',
    value: initValue = '',
    rows = 4,
    on_submit,
    param_name = 'text',
  } = node.props as {
    placeholder?: string;
    value?: string;
    rows?: number;
    on_submit?: UIAction;
    param_name?: string;
  };

  const [localValue, setLocalValue] = useState(initValue);
  const current = form ? (form.values[param_name] ?? initValue) : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (form) {
      form.setField(param_name, v);
    } else {
      setLocalValue(v);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && on_submit && onAction) {
      onAction({ ...on_submit, params: { ...(on_submit.params || {}), [param_name]: current } });
    }
  };

  return (
    <textarea
      value={current}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white resize-y focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    />
  );
};
