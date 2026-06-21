'use client';

import { useState } from 'react';
import type { UIComponent } from '../types';

export const DAudio: UIComponent = ({ node }) => {
  const {
    src, title, controls = true, autoplay = false, loop = false,
  } = node.props as any;

  const [error, setError] = useState(false);

  if (!src) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-500 text-center">
        No audio source
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-500 text-center">
        Audio unavailable
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {title && <p className="text-sm font-medium text-gray-300">{title}</p>}
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
