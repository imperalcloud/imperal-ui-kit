'use client';

import React, { useState } from 'react';
import type { UIComponent } from '../types';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function colorFromName(name: string): string {
  const colors = [
    'bg-blue-600', 'bg-purple-600', 'bg-green-700', 'bg-orange-600',
    'bg-pink-600', 'bg-teal-600', 'bg-indigo-600', 'bg-rose-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xfffffff;
  }
  return colors[hash % colors.length];
}

export const DAvatar: UIComponent = ({ node }) => {
  const {
    src,
    name = '',
    fallback = '',
    size = 'md',
    shape = 'circle',
  } = node.props as {
    src?: string;
    name?: string;
    fallback?: string;
    size?: AvatarSize;
    shape?: 'circle' | 'square';
  };

  const [imgError, setImgError] = useState(false);
  const displayName = name || fallback || '?';
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const shapeClass = shape === 'square' ? 'rounded-md' : 'rounded-full';
  const fallbackColor = colorFromName(displayName);
  const showImage = src && !imgError;

  return (
    <div className={`${sizeClass} ${shapeClass} flex items-center justify-center flex-shrink-0 overflow-hidden select-none`}>
      {showImage ? (
        <img src={src} alt={displayName} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className={`w-full h-full ${fallbackColor} flex items-center justify-center font-semibold text-white`}>
          {getInitials(displayName)}
        </div>
      )}
    </div>
  );
};
