'use client';

/**
 * DERIVED blocks for the migrated labs (the cms-ui side of the registry): CMS blocks with
 * the REAL schema + per-lab lazy runtime. The learner render map (manifestComponents) lives
 * in the LIGHTER ./render (no cms-ui) and is re-exported here for convenience.
 */

import type { CmsBlock } from '@classytic/cms-ui/contract';
import { manifestToBlock } from '../lab-def/to-block.js';
import { labManifests } from './manifests.js';

export const manifestBlocks: CmsBlock[] = labManifests.map(manifestToBlock);

export { manifestComponents, manifestComponentsByKey } from './render.js';
