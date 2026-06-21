'use client';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

/**
 * DSection — titled group of related children inside a DPage.
 *
 * No outer padding (inherits from DPage). Only provides:
 *  - small header gap if title present
 *  - consistent gap between children (--imp-section-gap)
 */
export const DSection: UIComponent = ({ node, onAction }) => {
  const { title, children } = node.props as { title?: string; children?: any };
  return (
    <section className="section-stack">
      {title && (
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider">{title}</h3>
      )}
      {renderChildren(children, onAction)}
    </section>
  );
};
