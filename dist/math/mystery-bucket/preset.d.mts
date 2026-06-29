import { MYSTERY_BUCKET_ASSET } from "./asset.mjs";
import { ReactNode } from "react";
import { SceneDoc } from "@classytic/stage";

//#region src/math/mystery-bucket/preset.d.ts
interface MysteryBucketProps {
  /** The hidden weight inside EACH bucket (the unknown). 1–maxWeights. */
  bucketWeight?: number;
  /** How many identical buckets sit on the left pan (coefficients: 2 = "2x"). */
  bucketCount?: number;
  /** Most unit weights a learner can stack. */
  maxWeights?: number;
  /** Where the learner starts (units already on the pan). */
  start?: number;
  title?: string;
  prompt?: string;
  height?: number;
}
/** Params → a portable SceneDoc (the asset self-registers on import). */
declare function mysteryBucketDoc(params: {
  bucketWeight: number;
  count: number;
  bucketCount?: number;
  maxWeights?: number;
}): SceneDoc;
declare function MysteryBucketLab({
  bucketWeight,
  bucketCount,
  maxWeights,
  start,
  title,
  prompt,
  height
}?: MysteryBucketProps): ReactNode;
//#endregion
export { MysteryBucketLab, MysteryBucketProps, mysteryBucketDoc };