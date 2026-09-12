/**
 * @classytic/labs/blocks, the AGGREGATE lesson-block registry.
 *
 * Each DOMAIN owns its own module (`./math`, `./physics`, `./chem`, `./circuits`,
 * `./geometry`, `./ict`, `./language`) holding that domain's `defineBlock` specs +
 * a `<domain>Blocks` array + a `<domain>Components` render map. Import a SINGLE
 * domain via `@classytic/labs/blocks/<domain>` to tree-shake, a consumer that only
 * wants physics never pulls math/chem/circuits. This index just COMPOSES them all
 * (plus re-exports every individual block) for hosts that want the full set.
 *
 * Blocks are CONFIGURABLE in the editor: a spec's `Component` receives `mode` +
 * `updateAttributes`, so editing mode renders an authoring panel that writes back
 * to the block's attributes (round-tripped through MDX as JSON). `@classytic/cms-ui`
 * + `zod` are OPTIONAL peers touched only by this blocks layer.
 */

// Re-export every per-domain block spec + helper (back-compat: consumers that
// import an individual block like `CircuitBlock` keep working).
// Every science/math domain is fully migrated to the manifest model (src/domains/*) — the only
// remaining barrel is lesson (composite lesson blocks, not a lab domain).
export * from './lesson.js';

// generic Zod-driven authoring panel, one editor config UI for any lab (UI layer).
// NOTE: agent/LLM tool registration is the consuming Node app's job, not this UI
// package's, the app imports the prop schemas (the contract) and builds + validates
// tools itself (z.toJSONSchema for raw APIs, or pass Zod to its AI SDK).
export { LabConfig, type LabConfigProps } from './lab-config.js';

// shared block-attr coercion (array attrs may round-trip from MDX as JSON strings).
export { coerceArray } from './authoring.js';
// Tolerant parsing for authored MDX attributes (object literals, entity-escaped JSON). Hosts
// use it wherever they repair block nodes loaded from stored MDX.
export { parseAuthoredValue, parseAuthoredAttrs } from '../lab-def/attrs.js';

import { lessonBlocks, lessonComponents } from './lesson.js';
// Every lab is now a canonical manifest (real schema + per-lab lazy loader); the lesson blocks
// are the only remaining hand-authored blocks.
import { manifestBlocks, manifestComponents } from '../domains/blocks.js';

/** Every lab block, pass to `<CmsBlockEditor blocks={labsBlocks}>` (slash menu). */
export const labsBlocks = [...manifestBlocks, ...lessonBlocks];

/** MDX render map, merge into the host's `blockComponents` (tag → component).
 *  Tags match each block's `tag` so editor + player render the same component.
 *  Tags are unique across domains, so spread order is irrelevant. */
export const labsComponents = {
  ...lessonComponents,
  // Every migrated lab's tag→component (per-lab lazy runtime).
  ...manifestComponents,
};

// ── what a host's lab PICKER is built from ──
// The picker itself is the HOST's chrome (it belongs with the host's own kit and
// design language); this package ships the two pieces it composes: `labCatalog`
// metadata and `LazyLab`, which resolves one lab's Component lazily per domain.
// Both live in their own LIGHT modules so a host imports them WITHOUT this heavy
// barrel: `@classytic/labs/blocks/lazy` (LazyLab + lazyLabBlocks + labCatalog)
// and `@classytic/labs/blocks/catalog` (metadata only). Re-exported here for
// convenience / back-compat.
export { labCatalog, lazyLabBlocks, type LabCatalogEntry, type LabDomain } from './lazy.js';
