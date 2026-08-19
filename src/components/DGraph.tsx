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
  on: {
    (evt: string, sel: string, cb: (e: { target: { id: () => string } }) => void): void;
    (evt: string, cb: () => void): void;
  };
  zoom: (level?: number) => number;
  center: (eles?: unknown) => void;
  getElementById?: (id: string) => CyNodeLike;
};

// Cytoscape scales label text WITH the viewport zoom, so the size declared in
// the stylesheet is not the size that reaches the screen:
//
//     effective px on screen = font-size x cy.zoom()
//
// `fit` zooms out until the whole graph is inside the box, so on a dense graph
// it settles far below zoom 1. Measured in headless Chromium on a real 14-node
// payload in a 900x600 box: zoom 0.2 (the minZoom floor), which turned a 10px
// font into a 2px letter — visible, but impossible to read at any zoom the
// toolbar offered, because it offered none. These three numbers are the
// contract between the stylesheet and fitReadable().
const NODE_FONT_PX = 13;
const EDGE_FONT_PX = 10;
const MIN_READABLE_PX = 12;

// The zoom below which node labels stop being readable, derived from the two
// constants above rather than hard-coded, so changing the font cannot silently
// break the floor.
const MIN_READABLE_ZOOM = MIN_READABLE_PX / NODE_FONT_PX;

// How many rings the concentric layout may use, at most. Ring COUNT is what
// drives the graph's radius, and radius is what forces fit to zoom out, so this
// — not the font size — is the number that decides whether labels are readable.
const CONCENTRIC_RINGS = 4;

/**
 * Enforce the readability floor after a fit.
 *
 * `fit` optimises for "everything on screen", which on a dense graph means
 * zooming out until the labels are noise. This trades completeness for
 * legibility: if fit landed below the floor, zoom back up to it and centre.
 * Part of the graph then sits outside the viewport — which is fine, it can be
 * panned and the counter reports what is drawn — whereas unreadable text is
 * not fine, and cannot be recovered by the user at all.
 *
 * Declared at module level, not as a callback, so both the Fit button and the
 * post-layout hook can use it without either having to be declared first.
 */
function enforceReadableZoom(cy: CyCore): boolean {
  try {
    if (cy.zoom() >= MIN_READABLE_ZOOM) return false;
    cy.zoom(MIN_READABLE_ZOOM);
    cy.center();
    return true;
  } catch {
    return false;
  }
}

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
    title = 'Relationship graph',
    description = '',
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
    title?: string;
    description?: string;
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
  // Which cy instance already has our 'tap' listener. See handleCyInit.
  const tapBoundRef = useRef<unknown>(null);
  // The click config, read at event time instead of captured at bind time, so
  // the listener never needs re-binding to stay current.
  const clickRef = useRef({ on_node_click, onAction });
  useEffect(() => {
    clickRef.current = { on_node_click, onAction };
  }, [on_node_click, onAction]);

  useEffect(() => {
    const controller = new AbortController();
    void ensureLayoutsRegistered().then(() => {
      if (!controller.signal.aborted) setLayoutsReady(true);
    });
    return () => controller.abort();
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
          // px, NOT rem: cytoscape draws labels on a canvas and parses this
          // itself, with no CSS engine and no root font-size to resolve
          // against. '.625rem' silently became a 0.625 PIXEL font — the labels
          // were painted all along, just far too small for anyone to see, and
          // with no console warning to hint at it.
          'font-size': `${NODE_FONT_PX}px`,
          // Long labels (file paths, 'python · 1,433') are what inflate the
          // graph's bounding box, and a wider box makes `fit` zoom further
          // out, which shrinks every label. Wrapping trades width for two
          // short lines and buys real zoom back.
          'text-wrap': 'wrap',
          'text-max-width': '120px',
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
          // px for the same reason as the node label above.
          'font-size': `${EDGE_FONT_PX}px`,
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
      // FALSE on purpose. When true the layout reserves each node's FULL label
      // width as its bounding box, and with long labels (file paths) that blew
      // the graph up: measured 3604x3802 for a 14-node payload, versus
      // 1468x1473 with it off. A bigger box makes `fit` zoom further out,
      // which shrinks every label — the exact complaint. Overlap is handled by
      // minNodeSpacing plus label wrapping instead.
      nodeDimensionsIncludeLabels: false,
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
      // THE root cause of unreadable labels, and the least obvious one.
      //
      // `() => 1` gives every distinct mention_count its OWN ring: 14 nodes
      // with 10 distinct values produced ~10 rings and a 1281px radius, so fit
      // settled at zoom 0.43 and a 13px font arrived as a 5.5px letter. Ring
      // width is derived from the data spread instead, capping the graph at
      // ~CONCENTRIC_RINGS rings no matter whether mentions run to 50 or 50,000.
      //
      // Measured in headless Chromium on the real 14-node payload, 900x600:
      //   levelWidth 1  -> box 1281x1269, fit 0.43, clamped, 6/14 in frame
      //   this rule     -> box  423x336,  fit 1.61, no clamp, 14/14 in frame,
      //                    label 20.9px on screen
      base.levelWidth = () => Math.max(1, Math.ceil(maxMentions / CONCENTRIC_RINGS));
      base.minNodeSpacing = 8;
    }
    if (layout === 'breadthfirst') {
      base.directed = true;
      base.spacingFactor = 1.25;
    }
    return base;
  }, [layout, animate, maxMentions]);

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

  // NO layout run here. react-cytoscapejs already runs the layout itself —
  // once on mount, and again whenever the `layout` prop differs — so running
  // it here too meant TWO animated, fit:true layout passes per change. On
  // first paint that reads as the graph loading, jumping and re-centring
  // several times over. This only records what happened, for the status line.
  useEffect(() => {
    if (!cyRef.current) return;
    setLastAction(`layout: ${layout} at ${new Date().toLocaleTimeString()}`);
  }, [layout]);

  const handleCyInit = useCallback(
    (cy: unknown) => {
      cyRef.current = cy as CyCore;
      const instance = cyRef.current;
      if (!instance) return;
      // react-cytoscapejs invokes its `cy` prop on EVERY update, not just on
      // mount, so binding unconditionally added ANOTHER 'tap' listener each
      // time. They accumulated, and a single click then dispatched the same
      // navigation two, three, four times over. Bind once per instance and
      // read the current config from a ref instead.
      if (tapBoundRef.current !== cy) {
        tapBoundRef.current = cy;
        instance.on('tap', 'node', (evt) => {
          const { on_node_click: action, onAction: dispatch } = clickRef.current;
          if (!action || !dispatch) return;
          dispatch({
            ...action,
            params: { ...(action.params ?? {}), node_id: evt.target.id() },
          });
        });
        // react-cytoscapejs runs the layout itself with fit:true, so the FIRST
        // view the user ever sees is the one fit chose — the one that was
        // unreadable. Clamp it every time a layout settles, which also covers
        // switching layout from the dropdown.
        instance.on('layoutstop', () => {
          if (enforceReadableZoom(instance)) {
            setLastAction(`zoom held at readable (${MIN_READABLE_PX}px min)`);
          }
        });
      }
      queueMicrotask(() => applyFilters());
    },
    [applyFilters]
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
      const clamped = enforceReadableZoom(cy);
      setLastAction(
        `${clamped ? 'fit (zoom held at readable)' : 'fit'} at ${new Date().toLocaleTimeString()}`
      );
    } catch {
      /* noop */
    }
  }, []);

  // Manual zoom, because there was NO way to zoom from the toolbar at all:
  // only Fit, Reset and PNG. On a graph fit had shrunk, the labels were
  // unreadable and the user had no control to fix it.
  const zoomBy = useCallback((factor: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    try {
      cy.zoom(cy.zoom() * factor);
      setLastAction(`zoom ${Math.round(cy.zoom() * 100)}%`);
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
        className="surface flex items-center justify-center text-sm text-muted"
        style={{ height }}
      >
        Empty graph — no entities to display.
      </div>
    );
  }

  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  return (
    <figure aria-label={title} className="surface flex flex-col overflow-hidden">
      <figcaption className="sr-only">{title}. {description || `${totalNodes} nodes and ${totalEdges} relationships.`}</figcaption>
      <details className="border-b border-hair p-2 text-sm text-body">
        <summary className="cursor-pointer font-medium focus-ring">Accessible graph data</summary>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <section aria-label="Entities"><h3 className="mb-1 font-medium">Entities ({totalNodes})</h3><ul className="max-h-48 overflow-auto text-xs text-muted">{nodes.map(item => <li key={item.id}>{item.label ?? item.id}{item.type ? ` — ${item.type}` : ''}</li>)}</ul></section>
          <section aria-label="Relationships"><h3 className="mb-1 font-medium">Relationships ({totalEdges})</h3><ul className="max-h-48 overflow-auto text-xs text-muted">{edges.map((item, index) => <li key={item.id ?? `${item.source}-${item.target}-${index}`}>{item.source} → {item.target}{item.label ? ` — ${item.label}` : ''}</li>)}</ul></section>
        </div>
      </details>
      {/* Row 1: search + layout + action buttons + edge label toggle */}
      <div className="flex items-center gap-2 p-2 border-b divide-hairline flex-wrap bg-panel/60">
        <input
          type="text"
          placeholder="Search entities..."
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
          className="field-chrome flex-1 min-w-[12.5rem] px-3 py-1 text-body border rounded text-sm focus:outline-none focus:border-primary"
        />
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          className="field-chrome px-2 py-1 text-body border rounded text-sm focus:outline-none focus:border-primary"
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
          onClick={() => zoomBy(1 / 1.3)}
          className="px-3 py-1 bg-card hover:bg-raised text-body border border-default rounded text-sm font-mono"
          title="Zoom out"
          aria-label="Zoom out"
        >
          &minus;
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.3)}
          className="px-3 py-1 bg-card hover:bg-raised text-body border border-default rounded text-sm font-mono"
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={fitToView}
          className="px-3 py-1 bg-card hover:bg-raised text-body border border-default rounded text-sm"
          title="Fit graph to view, without shrinking labels below readable"
        >
          Fit
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="px-3 py-1 bg-card hover:bg-raised text-body border border-default rounded text-sm"
          title="Clear all filters"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="px-3 py-1 bg-primary hover:bg-primary text-body rounded text-sm"
          title="Download graph as PNG"
        >
          PNG
        </button>
        <label className="flex items-center gap-1.5 text-sm text-body cursor-pointer select-none">
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
        <div className="flex items-center gap-2 p-2 border-b divide-hairline flex-wrap bg-panel/40">
          <span className="text-xs text-muted uppercase tracking-wide">Types:</span>
          {uniqueTypes.map((t) => {
            const hidden = hiddenTypes.has(t);
            return (
              <label
                key={t}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-xs select-none border ${
                  hidden
                    ? 'bg-panel text-muted border-hair'
                    : 'bg-card text-body border-default'
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
                <span className="text-muted">({typeCounts[t]})</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Row 3: sliders */}
      <div className="flex items-center gap-6 p-2 border-b divide-hairline flex-wrap bg-panel/40">
        <label className="flex items-center gap-2 text-xs text-body">
          <span>Min mentions:</span>
          <span className="font-mono text-body min-w-[1.5rem] text-right">{minMentions}</span>
          <input
            type="range"
            min={1}
            max={Math.max(1, maxMentions)}
            value={minMentions}
            onChange={(e) => setMinMentions(Number(e.target.value))}
            className="w-32 accent-blue-500"
          />
          <span className="text-muted">/ {maxMentions}</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-body">
          <span>Min strength:</span>
          <span className="font-mono text-body min-w-[2.5rem] text-right">
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
          <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-xs text-muted">Loading graph renderer…</div>}>
            <CytoscapeComponent
              elements={elements}
              style={{ width: '100%', height: '100%' }}
              layout={layoutOpts}
              stylesheet={stylesheet}
              cy={handleCyInit}
              minZoom={0.2}
              // 3x a 13px font is 39px, which is not much headroom on a big
              // graph the user wants to inspect closely. 8x is.
              maxZoom={8}
              // The default wheel sensitivity here was 0.2 — five times slower
              // than normal, so even scrolling to zoom felt like it did
              // nothing. 1 is cytoscape's own default.
              wheelSensitivity={1}
            />
          </Suspense>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
            Loading graph renderer…
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[.625rem] text-muted bg-black/70 px-2 py-1 rounded border divide-hairline pointer-events-none font-mono">
          Showing {visibleNodeCount} / {totalNodes} nodes · {visibleEdgeCount} / {totalEdges} edges
          · {layout} · {lastAction}
        </div>
      </div>
    </figure>
  );
};
