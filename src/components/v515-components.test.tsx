import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeclarativeRenderer } from '../DeclarativeRenderer';
import type { UINode } from '../types';

describe('DeclarativeRenderer new visual node types (5.15)', () => {
  it('renders ghost component with child and reason', () => {
    const node: UINode = {
      type: 'ghost',
      props: {
        reason: 'Analyzing code index...',
        pulse: false,
        opacity: 0.7,
        child: {
          type: 'text',
          props: { content: 'Underlying widget text' },
        },
      },
    };

    render(<DeclarativeRenderer node={node} />);
    expect(screen.getByTestId('ghost-wrapper')).toBeDefined();
    expect(screen.getByText('Analyzing code index...')).toBeDefined();
    expect(screen.getByText('Underlying widget text')).toBeDefined();
  });

  it('renders agentpresence component with status and action', () => {
    const node: UINode = {
      type: 'agentpresence',
      props: {
        status: 'thinking',
        action: 'Formulating execution plan',
        progress: 42,
        avatar: '🐝',
      },
    };

    render(<DeclarativeRenderer node={node} />);
    expect(screen.getByTestId('agent-presence')).toBeDefined();
    expect(screen.getByText('thinking')).toBeDefined();
    expect(screen.getByText('— Formulating execution plan')).toBeDefined();
    expect(screen.getByText('42%')).toBeDefined();
  });

  it('renders spatial canvas component with nodes and edges', () => {
    const node: UINode = {
      type: 'canvas',
      props: {
        height: 400,
        nodes: [
          { id: 'gw', title: 'API Gateway', x: 50, y: 50, status: 'healthy', type: 'gateway' },
          { id: 'db', title: 'Galera Postgres', x: 250, y: 150, status: 'warning', type: 'database' },
        ],
        edges: [
          { from: 'gw', to: 'db', protocol: 'tcp', latency_ms: 12 },
        ],
      },
    };

    render(<DeclarativeRenderer node={node} />);
    expect(screen.getByTestId('spatial-canvas')).toBeDefined();
    expect(screen.getByText('API Gateway')).toBeDefined();
    expect(screen.getByText('Galera Postgres')).toBeDefined();
    expect(screen.getByText('12ms')).toBeDefined();
    expect(screen.getByText('Spatial Canvas • 2 nodes')).toBeDefined();
  });
});
