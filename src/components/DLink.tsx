'use client';
import React from 'react';
import type { UIComponent } from '../types';

export const DLink: UIComponent = ({ node, onAction }) => {
  const { label, href, on_click } = node.props as any;
  const handleClick = (e: React.MouseEvent) => {
    if (on_click && onAction) { e.preventDefault(); onAction(on_click); }
  };
  return (
    <a
      href={href || '#'}
      onClick={handleClick}
      className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
    >
      {label}
    </a>
  );
};
