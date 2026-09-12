'use client';
import type { ReactNode } from 'react';
import { TaylorSeriesExplorer } from '../../../math/taylor-series/index.js';
export default function TaylorSeriesRuntime(attributes: Record<string, unknown>): ReactNode {
  const equation =
    typeof attributes.equation === 'string' && attributes.equation.trim() ? attributes.equation : 'sin(x)';
  return (
    <TaylorSeriesExplorer
      equation={equation}
      xRange={(attributes.xRange as [number, number] | undefined) ?? [-6.3, 6.3]}
      center={attributes.center as number | undefined}
      order={attributes.order as number | undefined}
      probe={attributes.probe as number | undefined}
      title={(attributes.title as string) ?? 'Build a function from its derivatives'}
    />
  );
}
