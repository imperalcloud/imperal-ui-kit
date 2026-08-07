import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeclarativeRenderer } from './DeclarativeRenderer';

describe('safe HTML SSR', () => {
  it('renders safe content on the server and removes executable markup', () => {
    const html = renderToStaticMarkup(<DeclarativeRenderer node={{ type: 'Html', props: { content: '<p>Hello SSR</p><script>alert(1)</script>', sandbox: false } }} />);
    expect(html).toContain('Hello SSR');
    expect(html).not.toContain('<script>');
  });
});
