'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { ChevronRight, Folder, File } from 'lucide-react';
import type { UIComponent, UIAction } from '../types';

// A node may name its own Lucide icon (the SDK has always documented
// `{"id", "label", "children", "icon"}`); an unknown name simply falls back to
// the folder/file default rather than rendering a hole.
function nodeIcon(name: unknown, hasChildren: boolean) {
  if (typeof name === 'string' && name) {
    const Named = (LucideIcons as any)[name];
    if (Named) return <Named className="size-3.5 shrink-0 text-muted" />;
  }
  return hasChildren
    ? <Folder className="size-3.5 shrink-0 text-warning" />
    : <File className="size-3.5 shrink-0 text-muted" />;
}

function TreeNode({ node, depth, onAction }: { node: any; depth: number; onAction?: (a: UIAction) => void }) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const [expanded, setExpanded] = useState(node.expanded ?? depth < 1);

  return (
    <li role="none">
      <button
        type="button"
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-level={depth + 1}
        aria-selected={false}
        onClick={() => (hasChildren ? setExpanded(!expanded) : node.on_click && onAction?.(node.on_click))}
        className="focus-ring flex w-full items-center gap-1.5 rounded px-1 py-1 text-sm text-body hover:bg-card"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren
          ? <ChevronRight aria-hidden="true" className={`size-3.5 shrink-0 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`} />
          : <span aria-hidden="true" className="w-3.5 shrink-0" />}
        {nodeIcon(node.icon, hasChildren)}
        <span className="min-w-0 truncate">{node.label}</span>
        {node.badge != null && <span className="ml-auto shrink-0 text-xs text-muted tabular-nums">{node.badge}</span>}
      </button>
      {expanded && hasChildren && (
        <ul role="group" className="space-y-0">
          {node.children.map((child: any, i: number) => (
            <TreeNode key={child.id || i} node={child} depth={depth + 1} onAction={onAction} />
          ))}
        </ul>
      )}
    </li>
  );
}

export const DTree: UIComponent = ({ node, onAction }) => {
  const { nodes = [], label = 'Tree' } = node.props as { nodes?: any[]; label?: string };
  return (
    <ul role="tree" aria-label={label} className="space-y-0">
      {nodes.map((n: any, i: number) => (
        <TreeNode key={n.id || i} node={n} depth={0} onAction={onAction} />
      ))}
    </ul>
  );
};
