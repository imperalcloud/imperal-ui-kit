'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UIComponent, UIAction } from '../types';

// Cytoscape itself is ~350KB gzipped. We lazy() the wrapper so it
// never hits the SSR pass (would crash: cytoscape touches `document`).
const CytoscapeComponent = React.lazy(() => import('react-cytoscapejs'));

type GraphNode = {
  id: string;
  label?: string;
  type?: string;
  size?: number;
  color?: string;
  mention_count?: number;
  [key: string]: unknown;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
  color?: string;
  [key: string]: unknown;
};

// Minimal structural type for the bits of cytoscape.Core we touch.
type CyNodeLike = {
  data: (k?: string) => unknown;
  style: (k: string, v?: string | number) => string;
  addClass: (c: string) => void;
  removeClass: (c: string) => void;
  toggleClass: (c: string, on?: boolean) => void;
  source?: () => CyNodeLike;
  target?: () => CyNodeLike;
  id?: () => string;
};

type CyCollection = {
  forEach: (cb: (e: CyNodeLike) => void) => void;
  filter: (sel: string) => { length: number };
  removeClass: (c: string) => void;
  length: number;
};

type CyCore = {
  batch: (cb: () => void) => void;
  nodes: (sel?: string) => CyCollection;
  edges: (sel?: string) => CyCollection;
  elements: () => CyCollection;
  layout: (opts: Record<string, unknown>) => { run: () => void };
  fit: (eles?: unknown, padding?: number) => void;
  png: (opts: Record<string, unknown>) => string;
  on: (evt: string, sel: string, cb: (e: { target: { id: () => string } }) => void) => void;
  getElementById?: (id: string) => CyNodeLike;
};

const TYPE_COLORS: Record<string, string> = {
  person: '#60a5fa',
  phone: '#c084fc',
  email: '#fb923c',
  address: '#4ade80',
  account: '#f87171',
  location: '#2dd4bf',
  device: '#a78bfa',
  company: '#94a3b8',
  organization: '#94a3b8',
  crypto_wallet: '#facc15',
  ip: '#22d3ee',
  url: '#38bdf8',
  file: '#9ca3af',
  default: '#64748b',
};

function resolveColor(node: GraphNode, colorBy: string): string {
  if (node.color) return node.color;
  const key = String((node as Record<string, unknown>)[colorBy] ?? '').toLowerCase();
  return TYPE_COLORS[key] ?? TYPE_COLORS.default;
}

function typeColor(t: string): string {
  return TYPE_COLORS[t.toLowerCase()] ?? TYPE_COLORS.default;
}

let _coseBilkentRegistered = false;
async function ensureLayoutsRegistered() {
  if (_coseBilkentRegistered || typeof window === 'undefined') return;
  const [{ default: cytoscape }, { default: coseBilkent }] = await Promise.all([
    import('cytoscape'),
    import('cytoscape-cose-bilkent'),
  ]);
  try {
    cytoscape.use(coseBilkent);
  } catch {
    // Already registered in another DGraph instance — ignore.
  }
  _coseBilkentRegistered = true;
}

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export const DGraph: UIComponent = ({ node, onAction }) => {
  const {
    nodes = [],
    edges = [],
    layout: initialLayout = 'cose-bilkent',
    height = 600,
    min_node_size = 10,
    max_node_size = 50,
    edge_label_visible = false,
    color_by = 'type',
    animate = true,
    on_node_click,
  } = node.props as {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    layout?: string;
    height?: number;
    min_node_size?: number;
    max_node_size?: number;
    edge_label_visible?: boolean;
    color_by?: string;
    animate?: boolean;
    on_node_click?: UIAction;
  };

  const { uniqueTypes, typeCounts, maxMentions } = useMemo(() => {
    const counts: Record<string, number> = {};
    let max = 1;
    for (const n of nodes) {
      const t = (n.type ?? 'unknown').toString();
      counts[t] = (counts[t] ?? 0) + 1;
      const mc = typeof n.mention_count === 'number' ? n.mention_count : 0;
      if (mc > max) max = mc;
    }
    return {
      uniqueTypes: Object.keys(counts).sort(),
      typeCounts: counts,
      maxMentions: max,
    };
  }, [nodes]);

  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [minMentions, setMinMentions] = useState(1);
  const [minStrength, setMinStrength] = useState(0);
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounced(searchRaw, 200);
  const [layout, setLayout] = useState<string>(initialLayout);
  const [showLabels, setShowLabels] = useState<boolean>(!!edge_label_visible);
  const [layoutsReady, setLayoutsReady] = useState(false);
  const [visibleNodeCount, setVisibleNodeCount] = useState(nodes.length);
  const [visibleEdgeCount, setVisibleEdgeCount] = useState(edges.length);
  const [lastAction, setLastAction] = useState<string>('initial render');

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<CyCore | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureLayoutsRegistered().then(() => {
      if (!cancelled) setLayoutsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const elements = useMemo(() => {
    const nodeEls = nodes.map((n) => ({
      data: {
        ...n,
        id: n.id,
        label: n.label ?? n.id,
        type: n.type,
        size: typeof n.size === 'number' ? n.size : 20,
        color: resolveColor(n, color_by),
        mention_count: typeof n.mention_count === 'number' ? n.mention_count : 0,
      },
    }));
    const edgeEls = edges.map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label ?? '',
        weight: typeof e.weight === 'number' ? e.weight : 0.5,
      },
    }));
    return [...nodeEls, ...edgeEls];
  }, [nodes, edges, color_by]);

  const stylesheet = useMemo(
    () => [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          label: 'data(label)',
          width: `mapData(size, 0, 50, ${min_node_size}, ${max_node_size})`,
          height: `mapData(size, 0, 50, ${min_node_size}, ${max_node_size})`,
          'font-size': '10px',
          'font-family': 'system-ui, -apple-system, sans-serif',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 4,
          color: '#e5e7eb',
          'text-outline-color': '#0f172a',
          'text-outline-width': 2,
          'border-width': 1,
          'border-color': 'rgba(15, 23, 42, 0.6)',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 'mapData(weight, 0, 1, 1, 4)',
          'line-color': '#475569',
          'target-arrow-color': '#475569',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: showLabels ? 'data(label)' : '',
          'font-size': '8px',
          color: '#94a3b8',
          'text-rotation': 'autorotate',
          opacity: 0.55,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#fbbf24',
        },
      },
      {
        selector: 'node:active',
        style: {
          'overlay-opacity': 0.15,
          'overlay-color': '#fbbf24',
        },
      },
      {
        selector: 'node.match',
        style: {
          'border-width': 4,
          'border-color': '#ff6b35',
          'z-index': 999,
        },
      },
      {
        selector: 'node.dimmed',
        style: {
          opacity: 0.25,
        },
      },
    ],
    [min_node_size, max_node_size, showLabels]
  );

  const layoutOpts = useMemo(() => {
    const base: Record<string, unknown> = {
      name: layout,
      nodeDimensionsIncludeLabels: true,
      animate,
      animationDuration: 500,
      randomize: false,
      fit: true,
      padding: 30,
    };
    if (layout === 'cose-bilkent') {
      base.idealEdgeLength = 100;
      base.nodeRepulsion = 4500;
    }
    if (layout === 'concentric') {
      base.concentric = (n: CyNodeLike) => {
        const v = n.data('mention_count');
        return typeof v === 'number' ? v : 0;
      };
      base.levelWidth = () => 1;
      base.minNodeSpacing = 20;
    }
    if (layout === 'breadthfirst') {
      base.directed = true;
      base.spacingFactor = 1.25;
    }
    return base;
  }, [layout, animate]);

  const applyFilters = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const type = String(n.data('type') ?? 'unknown');
        const mc = Number(n.data('mention_count') ?? 0);
        const hidden = hiddenTypes.has(type) || mc < minMentions;
        n.style('display', hidden ? 'none' : 'element');
      });
      cy.edges().forEach((e) => {
        const src = e.source ? e.source() : null;
        const tgt = e.target ? e.target() : null;
        const w = Number(e.data('weight') ?? 0);
        const srcHidden = src ? src.style('display') === 'none' : false;
        const tgtHidden = tgt ? tgt.style('display') === 'none' : false;
        const hidden = srcHidden || tgtHidden || w < minStrength;
        e.style('display', hidden ? 'none' : 'element');
      });
    });
    let nVisible = 0;
    cy.nodes().forEach((n) => {
      if (n.style('display') !== 'none') nVisible++;
    });
    let eVisible = 0;
    cy.edges().forEach((e) => {
      if (e.style('display') !== 'none') eVisible++;
    });
    setVisibleNodeCount(nVisible);
    setVisibleEdgeCount(eVisible);
    setLastAction(new Date().toLocaleTimeString());
  }, [hiddenTypes, minMentions, minStrength]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters, layoutsReady, elements]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      if (!search.trim()) {
        cy.nodes().removeClass('match');
        cy.nodes().removeClass('dimmed');
        return;
      }
      const q = search.toLowerCase();
      cy.nodes().forEach((n) => {
        const label = String(n.data('label') ?? '').toLowerCase();
        const matches = label.includes(q);
        n.toggleClass('match', matches);
        n.toggleClass('dimmed', !matches);
      });
    });
    if (search.trim()) {
      setLastAction(`search: "${search}" at ${new Date().toLocaleTimeString()}`);
    }
  }, [search]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    try {
      cy.layout(layoutOpts).run();
      setLastAction(`layout: ${layout} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.warn('[DGraph] layout failed:', err);
    }
  }, [layout, layoutOpts]);

  const handleCyInit = useCallback(
    (cy: unknown) => {
      cyRef.current = cy as CyCore;
      const instance = cyRef.current;
      if (on_node_click && onAction && instance) {
        instance.on('tap', 'node', (evt) => {
          const nodeId = evt.target.id();
          onAction({
            ...on_node_click,
            params: { ...(on_node_click.params ?? {}), node_id: nodeId },
          });
        });
      }
      queueMicrotask(() => applyFilters());
    },
    [on_node_click, onAction, applyFilters]
  );

  const toggleType = useCallback((t: string) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  const fitToView = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    try {
      cy.fit(undefined, 30);
      setLastAction(`fit at ${new Date().toLocaleTimeString()}`);
    } catch {
      /* noop */
    }
  }, []);

  const resetFilters = useCallback(() => {
    setHiddenTypes(new Set());
    setMinMentions(1);
    setMinStrength(0);
    setSearchRaw('');
    setLastAction(`reset at ${new Date().toLocaleTimeString()}`);
  }, []);

  const downloadPng = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    try {
      const dataUrl = cy.png({
        bg: '#0f172a',
        full: true,
        scale: 2,
        output: 'base64uri',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'case-graph.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setLastAction(`png export at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error('[DGraph] PNG export failed:', err);
      console.warn('[DGraph] PNG export failed. Your browser may not support this feature.');
    }
  }, []);

  if (nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center rounded-lg border border-gray-800/50 bg-gray-900/40 text-sm text-gray-500"
        style={{ height }}
      >
        Empty graph — no entities to display.
      </div>
    );
  }

  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  return (
    <div className="flex flex-col border border-gray-800/50 rounded-lg bg-gray-900/40 overflow-hidden">
      {/* Row 1: search + layout + action buttons + edge label toggle */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-800/50 flex-wrap bg-gray-900/60">
        <input
          type="text"
          placeholder="Search entities..."
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-1 bg-gray-800 text-gray-100 placeholder-gray-500 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
        />
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          className="px-2 py-1 bg-gray-800 text-gray-100 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          title="Layout algorithm"
        >
          <option value="cose-bilkent">Force-directed</option>
          <option value="circle">Circle</option>
          <option value="grid">Grid</option>
          <option value="concentric">Concentric (by mentions)</option>
          <option value="breadthfirst">Hierarchical</option>
        </select>
        <button
          type="button"
          onClick={fitToView}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 rounded text-sm"
          title="Fit graph to view"
        >
          Fit
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 rounded text-sm"
          title="Clear all filters"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
          title="Download graph as PNG"
        >
          PNG
        </button>
        <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="accent-blue-500"
          />
          Edge labels
        </label>
      </div>

      {/* Row 2: type filter checkboxes */}
      {uniqueTypes.length > 0 && (
        <div className="flex items-center gap-2 p-2 border-b border-gray-800/50 flex-wrap bg-gray-900/40">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Types:</span>
          {uniqueTypes.map((t) => {
            const hidden = hiddenTypes.has(t);
            return (
              <label
                key={t}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-xs select-none border ${
                  hidden
                    ? 'bg-gray-900 text-gray-500 border-gray-800'
                    : 'bg-gray-800 text-gray-100 border-gray-700'
                }`}
                style={{ borderLeftWidth: 3, borderLeftColor: typeColor(t) }}
              >
                <input
                  type="checkbox"
                  checked={!hidden}
                  onChange={() => toggleType(t)}
                  className="accent-blue-500"
                />
                <span>{t}</span>
                <span className="text-gray-500">({typeCounts[t]})</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Row 3: sliders */}
      <div className="flex items-center gap-6 p-2 border-b border-gray-800/50 flex-wrap bg-gray-900/40">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <span>Min mentions:</span>
          <span className="font-mono text-gray-100 min-w-[1.5rem] text-right">{minMentions}</span>
          <input
            type="range"
            min={1}
            max={Math.max(1, maxMentions)}
            value={minMentions}
            onChange={(e) => setMinMentions(Number(e.target.value))}
            className="w-32 accent-blue-500"
          />
          <span className="text-gray-500">/ {maxMentions}</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <span>Min strength:</span>
          <span className="font-mono text-gray-100 min-w-[2.5rem] text-right">
            {minStrength.toFixed(2)}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minStrength}
            onChange={(e) => setMinStrength(Number(e.target.value))}
            className="w-32 accent-blue-500"
          />
        </label>
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} style={{ height, width: '100%', position: 'relative' }}>
        {layoutsReady ? (
          <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Loading graph renderer…</div>}>
            <CytoscapeComponent
              elements={elements}
              style={{ width: '100%', height: '100%' }}
              layout={layoutOpts}
              stylesheet={stylesheet}
              cy={handleCyInit}
              minZoom={0.2}
              maxZoom={3}
              wheelSensitivity={0.2}
            />
          </Suspense>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Loading graph renderer…
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-black/70 px-2 py-1 rounded border border-gray-800/50 pointer-events-none font-mono">
          Showing {visibleNodeCount} / {totalNodes} nodes · {visibleEdgeCount} / {totalEdges} edges
          · {layout} · {lastAction}
        </div>
      </div>
    </div>
  );
};
