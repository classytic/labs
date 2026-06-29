import { IconValue } from "../icon.mjs";
import { ReactNode } from "react";

//#region src/language/preposition-scene/preset.d.ts
/** Spatial relations a creator can depict (positions the figure vs the landmark). */
type Relation = 'in' | 'on' | 'over' | 'above' | 'under' | 'below' | 'beside' | 'between' | 'behind' | 'infront' | 'at';
interface PrepItem {
  /** Text before the blank, e.g. "The bird is". */
  before: string;
  /** The noun phrase after the preposition, e.g. "the tree.". */
  noun: string;
  answer: string;
  options: string[];
  /** Spatial relation to depict (positions the figure vs the landmark). */
  scene: Relation;
  /** The figure being placed, an emoji string or an `IconRef`. Default a ball. */
  figure?: IconValue;
  /** The reference landmark, an emoji/`IconRef`, OR a backdrop key string
   *  ('sky'|'water'|'ground'|'room'). Default a box. */
  landmark?: IconValue;
  note?: string;
}
interface PrepositionProps {
  items: PrepItem[];
  title?: string;
  prompt?: string;
}
declare function PrepositionSceneLab({
  items,
  title,
  prompt
}: PrepositionProps): ReactNode;
//#endregion
export { PrepItem, PrepositionProps, PrepositionSceneLab, Relation };