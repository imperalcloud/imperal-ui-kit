'use client';

import { useState } from 'react';
import { ChevronRight, Folder, File } from 'lucide-react';
import type { UIComponent, UIAction } from '../types';

function TreeNode({ node, depth, onAction }: { node: any; depth: number; onAction?: (a: UIAction) => void }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren ? setExpanded(!expanded) : node.on_click && onAction?.(node.on_click)}
        className="flex items-center gap-1.5 w-full py-1 px-1 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        ) : (
          <span className="w-3.5" />
        )}
        {hasChildren ? <Folder className="w-3.5 h-3.5 text-yellow-500" /> : <File className="w-3.5 h-3.5 text-gray-500" />}
        <span>{node.label}</span>
      </button>
      {expanded && hasChildren && node.children.map((child: any, i: number) => (
        <TreeNode key={child.id || i} node={child} depth={depth + 1} onAction={onAction} />
      ))}
    </div>
  );
}

export const DTree: UIComponent = ({ node, onAction }) => {
  const { nodes = [] } = node.props as { nodes?: any[] };
  return (
    <div className="space-y-0">
      {nodes.map((n: any, i: number) => (
        <TreeNode key={n.id || i} node={n} depth={0} onAction={onAction} />
      ))}
    </div>
  );
};
