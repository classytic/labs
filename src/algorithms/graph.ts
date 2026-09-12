import type { AlgorithmEdge, AlgorithmEvent, AlgorithmGraph, AlgorithmTrace } from './contract.js';

const adjacency = (graph: AlgorithmGraph, id: string): { edge: AlgorithmEdge; next: string }[] =>
  graph.edges
    .flatMap((edge) => {
      if (edge.from === id) return [{ edge, next: edge.to }];
      if (!edge.directed && edge.to === id) return [{ edge, next: edge.from }];
      return [];
    })
    .sort((a, b) => a.next.localeCompare(b.next) || a.edge.id.localeCompare(b.edge.id));

export function reconstructPath(
  previous: Record<string, string | undefined>,
  source: string,
  target: string,
): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined = target;
  while (cursor && !seen.has(cursor)) {
    path.unshift(cursor);
    if (cursor === source) return path;
    seen.add(cursor);
    cursor = previous[cursor];
  }
  return [];
}

function traverse(graph: AlgorithmGraph, source: string, mode: 'bfs' | 'dfs'): AlgorithmTrace {
  const events: AlgorithmEvent[] = [{ type: 'start', nodeId: source, message: `Start at ${source}.` }];
  const frontier = [source];
  const discovered = new Set([source]);
  const previous: Record<string, string | undefined> = {};
  const order: string[] = [];
  while (frontier.length) {
    const current = mode === 'bfs' ? frontier.shift()! : frontier.pop()!;
    order.push(current);
    events.push({
      type: 'visit-node',
      nodeId: current,
      frontier: [...frontier],
      message: `Visit ${current}; ${mode === 'bfs' ? 'queue' : 'stack'} has ${frontier.length} item${frontier.length === 1 ? '' : 's'}.`,
    });
    const nextEdges = adjacency(graph, current);
    if (mode === 'dfs') nextEdges.reverse();
    for (const { edge, next } of nextEdges) {
      events.push({
        type: 'inspect-edge',
        edgeId: edge.id,
        from: current,
        to: next,
        message: `Inspect ${current} → ${next}.`,
      });
      if (discovered.has(next)) continue;
      discovered.add(next);
      previous[next] = current;
      frontier.push(next);
      events.push({
        type: 'discover-node',
        nodeId: next,
        via: edge.id,
        frontier: [...frontier],
        message: `Discover ${next} and add it to the ${mode === 'bfs' ? 'queue' : 'stack'}.`,
      });
    }
  }
  events.push({ type: 'complete', order, message: `${mode.toUpperCase()} complete: ${order.join(' → ')}.` });
  return { algorithm: mode, events, order, previous };
}

export const bfs = (graph: AlgorithmGraph, source: string): AlgorithmTrace => traverse(graph, source, 'bfs');
export const dfs = (graph: AlgorithmGraph, source: string): AlgorithmTrace => traverse(graph, source, 'dfs');

export function dijkstra(graph: AlgorithmGraph, source: string, target?: string): AlgorithmTrace {
  const ids = graph.nodes.map((node) => node.id);
  const distance = Object.fromEntries(ids.map((id) => [id, id === source ? 0 : Infinity]));
  const previous: Record<string, string | undefined> = {};
  const previousEdge: Record<string, string | undefined> = {};
  const pending = new Set(ids);
  const order: string[] = [];
  const events: AlgorithmEvent[] = [
    { type: 'start', nodeId: source, message: `Set ${source} to 0; every other distance starts at ∞.` },
  ];
  while (pending.size) {
    const current = [...pending].sort((a, b) => distance[a]! - distance[b]! || a.localeCompare(b))[0]!;
    pending.delete(current);
    if (!Number.isFinite(distance[current])) break;
    order.push(current);
    events.push({
      type: 'visit-node',
      nodeId: current,
      frontier: [...pending].filter((id) => Number.isFinite(distance[id]!)),
      message: `Settle ${current} at distance ${distance[current]}.`,
    });
    if (current === target) break;
    for (const { edge, next } of adjacency(graph, current)) {
      if (!pending.has(next)) continue;
      events.push({
        type: 'inspect-edge',
        edgeId: edge.id,
        from: current,
        to: next,
        message: `Try ${current} → ${next} with weight ${edge.weight ?? 1}.`,
      });
      const candidate = distance[current]! + Math.max(0, edge.weight ?? 1);
      if (candidate < distance[next]!) {
        const old = distance[next]!;
        distance[next] = candidate;
        previous[next] = current;
        previousEdge[next] = edge.id;
        events.push({
          type: 'relax-edge',
          edgeId: edge.id,
          nodeId: next,
          previous: old,
          next: candidate,
          message: `Improve ${next}: ${Number.isFinite(old) ? old : '∞'} → ${candidate}.`,
        });
      }
    }
  }
  const path = target ? reconstructPath(previous, source, target) : undefined;
  events.push({
    type: 'complete',
    order,
    path,
    message: path?.length
      ? `Shortest path: ${path.join(' → ')}; cost ${distance[target!]}.`
      : 'Dijkstra complete.',
  });
  return { algorithm: 'dijkstra', events, order, distance, previous };
}
