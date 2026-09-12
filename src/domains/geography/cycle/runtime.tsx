'use client';

/** Cycle runtime — adapter: resolve a preset (water/rock/carbon) to its nodes+edges, or use the
 *  authored custom graph, then render the ring. */
import type { ReactNode } from 'react';
import { CycleLab } from '../../../geography/cycle-lab/index.js';
import { CYCLE_PRESETS, type CyclePresetKey } from '../../../geography/cycles.js';

type CycleAttrs = {
  preset?: string;
  challenge?: 'trace' | 'label-process';
  nodes?: unknown;
  edges?: unknown;
  title?: string;
  prompt?: string;
  size?: number;
  objectives?: string[];
};

export default function Cycle(a: CycleAttrs): ReactNode {
  const preset = (a.preset ?? 'water') as CyclePresetKey | 'custom';
  const spec =
    preset === 'custom'
      ? {
          nodes: (Array.isArray(a.nodes) ? a.nodes : []) as never,
          edges: (Array.isArray(a.edges) ? a.edges : []) as never,
        }
      : CYCLE_PRESETS[preset];
  return (
    <CycleLab
      nodes={spec.nodes}
      edges={spec.edges}
      challenge={a.challenge}
      title={a.title}
      prompt={a.prompt}
      size={a.size}
      objectives={a.objectives}
    />
  );
}
