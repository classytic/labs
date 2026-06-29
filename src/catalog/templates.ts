/**
 * Register the built-in lab families. Importing this module imports each
 * preset's doc factory, which self-registers its stage asset, and adds the
 * family to the registry. New family = add one entry here.
 */

import { z } from 'zod';
import { registerLabTemplate } from './registry.js';
import { mysteryBucketDoc } from '../math/mystery-bucket/index.js';
import { balanceAlgebraDoc } from '../math/balance-algebra/index.js';
import { areaModelDoc } from '../math/area-model/index.js';
import { growingPatternDoc } from '../math/pattern/index.js';
import { leverBalanceDoc } from '../physics/lever/index.js';
import { opticsDoc } from '../physics/optics/index.js';
import { circuitDoc } from '../circuits/circuit/index.js';

/** Register all built-in families. Called from the catalog entry (a used import
 *  so the registrations are never tree-shaken). Idempotent. */
export function registerBuiltinTemplates(): void {
registerLabTemplate({
  id: 'mystery-bucket',
  title: 'Mystery bucket (weigh the unknown)',
  category: 'algebra',
  description: 'Add unit weights until a balance is level, discover the hidden weight (the unknown) with no symbols. The essentials opener.',
  paramsSchema: z.object({ bucketWeight: z.number(), maxWeights: z.number().optional() }),
  defaultParams: { bucketWeight: 5, maxWeights: 10 },
  factory: (p) => mysteryBucketDoc({ bucketWeight: (p.bucketWeight as number) ?? 5, count: 0, maxWeights: p.maxWeights as number | undefined }),
});

registerLabTemplate({
  id: 'balance-algebra',
  title: 'Balance scale (algebra)',
  category: 'algebra',
  description: 'Solve a·x + b = c by keeping a scale balanced.',
  paramsSchema: z.object({ coef: z.number(), addend: z.number(), rhs: z.number(), answer: z.number() }),
  defaultParams: { coef: 2, addend: 1, rhs: 7, answer: 3 },
  factory: (p) => balanceAlgebraDoc(p as { coef: number; addend: number; rhs: number; answer: number }),
});

registerLabTemplate({
  id: 'area-model',
  title: 'Area model (algebra tiles)',
  category: 'algebra',
  description: '(x+a)(x+b) as a partitioned rectangle, expand or factor.',
  paramsSchema: z.object({ a: z.number(), b: z.number(), mode: z.enum(['expand', 'factor']).optional() }),
  defaultParams: { a: 3, b: 2, mode: 'expand' },
  factory: (p) => areaModelDoc(p as { a: number; b: number; mode?: 'expand' | 'factor' }),
});

registerLabTemplate({
  id: 'growing-pattern',
  title: 'Pattern → formula',
  category: 'algebra',
  description: 'Find the rule a·n + b from a growing figure.',
  paramsSchema: z.object({ a: z.number(), b: z.number(), steps: z.number().optional() }),
  defaultParams: { a: 2, b: 3, steps: 4 },
  factory: (p) => growingPatternDoc(p as { a: number; b: number; steps?: number }),
});

registerLabTemplate({
  id: 'balance-lever',
  title: 'Lever / torque',
  category: 'physics',
  description: 'Balance the mobile, set the unknown weight so Σ(w·d) matches.',
  paramsSchema: z.object({ items: z.array(z.unknown()).optional(), start: z.number().optional(), maxWeight: z.number().optional() }),
  defaultParams: { start: 1, maxWeight: 12 },
  factory: (p) => leverBalanceDoc(p as Parameters<typeof leverBalanceDoc>[0]),
});

registerLabTemplate({
  id: 'optics',
  title: 'Optics: reflection',
  category: 'physics',
  description: 'Reflect a light ray off mirrors into the target.',
  defaultParams: {},
  factory: () => opticsDoc(),
});

registerLabTemplate({
  id: 'circuit',
  title: 'Circuit',
  category: 'circuits',
  description: 'Battery + series/parallel branches, light the bulb.',
  paramsSchema: z.object({ emf: z.number().optional(), branches: z.array(z.unknown()).optional() }),
  defaultParams: { emf: 6, branches: [[{ type: 'switch', closed: false }, { type: 'bulb', ohms: 6 }]], goal: { kind: 'lightBulb' } },
  factory: (p) => circuitDoc(p as Parameters<typeof circuitDoc>[0]),
});
}
