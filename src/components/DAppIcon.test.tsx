import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { configureAppIconRenderer, DAppIcon } from './DAppIcon';

const node = { type: 'AppIcon', props: { app_id: 'mail', display_name: 'Imperal Mail' } };

afterEach(() => { configureAppIconRenderer(null); cleanup(); });

describe('DAppIcon', () => {
  it('renders a portable initials fallback', () => {
    render(<DAppIcon node={node} />);
    expect(screen.getByRole('img', { name: 'Imperal Mail icon' }).textContent).toBe('IM');
  });

  it('uses a host-provided icon renderer', () => {
    configureAppIconRenderer(({ appId }) => <span data-testid="host-icon">{appId}</span>);
    render(<DAppIcon node={node} />);
    expect(screen.getByTestId('host-icon').textContent).toBe('mail');
  });
});
