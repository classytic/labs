import { Pos } from "../deck.mjs";
import { ReactNode } from "react";

//#region src/language/sentence-builder/preset.d.ts
interface SentenceTile {
  text: string;
  pos?: Pos;
  /** Optional L1 gloss shown under the tile. */
  gloss?: string;
}
interface SentenceBuilderProps {
  /** Tiles in the CORRECT order. */
  tiles: SentenceTile[];
  /** The meaning / L1 sentence shown above (e.g. "আমি ভাত খাই"). */
  prompt?: string;
  /** Direction of the prompt text. */
  promptDir?: 'ltr' | 'rtl';
  /** Direction of the tiles' language (target). */
  targetDir?: 'ltr' | 'rtl';
  title?: string;
  hint?: string;
}
declare function SentenceBuilderLab({
  tiles,
  prompt,
  promptDir,
  targetDir,
  title,
  hint
}: SentenceBuilderProps): ReactNode;
//#endregion
export { SentenceBuilderLab, SentenceBuilderProps, SentenceTile };