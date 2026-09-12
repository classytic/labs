import type { AlgorithmGraph } from './contract.js';
import { teachingGraph } from './presets.js';

export function normalizeGraph(input?: AlgorithmGraph): AlgorithmGraph {
  if (!input?.nodes.length) return teachingGraph;
  const seen = new Set<string>();
  const nodes = input.nodes
    .filter((node) => node.id.trim() && !seen.has(node.id) && seen.add(node.id))
    .map((node) => ({
      ...node,
      id: node.id.trim(),
      label: node.label?.trim() || node.id.trim(),
      x: Math.max(7, Math.min(93, Number.isFinite(node.x) ? node.x : 50)),
      y: Math.max(9, Math.min(88, Number.isFinite(node.y) ? node.y : 50)),
    }));
  if (!nodes.length) return teachingGraph;
  const ids = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set<string>();
  const edges = input.edges
    .filter(
      (edge) =>
        ids.has(edge.from) &&
        ids.has(edge.to) &&
        edge.from !== edge.to &&
        !edgeIds.has(edge.id) &&
        edgeIds.add(edge.id),
    )
    .map((edge) => ({ ...edge, weight: Math.max(0, edge.weight ?? 1) }));
  return { nodes, edges };
}
