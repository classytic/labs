'use client';
import type { ReactNode } from 'react';
import { NewtonMethodExplorer } from '../../../math/newton-method/index.js';
export default function NewtonMethodRuntime(attributes: Record<string, unknown>): ReactNode {
  const equation =
    typeof attributes.equation === 'string' && attributes.equation.trim()
      ? attributes.equation
      : 'x^3 - x - 2';
  return (
    <NewtonMethodExplorer
      equation={equation}
      xRange={(attributes.xRange as [number, number] | undefined) ?? [-3, 3]}
      startX={attributes.startX as number | undefined}
      maxSteps={attributes.maxSteps as number | undefined}
      title={(attributes.title as string) ?? 'Find a root with tangents'}
    />
  );
}
