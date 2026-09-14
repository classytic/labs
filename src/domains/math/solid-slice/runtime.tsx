'use client';

/** Solid-slice runtime — adapter: default the solid, its dimensions and which quantity is asked for. */
import type { ReactNode } from 'react';
import { SolidSliceLab } from '../../../math/solid-slice/index.js';

const num = (v: unknown, f: number): number => (typeof v === 'number' ? v : f);

export default function SolidSlice(a: Record<string, unknown>): ReactNode {
  return (
    <SolidSliceLab
      solid={a.solid === 'pyramid' ? 'pyramid' : 'cuboid'}
      length={num(a.length, 8)}
      width={num(a.width, 6)}
      height={num(a.height, 5)}
      target={
        a.target === 'face-diagonal' || a.target === 'line-plane-angle'
          ? a.target
          : 'space-diagonal'
      }
      yaw={num(a.yaw, 35)}
      lift={num(a.lift, 0)}
      unit={typeof a.unit === 'string' ? a.unit : 'cm'}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
