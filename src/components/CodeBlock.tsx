'use client';
import { useState, useCallback, useEffect, lazy, Suspense } from 'react';

const SyntaxHighlighter: any = lazy(
  () => import('react-syntax-highlighter/dist/cjs/prism').then(mod => ({ default: (mod as any).default || mod })),
);

let _theme: any = null;
let _themePromise: Promise<any> | null = null;

function ensureTheme(): Promise<any> {
  if (_theme) return Promise.resolve(_theme);
  if (!_themePromise) {
    _themePromise = import('react-syntax-highlighter/dist/cjs/styles/prism/one-dark').then(mod => {
      _theme = (mod as any).default || mod;
      return _theme;
    });
  }
  return _themePromise;
}

interface Props {
  language?: string;
  filename?: string;
  children: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={copy}
      className="text-gray-500 hover:text-gray-300 transition-colors p-1"
      title="Copy code"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function PlainBlock({ children, language, filename }: Props) {
  return (
    <div className="relative my-2">
      {(language || filename) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface-1 border border-subtle rounded-t-lg border-b-0">
          <span className="text-[10px] text-text-subtle uppercase tracking-wider">{filename ?? language}</span>
          <CopyButton text={children} />
        </div>
      )}
      <pre className={`bg-surface-0 border border-subtle ${language || filename ? 'rounded-b-lg' : 'rounded-lg'} p-3 overflow-x-auto max-h-[400px] overflow-y-auto`}>
        <code className="text-[13px] text-text font-mono">{children}</code>
      </pre>
    </div>
  );
}

export default function CodeBlock({ language, filename, children }: Props) {
  const [theme, setTheme] = useState<any>(_theme);

  useEffect(() => {
    if (!_theme) {
      ensureTheme().then(setTheme);
    }
  }, []);

  if (!language || !theme) {
    return <PlainBlock language={language} filename={filename}>{children}</PlainBlock>;
  }

  return (
    <div className="relative my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-1 border border-subtle rounded-t-lg border-b-0">
        <span className="text-[10px] text-text-subtle uppercase tracking-wider">{filename ?? language}</span>
        <CopyButton text={children} />
      </div>
      <div className="max-h-[400px] overflow-y-auto overflow-x-auto border border-subtle border-t-0 rounded-b-lg">
        <Suspense fallback={<pre style={{ margin: 0, padding: '0.75rem', fontSize: '0.8125rem' }}>{children}</pre>}>
          <SyntaxHighlighter
            language={language}
            style={theme}
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              background: 'var(--imp-color-surface-0)',
              fontSize: '0.8125rem',
            }}
          >
            {children}
          </SyntaxHighlighter>
        </Suspense>
      </div>
    </div>
  );
}
