'use client';

/**
 * lazyLabBlocks — the full lab block set for `<CmsBlockEditor blocks={…}>`, but
 * derived from the authoritative manifest registry. Each manifest retains its own
 * runtime and authoring dynamic import, so registering the full set remains light.
 *
 * Why this reconstructs specs instead of importing them:
 *  - Every lab block is `void` (captured in the catalog) and uses the DEFAULT MDX
 *    attribute encoding (no custom toAttrs/fromAttrs in any lab), which auto-encodes
 *    every node prop regardless of schema — so a permissive `z.any()` schema here
 *    does NOT drop attributes on save; a lab's authored props round-trip as before.
 *  - `tag` (when non-default) and `void` come from the catalog, so tag→type naming
 *    and void self-closing round-trip identically.
 *
 * The learner/player side is unaffected — it uses the per-domain lazy `registry`
 * (see the host's mdx-editor registry), not this.
 */

import type { CmsBlock } from '@classytic/cms-ui/contract';
import { labCatalog, type LabCatalogEntry, type LabDomain } from './catalog.js';
import { manifestBlocks } from '../domains/blocks.js';
import { LazyLab, type LazyLabProps } from './lazy-resolve.js';

/** Every lab block for `<CmsBlockEditor blocks={…}>`: migrated labs (real schema + per-lab
 *  loader) then the still-generated labs. */
export const lazyLabBlocks: readonly CmsBlock[] = manifestBlocks;

/** The lab catalog: migrated labs are DERIVED from their manifests (with taxonomy); the rest
 *  are still the generated metadata. As labs migrate, the generated slice shrinks to nothing. */
// The host-facing lazy authoring surface from one light entry, so a host builds its
// own lab picker from the catalogue + `LazyLab` WITHOUT touching the heavy barrel.
export { labCatalog, LazyLab, type LabCatalogEntry, type LabDomain, type LazyLabProps };
