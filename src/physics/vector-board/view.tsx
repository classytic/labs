'use client';

/**
 * VectorBoard — block/MDX adapter.
 *
 * Authors declare vectors as flat rows (label/dx/dy/color/drag) + a target
 * (goalX/goalY); this maps that ergonomic shape onto the lab's typed
 * `{comp:{x,y}}` props. Lives with the vector-board domain (not the block
 * registry) so the mapping stays next to the lab it adapts.
 */

import type { ReactNode } from 'react';
import { VectorBoardLab, type BoardVector } from './preset.js';

export interface FlatVec { label?: string; dx?: number | string; dy?: number | string; color?: string; drag?: boolean }

export interface VectorBoardViewProps {
  vectors?: FlatVec[];
  combine?: 'sum' | 'diff' | 'none';
  goalX?: number | string;
  goalY?: number | string;
  tol?: number;
  components?: boolean;
  angle?: boolean;
  parallelogram?: boolean;
  title?: string;
  prompt?: string;
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  resultantLabel?: string;
  objectives?: string[];
  hints?: string[];
}

/** Default vectors for a freshly-inserted block. */
export const VECTOR_BOARD_DEMO: FlatVec[] = [
  { label: 'a', dx: 3, dy: 1, color: 'var(--stage-accent)', drag: true },
  { label: 'b', dx: 1, dy: 2, color: 'var(--stage-accent-2)', drag: true },
];

export function VectorBoardView({
  vectors, combine = 'sum', goalX, goalY, tol, components, angle, parallelogram, title, prompt, view, resultantLabel, objectives, hints,
}: VectorBoardViewProps): ReactNode {
  const vs: BoardVector[] = (vectors ?? []).map((v) => ({
    comp: { x: Number(v.dx) || 0, y: Number(v.dy) || 0 },
    label: v.label,
    color: v.color || undefined,
    drag: !!v.drag,
  }));
  const hasGoal = goalX !== undefined && goalX !== '' && goalY !== undefined && goalY !== '';
  const goal = hasGoal ? { match: { x: Number(goalX) || 0, y: Number(goalY) || 0 }, tol } : undefined;
  return (
    <VectorBoardLab
      view={view}
      vectors={vs}
      combine={combine}
      resultantLabel={resultantLabel}
      goal={goal}
      objectives={objectives}
      hints={hints}
      show={{ components, angle, parallelogram, magnitude: true }}
      title={title ?? 'Vectors'}
      prompt={prompt ?? (goal ? 'Drag the heads so the resultant lands on the target.' : 'Drag the arrow heads.')}
    />
  );
}
