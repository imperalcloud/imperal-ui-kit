'use client';

import { useEffect, useState } from 'react';
import type { UIComponent } from '../types';

export const DAudio: UIComponent = ({ node }) => {
  const {
    src, title, controls = true, autoplay = false, loop = false,
  } = node.props as any;

  const [error, setError] = useState(false);
  useEffect(() => setError(false), [src]);

  if (!src) {
    return (
      <div className="bg-card rounded-lg p-4 text-sm text-muted text-center">
        No audio source
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg p-4 text-sm text-muted text-center">
        Audio unavailable
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {title && <p className="text-sm font-medium text-body">{title}</p>}
      {/* Declarative media may not provide a caption URL; host content policy supplies it when available. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        src={src}
        controls={controls}
        autoPlay={autoplay}
        loop={loop}
        preload="metadata"
        onError={() => setError(true)}
        className="w-full rounded-lg"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
