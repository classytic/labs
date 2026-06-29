'use client';

/**
 * CycleDiagram, the shared directed-cycle renderer (single source of truth for
 * every "cycle" visual: water, rock, carbon, nitrogen…). Give it nodes + edges;
 * it lays the nodes evenly around a ring and draws each edge as a curved,
 * process-labelled arrow, ring-adjacent edges bow outward, shortcut/chord edges
 * bow to the left of travel so reciprocal arrows separate instead of overlapping.
 * Pure tokenized SVG, so it drops into any cycle lab. Highlight a node + its
 * outgoing edges via `activeId`; swap each process pill for a custom control via
 * `edgeSlot` (the label-the-process challenge uses this).
 */

import type { ReactNode } from 'react';
import { toRad } from '../core/util.js';

export interface CycleNode { id: string; label: string; tone?: string }
export interface CycleEdge { from: string; to: string; label?: string }

export const edgeKey = (e: { from: string; to: string }): string => `${e.from}->${e.to}`;

const TONES = ['var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-good)', 'var(--stage-warn)', 'var(--stage-danger)', 'var(--stage-muted)'];
const r2 = (n: number): number => Math.round(n * 100) / 100; // pin precision so SSR + client strings match

export interface CycleDiagramProps {
  nodes: CycleNode[];
  edges: CycleEdge[];
  size?: number;
  activeId?: string | null;
  /** edge keys to render highlighted; defaults to the active node's outgoing edges. */
  litEdges?: ReadonlySet<string> | null;
  /** render this in place of each edge's default process-label pill (challenge slots). */
  edgeSlot?: (edge: CycleEdge, key: string, mid: { x: number; y: number }) => ReactNode;
  onNodeClick?: (id: string) => void;
  ariaLabel?: string;
}

export function CycleDiagram({ nodes, edges, size = 340, activeId = null, litEdges = null, edgeSlot, onNodeClick, ariaLabel }: CycleDiagramProps): ReactNode {
  const c = size / 2;
  const R = size * 0.33;
  const nodeR = Math.max(16, Math.min(26, size * 0.075));
  const PAD = 46;
  const n = nodes.length || 1;

  const pos = new Map<string, { x: number; y: number; tone: string; label: string }>();
  nodes.forEach((nd, i) => {
    const a = toRad(-90 + (360 * i) / n);
    pos.set(nd.id, { x: r2(c + R * Math.cos(a)), y: r2(c + R * Math.sin(a)), tone: nd.tone ?? TONES[i % TONES.length]!, label: nd.label });
  });

  const idx = new Map(nodes.map((nd, i) => [nd.id, i]));
  const interactive = !!onNodeClick;
  const lit = litEdges ?? (activeId ? new Set(edges.filter((e) => e.from === activeId).map(edgeKey)) : null);

  const edgePaths: ReactNode[] = [];
  const slots: ReactNode[] = [];
  edges.forEach((e) => {
    const A = pos.get(e.from), B = pos.get(e.to);
    if (!A || !B) return;
    const key = edgeKey(e);
    const dx = B.x - A.x, dy = B.y - A.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const start = { x: r2(A.x + ux * nodeR), y: r2(A.y + uy * nodeR) };
    const end = { x: r2(B.x - ux * (nodeR + 7)), y: r2(B.y - uy * (nodeR + 7)) };
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;

    const ai = idx.get(e.from)!, bi = idx.get(e.to)!;
    const adjacent = (ai + 1) % n === bi || (bi + 1) % n === ai;
    let ctrl: { x: number; y: number };
    if (adjacent) {
      const ox = mx - c, oy = my - c, ol = Math.hypot(ox, oy) || 1;
      const bow = R * 0.18;
      ctrl = { x: r2(mx + (ox / ol) * bow), y: r2(my + (oy / ol) * bow) };
    } else {
      const bow = L * 0.18;
      ctrl = { x: r2(mx - uy * bow), y: r2(my + ux * bow) }; // left normal (-uy, ux)
    }

    const on = lit ? lit.has(key) : true;
    const dim = lit ? !on : false;
    const hot = on && !!lit;
    const col = hot ? 'var(--stage-accent)' : 'var(--stage-fg)';
    // arrowhead oriented along the curve tangent at the end (end − ctrl)
    const adx = end.x - ctrl.x, ady = end.y - ctrl.y, al = Math.hypot(adx, ady) || 1;
    const hx = adx / al, hy = ady / al, px = -hy, py = hx, ah = 7;
    const b1 = { x: r2(end.x - hx * ah + px * ah * 0.6), y: r2(end.y - hy * ah + py * ah * 0.6) };
    const b2 = { x: r2(end.x - hx * ah - px * ah * 0.6), y: r2(end.y - hy * ah - py * ah * 0.6) };

    edgePaths.push(
      <g key={key} opacity={dim ? 0.16 : 0.9}>
        <path d={`M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`} fill="none" stroke={col} strokeWidth={hot ? 2.6 : 1.8} />
        <polygon points={`${end.x},${end.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill={col} />
      </g>,
    );

    const bm = { x: r2(0.25 * start.x + 0.5 * ctrl.x + 0.25 * end.x), y: r2(0.25 * start.y + 0.5 * ctrl.y + 0.25 * end.y) };
    if (edgeSlot) {
      slots.push(<g key={`s-${key}`} opacity={dim ? 0.25 : 1}>{edgeSlot(e, key, bm)}</g>);
    } else if (e.label) {
      const w = e.label.length * 5.7 + 14;
      slots.push(
        <g key={`l-${key}`} opacity={dim ? 0.3 : 1}>
          <rect x={r2(bm.x - w / 2)} y={bm.y - 9} width={r2(w)} height={18} rx={9} fill="var(--stage-bg)" stroke={hot ? 'var(--stage-accent)' : 'var(--stage-grid)'} strokeWidth={1} />
          <text x={bm.x} y={bm.y} fill={hot ? 'var(--stage-accent)' : 'var(--stage-muted)'} fontSize={10.5} fontWeight={600} textAnchor="middle" dominantBaseline="central">{e.label}</text>
        </g>,
      );
    }
  });

  const nodeEls = nodes.map((nd) => {
    const p = pos.get(nd.id)!;
    const active = nd.id === activeId;
    const dim = activeId ? !active : false;
    return (
      <g key={nd.id} opacity={dim ? 0.45 : 1} style={{ cursor: interactive ? 'pointer' : 'default' }}
        onClick={interactive ? () => onNodeClick!(nd.id) : undefined}
        role={interactive ? 'button' : undefined} aria-label={interactive ? nd.label : undefined}>
        {active && <circle cx={p.x} cy={p.y} r={nodeR + 5} fill="none" stroke={p.tone} strokeWidth={2} opacity={0.5} />}
        <circle cx={p.x} cy={p.y} r={nodeR} fill={p.tone} stroke="var(--stage-bg)" strokeWidth={2} />
        <text x={p.x} y={r2(p.y + nodeR + 12)} fill="var(--stage-fg)" fontSize={11} fontWeight={700} textAnchor="middle">{p.label}</text>
      </g>
    );
  });

  return (
    <svg viewBox={`${-PAD} ${-PAD} ${size + 2 * PAD} ${size + 2 * PAD}`} width="100%" role="img" aria-label={ariaLabel} style={{ display: 'block', maxHeight: size + 2 * PAD }}>
      {edgePaths}
      {nodeEls}
      {slots}
    </svg>
  );
}
