'use client';
import type { UIComponent } from '../types';
import { renderChildren } from '../DeclarativeRenderer';

/**
 * DPage — root container for an extension's declarative UI.
 *
 * Provides consistent outer padding + vertical rhythm via design tokens.
 * Every child element inherits this container context — DText, DList,
 * DCard, DSection should NOT add their own outer padding; they just render
 * their content in the parent's spacing.
 *
 * Tune globally via --imp-page-padding / --imp-page-gap in tokens.css.
 */
export const DPage: UIComponent = ({ node, onAction }) => {
  const { title, subtitle, children } = node.props as {
    title?: string;
    subtitle?: string;
    children?: any;
  };
  return (
    <div className="page-stack">
      {title && (
        <header className="page-header-gap">
          <h1 className="text-xl font-semibold text-body">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </header>
      )}
      {renderChildren(children, onAction)}
    </div>
  );
};
