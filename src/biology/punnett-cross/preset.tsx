'use client';

/**
 * PunnettCrossLab, the 3:1 you can count. Now a thin MONOHYBRID preset of the
 * general GeneticCrossLab (single source of truth for all cross logic): it just
 * builds a simple dominant/recessive model from its props and forwards. Multiple
 * alleles, codominance (blood groups) and incomplete dominance live in the same
 * engine, see GeneticCrossLab.
 */

import { type ReactNode } from 'react';
import { GeneticCrossLab } from '../genetic-cross/index.js';
import { monohybridSpec } from '../genetic-cross/core.js';

export interface PunnettCrossProps {
  parent1?: string;          // e.g. "Aa"
  parent2?: string;
  dominantLabel?: string;    // phenotype shown by the dominant allele
  recessiveLabel?: string;
  alleleLetter?: string;     // e.g. "A"
  predictFirst?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

export function PunnettCrossLab({
  parent1 = 'Aa', parent2 = 'Aa', dominantLabel = 'tall', recessiveLabel = 'short', alleleLetter = 'A',
  predictFirst = true,
  title = 'The 3:1 you can count',
  prompt = 'Cross two parents: alleles segregate into gametes, recombine, and the ratio falls out.',
  objectives,
}: PunnettCrossProps): ReactNode {
  return (
    <GeneticCrossLab
      spec={monohybridSpec(alleleLetter, dominantLabel, recessiveLabel)}
      parent1={parent1.split('')}
      parent2={parent2.split('')}
      predictFirst={predictFirst}
      title={title}
      prompt={prompt}
      objectives={objectives}
    />
  );
}
