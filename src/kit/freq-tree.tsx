'use client';

/**
 * FrequencyTree, a natural-frequency tree as an actual DIAGRAM (not a wall of
 * text): N splits into branches, each branch into sub-branches, with counts on
 * every node. Natural frequencies are the format research says makes conditional
 * probability click, so this is the shared readout under Bayes, conditional
 * probability, decision trees, authored as nested DATA.
 *
 * Pure pixel-space SVG figure; layout is automatic (leaves spaced evenly, parents
 * centered on their children) for any depth. Colours are tokens; `lit` flags a
 * leaf to emphasise (e.g. the "test positive" outcomes).
 */

import type { ReactNode } from 'react';

export interface FreqNode {
  /** Short descriptor (e.g. "disease", "test +"). */
  label: string;
  /** The natural-frequency count at this node. */
  count: number;
  /** Accent colour (tokens) for the node + its in-edge. */
  color?: string;
  /** Emphasise this leaf (filled chip). */
  lit?: boolean;
  children?: FreqNode[];
}

export interface FrequencyTreeProps {
  root: FreqNode;
  /** Total width in px. Default 360. */
  width?: number;
  ariaLabel?: string;
}

interface Placed { node: FreqNode; x: number; y: number; parent: number }

function countLeaves(n: FreqNode): number {
  return n.children?.length ? n.children.reduce((s, c) => s + countLeaves(c), 0) : 1;
}
function depth(n: FreqNode): number {
  return n.children?.length ? 1 + Math.max(...n.children.map(depth)) : 0;
}

export function FrequencyTree({ root, width = 360, ariaLabel = 'Natural-frequency tree' }: FrequencyTreeProps): ReactNode {
  const NODE_W = 88, NODE_H = 34, ROW = 46, PADY = 8, PADX = 4;
  const leaves = countLeaves(root);
  const levels = depth(root);
  const H = PADY * 2 + leaves * ROW;
  const colGap = levels > 0 ? (width - 2 * PADX - NODE_W) / levels : 0;

  // place: leaves get even rows; internal nodes center on their children
  const placed: Placed[] = [];
  let cursor = 0;
  const walk = (node: FreqNode, level: number, parent: number): number => {
    const idx = placed.length;
    placed.push({ node, x: PADX + level * colGap, y: 0, parent });
    let y: number;
    if (!node.children?.length) { y = PADY + (cursor + 0.5) * ROW; cursor++; }
    else { const ys = node.children.map((ch) => walk(ch, level + 1, idx)); y = (Math.min(...ys) + Math.max(...ys)) / 2; }
    placed[idx]!.y = y;
    return y;
  };
  walk(root, 0, -1);

  return (
    <svg viewBox={`0 0 ${width} ${H}`} style={{ width: '100%', maxWidth: width, height: 'auto' }} role="img" aria-label={ariaLabel}>
      {/* edges parent → child */}
      {placed.map((p, i) => {
        if (p.parent < 0) return null;
        const par = placed[p.parent]!;
        const x1 = par.x + NODE_W;
        const x2 = p.x;
        const mx = (x1 + x2) / 2;
        return <path key={`e${i}`} d={`M ${x1} ${par.y} C ${mx} ${par.y}, ${mx} ${p.y}, ${x2} ${p.y}`} fill="none" stroke={p.node.color ?? 'var(--stage-grid)'} strokeWidth={1.5} opacity={0.55} />;
      })}
      {/* nodes */}
      {placed.map((p, i) => {
        const accent = p.node.color ?? 'var(--stage-fg)';
        const fill = p.node.lit ? `color-mix(in oklab, ${accent} 26%, var(--stage-bg))` : 'color-mix(in oklab, var(--stage-fg) 5%, var(--stage-bg))';
        const stroke = p.node.color ?? 'var(--stage-grid)';
        return (
          <g key={`n${i}`}>
            <rect x={p.x} y={p.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={8} fill={fill} stroke={stroke} strokeWidth={p.node.lit ? 1.75 : 1} />
            <text x={p.x + 9} y={p.y - 2} fontSize={13} fontWeight={800} fill={accent} style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(p.node.count).toLocaleString()}</text>
            <text x={p.x + 9} y={p.y + 11} fontSize={9.5} fill="var(--stage-muted)">{p.node.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
