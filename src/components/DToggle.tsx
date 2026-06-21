'use client';

import React, { useContext, useState } from 'react';
import type { UIComponent, UIAction } from '../types';
import { FormContext } from './DForm';

/**
 * Coerce a value to boolean — handles string "true"/"false" from form defaults.
 */
function toBool(v: unknown): boolean {
  if (typeof v === 'string') return v === 'true' || v === '1';
  return !!v;
}

/**
 * Standard system toggle — matches React SettingsModal Toggle exactly.
 * w-9 h-5 track, w-4 h-4 dot, standard Tailwind classes only (no arbitrary values).
 */
export const DToggle: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    label = '',
    value: initValue = false,
    on_change,
    param_name = 'enabled',
  } = node.props as {
    label?: string;
    value?: boolean;
    on_change?: UIAction;
    param_name?: string;
  };

  const [localValue, setLocalValue] = useState(toBool(initValue));
  // GAP-2: register initial value with the form so unchanged toggles still
  // appear in submit payload (previously "unticked" => key missing => server
  // treated as undefined instead of false).
  React.useEffect(() => {
    if (form && form.values[param_name] === undefined) {
      form.setField(param_name, toBool(initValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rawCheck = form ? (form.values[param_name] ?? initValue) : localValue;
  const checked = toBool(rawCheck);

  const toggle = () => {
    const next = !checked;
    if (form) {
      form.setField(param_name, next);
    } else {
      setLocalValue(next);
    }
    if (on_change && onAction) {
      onAction({ ...on_change, params: { ...(on_change.params || {}), [param_name]: next } });
    }
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
      <div
        onClick={toggle}
        role="switch"
        aria-checked={checked}
        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
};
