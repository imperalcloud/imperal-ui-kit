'use client';

import { useContext, useState } from 'react';
import type { UIComponent } from '../types';
import { FormContext } from './DForm';

export const DSlider: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    min = 0,
    max = 100,
    value: initValue = 50,
    step = 1,
    label = '',
    param_name = 'value',
  } = node.props as {
    min?: number;
    max?: number;
    value?: number;
    step?: number;
    label?: string;
    param_name?: string;
  };

  const [localValue, setLocalValue] = useState(initValue);
  const current = form ? (form.values[param_name] ?? initValue) : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (form) {
      form.setField(param_name, v);
    } else {
      setLocalValue(v);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="text-white">{current}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={handleChange}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
};
