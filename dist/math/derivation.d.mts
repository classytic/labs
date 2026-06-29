import { ReactNode } from "react";

//#region src/math/derivation.d.ts
interface DerivationStep {
  /** A LaTeX line, e.g. `\\frac{y - y_P}{x - x_P} = \\frac{y_Q - y_P}{x_Q - x_P}`. */
  tex: string;
  /** Why this step follows (shown beside the line). */
  note?: string;
}
interface DerivationProps {
  steps?: (DerivationStep | string)[];
  title?: string;
  /** Reveal all steps at once instead of stepping (e.g. for print/review). */
  showAll?: boolean;
}
declare function Derivation({
  steps,
  title,
  showAll
}?: DerivationProps): ReactNode;
//#endregion
export { Derivation, DerivationProps, DerivationStep };