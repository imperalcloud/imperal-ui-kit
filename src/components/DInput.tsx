'use client';

import React, { useContext, useState, useRef } from 'react';
import { Send } from 'lucide-react';
import type { UIComponent, UIAction } from '../types';
import { FormContext } from './DForm';

export const DInput: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    placeholder = '',
    on_submit,
    param_name = 'value',
    value: initValue = '',
    label,
    variant = 'default',
    type = 'text',
  } = node.props as {
    placeholder?: string;
    on_submit?: UIAction;
    param_name?: string;
    value?: string;
    label?: string;
    variant?: 'default' | 'ghost';
    type?: 'text' | 'password' | 'email' | 'number' | 'url';
  };

  const [localValue, setLocalValue] = useState(String(initValue));
  const inputRef = useRef<HTMLInputElement>(null);

  const value = form ? (form.values[param_name] ?? initValue) : localValue;

  const setValue = (v: string) => {
    if (form) {
      form.setField(param_name, v);
    } else {
      setLocalValue(v);
    }
  };

  const handleSubmit = () => {
    if (!String(value).trim() || !on_submit || !onAction) return;
    if (!form) {
      const action: UIAction = {
        ...on_submit,
        params: { ...(on_submit.params || {}), [param_name]: String(value).trim() },
      };
      onAction(action);
      setLocalValue('');
      inputRef.current?.focus();
    }
  };

  const isGhost = variant === 'ghost';

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <label className="text-xs text-gray-400">{label}</label>}
      <div className="flex items-center gap-1.5 min-w-0">
        <input
          ref={inputRef}
          type={type}
          autoComplete={type === 'password' ? 'new-password' : undefined}
          spellCheck={type === 'password' ? false : undefined}
          value={String(value)}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          className={[
            'flex-1 min-w-0 rounded-md px-3 py-1.5 text-sm transition-colors',
            'focus:outline-none focus:ring-1 focus:ring-blue-500/50',
            'placeholder:text-gray-600',
            isGhost
              ? 'bg-transparent border border-transparent hover:border-gray-700/50 text-gray-200'
              : 'bg-gray-800/60 border border-gray-700/50 text-gray-200',
          ].join(' ')}
        />
        {!form && String(value).trim() && (
          <button
            onClick={handleSubmit}
            className="flex-shrink-0 p-1.5 rounded-md text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <Send size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
