'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { UIAction, UIComponent } from '../types';

type ObjectFit = CSSProperties['objectFit'];
const OBJECT_FITS = new Set<ObjectFit>(['contain', 'cover', 'fill', 'none', 'scale-down']);

export const DImage: UIComponent = ({ node, onAction }) => {
  const { src = '', alt = '', width, height, on_click, object_fit, caption } = node.props as {
    src?: string; alt?: string; width?: string; height?: string; on_click?: UIAction;
    object_fit?: ObjectFit; caption?: string;
  };
  const [error, setError] = useState(false);
  useEffect(() => setError(false), [src]);
  const clickable = Boolean(on_click && onAction);
  const activate = () => { if (on_click && onAction) onAction(on_click); };

  if (!src || error) return <div role="status" className="bg-card rounded-md p-4 text-sm text-muted text-center">Image unavailable</div>;

  const imageElement = <img src={src} alt={alt} width={width || undefined} height={height || undefined} style={{ objectFit: OBJECT_FITS.has(object_fit) ? object_fit : undefined }} onError={() => setError(true)} className="max-w-full rounded-md" />;
  const image = clickable ? <button type="button" onClick={activate} aria-label={alt || caption || 'Open image'} className="rounded-md transition-opacity hover:opacity-80 focus-ring">{imageElement}</button> : imageElement;

  return caption ? <figure className="inline-block">{image}<figcaption className="text-xs text-muted mt-1 text-center">{caption}</figcaption></figure> : image;
};
