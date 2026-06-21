'use client';

import React from 'react';
import type { UIComponent } from '../types';

type TextVariant = 'heading' | 'subheading' | 'body' | 'caption' | 'code' | 'label';

const VARIANT_CLASSES: Record<TextVariant, string> = {
  heading:    'text-lg font-semibold text-body',
  subheading: 'text-base font-medium text-body',
  body:       'text-sm text-body',
  caption:    'text-xs text-muted',
  code:       'text-xs font-mono text-primary bg-code px-1.5 py-0.5 rounded',
  label:      'text-xs font-medium text-muted uppercase tracking-wide',
};

export const DText: UIComponent = ({ node }) => {
  const {
    content,
    text,
    variant = 'body',
    className: extraClass,
    truncate,
  } = node.props as {
    content?: string;
    text?: string;
    variant?: TextVariant;
    className?: string;
    truncate?: boolean;
  };

  const value = content || text || '';
  const base = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.body;
  const classes = [base, truncate ? 'truncate' : '', extraClass ?? ''].filter(Boolean).join(' ');

  if (variant === 'code')       return <code className={classes}>{value}</code>;
  if (variant === 'heading')    return <h2 className={classes}>{value}</h2>;
  if (variant === 'subheading') return <h3 className={classes}>{value}</h3>;
  return <p className={classes}>{value}</p>;
};
