import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Field, InlineError, Skeleton, ToastProvider, useToast } from './components/primitives';

afterEach(cleanup);

function DemoToast() { const toast = useToast(); return <button onClick={() => toast.notify('Saved', 'success')}>Notify</button>; }

describe('system primitives', () => {
  it('connects field descriptions and errors', () => {
    render(<Field label="Email" description="Work address" error="Invalid" required>{ids => <input id={ids.id} aria-describedby={[ids.descriptionId, ids.errorId].filter(Boolean).join(' ')} aria-invalid="true" />}</Field>);
    const input = screen.getByLabelText(/Email/);
    expect(input.getAttribute('aria-describedby')).toContain('description');
    expect(screen.getByRole('alert').textContent).toContain('Invalid');
  });
  it('exposes non-visual loading status', () => { render(<Skeleton label="Loading chart" />); expect(screen.getByRole('status', { name: 'Loading chart' })).toBeTruthy(); });
  it('announces and dismisses toasts', () => { render(<ToastProvider duration={0}><DemoToast /></ToastProvider>); fireEvent.click(screen.getByText('Notify')); expect(screen.getByText('Saved')).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: 'Dismiss' })); expect(screen.queryByText('Saved')).toBeNull(); });
  it('renders inline errors as alerts', () => { render(<InlineError>Try again</InlineError>); expect(screen.getByRole('alert').textContent).toContain('Try again'); });
});
