import { MarketEquilibriumLab } from "../commerce/economics/market-equilibrium.mjs";
import { ElasticityRevenueLab } from "../commerce/economics/elasticity-revenue.mjs";
import { DemandShiftVsMoveLab } from "../commerce/economics/demand-shift-vs-move.mjs";
import { z } from "zod";

//#region src/blocks/economics.d.ts
declare const MarketEquilibriumBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  demandIntercept: z.ZodDefault<z.ZodNumber>;
  demandSlope: z.ZodDefault<z.ZodNumber>;
  supplyIntercept: z.ZodDefault<z.ZodNumber>;
  supplySlope: z.ZodDefault<z.ZodNumber>;
  shiftDemand: z.ZodDefault<z.ZodBoolean>;
  shiftSupply: z.ZodDefault<z.ZodBoolean>;
  goodLabel: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ElasticityRevenueBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  pivotP: z.ZodDefault<z.ZodNumber>;
  pivotQ: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const DemandShiftVsMoveBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  askPrediction: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** This domain's block specs + tag→component render map. */
declare const economicsBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  demandIntercept: z.ZodDefault<z.ZodNumber>;
  demandSlope: z.ZodDefault<z.ZodNumber>;
  supplyIntercept: z.ZodDefault<z.ZodNumber>;
  supplySlope: z.ZodDefault<z.ZodNumber>;
  shiftDemand: z.ZodDefault<z.ZodBoolean>;
  shiftSupply: z.ZodDefault<z.ZodBoolean>;
  goodLabel: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  pivotP: z.ZodDefault<z.ZodNumber>;
  pivotQ: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  askPrediction: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const economicsComponents: {
  readonly MarketEquilibrium: typeof MarketEquilibriumLab;
  readonly ElasticityRevenue: typeof ElasticityRevenueLab;
  readonly DemandShiftVsMove: typeof DemandShiftVsMoveLab;
};
//#endregion
export { DemandShiftVsMoveBlock, ElasticityRevenueBlock, MarketEquilibriumBlock, economicsBlocks, economicsComponents };