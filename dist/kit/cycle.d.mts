import { ReactNode } from "react";

//#region src/kit/cycle.d.ts
interface CycleNode {
  id: string;
  label: string;
  tone?: string;
}
interface CycleEdge {
  from: string;
  to: string;
  label?: string;
}
declare const edgeKey: (e: {
  from: string;
  to: string;
}) => string;
interface CycleDiagramProps {
  nodes: CycleNode[];
  edges: CycleEdge[];
  size?: number;
  activeId?: string | null;
  /** edge keys to render highlighted; defaults to the active node's outgoing edges. */
  litEdges?: ReadonlySet<string> | null;
  /** render this in place of each edge's default process-label pill (challenge slots). */
  edgeSlot?: (edge: CycleEdge, key: string, mid: {
    x: number;
    y: number;
  }) => ReactNode;
  onNodeClick?: (id: string) => void;
  ariaLabel?: string;
}
declare function CycleDiagram({
  nodes,
  edges,
  size,
  activeId,
  litEdges,
  edgeSlot,
  onNodeClick,
  ariaLabel
}: CycleDiagramProps): ReactNode;
//#endregion
export { CycleDiagram, CycleEdge, CycleNode, edgeKey };