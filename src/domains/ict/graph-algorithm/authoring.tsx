'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AlgorithmGraph } from '../../../algorithms/contract.js';
import { GraphView } from '../../../algorithms/GraphView.js';
import { normalizeGraph } from '../../../algorithms/normalize.js';
import { teachingGraph } from '../../../algorithms/presets.js';
import {
  BooleanField,
  ConfigPanel,
  ConfigRow,
  NumField,
  SelectField,
  TextField,
} from '../../../blocks/authoring.js';

type Props = {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
};

export default function GraphAlgorithmAuthoring({ value, onChange }: Props) {
  const graph = normalizeGraph(value.graph as AlgorithmGraph | undefined);
  const algorithm = value.algorithm === 'bfs' || value.algorithm === 'dfs' ? value.algorithm : 'dijkstra';
  const source = graph.nodes.some((node) => node.id === value.source)
    ? String(value.source)
    : graph.nodes[0]!.id;
  const target = graph.nodes.some((node) => node.id === value.target)
    ? String(value.target)
    : graph.nodes.at(-1)!.id;
  const updateGraph = (next: AlgorithmGraph) => onChange({ graph: next });
  const patchNode = (id: string, patch: Partial<AlgorithmGraph['nodes'][number]>) =>
    updateGraph({
      ...graph,
      nodes: graph.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    });
  const patchEdge = (id: string, patch: Partial<AlgorithmGraph['edges'][number]>) =>
    updateGraph({
      ...graph,
      edges: graph.edges.map((edge) => (edge.id === id ? { ...edge, ...patch } : edge)),
    });
  const addNode = () => {
    let index = graph.nodes.length + 1;
    let id = `N${index}`;
    while (graph.nodes.some((node) => node.id === id)) id = `N${++index}`;
    const angle = graph.nodes.length * 2.4;
    updateGraph({
      ...graph,
      nodes: [
        ...graph.nodes,
        {
          id,
          label: id,
          x: 50 + 32 * Math.cos(angle),
          y: 50 + 32 * Math.sin(angle),
        },
      ],
    });
  };
  const removeNode = (id: string) => {
    const nodes = graph.nodes.filter((node) => node.id !== id);
    if (!nodes.length) return;
    const next = {
      nodes,
      edges: graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
    };
    onChange({
      graph: next,
      source: source === id ? nodes[0]!.id : source,
      target: target === id ? nodes.at(-1)!.id : target,
    });
  };
  const addEdge = () => {
    if (graph.nodes.length < 2) return;
    let index = graph.edges.length + 1;
    let id = `e${index}`;
    while (graph.edges.some((edge) => edge.id === id)) id = `e${++index}`;
    updateGraph({
      ...graph,
      edges: [...graph.edges, { id, from: graph.nodes[0]!.id, to: graph.nodes[1]!.id, weight: 1 }],
    });
  };
  const nodeOptions = graph.nodes.map((node) => ({
    value: node.id,
    label: node.label ?? node.id,
  }));
  return (
    <div className="graph-authoring">
      <div className="graph-authoring-preview">
        <GraphView graph={graph} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ graph: teachingGraph, source: 'A', target: 'F' })}
        >
          Reset example
        </Button>
      </div>
      <div className="graph-authoring-panel">
        <ConfigPanel>
          <ConfigRow label="Algorithm">
            <SelectField
              value={algorithm}
              onChange={(algorithm) => onChange({ algorithm })}
              options={[
                { value: 'dijkstra', label: 'Dijkstra' },
                { value: 'bfs', label: 'Breadth-first search' },
                { value: 'dfs', label: 'Depth-first search' },
              ]}
            />
          </ConfigRow>
          <ConfigRow label="Route">
            <SelectField
              value={source}
              onChange={(source) => onChange({ source })}
              options={nodeOptions}
              ariaLabel="Start node"
            />
            <span className="text-muted-foreground">to</span>
            <SelectField
              value={target}
              onChange={(target) => onChange({ target })}
              options={nodeOptions}
              ariaLabel="Target node"
            />
          </ConfigRow>
        </ConfigPanel>
        <ConfigPanel>
          <div className="flex items-center justify-between">
            <strong className="text-xs">Nodes</strong>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              title="Add node"
              aria-label="Add node"
              onClick={addNode}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
          {graph.nodes.map((node) => (
            <div className="grid grid-cols-[minmax(5rem,1fr)_4rem_4rem_auto] items-end gap-1.5" key={node.id}>
              <TextField
                value={node.label ?? node.id}
                onChange={(label) => patchNode(node.id, { label })}
                aria-label={`Label for node ${node.id}`}
                className="w-full"
              />
              <NumField value={node.x} min={7} max={93} onChange={(x) => patchNode(node.id, { x })} />
              <NumField value={node.y} min={9} max={88} onChange={(y) => patchNode(node.id, { y })} />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                title={`Delete ${node.id}`}
                aria-label={`Delete node ${node.id}`}
                onClick={() => removeNode(node.id)}
                disabled={graph.nodes.length === 1}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
        </ConfigPanel>
        <ConfigPanel>
          <div className="flex items-center justify-between">
            <strong className="text-xs">Edges</strong>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              title="Add edge"
              aria-label="Add edge"
              onClick={addEdge}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
          {graph.edges.map((edge) => (
            <div
              className="grid grid-cols-[minmax(4rem,1fr)_minmax(4rem,1fr)_4rem_auto] items-end gap-1.5"
              key={edge.id}
            >
              <SelectField
                value={edge.from}
                onChange={(from) => patchEdge(edge.id, { from })}
                options={nodeOptions}
                ariaLabel={`From node for edge ${edge.id}`}
              />
              <SelectField
                value={edge.to}
                onChange={(to) => patchEdge(edge.id, { to })}
                options={nodeOptions}
                ariaLabel={`To node for edge ${edge.id}`}
              />
              <NumField
                value={edge.weight ?? 1}
                min={0}
                onChange={(weight) => patchEdge(edge.id, { weight })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                title={`Delete ${edge.id}`}
                aria-label={`Delete edge ${edge.id}`}
                onClick={() =>
                  updateGraph({
                    ...graph,
                    edges: graph.edges.filter((item) => item.id !== edge.id),
                  })
                }
              >
                <Trash2 aria-hidden="true" />
              </Button>
              <div className="col-span-full">
                <BooleanField
                  checked={edge.directed ?? false}
                  onChange={(directed) => patchEdge(edge.id, { directed })}
                  label="Directed edge"
                />
              </div>
            </div>
          ))}
        </ConfigPanel>
      </div>
    </div>
  );
}
