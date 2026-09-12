'use client';

/** Number-line runtime — adapter: default the range + start. */
import type { ReactNode } from 'react';
import { NumberLineLab } from '../../../math/number-line/index.js';

export default function NumberLine(a: Record<string, unknown>): ReactNode {
  return (
    <NumberLineLab
      min={typeof a.min === 'number' ? a.min : -8}
      max={typeof a.max === 'number' ? a.max : 8}
      start={typeof a.start === 'number' ? a.start : 0}
      target={a.target as number | undefined}
    />
  );
}
