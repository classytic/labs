import { useId } from 'react';
import type { AlgorithmGraph } from './contract.js';

export interface GraphViewProps {
  graph: AlgorithmGraph;
  current?: string;
  activeEdge?: string;
  visited?: ReadonlySet<string>;
  discovered?: ReadonlySet<string>;
  path?: readonly string[];
  distances?: Record<string, number>;
}

export function GraphView({
  graph,
  current,
  activeEdge,
  visited = new Set(),
  discovered = new Set(),
  path = [],
  distances,
}: GraphViewProps) {
  const markerId = `algorithm-arrow-${useId().replaceAll(':', '')}`;
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const pathEdges = new Set(path.slice(1).map((id, index) => `${path[index]}:${id}`));
  return (
    <div className="algorithm-graph">
      <svg className="algorithm-scene-svg" viewBox="0 0 100 100" role="img" aria-label="Algorithm graph">
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 8 4 0 8z" />
          </marker>
        </defs>
        {graph.edges.map((edge) => {
          const from = nodes.get(edge.from)!;
          const to = nodes.get(edge.to)!;
          const onPath = pathEdges.has(`${edge.from}:${edge.to}`) || pathEdges.has(`${edge.to}:${edge.from}`);
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const length = Math.hypot(dx, dy) || 1;
          // Keep the weight beside its edge rather than sitting on the stroke or a node.
          const labelOffset = 3.2;
          const labelX = (from.x + to.x) / 2 + (-dy / length) * labelOffset;
          const labelY = (from.y + to.y) / 2 + (dx / length) * labelOffset;
          return (
            <g
              key={edge.id}
              className="algorithm-edge"
              data-active={edge.id === activeEdge || undefined}
              data-path={onPath || undefined}
            >
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                markerEnd={edge.directed ? `url(#${markerId})` : undefined}
              />
              <text
                className="algorithm-scene-meta"
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {edge.weight ?? 1}
              </text>
            </g>
          );
        })}
        {graph.nodes.map((node) => (
          <g
            key={node.id}
            className="algorithm-node"
            transform={`translate(${node.x} ${node.y})`}
            data-current={node.id === current || undefined}
            data-visited={visited.has(node.id) || undefined}
            data-discovered={discovered.has(node.id) || undefined}
          >
            <circle r="7" />
            <text className="algorithm-scene-label" textAnchor="middle" dominantBaseline="central">
              {node.label ?? node.id}
            </text>
            {distances && (
              <text className="algorithm-distance algorithm-scene-meta" textAnchor="middle" y="12">
                {Number.isFinite(distances[node.id]!) ? distances[node.id] : '∞'}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
