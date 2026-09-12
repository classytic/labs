'use client';

/** Linear-system runtime — adapter: two scalar clue lines (slope-intercept) → the lab's lines[] API. */
import type { ReactNode } from 'react';
import { LinearSystemLab } from '../../../math/linear-system/index.js';

export default function LinearSystem(a: Record<string, unknown>): ReactNode {
  const m1 = typeof a.m1 === 'number' ? a.m1 : 1;
  const b1 = typeof a.b1 === 'number' ? a.b1 : 1;
  const m2 = typeof a.m2 === 'number' ? a.m2 : -1;
  const b2 = typeof a.b2 === 'number' ? a.b2 : 5;
  return (
    <LinearSystemLab
      lines={[
        { m: m1, b: b1, label: 'clue A' },
        { m: m2, b: b2, label: 'clue B' },
      ]}
    />
  );
}
