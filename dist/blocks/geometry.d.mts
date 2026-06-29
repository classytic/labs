import { GeometryBoard } from "../geometry/board/preset.mjs";
import { IntersectingCircles } from "../geometry/intersecting-circles.mjs";
import { z } from "zod";

//#region src/blocks/geometry.d.ts
declare const GeometryBoardBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  scene: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const IntersectingCirclesBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  r1: z.ZodOptional<z.ZodNumber>;
  r2: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const geometryBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  scene: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  r1: z.ZodOptional<z.ZodNumber>;
  r2: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const geometryComponents: {
  readonly GeometryBoard: typeof GeometryBoard;
  readonly IntersectingCircles: typeof IntersectingCircles;
};
//#endregion
export { GeometryBoardBlock, IntersectingCirclesBlock, geometryBlocks, geometryComponents };