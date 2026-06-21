'use client';

import { useRef, useState } from 'react';
import type { UIComponent } from '../types';

export const DVideo: UIComponent = ({ node }) => {
  const {
    src, poster, title, autoplay = false, controls = true,
    loop = false, muted = false, width, height,
  } = node.props as any;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  if (!src) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-sm text-gray-500 text-center">
        No video source
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-sm text-gray-500 text-center">
        Video unavailable
      </div>
    );
  }

  const isHLS = typeof src === 'string' && src.includes('.m3u8');

  return (
    <div className="flex flex-col gap-1.5">
      {title && <p className="text-sm font-medium text-gray-300">{title}</p>}
      <video
        ref={videoRef}
        src={isHLS ? undefined : src}
        poster={poster || undefined}
        controls={controls}
        autoPlay={autoplay}
        loop={loop}
        muted={muted || autoplay}
        playsInline
        preload="metadata"
        onError={() => setError(true)}
        style={{
          width: width || '100%',
          height: height || undefined,
          maxHeight: '70vh',
        }}
        className="rounded-lg bg-black object-contain"
      >
        {isHLS ? null : (
          <>
            <source src={src} />
            Your browser does not support the video tag.
          </>
        )}
      </video>
    </div>
  );
};
