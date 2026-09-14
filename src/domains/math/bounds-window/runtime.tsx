'use client';

/** Bounds-window runtime — adapter: default both measurements, their rounding units and the goal. */
import type { ReactNode } from 'react';
import { BoundsWindowLab } from '../../../math/bounds-window/index.js';

const num = (v: unknown, fallback: number): number => (typeof v === 'number' ? v : fallback);
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback);

export default function BoundsWindow(a: Record<string, unknown>): ReactNode {
  return (
    <BoundsWindowLab
      numerator={num(a.numerator, 120)}
      numeratorUnit={num(a.numeratorUnit, 10)}
      numeratorLabel={str(a.numeratorLabel, 'Distance')}
      numeratorSymbol={str(a.numeratorSymbol, 'm')}
      denominator={num(a.denominator, 16)}
      denominatorUnit={num(a.denominatorUnit, 1)}
      denominatorLabel={str(a.denominatorLabel, 'Time')}
      denominatorSymbol={str(a.denominatorSymbol, 's')}
      resultLabel={str(a.resultLabel, 'Speed')}
      resultSymbol={str(a.resultSymbol, 'm/s')}
      goal={a.goal === 'min' ? 'min' : 'max'}
      height={a.height as number | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
