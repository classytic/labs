import { describe, expect, it } from 'vitest';
import {
  broadcastFrom,
  domainCount,
  domainOf,
  makeVlanSwitch,
  sendBetween,
  setPortVlan,
  setRouting,
} from '../src/networking/vlan.js';

const base = makeVlanSwitch(6);

describe('a VLAN is a broadcast domain', () => {
  it('reaches every live port in its own VLAN and no others', () => {
    const result = broadcastFrom(base, 1);
    expect(result.reached).toEqual([2, 3, 4]);
    expect(result.blocked).toEqual([5, 6]);
  });

  it('does not reach ports with no device, in either VLAN', () => {
    // Ports 7 and 8 are empty, so they are neither reached nor reported as blocked.
    const result = broadcastFrom(base, 5);
    expect(result.reached).toEqual([6]);
    expect(result.reached).not.toContain(7);
    expect(result.blocked).not.toContain(7);
  });

  it('counts one broadcast domain per VLAN actually in use', () => {
    expect(domainCount(base)).toBe(2);
    // Move every live port into one VLAN and the switch is a single domain again.
    let merged = base;
    for (const id of [5, 6]) merged = setPortVlan(merged, id, 10);
    expect(domainCount(merged)).toBe(1);
    expect(broadcastFrom(merged, 1).blocked).toEqual([]);
  });

  it('keeps isolation even with routing enabled, because routing is layer 3', () => {
    const routed = setRouting(base, true);
    expect(broadcastFrom(routed, 1).reached).toEqual(broadcastFrom(base, 1).reached);
    expect(broadcastFrom(routed, 1).blocked).toEqual([5, 6]);
  });
});

describe('moving a port between VLANs', () => {
  it('changes who hears it, with no cable touched', () => {
    expect(broadcastFrom(base, 1).reached).toEqual([2, 3, 4]);
    const moved = setPortVlan(base, 5, 10);
    expect(broadcastFrom(moved, 1).reached).toEqual([2, 3, 4, 5]);
    expect(broadcastFrom(moved, 6).reached).toEqual([]);
  });

  it('leaves a port alone in its VLAN with nobody to broadcast to', () => {
    const isolated = setPortVlan(base, 6, 30);
    const result = broadcastFrom(isolated, 6);
    expect(result.reached).toEqual([]);
    expect(result.blocked.length).toBeGreaterThan(0);
  });

  it('never mutates the state it was given', () => {
    const before = JSON.stringify(base);
    setPortVlan(base, 1, 20);
    setRouting(base, true);
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe('crossing between VLANs', () => {
  it('forwards directly inside one VLAN', () => {
    const result = sendBetween(base, 1, 3);
    expect(result).toMatchObject({ delivered: true, viaRouter: false });
  });

  it('has NO path between VLANs without a layer-3 interface', () => {
    const result = sendBetween(base, 1, 5);
    expect(result.delivered).toBe(false);
    expect(result.viaRouter).toBe(false);
    expect(result.message).toContain('no path');
  });

  it('delivers across VLANs once routing exists, and says it went through the router', () => {
    const routed = setRouting(base, true);
    const result = sendBetween(routed, 1, 5);
    expect(result).toMatchObject({ delivered: true, viaRouter: true });
  });

  it('still does not involve the router for traffic inside one VLAN', () => {
    const routed = setRouting(base, true);
    expect(sendBetween(routed, 1, 2).viaRouter).toBe(false);
  });

  it('refuses when either end has no device', () => {
    expect(sendBetween(base, 1, 8).delivered).toBe(false);
    expect(sendBetween(base, 7, 1).delivered).toBe(false);
  });
});

describe('the point of doing this at all', () => {
  it('puts every crossing through one place, which is where a policy can sit', () => {
    const routed = setRouting(base, true);
    // Every cross-VLAN pair goes via the router; no pair sneaks across at layer 2.
    for (const from of [1, 2, 3, 4]) {
      for (const to of [5, 6]) {
        expect(sendBetween(routed, from, to).viaRouter).toBe(true);
      }
    }
  });

  it('gives the same physical switch two independent networks', () => {
    expect(domainOf(base, 1)).toEqual([2, 3, 4]);
    expect(domainOf(base, 5)).toEqual([6]);
    expect(domainOf(base, 1).some((port) => domainOf(base, 5).includes(port))).toBe(false);
  });
});
