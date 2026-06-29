import { LabMeta, SceneDoc } from "@classytic/stage";
import { ZodTypeAny } from "zod";

//#region src/catalog/registry.d.ts
interface LabTemplate {
  /** Stable id, kebab-case (e.g. 'balance-algebra'). */
  id: string;
  /** Human title for the catalog. */
  title: string;
  /** Domain bucket, 'algebra' | 'calculus' | 'physics' | 'circuits' | … */
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
declare function registerLabTemplate(t: LabTemplate): void;
declare function listLabTemplates(): LabTemplate[];
declare function listLabTemplatesByCategory(category: string): LabTemplate[];
declare function getLabTemplate(id: string): LabTemplate | undefined;
/** Result of instantiating a template, typed errors before a bad scene is built. */
type InstantiateResult = {
  ok: true;
  doc: SceneDoc;
} | {
  ok: false;
  error: string;
  issues?: {
    path: string;
    message: string;
  }[];
};
/**
 * Validate params against the family's `paramsSchema` (zod), then build the
 * SceneDoc. Returns typed errors so a marketplace/authoring UI can surface bad
 * input WITHOUT producing a broken scene.
 */
declare function instantiateTemplate(id: string, params?: Record<string, unknown>): InstantiateResult;
//#endregion
export { LabTemplate, getLabTemplate, instantiateTemplate, listLabTemplates, listLabTemplatesByCategory, registerLabTemplate };