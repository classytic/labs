import { RegressionLab } from "../ml/regression/preset.mjs";
import { KMeansLab } from "../ml/kmeans/preset.mjs";
import { ClassifierThresholdLab } from "../ml/classifier/preset.mjs";
import { DecisionBoundaryLab } from "../ml/boundary/preset.mjs";
import { KNNBoundaryLab } from "../ml/knn/preset.mjs";
import { z } from "zod";

//#region src/blocks/ml.d.ts
declare const RegressionBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  data: z.ZodOptional<z.ZodArray<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>>;
  showSquares: z.ZodDefault<z.ZodBoolean>;
  learnRate: z.ZodDefault<z.ZodNumber>;
  m0: z.ZodDefault<z.ZodNumber>;
  b0: z.ZodDefault<z.ZodNumber>;
  span: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const KMeansBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  points: z.ZodOptional<z.ZodArray<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>>;
  k: z.ZodDefault<z.ZodNumber>;
  seeds: z.ZodOptional<z.ZodArray<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>>;
  span: z.ZodDefault<z.ZodNumber>;
  showLines: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ClassifierThresholdBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  positives: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
  negatives: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
  threshold: z.ZodDefault<z.ZodNumber>;
  span: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const DecisionBoundaryBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  dataset: z.ZodDefault<z.ZodEnum<{
    xor: "xor";
    separable: "separable";
    overlap: "overlap";
  }>>;
  seed: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const KnnBoundaryBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  dataset: z.ZodDefault<z.ZodEnum<{
    xor: "xor";
    blobs: "blobs";
    circles: "circles";
  }>>;
  k: z.ZodDefault<z.ZodNumber>;
  seed: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** This domain's block specs + tag→component render map. */
declare const mlBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  data: z.ZodOptional<z.ZodArray<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>>;
  showSquares: z.ZodDefault<z.ZodBoolean>;
  learnRate: z.ZodDefault<z.ZodNumber>;
  m0: z.ZodDefault<z.ZodNumber>;
  b0: z.ZodDefault<z.ZodNumber>;
  span: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  points: z.ZodOptional<z.ZodArray<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>>;
  k: z.ZodDefault<z.ZodNumber>;
  seeds: z.ZodOptional<z.ZodArray<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>>;
  span: z.ZodDefault<z.ZodNumber>;
  showLines: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  positives: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
  negatives: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
  threshold: z.ZodDefault<z.ZodNumber>;
  span: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  dataset: z.ZodDefault<z.ZodEnum<{
    xor: "xor";
    separable: "separable";
    overlap: "overlap";
  }>>;
  seed: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  dataset: z.ZodDefault<z.ZodEnum<{
    xor: "xor";
    blobs: "blobs";
    circles: "circles";
  }>>;
  k: z.ZodDefault<z.ZodNumber>;
  seed: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const mlComponents: {
  readonly Regression: typeof RegressionLab;
  readonly KMeans: typeof KMeansLab;
  readonly ClassifierThreshold: typeof ClassifierThresholdLab;
  readonly DecisionBoundary: typeof DecisionBoundaryLab;
  readonly KnnBoundary: typeof KNNBoundaryLab;
};
//#endregion
export { ClassifierThresholdBlock, DecisionBoundaryBlock, KMeansBlock, KnnBoundaryBlock, RegressionBlock, mlBlocks, mlComponents };