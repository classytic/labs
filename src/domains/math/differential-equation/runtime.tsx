'use client';
import type { ReactNode } from 'react';
import { DifferentialEquationExplorer } from '../../../math/differential-equation/index.js';

export default function DifferentialEquationRuntime(attributes: Record<string, unknown>): ReactNode {
  const equation =
    typeof attributes.equation === 'string' && attributes.equation.trim() ? attributes.equation : 'x - y';
  return (
    <DifferentialEquationExplorer
      equation={equation}
      xRange={(attributes.xRange as [number, number] | undefined) ?? [-3, 3]}
      yRange={(attributes.yRange as [number, number] | undefined) ?? [-3, 3]}
      initial={(attributes.initial as [number, number] | undefined) ?? [0, 1]}
      stepSize={attributes.stepSize as number | undefined}
      probe={attributes.probe as number | undefined}
      title={(attributes.title as string) ?? 'Trace a solution through a slope field'}
    />
  );
}
