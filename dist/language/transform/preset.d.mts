import { Pos } from "../deck.mjs";
import { ReactNode } from "react";

//#region src/language/transform/preset.d.ts
interface TransformTile {
  text: string;
  pos?: Pos;
  gloss?: string;
}
interface TransformProps {
  /** Source sentence tiles (correct order), shown read-only. */
  from: TransformTile[];
  /** Target sentence tiles (correct order), the learner rebuilds these. */
  to: TransformTile[];
  /** What to do, e.g. "Make it a question". */
  instruction?: string;
  /** One-line explanation shown on success. */
  note?: string;
  title?: string;
  targetDir?: 'ltr' | 'rtl';
}
declare function TransformLab({
  from,
  to,
  instruction,
  note,
  title,
  targetDir
}: TransformProps): ReactNode;
//#endregion
export { TransformLab, TransformProps, TransformTile };