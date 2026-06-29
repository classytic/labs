import { Deck } from "../deck.mjs";
import { ReactNode } from "react";

//#region src/language/word-match/preset.d.ts
interface WordMatchProps {
  deck: Deck;
  /** How many pairs to show at once (default min(items, 6)). */
  count?: number;
  /** Right column: the translation text, or the item icon (kids/concrete). */
  show?: 'translation' | 'icon';
  title?: string;
  prompt?: string;
}
declare function WordMatchLab({
  deck,
  count,
  show,
  title,
  prompt
}: WordMatchProps): ReactNode;
//#endregion
export { WordMatchLab, WordMatchProps };