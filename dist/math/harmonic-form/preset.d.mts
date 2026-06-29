import { ReactNode } from "react";

//#region src/math/harmonic-form/preset.d.ts
interface HarmonicFormProps {
  /** Coefficient of cos x. */
  a?: number;
  /** Coefficient of sin x. */
  b?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function HarmonicFormLab({
  a: a0,
  b: b0,
  title,
  prompt,
  objectives
}?: HarmonicFormProps): ReactNode;
//#endregion
export { HarmonicFormLab, HarmonicFormProps };