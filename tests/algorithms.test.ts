import { describe, expect, it } from 'vitest';
import {
  bfs,
  dfs,
  dijkstra,
  normalizeGraph,
  reconstructPath,
  teachingGraph,
} from '../src/algorithms/graph/index.js';
import { gridPaths } from '../src/algorithms/dp/index.js';

describe('algorithm traces', () => {
  it('keeps BFS and DFS deterministic', () => {
    expect(bfs(teachingGraph, 'A').order).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(dfs(teachingGraph, 'A').order).toEqual(['A', 'B', 'D', 'F', 'E', 'C']);
  });
  it('finds and explains the shortest path', () => {
    const result = dijkstra(teachingGraph, 'A', 'F');
    expect(reconstructPath(result.previous, 'A', 'F')).toEqual(['A', 'C', 'E', 'D', 'F']);
    expect(result.distance?.F).toBe(9);
    expect(result.events.some((event) => event.type === 'relax-edge')).toBe(true);
  });
  it('builds grid-path states from dependencies', () => {
    const result = gridPaths(3, 4);
    expect(result.table[2]?.[3]).toBe(10);
    expect(result.events).toHaveLength(12);
    expect(result.events.at(-1)?.dependencies).toEqual([
      [1, 3],
      [2, 2],
    ]);
  });
  it('sanitizes author graphs and ignores dangling edges', () => {
    const graph = normalizeGraph({
      nodes: [
        { id: 'A', x: -20, y: 120 },
        { id: 'B', x: 60, y: 50 },
      ],
      edges: [
        { id: 'ok', from: 'A', to: 'B', weight: -4 },
        { id: 'dangling', from: 'A', to: 'Z' },
      ],
    });
    expect(graph.nodes[0]).toMatchObject({ x: 7, y: 88 });
    expect(graph.edges).toEqual([{ id: 'ok', from: 'A', to: 'B', weight: 0 }]);
  });
});
