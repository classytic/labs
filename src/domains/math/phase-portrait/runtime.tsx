'use client';
import type { ReactNode } from 'react';
import { PhasePortraitExplorer } from '../../../math/phase-portrait/index.js';
export default function PhasePortraitRuntime(attributes: Record<string, unknown>): ReactNode {
  return (
    <PhasePortraitExplorer
      dx={(attributes.dx as string) || 'y'}
      dy={(attributes.dy as string) || '-x - 0.25*y'}
      xRange={(attributes.xRange as [number, number] | undefined) ?? [-4, 4]}
      yRange={(attributes.yRange as [number, number] | undefined) ?? [-4, 4]}
      initial={(attributes.initial as [number, number] | undefined) ?? [3, 0]}
      duration={attributes.duration as number | undefined}
      stepSize={attributes.stepSize as number | undefined}
      title={(attributes.title as string) ?? 'See a system evolve in state space'}
    />
  );
}
