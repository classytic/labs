'use client';

/** Integral-explorer runtime — adapter: default the equation + x-window. */
import type { ReactNode } from 'react';
import { IntegralExplorer } from '../../../math/integral-explorer/index.js';

export default function IntegralExplorerRuntime(a: Record<string, unknown>): ReactNode {
  const equation = typeof a.equation === 'string' && a.equation.trim() ? a.equation : '0.4*x^2 + 0.5';
  const xRange = (a.xRange as [number, number] | undefined) ?? [-1, 4];
  return (
    <IntegralExplorer
      equation={equation}
      xRange={xRange}
      a={a.a as number | undefined}
      b={a.b as number | undefined}
      n={a.n as number | undefined}
      title={(a.title as string) ?? 'The integral is an area'}
    />
  );
}
