export interface AlgorithmNode {
  id: string;
  label?: string;
  x: number;
  y: number;
}
export interface AlgorithmEdge {
  id: string;
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
}
export interface AlgorithmGraph {
  nodes: AlgorithmNode[];
  edges: AlgorithmEdge[];
}

export type AlgorithmEvent =
  | { type: 'start'; nodeId: string; message: string }
  | { type: 'visit-node'; nodeId: string; frontier: string[]; message: string }
  | { type: 'inspect-edge'; edgeId: string; from: string; to: string; message: string }
  | { type: 'discover-node'; nodeId: string; via: string; frontier: string[]; message: string }
  | { type: 'relax-edge'; edgeId: string; nodeId: string; previous: number; next: number; message: string }
  | { type: 'complete'; order: string[]; path?: string[]; message: string };

export interface AlgorithmTrace {
  algorithm: 'bfs' | 'dfs' | 'dijkstra';
  events: AlgorithmEvent[];
  order: string[];
  distance?: Record<string, number>;
  previous: Record<string, string | undefined>;
}

export interface DPCellEvent {
  type: 'set-cell';
  row: number;
  col: number;
  value: number;
  dependencies: [number, number][];
  message: string;
}

export interface DPTrace {
  rows: number;
  cols: number;
  table: number[][];
  events: DPCellEvent[];
}
