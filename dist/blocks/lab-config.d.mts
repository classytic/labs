import { ReactNode } from "react";
import { z } from "zod";

//#region src/blocks/lab-config.d.ts
interface LabConfigProps {
  schema: z.ZodType;
  value: Record<string, unknown>;
  /** Patch callback, same shape as a block's `updateAttributes`. */
  onChange: (patch: Record<string, unknown>) => void;
  /** Props to skip (e.g. ones a bespoke panel already handles). */
  omit?: string[];
  /** Internal: nested objects render without re-wrapping in a ConfigPanel. */
  flat?: boolean;
}
declare function LabConfig({
  schema,
  value,
  onChange,
  omit,
  flat
}: LabConfigProps): ReactNode;
//#endregion
export { LabConfig, LabConfigProps };