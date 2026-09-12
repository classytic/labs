'use client';

/** Interactive-problem runtime — adapter: coerce equations/params, default the windows, and pass
 *  the authored derive[] + ask straight to the engine (the manifest schema validated them). */
import type { ReactNode } from 'react';
import { InteractiveProblem, type Derived, type ProblemAsk } from '../../../math/interactive/index.js';
import { asExprStrings, asParams } from '../shared.js';

export default function InteractiveProblemRuntime(a: Record<string, unknown>): ReactNode {
  const xRange = (a.xRange as [number, number] | undefined) ?? [-6.5, 6.5];
  const yRange = (a.yRange as [number, number] | 'auto' | undefined) ?? 'auto';
  const derive = (Array.isArray(a.derive) ? a.derive : []) as unknown as Derived[];
  return (
    <InteractiveProblem
      equations={asExprStrings(a.equations)}
      params={asParams(a.params)}
      xRange={xRange}
      yRange={yRange}
      derive={derive}
      ask={a.ask as unknown as ProblemAsk}
      title={(a.title as string) ?? 'Interactive problem'}
      prompt={a.prompt as string | undefined}
      activity={(a.activity as string) ?? 'interactive-problem'}
    />
  );
}
