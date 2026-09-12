'use client';

/** Logic builder runtime — adapter: 'sandbox' is the open-canvas goal (no grading), so it maps
 *  to an undefined goal; a real preset ('half-adder', 'nand-and', …) grades against its table. */
import type { ReactNode } from 'react';
import { LogicBuildLab } from '../../../logic/LogicBuildLab.js';

export default function LogicBuilder(a: Record<string, unknown>): ReactNode {
  const goal = a.goal as string | undefined;
  const graded = goal && goal !== 'sandbox' ? goal : undefined;
  return (
    <LogicBuildLab
      goal={graded}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
