import { ReactNode } from "react";
import { z } from "zod";

//#region src/blocks/lesson.d.ts
interface Choice {
  label: string;
  correct: boolean;
}
/** Render a predict-first question and report completion when answered correctly. */
declare function PredictWidget({
  prompt,
  choices,
  explain,
  title
}: {
  prompt?: string;
  choices?: Choice[];
  explain?: string;
  title?: string;
}): ReactNode;
declare const PredictBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  prompt: z.ZodDefault<z.ZodString>;
  choices: z.ZodDefault<z.ZodArray<z.ZodObject<{
    label: z.ZodString;
    correct: z.ZodBoolean;
  }, z.core.$strip>>>;
  explain: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const lessonBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  prompt: z.ZodDefault<z.ZodString>;
  choices: z.ZodDefault<z.ZodArray<z.ZodObject<{
    label: z.ZodString;
    correct: z.ZodBoolean;
  }, z.core.$strip>>>;
  explain: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const lessonComponents: {
  readonly Predict: typeof PredictWidget;
};
//#endregion
export { PredictBlock, PredictWidget, lessonBlocks, lessonComponents };