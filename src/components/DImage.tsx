'use client';
import { useState } from 'react';
import type { UIComponent } from '../types';

export const DImage: UIComponent = ({ node, onAction }) => {
  const { src, alt = '', width, height, on_click, object_fit, caption } = node.props as any;
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="bg-gray-800 rounded-md p-4 text-sm text-gray-500 text-center">
        Image unavailable
      </div>
    );
  }

  const img = (
    <img
      src={src}
      alt={alt}
      style={{
        width: width || undefined,
        height: height || undefined,
        objectFit: (object_fit as any) || undefined,
      }}
      onError={() => setError(true)}
      className={`rounded-md max-w-full${on_click ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={on_click && onAction ? () => onAction(on_click) : undefined}
    />
  );

  if (caption) {
    return (
      <figure className="inline-block">
        {img}
        <figcaption className="text-xs text-gray-500 mt-1 text-center">{caption}</figcaption>
      </figure>
    );
  }

  return img;
};
