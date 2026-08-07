'use client';

import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import type { UIComponent, UIAction } from '../types';
import { FormContext } from './DForm';
import { nodeIdentity, useSyncedState } from '../hooks';

interface DTagInputProps {
  values?: string[];
  suggestions?: string[];
  placeholder?: string;
  param_name?: string;
  on_change?: UIAction;
  grouped_by?: string;
  delimiters?: string[];
  validate?: string;
  validate_message?: string;
}

function groupSuggestions(suggestions: string[], grouped_by: string): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const s of suggestions) {
    const colonIdx = s.indexOf(':');
    const group = colonIdx > 0 ? s.slice(0, colonIdx) : grouped_by || '__ungrouped__';
    if (!groups[group]) groups[group] = [];
    groups[group].push(s);
  }
  return groups;
}

export const DTagInput: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    values: rawInitValues = [],
    suggestions: rawSuggestions = [],
    placeholder = 'Add...',
    param_name = 'tags',
    on_change,
    grouped_by = '',
    delimiters = [],
    validate = '',
    validate_message = '',
  } = node.props as DTagInputProps;

  const [validateError, setValidateError] = useState(false);
  const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validateRe = useMemo(() => {
    if (!validate) return null;
    try { return new RegExp(validate); } catch { return null; }
  }, [validate]);

  const initValues = useMemo(() => Array.isArray(rawInitValues) ? rawInitValues : rawInitValues ? [String(rawInitValues)] : [], [rawInitValues]);
  const [localValues, setLocalValues] = useSyncedState<string[]>(initValues, nodeIdentity(node));
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form && form.values[param_name] === undefined) form.setField(param_name, initValues);
  }, [form, initValues, param_name]);

  const rawSelected = form ? (form.values[param_name] ?? initValues) : localValues;
  const selected: string[] = Array.isArray(rawSelected) ? rawSelected : rawSelected ? [String(rawSelected)] : [];

  const applyChange = (next: string[]) => {
    if (form) {
      form.setField(param_name, next);
    } else {
      setLocalValues(next);
    }
    if (on_change && onAction) {
      onAction({ ...on_change, params: { ...(on_change.params || {}), [param_name]: next } });
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    if (validateRe && !validateRe.test(trimmed)) {
      setValidateError(true);
      if (validationTimer.current) clearTimeout(validationTimer.current);
      validationTimer.current = setTimeout(() => setValidateError(false), 1800);
      return;
    }
    setValidateError(false);
    applyChange([...selected, trimmed]);
    setInputValue('');
    setIsOpen(false);
  };

  const removeTag = (tag: string) => {
    applyChange(selected.filter(v => v !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || (delimiters && delimiters.includes(e.key))) {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      removeTag(selected[selected.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Paste multiple values at once when delimiters include ' ' or ',' etc.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!delimiters || delimiters.length === 0) return;
    const text = e.clipboardData.getData('text');
    if (!text) return;
    // Build a regex that splits on any configured delimiter or newline.
    const escaped = delimiters.map(d => d.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|');
    const re = new RegExp(`[\\n${escaped}]+`);
    const parts = text.split(re).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return; // let default single-paste behavior run
    e.preventDefault();
    const additions = parts.filter((part, index) =>
      !selected.includes(part) && parts.indexOf(part) === index && (!validateRe || validateRe.test(part)),
    );
    if (additions.length) applyChange([...selected, ...additions]);
    if (additions.length !== parts.length) {
      setValidateError(true);
      if (validationTimer.current) clearTimeout(validationTimer.current);
      validationTimer.current = setTimeout(() => setValidateError(false), 1800);
    }
    setInputValue('');
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => () => {
    if (validationTimer.current) clearTimeout(validationTimer.current);
  }, []);

  const suggestions = Array.isArray(rawSuggestions) ? rawSuggestions : [];
  const filteredSuggestions = suggestions.filter(
    s => !selected.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  const useGroups = grouped_by !== '' && filteredSuggestions.length > 0;
  const groups = useGroups ? groupSuggestions(filteredSuggestions, grouped_by) : {};

  return (
    <div ref={containerRef} className="relative">
      <div
        className="field-chrome min-h-[2.75rem] w-full border rounded-md px-2 py-1.5 flex flex-wrap gap-1 items-center cursor-text focus-within:border-primary focus-within:ring-1 focus-within:ring-focus"
        role="group"
      >
        {selected.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/50 text-primary text-xs rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              aria-label={`Remove ${tag}`}
              className="hover:text-on-primary focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          aria-label="Tags"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[5rem] bg-transparent text-sm text-body outline-none"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-panel border border-default rounded-md shadow-lg max-h-48 overflow-y-auto">
          {useGroups ? (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <div className="px-3 py-1 text-xs text-muted uppercase tracking-wider font-medium bg-card/50">
                  {group}
                </div>
                {items.map(s => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-body hover:bg-raised focus:outline-none"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ))
          ) : (
            filteredSuggestions.map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className="w-full text-left px-3 py-1.5 text-sm text-body hover:bg-raised focus:outline-none"
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}
      {validateError && validate_message && (
        /* validate_error_msg_marker */
        <div className="text-xs text-danger mt-1 px-1">{validate_message}</div>
      )}
    </div>
  );
};
