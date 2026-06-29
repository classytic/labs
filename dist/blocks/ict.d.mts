import { PlaceValueDialLab } from "../ict/number-systems/place-value-dial.mjs";
import { BitGrouperLab } from "../ict/number-systems/bit-grouper.mjs";
import { BaseOdometerLab } from "../ict/number-systems/base-odometer.mjs";
import { LogicGateLab } from "../logic/lab.mjs";
import { BinaryDisplayLab } from "../logic/display.mjs";
import { LogicBuildLab } from "../logic/LogicBuildLab.mjs";
import { z } from "zod";

//#region src/blocks/ict.d.ts
declare const PlaceValueDialBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  base: z.ZodDefault<z.ZodNumber>;
  width: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
  showWeights: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const BitGrouperBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  width: z.ZodDefault<z.ZodNumber>;
  groupSize: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  showColor: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const BaseOdometerBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  max: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  race: z.ZodDefault<z.ZodBoolean>;
  speed: z.ZodDefault<z.ZodNumber>;
  highlightBase: z.ZodOptional<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const LogicGateBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  preset: z.ZodDefault<z.ZodEnum<{
    and: "and";
    or: "or";
    xor: "xor";
    "nand-not": "nand-not";
    "nand-and": "nand-and";
    "nand-or": "nand-or";
    "xor-nand": "xor-nand";
    "half-adder": "half-adder";
    "full-adder": "full-adder";
  }>>;
  mode: z.ZodDefault<z.ZodEnum<{
    predict: "predict";
    explore: "explore";
  }>>;
  steps: z.ZodDefault<z.ZodBoolean>;
  showTable: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const BinaryDisplayBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  bits: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const LogicBuilderBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  goal: z.ZodDefault<z.ZodEnum<{
    and: "and";
    or: "or";
    xor: "xor";
    "nand-not": "nand-not";
    "nand-and": "nand-and";
    "nand-or": "nand-or";
    "half-adder": "half-adder";
    "full-adder": "full-adder";
    sandbox: "sandbox";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ictBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  base: z.ZodDefault<z.ZodNumber>;
  width: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
  showWeights: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  width: z.ZodDefault<z.ZodNumber>;
  groupSize: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  showColor: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  max: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  race: z.ZodDefault<z.ZodBoolean>;
  speed: z.ZodDefault<z.ZodNumber>;
  highlightBase: z.ZodOptional<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  preset: z.ZodDefault<z.ZodEnum<{
    and: "and";
    or: "or";
    xor: "xor";
    "nand-not": "nand-not";
    "nand-and": "nand-and";
    "nand-or": "nand-or";
    "xor-nand": "xor-nand";
    "half-adder": "half-adder";
    "full-adder": "full-adder";
  }>>;
  mode: z.ZodDefault<z.ZodEnum<{
    predict: "predict";
    explore: "explore";
  }>>;
  steps: z.ZodDefault<z.ZodBoolean>;
  showTable: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  bits: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  goal: z.ZodDefault<z.ZodEnum<{
    and: "and";
    or: "or";
    xor: "xor";
    "nand-not": "nand-not";
    "nand-and": "nand-and";
    "nand-or": "nand-or";
    "half-adder": "half-adder";
    "full-adder": "full-adder";
    sandbox: "sandbox";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const ictComponents: {
  readonly PlaceValueDial: typeof PlaceValueDialLab;
  readonly BitGrouper: typeof BitGrouperLab;
  readonly BaseOdometer: typeof BaseOdometerLab;
  readonly LogicGate: typeof LogicGateLab;
  readonly BinaryDisplay: typeof BinaryDisplayLab;
  readonly LogicBuilder: typeof LogicBuildLab;
};
//#endregion
export { BaseOdometerBlock, BinaryDisplayBlock, BitGrouperBlock, LogicBuilderBlock, LogicGateBlock, PlaceValueDialBlock, ictBlocks, ictComponents };