import { CenterSpreadLab } from "../statistics/center-spread/preset.mjs";
import { SequenceLab } from "../statistics/sequence/preset.mjs";
import { GaltonBoardLab } from "../statistics/galton/preset.mjs";
import { HistogramBoxLab } from "../statistics/histogram/preset.mjs";
import { NormalDistributionLab } from "../statistics/normal/preset.mjs";
import { ZTableLab } from "../statistics/z-table/preset.mjs";
import { SamplingDistributionLab } from "../statistics/sampling/preset.mjs";
import { z } from "zod";

//#region src/blocks/statistics.d.ts
declare const CenterSpreadBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
declare const SeriesBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
declare const GaltonBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
declare const HistogramBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
declare const NormalBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
declare const ZTableBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
declare const SamplingBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
declare const statisticsBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>];
declare const statisticsComponents: {
  readonly CenterSpread: typeof CenterSpreadLab;
  readonly Series: typeof SequenceLab;
  readonly GaltonBoard: typeof GaltonBoardLab;
  readonly HistogramBox: typeof HistogramBoxLab;
  readonly NormalDistribution: typeof NormalDistributionLab;
  readonly ZTable: typeof ZTableLab;
  readonly SamplingDistribution: typeof SamplingDistributionLab;
};
//#endregion
export { CenterSpreadBlock, GaltonBlock, HistogramBlock, NormalBlock, SamplingBlock, SeriesBlock, ZTableBlock, statisticsBlocks, statisticsComponents };