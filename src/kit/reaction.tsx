'use client';

/**
 * ReactionFlow — the shared reactants → products renderer (single source of truth
 * for reaction equations). Give it terms; it lays out coefficient + MoleculeGlyph
 * + "+" separators, a reaction arrow, then the products — as a self-contained,
 * responsive <svg>. Reused by photosynthesis, respiration, and the chemistry
 * reaction labs so every reaction speaks the same visual vocabulary.
 */

import type { ReactNode } from 'react';
import { MoleculeGlyph, type MoleculeKind } from './molecules.js';

export interface Term { kind: MoleculeKind; coef?: number }

export interface ReactionFlowProps {
  reactants: Term[];
  products: Term[];
  /** arrow direction (default forward →); 'left' draws ← for the reverse process. */
  arrow?: 'right' | 'left';
  height?: number;
  molSize?: number;
  ariaLabel?: string;
}

export function ReactionFlow({ reactants, products, arrow = 'right', height = 88, molSize = 30, ariaLabel }: ReactionFlowProps): ReactNode {
  const GAP = 10, PLUS = 22, ARROW = 58, PAD = 14, COEF = 14;
  const cy = height / 2 - 6;
  const nodes: ReactNode[] = [];
  let x = PAD;

  const place = (terms: Term[], key: string): void => {
    terms.forEach((t, i) => {
      const coef = t.coef ?? 1;
      if (coef > 1) { nodes.push(<text key={`${key}c${i}`} x={x} y={cy} fill="var(--stage-fg)" fontSize={14} fontWeight={700} textAnchor="middle" dominantBaseline="central">{coef}</text>); x += COEF; }
      nodes.push(<MoleculeGlyph key={`${key}m${i}`} kind={t.kind} x={x + molSize / 2} y={cy} size={molSize} showLabel />);
      x += molSize + GAP;
      if (i < terms.length - 1) { nodes.push(<text key={`${key}p${i}`} x={x} y={cy} fill="var(--stage-muted)" fontSize={18} fontWeight={700} textAnchor="middle" dominantBaseline="central">+</text>); x += PLUS; }
    });
  };

  place(reactants, 'r');
  const ax = x + 6;
  // arrow
  if (arrow === 'right') {
    nodes.push(<g key="arr"><line x1={ax} y1={cy} x2={ax + ARROW - 12} y2={cy} stroke="var(--stage-fg)" strokeWidth={2.5} /><polygon points={`${ax + ARROW - 4},${cy} ${ax + ARROW - 14},${cy - 5} ${ax + ARROW - 14},${cy + 5}`} fill="var(--stage-fg)" /></g>);
  } else {
    nodes.push(<g key="arr"><line x1={ax + 12} y1={cy} x2={ax + ARROW} y2={cy} stroke="var(--stage-fg)" strokeWidth={2.5} /><polygon points={`${ax + 4},${cy} ${ax + 14},${cy - 5} ${ax + 14},${cy + 5}`} fill="var(--stage-fg)" /></g>);
  }
  x += ARROW + 4;
  place(products, 'p');
  const W = x + PAD;

  // responsive: fills the container up to its natural width (never upscaled to a
  // giant), and on a narrow phone it stops shrinking at a legible floor and the
  // wrapper scrolls horizontally instead of going microscopic.
  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={ariaLabel} preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', height: 'auto', maxWidth: W, minWidth: Math.min(W, 300), margin: '0 auto' }}>
        {nodes}
      </svg>
    </div>
  );
}
