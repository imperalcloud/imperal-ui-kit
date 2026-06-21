'use client';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, Info, Lightbulb, OctagonAlert, TriangleAlert, ShieldAlert } from 'lucide-react';
import CodeBlock from './CodeBlock';

function isExternal(href?: string): boolean {
  return !!href && /^https?:\/\//i.test(href) && !href.includes('panel.imperal.io');
}

type AlertKind = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION';

const ALERT: Record<AlertKind, { Icon: typeof Info; ring: string; tint: string; fg: string; label: string }> = {
  NOTE:      { Icon: Info,          ring: 'border-info/40',    tint: 'bg-info/10',    fg: 'text-info',    label: 'Note' },
  TIP:       { Icon: Lightbulb,     ring: 'border-success/40', tint: 'bg-success/10', fg: 'text-success', label: 'Tip' },
  IMPORTANT: { Icon: OctagonAlert,  ring: 'border-primary/40', tint: 'bg-primary/10', fg: 'text-primary', label: 'Important' },
  WARNING:   { Icon: TriangleAlert, ring: 'border-warning/40', tint: 'bg-warning/10', fg: 'text-warning', label: 'Warning' },
  CAUTION:   { Icon: ShieldAlert,   ring: 'border-danger/40',  tint: 'bg-danger/10',  fg: 'text-danger',  label: 'Caution' },
};

// Dependency-free: tag top-level `> [!KIND]` blockquotes + strip the marker.
function remarkAlerts() {
  return (tree: { children?: any[] }) => {
    for (const node of tree.children ?? []) {
      if (node.type !== 'blockquote') continue;
      const para = node.children?.[0];
      if (para?.type !== 'paragraph') continue;
      const text = para.children?.[0];
      if (text?.type !== 'text') continue;
      const m = text.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][^\S\n]*\n?/i);
      if (!m) continue;
      node.data = node.data ?? {};
      node.data.hProperties = { ...(node.data.hProperties ?? {}), 'data-alert': m[1].toUpperCase() };
      text.value = text.value.slice(m[0].length);
    }
  };
}

function Callout({ kind, children }: { kind: AlertKind; children: React.ReactNode }) {
  const a = ALERT[kind];
  return (
    <div className={`not-prose my-3 rounded-lg border ${a.ring} ${a.tint} px-3.5 py-2.5`}>
      <div className={`mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${a.fg}`}>
        <a.Icon className="h-3.5 w-3.5" aria-hidden /> {a.label}
      </div>
      <div className="text-text [&>*:last-child]:mb-0 [&>*]:my-1">{children}</div>
    </div>
  );
}

function MarkdownMessageImpl({ content }: { content: string }) {
  return (
    <div className="imp-markdown prose prose-sm max-w-none min-w-0 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkAlerts]}
        components={{
          a: ({ href, children }) => {
            const ext = isExternal(href);
            return (
              <a
                href={href}
                target={ext ? '_blank' : undefined}
                rel={ext ? 'noopener noreferrer' : undefined}
                className="text-primary no-underline hover:underline break-words inline-flex items-center gap-0.5"
              >
                {children}
                {ext && <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />}
              </a>
            );
          },
          code: ({ className, children }) => {
            const match = className?.match(/language-([\w.+-]+)/);
            const code = String(children).replace(/\n$/, '');
            if (match || className?.includes('language-')) {
              const [lang, file] = (match?.[1] ?? '').split(':');
              return <CodeBlock language={lang || undefined} filename={file}>{code}</CodeBlock>;
            }
            return (
              <code className="rounded border border-subtle bg-[var(--imp-code-bg)] px-1 py-0.5 text-[0.85em] text-primary break-words">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-subtle">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-2">{children}</thead>,
          tr: ({ children }) => <tr className="even:bg-surface-1/40">{children}</tr>,
          th: ({ children }) => (
            <th className="border-b border-subtle px-3 py-2 text-left font-semibold text-text">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-subtle px-3 py-2 text-text-muted break-words">{children}</td>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === 'string' ? src : ''}
              alt={alt ?? ''}
              loading="lazy"
              className="my-2 max-w-full rounded-lg border border-subtle"
            />
          ),
          blockquote: ({ node, children }) => {
            const props = (node as { properties?: Record<string, unknown> })?.properties ?? {};
            const kind = ((props['dataAlert'] ?? props['data-alert']) as string | undefined)?.toUpperCase() as AlertKind | undefined;
            if (kind && ALERT[kind]) return <Callout kind={kind}>{children}</Callout>;
            return (
              <blockquote className="border-l-2 border-primary/40 pl-3 text-text-muted italic">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

const MarkdownMessage = memo(MarkdownMessageImpl);
export default MarkdownMessage;
