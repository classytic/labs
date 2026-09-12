'use client';

/** Genetic-cross runtime — adapter: resolve the authored `preset` to the lab's `spec`/`loci`
 *  (presets from the genetic-cross core; 'dihybrid' uses the two-locus model; 'custom' takes the
 *  authored spec). */
import type { ReactNode } from 'react';
import { GeneticCrossLab } from '../../../biology/genetic-cross/index.js';
import { CROSS_PRESETS, DIHYBRID_LOCI, type CrossPresetKey } from '../../../biology/genetic-cross/core.js';

export default function GeneticCross(a: Record<string, unknown>): ReactNode {
  const preset = (a.preset ?? 'blood-type') as CrossPresetKey | 'dihybrid' | 'custom';
  const dihybrid = preset === 'dihybrid';
  const spec = dihybrid
    ? undefined
    : preset === 'custom'
      ? (a.spec as never)
      : CROSS_PRESETS[preset as CrossPresetKey];
  return (
    <GeneticCrossLab
      spec={spec}
      loci={dihybrid ? DIHYBRID_LOCI : undefined}
      parent1={a.parent1 as string[] | undefined}
      parent2={a.parent2 as string[] | undefined}
      predictFirst={a.predictFirst as boolean | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
    />
  );
}
