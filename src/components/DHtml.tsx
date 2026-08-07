'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import type { UIComponent } from '../types';

const DARK_THEME_CSS = `body{font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#d1d5db;background:transparent;margin:0;padding:0;overflow-wrap:anywhere}a{color:#60a5fa}img{max-width:100%;height:auto}pre{background:#1f2937;padding:8px;overflow:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #374151;padding:6px 10px}`;
const LIGHT_THEME_CSS = `body{font-family:system-ui,sans-serif;font-size:14px;line-height:1.65;color:#1a1a1a;background:#fff;margin:0;padding:16px 20px;overflow-wrap:anywhere}a{color:#2563eb}img{max-width:100%;height:auto}pre{background:#f3f4f6;padding:8px;overflow:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d1d5db;padding:6px 10px}`;

function sanitizeHtml(content: string): string {
  const sanitizer = DOMPurify as unknown as { sanitize?: (value: string, options: object) => string };
  if (typeof window === 'undefined' || typeof sanitizer.sanitize !== 'function') return '';
  return sanitizer.sanitize(content, {
    ADD_ATTR: ['target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'iframe'],
    FORBID_ATTR: ['srcdoc'],
  });
}

export const DHtml: UIComponent = ({ node }) => {
  const { content = '', sandbox = true, max_height = 0, theme = 'dark' } = node.props as {
    content?: string; sandbox?: boolean; max_height?: number; theme?: 'dark' | 'light';
  };
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(300);
  const sanitized = useMemo(() => sanitizeHtml(String(content)), [content]);
  const themeCSS = theme === 'light' ? LIGHT_THEME_CSS : DARK_THEME_CSS;
  const srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${themeCSS}</style></head><body>${sanitized}</body></html>`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || typeof ResizeObserver === 'undefined') return;
    const updateHeight = () => {
      const doc = iframe.contentDocument;
      const next = doc ? Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0) : 0;
      if (next > 0) setHeight(next + 2);
    };
    const observer = new ResizeObserver(updateHeight);
    const onLoad = () => { updateHeight(); if (iframe.contentDocument?.body) observer.observe(iframe.contentDocument.body); };
    iframe.addEventListener('load', onLoad);
    return () => { iframe.removeEventListener('load', onLoad); observer.disconnect(); };
  }, [srcdoc]);

  if (!sandbox) {
    return <div className={theme === 'light' ? 'prose prose-sm max-w-none' : 'prose prose-invert prose-sm max-w-none text-gray-300'} dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      sandbox="allow-popups"
      className={`w-full border-0 ${theme === 'light' ? 'rounded-lg bg-white' : 'rounded bg-transparent'}`}
      style={{ height: Math.min(height, max_height || 3000), minHeight: 300, maxHeight: max_height || 3000 }}
      title="HTML content"
    />
  );
};
