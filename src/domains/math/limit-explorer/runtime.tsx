'use client';

/** Limit-explorer runtime — adapter: default the equation + x-window. */
import type { ReactNode } from 'react';
import { LimitExplorer } from '../../../math/limit-explorer/index.js';

export default function LimitExplorerRuntime(a: Record<string, unknown>): ReactNode {
  const equation = typeof a.equation === 'string' && a.equation.trim() ? a.equation : '(x^2 - 1)/(x - 1)';
  const xRange = (a.xRange as [number, number] | undefined) ?? [-1, 3];
  return (
    <LimitExplorer
      equation={equation}
      xRange={xRange}
      c={a.c as number | undefined}
      title={(a.title as string) ?? 'Approaching a limit'}
    />
  );
}
