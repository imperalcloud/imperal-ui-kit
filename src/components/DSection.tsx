'use client';

import { useEffect, useId, useState } from 'react';
import { nodeIdentity } from '../hooks';
import { ChevronRight } from 'lucide-react';
import type { UIComponent, UINode } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

/** A titled group. `collapsible` is part of the public Imperal SDK contract. */
export const DSection: UIComponent = ({ node, onAction }) => {
  const { title, children, collapsible = false } = node.props as {
    title?: string;
    children?: UINode[];
    collapsible?: boolean;
  };
  const [open, setOpen] = useState(true);
  const identity = nodeIdentity(node);
  useEffect(() => setOpen(true), [identity]);
  const contentId = useId();

  return (
    <section className="section-stack">
      {title && collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen(value => !value)}
          className="flex w-full items-center gap-1 text-left text-xs font-medium uppercase tracking-wider text-muted hover:text-body focus-ring"
        >
          <ChevronRight className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
          {title}
        </button>
      ) : title ? (
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider">{title}</h3>
      ) : null}
      {(!collapsible || open) && (
        <div id={contentId} className="contents">
          {renderChildren(children, onAction)}
        </div>
      )}
    </section>
  );
};
