/**
 * defineLab — the ONE canonical lab manifest (Phase-2 vertical slice).
 *
 * Today "make a lab" means editing 4+ places: a React component, a zod schema, a
 * `defineBlock` spec in a domain barrel, and (after a build) a generated catalog row
 * — and the lazy authoring path then throws the schema away as `z.any()`. A manifest
 * unifies all of that into ONE declaration that GENERATES the CMS block (with the REAL
 * schema, so authoring validates), the catalog metadata (with taxonomy for gallery
 * facets), and a PER-LAB lazy loader (one code-split chunk per lab, not per domain).
 *
 * This module is deliberately PURE — types + an identity factory, no React, no cms-ui,
 * no lab runtime. So a `manifest.ts` that imports `defineLab` stays a leaf: importing it
 * pulls neither the editor nor the heavy lab component. The component arrives only when
 * `loadRuntime()` is awaited — that dynamic import IS the per-lab chunk boundary.
 *
 * defineLab does NOT self-register into a module global (that was finding #6's bug);
 * manifests are composed EXPLICITLY in registry.ts.
 */

import type { z } from 'zod';
import type { ReactNode } from 'react';
import type { LabDomain } from '../blocks/catalog.js';

/** Discovery / decision metadata the gallery can facet + filter on (finding #7). */
export interface LabTaxonomy {
  /** School grades / year levels this suits (e.g. ['9', '10']). */
  grades?: string[];
  /** Curriculum outcomes / topics (e.g. ['kinematics', 'projectile-motion']). */
  outcomes?: string[];
  /** Rough time-on-task in minutes. */
  durationMinutes?: number;
  /** The dominant interaction shape. */
  interaction?: 'guided' | 'explorer' | 'predict' | 'build';
  /** How much authoring effort a good setup takes. */
  authorability?: 'simple' | 'moderate' | 'advanced';
  /** Feature as a starter / recommended lab. */
  starter?: boolean;
  /** The REPRESENTATIONAL level a concept is shown at — the same idea (e.g. a NAND) recurs across
   *  levels, so this places a lab on the abstraction ladder (number → boolean → gate → schematic →
   *  device → carrier) for coherent learning pathways. */
  representation?: LabRepresentation;
  /** Lab ids a learner should meet BEFORE this one (a pathway backbone). */
  prerequisites?: string[];
  /** Lab ids showing the same idea at an adjacent level / a sibling concept. */
  related?: string[];
}

/** The abstraction ladder a concept can be shown at (from most abstract to most physical). */
export type LabRepresentation =
  'number' | 'boolean' | 'gate' | 'schematic' | 'device' | 'carrier' | 'graph' | 'table';

/**
 * Portable teaching contract for a lab. This is deliberately metadata, not UI:
 * hosts can build their own lesson editor while the runtime stays independent.
 */
export interface LabLearningExperience {
  /** Observable learner outcomes, written as actions rather than topic labels. */
  objectives: string[];
  /** Phases the authored experience supports. Showcase labs should cover all five. */
  phases: Array<'predict' | 'act' | 'observe' | 'explain' | 'transfer'>;
  /** Response shapes a host author may use around the interactive model. */
  responses: Array<'choice' | 'numeric' | 'text' | 'ordering' | 'reflection'>;
  /** Non-visual and non-pointer routes supported by the runtime. */
  accessibility: {
    keyboard: boolean;
    textAlternative: boolean;
    reducedMotion: boolean;
  };
}

/**
 * The render component a lab's runtime chunk default-exports: attributes in, UI out. The
 * attrs are typed loosely on purpose — an engine-backed runtime often has REFINED props
 * (e.g. a discriminated union) that are a subtype of `z.infer<schema>`, which strict
 * function-param checking would reject. The schema stays the source of truth for the
 * authoring form + validation; the runtime just receives the validated attributes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LabRuntimeComponent = (attrs: any) => ReactNode;

/**
 * A CUSTOM authoring component (a visual editor richer than the schema-driven form) —
 * receives the current attributes + a patch callback, same contract as a block's editing UI.
 */
export type LabAuthoringComponent = (props: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) => ReactNode;

export interface LabManifest<S extends z.ZodObject = z.ZodObject> {
  /** kebab-case id (also the block key + MDX tag source). */
  id: string;
  domain: LabDomain;
  /** Display group in the gallery (e.g. 'Physics'). */
  group: string;
  title: string;
  description: string;
  /** MDX tag / Plate node type; defaults to PascalCase(id). */
  tag?: string;
  /** The lab's prop schema — the SINGLE source of truth (authoring form + validation). */
  schema: S;
  taxonomy: LabTaxonomy;
  /** Optional, host-neutral declaration of the learning experience this runtime supports. */
  experience?: LabLearningExperience;
  /**
   * Lazily load the render component (its own code-split chunk). MUST be a literal
   * dynamic import — `() => import('./runtime.js')` — so the bundler can split it and
   * the manifest module never statically pulls the component.
   */
  loadRuntime: () => Promise<{ default: LabRuntimeComponent }>;
  /**
   * Optional CUSTOM authoring UI (its own lazy chunk) for a visual editor the schema-driven
   * form can't express (e.g. a construction builder). When absent, editing shows the
   * auto-generated LabConfig form from `schema`.
   */
  loadAuthoring?: () => Promise<{ default: LabAuthoringComponent }>;
  /** Props to hide from the auto-generated authoring panel (bespoke UX handles them). */
  omit?: string[];
}

/**
 * Identity factory: validates the shape at the type level and returns the manifest
 * unchanged. Pure on purpose — see the module doc. Compose manifests in registry.ts.
 */
export function defineLab<S extends z.ZodObject>(manifest: LabManifest<S>): LabManifest<S> {
  return manifest;
}

/** PascalCase MDX tag from a kebab id (mirrors defineBlock's default). */
export function labTag(id: string): string {
  return id
    .split('-')
    .map((s) => (s ? s[0]!.toUpperCase() + s.slice(1) : ''))
    .join('');
}
