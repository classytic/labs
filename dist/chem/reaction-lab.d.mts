import { ReactNode } from "react";

//#region src/chem/reaction-lab.d.ts
interface ReactionLabProps {
  /** Labels for the two reactant atoms. */
  a?: string;
  b?: string;
  title?: string;
  height?: number;
}
declare function ReactionLab({
  a,
  b,
  title,
  height
}?: ReactionLabProps): ReactNode;
//#endregion
export { ReactionLab, ReactionLabProps };