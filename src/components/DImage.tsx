'use client';

import { useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { UIAction, UIComponent } from '../types';

type ObjectFit = CSSProperties['objectFit'];
const OBJECT_FITS = new Set<ObjectFit>(['contain', 'cover', 'fill', 'none', 'scale-down']);

export const DImage: UIComponent = ({ node, onAction }) => {
  const { src = '', alt = '', width, height, on_click, object_fit, caption } = node.props as {
    src?: string; alt?: string; width?: string; height?: string; on_click?: UIAction;
    object_fit?: ObjectFit; caption?: string;
  };
  const [error, setError] = useState(false);
  const clickable = Boolean(on_click && onAction);
  const activate = () => { if (on_click && onAction) onAction(on_click); };
  const handleKeyDown = (event: KeyboardEvent<HTMLImageElement>) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
  };

  if (!src || error) return <div role="status" className="bg-gray-800 rounded-md p-4 text-sm text-gray-500 text-center">Image unavailable</div>;

  const image = (
    <img
      src={src}
      alt={alt}
      width={width || undefined}
      height={height || undefined}
      style={{ objectFit: OBJECT_FITS.has(object_fit) ? object_fit : undefined }}
      onError={() => setError(true)}
      className={`rounded-md max-w-full${clickable ? ' cursor-pointer hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500/70' : ''}`}
      onClick={clickable ? activate : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    />
  );

  return caption ? <figure className="inline-block">{image}<figcaption className="text-xs text-gray-500 mt-1 text-center">{caption}</figcaption></figure> : image;
};
