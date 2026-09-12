/** GENERATED — literal per-domain authoring block loaders. */
import type { CmsBlock } from '@classytic/cms-ui/contract';
import type { LabDomain } from '../blocks/catalog.js';

export type DomainBlockLoader = () => Promise<CmsBlock[]>;
export const domainBlockLoaders: Record<LabDomain, DomainBlockLoader> = {
  'accounting': () => import('./block-sets/accounting.js').then((module) => module.blocks),
  'biology': () => import('./block-sets/biology.js').then((module) => module.blocks),
  'chem': () => import('./block-sets/chem.js').then((module) => module.blocks),
  'circuits': () => import('./block-sets/circuits.js').then((module) => module.blocks),
  'discrete': () => import('./block-sets/discrete.js').then((module) => module.blocks),
  'economics': () => import('./block-sets/economics.js').then((module) => module.blocks),
  'exam': () => import('./block-sets/exam.js').then((module) => module.blocks),
  'geography': () => import('./block-sets/geography.js').then((module) => module.blocks),
  'geometry': () => import('./block-sets/geometry.js').then((module) => module.blocks),
  'ict': () => import('./block-sets/ict.js').then((module) => module.blocks),
  'language': () => import('./block-sets/language.js').then((module) => module.blocks),
  'math': () => import('./block-sets/math.js').then((module) => module.blocks),
  'ml': () => import('./block-sets/ml.js').then((module) => module.blocks),
  'networking': () => import('./block-sets/networking.js').then((module) => module.blocks),
  'physics': () => import('./block-sets/physics.js').then((module) => module.blocks),
  'statistics': () => import('./block-sets/statistics.js').then((module) => module.blocks),
};
