'use client';

/** Vector-board runtime — adapter: coerce array attrs (MDX may hand them back as JSON strings)
 *  then render the board view. VectorBoardView lives outside physics/index, imported directly. */
import type { ReactNode } from 'react';
import { VectorBoardView, type FlatVec } from '../../../physics/vector-board/view.js';
import { coerceArray } from '../../../blocks/authoring.js';

export default function VectorBoardLab(a: Record<string, unknown>): ReactNode {
  const vectors = coerceArray<FlatVec>(a.vectors);
  const objectives = coerceArray<string>(a.objectives);
  const hints = coerceArray<string>(a.hints);
  return (
    <VectorBoardView
      vectors={vectors}
      combine={a.combine as 'sum' | 'diff' | 'none' | undefined}
      goalX={a.goalX as number | string | undefined}
      goalY={a.goalY as number | string | undefined}
      components={a.components as boolean | undefined}
      angle={a.angle as boolean | undefined}
      objectives={objectives}
      hints={hints}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
