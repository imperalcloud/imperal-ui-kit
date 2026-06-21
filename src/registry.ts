// Component registry — maps type strings to React components

import type { UIComponent } from './types';

const registry = new Map<string, UIComponent>();

export function registerComponent(type: string, component: UIComponent): void {
  registry.set(type, component);
}

export function getComponent(type: string): UIComponent | undefined {
  return registry.get(type) || registry.get(type.toLowerCase());
}

export function hasComponent(type: string): boolean {
  return registry.has(type) || registry.has(type.toLowerCase());
}

export function listRegistered(): string[] {
  return Array.from(registry.keys());
}
