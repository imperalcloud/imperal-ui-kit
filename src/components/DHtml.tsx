'use client';

import { useRef, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import type { UIComponent } from '../types';

const DARK_THEME_CSS = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px; line-height: 1.6;
    color: #d1d5db; background: transparent;
    margin: 0; padding: 0; overflow: hidden;
    word-wrap: break-word; overflow-wrap: break-word;
  }
  a { color: #60a5fa; }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  blockquote {
    border-left: 3px solid #4b5563; margin: 8px 0; padding: 4px 12px;
    color: #9ca3af;
  }
  pre { background: #1f2937; padding: 8px; border-radius: 4px; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #374151; padding: 6px 10px; }
`;

const LIGHT_THEME_CSS = `
  html, body {
    margin: 0; padding: 16px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px; line-height: 1.65;
    color: #1a1a1a; background: #ffffff;
    word-break: break-word; overflow-x: hidden;
  }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  table { max-width: 100% !important; border-collapse: collapse; }
  pre, code {
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 12px; background: #f3f4f6;
    padding: 2px 4px; border-radius: 3px;
  }
  blockquote {
    border-left: 3px solid #d1d5db;
    margin: 8px 0 8px 4px; padding-left: 12px; color: #6b7280;
  }
  * { box-sizing: border-box; }
`;

export const DHtml: UIComponent = ({ node }) => {
  const {
    content = '', sandbox = true, max_height = 0, theme = 'dark',
  } = node.props as {
    content?: string; sandbox?: boolean; max_height?: number; theme?: 'dark' | 'light';
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  const isLight = theme === 'light';
  const themeCSS = isLight ? LIGHT_THEME_CSS : DARK_THEME_CSS;

  const sanitized = DOMPurify.sanitize(content, {
    ADD_TAGS: ['style'],
    ADD_ATTR: ['target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed'],
  });

  const srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${themeCSS}</style></head><body>${sanitized}</body></html>`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resizeObserver = new ResizeObserver(() => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
          if (h > 0) setHeight(h + 2);
        }
      } catch { /* cross-origin safety */ }
    });

    const onLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
          setHeight(h + 2);
          resizeObserver.observe(doc.body);
        }
      } catch { /* cross-origin safety */ }
    };

    iframe.addEventListener('load', onLoad);
    return () => {
      iframe.removeEventListener('load', onLoad);
      resizeObserver.disconnect();
    };
  }, [sanitized]);

  if (!sandbox) {
    return (
      <div
        className={isLight
          ? 'prose prose-sm max-w-none'
          : 'prose prose-invert prose-sm max-w-none text-gray-300'
        }
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  const effectiveHeight = max_height && height > max_height ? max_height : height;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      sandbox="allow-same-origin allow-popups"
      className={`w-full border-0 ${isLight ? 'rounded-lg bg-white' : 'rounded bg-transparent'}`}
      style={{
        height: effectiveHeight,
        minHeight: 300,
        maxHeight: max_height || 3000,
        overflow: 'auto',
      }}
      title="HTML content"
    />
  );
};
