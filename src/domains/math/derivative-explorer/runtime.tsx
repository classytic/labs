'use client';

/** Derivative-explorer runtime — adapter: default the equation + x-window. */
import type { ReactNode } from 'react';
import { DerivativeExplorer } from '../../../math/derivative-explorer/index.js';

export default function DerivativeExplorerRuntime(a: Record<string, unknown>): ReactNode {
  const equation = typeof a.equation === 'string' && a.equation.trim() ? a.equation : '0.15*x^3 - x';
  const xRange = (a.xRange as [number, number] | undefined) ?? [-4, 4];
  return (
    <DerivativeExplorer
      equation={equation}
      xRange={xRange}
      startX={a.startX as number | undefined}
      title={(a.title as string) ?? 'The derivative is a slope'}
    />
  );
}
