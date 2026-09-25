import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MorphingCard } from './MorphingCard';
import { getComponent } from '../registry';
import { registerAllComponents } from '../register-all';

describe('MorphingCard (Liquid Intent UI)', () => {
  beforeEach(() => {
    registerAllComponents();
  });

  it('registers in global component registry', () => {
    const comp = getComponent('MorphingState');
    expect(comp).toBeDefined();
    const compCard = getComponent('morphing_card');
    expect(compCard).toBeDefined();
  });

  it('renders critical incident state with metrics and affordances', () => {
    const onAction = vi.fn();
    render(
      <MorphingCard
        context="postgres_failover"
        summary="Primary DB unreachable for 45s"
        urgency="critical"
        risk="destructive"
        details="Replication lag is 0 bytes. Secondary db-02 is ready to promote."
        affected_entities={['db-01', 'api-gateway', 'billing-worker']}
        metrics={{ 'Replica Lag': '0 bytes', 'Active Conn': 1420 }}
        affordances={[
          {
            id: 'promote_replica',
            label: 'Promote Replica (db-02)',
            risk: 'destructive',
            primary: true,
            shortcut: 'p',
          },
          {
            id: 'standby',
            label: 'Standby & Observe',
            risk: 'read',
            shortcut: 's',
          },
        ]}
        onAction={onAction}
      />
    );

    expect(screen.getByText('Primary DB unreachable for 45s')).toBeDefined();
    expect(screen.getByText(/critical/i)).toBeDefined();
    expect(screen.getByText('Replica Lag')).toBeDefined();
    expect(screen.getByText('0 bytes')).toBeDefined();
    expect(screen.getByText('db-01')).toBeDefined();

    // Affordance action execution
    const standbyBtn = screen.getByText('Standby & Observe');
    fireEvent.click(standbyBtn);
    expect(onAction).toHaveBeenCalledWith('standby', undefined);
  });

  it('requires two-step confirmation for destructive affordance', () => {
    const onAction = vi.fn();
    render(
      <MorphingCard
        context="storage_purge"
        summary="Storage pool near capacity"
        urgency="elevated"
        affordances={[
          {
            id: 'purge_temp',
            label: 'Purge Temp Files',
            risk: 'destructive',
            requires_confirmation: true,
          },
        ]}
        onAction={onAction}
      />
    );

    const purgeBtn = screen.getByText('Purge Temp Files');
    // First click requests confirmation
    fireEvent.click(purgeBtn);
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText(/Подтвердить: Purge Temp Files/)).toBeDefined();

    // Second click confirms
    fireEvent.click(screen.getByText(/Подтвердить: Purge Temp Files/));
    expect(onAction).toHaveBeenCalledWith('purge_temp', undefined);
  });
});
