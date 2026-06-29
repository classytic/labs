import { CycleLab } from "../geography/cycle-lab/preset.mjs";
import { z } from "zod";

//#region src/blocks/geography.d.ts
declare const CycleBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  preset: z.ZodDefault<z.ZodEnum<{
    custom: "custom";
    water: "water";
    rock: "rock";
    carbon: "carbon";
  }>>;
  challenge: z.ZodDefault<z.ZodEnum<{
    trace: "trace";
    "label-process": "label-process";
  }>>;
  nodes: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  edges: z.ZodOptional<z.ZodArray<z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** This domain's block specs + tag→component render map. */
declare const geographyBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  preset: z.ZodDefault<z.ZodEnum<{
    custom: "custom";
    water: "water";
    rock: "rock";
    carbon: "carbon";
  }>>;
  challenge: z.ZodDefault<z.ZodEnum<{
    trace: "trace";
    "label-process": "label-process";
  }>>;
  nodes: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    tone: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  edges: z.ZodOptional<z.ZodArray<z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const geographyComponents: {
  readonly Cycle: typeof CycleLab;
};
//#endregion
export { CycleBlock, geographyBlocks, geographyComponents };