import { describe, it, expect } from 'vitest';
import { resolveSignalValue } from '../DeclarativeRenderer';

describe('Signal resolution in DeclarativeRenderer', () => {
  it('resolves raw values directly', () => {
    expect(resolveSignalValue('hello')).toBe('hello');
    expect(resolveSignalValue(42)).toBe(42);
    expect(resolveSignalValue(null)).toBe(null);
  });

  it('falls back to default when signal state is not provided or key missing', () => {
    const sig = { __signal__: 'server.load', default: '0%' };
    expect(resolveSignalValue(sig)).toBe('0%');
    expect(resolveSignalValue(sig, { other: '10%' })).toBe('0%');
  });

  it('resolves live value when signal key exists in state', () => {
    const sig = { __signal__: 'server.load', default: '0%' };
    expect(resolveSignalValue(sig, { 'server.load': '85%' })).toBe('85%');
  });
});
