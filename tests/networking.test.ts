import { describe, expect, it } from 'vitest';
import {
  HOME_NETWORK,
  COMPANY_NETWORK,
  cidrContains,
  longestPrefixMatch,
  simulatePacket,
  type NetworkRoute,
} from '../src/networking/index.js';
import { dijkstra, reconstructPath } from '../src/algorithms/graph.js';

describe('networking foundation', () => {
  it('returns a deterministic shortest-path trace', () => {
    const result = dijkstra(
      {
        nodes: ['a', 'b', 'c'].map((id, x) => ({ id, x, y: 0 })),
        edges: [
          { id: 'ab', from: 'a', to: 'b', weight: 2 },
          { id: 'ac', from: 'a', to: 'c', weight: 10 },
          { id: 'bc', from: 'b', to: 'c', weight: 3 },
        ],
      },
      'a',
    );
    expect(result.distance?.c).toBe(5);
    expect(reconstructPath(result.previous, 'a', 'c')).toEqual(['a', 'b', 'c']);
    expect(result.events.some((event) => event.type === 'relax-edge' && event.edgeId === 'bc')).toBe(true);
  });

  it('performs CIDR containment and longest-prefix selection', () => {
    const routes: NetworkRoute[] = [
      { id: 'default', deviceId: 'r1', prefix: '0.0.0.0/0', via: '10.0.0.1', interfaceId: 'wan', metric: 10 },
      { id: 'private', deviceId: 'r1', prefix: '10.20.0.0/16', interfaceId: 'lan', metric: 1 },
    ];
    expect(cidrContains('10.20.0.0/16', '10.20.8.9')).toBe(true);
    expect(longestPrefixMatch(routes, '10.20.8.9')?.id).toBe('private');
    expect(longestPrefixMatch(routes, '8.8.8.8')?.id).toBe('default');
  });

  it('replays a home HTTP packet hop by hop', () => {
    const trace = simulatePacket(HOME_NETWORK, 'laptop', 'web', 'http');
    expect(trace.delivered).toBe(true);
    expect(trace.path).toEqual(['laptop', 'wifi', 'router', 'internet', 'web']);
    expect(trace.events.at(-1)?.type).toBe('packet-delivered');
  });

  it('chooses the lower-cost company route', () => {
    const trace = simulatePacket(COMPANY_NETWORK, 'employee', 'api', 'http');
    expect(trace.path).toEqual(['employee', 'access', 'r1', 'firewall', 'api']);
  });
});
