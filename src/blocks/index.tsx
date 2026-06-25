/**
 * @classytic/labs/blocks — the AGGREGATE lesson-block registry.
 *
 * Each DOMAIN owns its own module (`./math`, `./physics`, `./chem`, `./circuits`,
 * `./geometry`, `./ict`, `./language`) holding that domain's `defineBlock` specs +
 * a `<domain>Blocks` array + a `<domain>Components` render map. Import a SINGLE
 * domain via `@classytic/labs/blocks/<domain>` to tree-shake — a consumer that only
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
export * from './physics.js';
export * from './math.js';
export * from './chem.js';
export * from './circuits.js';
export * from './geometry.js';
export * from './ict.js';
export * from './language.js';
export * from './accounting.js';
export * from './economics.js';
export * from './biology.js';
export * from './geography.js';
export * from './ml.js';
export * from './discrete.js';
export * from './statistics.js';
export * from './lesson.js';

// generic Zod-driven authoring panel — one editor config UI for any lab (UI layer).
// NOTE: agent/LLM tool registration is the consuming Node app's job, not this UI
// package's — the app imports the prop schemas (the contract) and builds + validates
// tools itself (z.toJSONSchema for raw APIs, or pass Zod to its AI SDK).
export { LabConfig, type LabConfigProps } from './lab-config.js';

// shared block-attr coercion (array attrs may round-trip from MDX as JSON strings).
export { coerceArray } from './authoring.js';

import { physicsBlocks, physicsComponents } from './physics.js';
import { mathBlocks, mathComponents } from './math.js';
import { chemBlocks, chemComponents } from './chem.js';
import { circuitsBlocks, circuitsComponents } from './circuits.js';
import { geometryBlocks, geometryComponents } from './geometry.js';
import { ictBlocks, ictComponents } from './ict.js';
import { languageBlocks, languageComponents } from './language.js';
import { accountingBlocks, accountingComponents } from './accounting.js';
import { economicsBlocks, economicsComponents } from './economics.js';
import { biologyBlocks, biologyComponents } from './biology.js';
import { geographyBlocks, geographyComponents } from './geography.js';
import { mlBlocks, mlComponents } from './ml.js';
import { discreteBlocks, discreteComponents } from './discrete.js';
import { statisticsBlocks, statisticsComponents } from './statistics.js';
import { lessonBlocks, lessonComponents } from './lesson.js';

/** Every lab block — pass to `<CmsBlockEditor blocks={labsBlocks}>` (slash menu). */
export const labsBlocks = [
  ...lessonBlocks,
  ...languageBlocks,
  ...physicsBlocks,
  ...mathBlocks,
  ...chemBlocks,
  ...circuitsBlocks,
  ...geometryBlocks,
  ...ictBlocks,
  ...accountingBlocks,
  ...economicsBlocks,
  ...biologyBlocks,
  ...geographyBlocks,
  ...mlBlocks,
  ...discreteBlocks,
  ...statisticsBlocks,
] as const;

/** MDX render map — merge into the host's `blockComponents` (tag → component).
 *  Tags match each block's `tag` so editor + player render the same component.
 *  Tags are unique across domains, so spread order is irrelevant. */
export const labsComponents = {
  ...lessonComponents,
  ...languageComponents,
  ...physicsComponents,
  ...mathComponents,
  ...chemComponents,
  ...circuitsComponents,
  ...geometryComponents,
  ...ictComponents,
  ...accountingComponents,
  ...economicsComponents,
  ...biologyComponents,
  ...geographyComponents,
  ...mlComponents,
  ...discreteComponents,
  ...statisticsComponents,
} as const;

// ── the visual lab PICKER (one slash command → this gallery → insert one lab) ──
export { LabGallery, type LabGalleryProps, type LabPickItem } from './lab-gallery.js';

/** Every lab tagged with its subject group, for `<LabGallery blocks={labGalleryItems}>`. */
export const labGalleryItems = [
  ...mathBlocks.map((b) => ({ ...b, group: 'Math' })),
  ...physicsBlocks.map((b) => ({ ...b, group: 'Physics' })),
  ...chemBlocks.map((b) => ({ ...b, group: 'Chemistry' })),
  ...biologyBlocks.map((b) => ({ ...b, group: 'Biology' })),
  ...circuitsBlocks.map((b) => ({ ...b, group: 'Circuits' })),
  ...geometryBlocks.map((b) => ({ ...b, group: 'Geometry' })),
  ...discreteBlocks.map((b) => ({ ...b, group: 'Discrete' })),
  ...statisticsBlocks.map((b) => ({ ...b, group: 'Statistics' })),
  ...ictBlocks.map((b) => ({ ...b, group: 'ICT' })),
  ...languageBlocks.map((b) => ({ ...b, group: 'Language' })),
  ...accountingBlocks.map((b) => ({ ...b, group: 'Accounting' })),
  ...economicsBlocks.map((b) => ({ ...b, group: 'Economics' })),
  ...geographyBlocks.map((b) => ({ ...b, group: 'Geography' })),
  ...mlBlocks.map((b) => ({ ...b, group: 'Machine learning' })),
];
