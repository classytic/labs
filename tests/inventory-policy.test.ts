import { describe, expect, it } from 'vitest';
import { simulateInventoryPolicy } from '../src/commerce/finance/inventory-policy.js';

const policy = { usagePerDay: 20, orderQty: 120, leadTimeDays: 5, bufferStock: 40, days: 60 };

describe('inventory policy simulation', () => {
  it('keeps the baseline deterministic and fully served', () => {
    const first = simulateInventoryPolicy({ ...policy, scenario: 'steady' });
    const replay = simulateInventoryPolicy({ ...policy, scenario: 'steady' });
    expect(replay).toEqual(first);
    expect(first.serviceLevel).toBe(1);
    expect(first.lostUnits).toBe(0);
    expect(first.reorderPoint).toBe(140);
  });

  it('makes disruptions visible without random or hidden state', () => {
    const spike = simulateInventoryPolicy({ ...policy, scenario: 'demand-spike' });
    const delayed = simulateInventoryPolicy({ ...policy, scenario: 'supplier-delay' });
    expect(spike.demand.some((demand) => demand === 40)).toBe(true);
    expect(spike.eventLabel).toContain('Demand doubles');
    expect(delayed.eventLabel).toContain('3 days late');
    expect(spike.series).not.toEqual(delayed.series);
  });

  it('shows the operational trade-off when safety stock is raised', () => {
    const exposed = simulateInventoryPolicy({ ...policy, bufferStock: 0, scenario: 'demand-spike' });
    const protectedPolicy = simulateInventoryPolicy({
      ...policy,
      bufferStock: 100,
      scenario: 'demand-spike',
    });
    expect(protectedPolicy.serviceLevel).toBeGreaterThanOrEqual(exposed.serviceLevel);
    expect(protectedPolicy.averageStock).toBeGreaterThan(exposed.averageStock);
  });
});
