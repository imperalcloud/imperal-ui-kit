'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { UIComponent } from '../types';

// Convert snake_case or kebab-case to PascalCase for Lucide lookup
function toPascalCase(name: string): string {
  return name
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
};

export const DIcon: UIComponent = ({ node }) => {
  const {
    name = 'circle',
    size = 'md',
    color,
    className: extraClass,
  } = node.props as {
    name?: string;
    size?: string;
    color?: string;
    className?: string;
  };

  const pascalName = toPascalCase(name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[pascalName] as React.FC<{
    size?: number;
    color?: string;
    className?: string;
  }> | undefined;

  if (!IconComponent) {
    // Fallback: render a small placeholder square
    return (
      <span
        className={`inline-block w-4 h-4 rounded bg-gray-700/50 ${extraClass ?? ''}`}
        title={`Icon "${name}" not found`}
      />
    );
  }

  const px = SIZE_MAP[size] ?? 16;

  return (
    <IconComponent
      size={px}
      color={color}
      className={extraClass}
    />
  );
};
