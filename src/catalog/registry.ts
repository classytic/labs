/**
 * Lab-template registry — the "marketplace" of reusable lab families.
 *
 * A template is a pedagogical FAMILY (balance-algebra, area-model, circuit, …):
 * a params schema + defaults + a factory that produces a portable SceneDoc, plus
 * optional pedagogy. Authoring = pick a template → tweak params → get a SceneDoc
 * (which the authoring kit then refines). Adding a "new lab" = register one
 * family, not new plumbing. Parallel to stage's asset registry; lives in labs
 * (the domain layer) because templates ARE the sellable/listable units.
 */

import type { SceneDoc, LabMeta } from '@classytic/stage';
import type { ZodTypeAny } from 'zod';

export interface LabTemplate {
  /** Stable id, kebab-case (e.g. 'balance-algebra'). */
  id: string;
  /** Human title for the catalog. */
  title: string;
  /** Domain bucket — 'algebra' | 'calculus' | 'physics' | 'circuits' | … */
  category: string;
  /** One-line description for the catalog card. */
  description?: string;
  /** Zod schema validating the creator-facing params (optional). */
  paramsSchema?: ZodTypeAny;
  /** Params used when a creator first inserts the template. */
  defaultParams: Record<string, unknown>;
  /** Params → a portable SceneDoc (the asset self-registers on factory import). */
  factory: (params: Record<string, unknown>) => SceneDoc;
  /** Default pedagogy carried into the SceneDoc.meta. */
  pedagogy?: LabMeta;
}

const TEMPLATES = new Map<string, LabTemplate>();

export function registerLabTemplate(t: LabTemplate): void {
  TEMPLATES.set(t.id, t);
}

export function listLabTemplates(): LabTemplate[] {
  return [...TEMPLATES.values()];
}

export function listLabTemplatesByCategory(category: string): LabTemplate[] {
  return listLabTemplates().filter((t) => t.category === category);
}

export function getLabTemplate(id: string): LabTemplate | undefined {
  return TEMPLATES.get(id);
}

/** Result of instantiating a template — typed errors before a bad scene is built. */
export type InstantiateResult =
  | { ok: true; doc: SceneDoc }
  | { ok: false; error: string; issues?: { path: string; message: string }[] };

/**
 * Validate params against the family's `paramsSchema` (zod), then build the
 * SceneDoc. Returns typed errors so a marketplace/authoring UI can surface bad
 * input WITHOUT producing a broken scene.
 */
export function instantiateTemplate(id: string, params?: Record<string, unknown>): InstantiateResult {
  const t = TEMPLATES.get(id);
  if (!t) return { ok: false, error: `Unknown template: ${id}` };
  const merged = { ...t.defaultParams, ...(params ?? {}) };
  if (t.paramsSchema) {
    const parsed = t.paramsSchema.safeParse(merged);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      return { ok: false, error: `Invalid params for "${id}": ${issues.map((i) => `${i.path || '(root)'} ${i.message}`).join('; ')}`, issues };
    }
  }
  const doc = t.factory(merged);
  if (t.pedagogy && !doc.meta?.pedagogy) doc.meta = { ...doc.meta, pedagogy: t.pedagogy };
  return { ok: true, doc };
}
