import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'jest-axe';
import { DeclarativeRenderer } from './DeclarativeRenderer';

expect.extend({
  toHaveNoViolations(results: { violations: unknown[] }) {
    return { pass: results.violations.length === 0, message: () => JSON.stringify(results.violations, null, 2) };
  },
});
afterEach(cleanup);

declare module 'vitest' { interface Assertion<T = any> { toHaveNoViolations(): T } }

const text = (content: string) => ({ type: 'Text', props: { content } });

describe('automated accessibility gate', () => {
  it.each([
    ['form', { type: 'Form', props: { action: 'save', children: [{ type: 'Input', props: { label: 'Email', type: 'email', required: true } }] } }],
    ['tabs', { type: 'Tabs', props: { tabs: [{ id: 'one', label: 'One', children: [text('First')] }, { id: 'two', label: 'Two', children: [text('Second')] }] } }],
    ['dialog', { type: 'Dialog', props: { title: 'Confirm', content: 'Continue?' } }],
    ['menu', { type: 'Menu', props: { items: [{ label: 'Edit' }, { label: 'Delete' }] } }],
    ['table', { type: 'DataTable', props: { columns: [{ key: 'name', label: 'Name' }], rows: [{ name: 'Bee' }] } }],
  ])('%s has no detectable violations', async (_name, node) => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const { container } = render(<DeclarativeRenderer node={node} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
