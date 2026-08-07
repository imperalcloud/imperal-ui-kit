'use client';

import type { ReactNode } from 'react';
import type { UIComponent } from '../types';
import { useImperalUI } from '../ImperalUIProvider';

export interface AppIconRenderProps {
  appId: string;
  displayName: string;
  className: string;
}

export type AppIconRenderer = (props: AppIconRenderProps) => ReactNode;

let appIconRenderer: AppIconRenderer | null = null;

/** Configure host-specific app icon resolution without coupling the kit to a panel alias. */
export function configureAppIconRenderer(renderer: AppIconRenderer | null): void {
  appIconRenderer = renderer;
}

function initials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words.slice(0, 2).map(word => word[0]?.toUpperCase() ?? '').join('');
}

export const DAppIcon: UIComponent = ({ node }) => {
  const { appIconRenderer: providerRenderer } = useImperalUI();
  const props = node.props as {
    app_id?: string;
    appId?: string;
    display_name?: string;
    displayName?: string;
  };
  const appId = props.app_id || props.appId || '';
  const displayName = props.display_name || props.displayName || appId || 'App';
  const className = 'w-6 h-6 rounded-lg';

  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/30 bg-primary/15 text-on-primary"
      role="img"
      aria-label={`${displayName} icon`}
    >
      {providerRenderer || appIconRenderer
        ? (providerRenderer || appIconRenderer)!({ appId, displayName, className })
        : <span className="text-xs font-semibold" aria-hidden="true">{initials(displayName)}</span>}
    </div>
  );
};
