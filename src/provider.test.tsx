import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeclarativeRenderer, ImperalUIRoot } from './index';

describe('Imperal UI provider', () => {
  it('scopes a direct declarative renderer automatically', () => {
    const { container } = render(<DeclarativeRenderer node={{ type: 'Alert', props: { message: 'Ready' } }} />);
    expect(container.firstElementChild?.classList.contains('imperal-ui')).toBe(true);
  });
  it('provides theme, locale, direction and host app icons', () => {
    const { container } = render(<ImperalUIRoot theme="light" locale="ar" direction="rtl" appIconRenderer={({ appId }) => <b>{appId}</b>}>
      <DeclarativeRenderer root={false} node={{ type: 'AppIcon', props: { app_id: 'notes' } }} />
    </ImperalUIRoot>);
    const root = container.firstElementChild;
    expect(root?.getAttribute('data-theme')).toBe('light');
    expect(root?.getAttribute('dir')).toBe('rtl');
    expect(screen.getByText('notes')).toBeTruthy();
  });
});
