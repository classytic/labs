'use client';

/** Gradient-descent runtime — adapter: default the surface equation + region. */
import type { ReactNode } from 'react';
import { GradientDescent } from '../../../math/gradient-descent.js';

export default function GradientDescentRuntime(a: Record<string, unknown>): ReactNode {
  const equation = typeof a.equation === 'string' && a.equation.trim() ? a.equation : 'x^2 + 2*y^2';
  const range = (a.range as [number, number] | undefined) ?? [-3, 3];
  return (
    <GradientDescent
      equation={equation}
      range={range}
      start={a.start as [number, number] | undefined}
      learningRate={a.learningRate as number | undefined}
      title={(a.title as string) ?? 'Gradient descent'}
    />
  );
}
