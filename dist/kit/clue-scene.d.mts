import { ReactNode } from "react";

//#region src/kit/clue-scene.d.ts
interface Unknown {
  /** symbol shown on chips (an emoji like 🍍 or a letter like x). */
  sym: string;
  label?: string;
  /** token colour for chips / buckets (default accent). */
  color?: string;
  /** the hidden value the learner solves for. */
  answer: number;
}
interface Clue {
  /** coefficient per unknown, aligned to the unknowns array (e.g. [2,1] → 2▲ + 1●). */
  coeffs: number[];
}
type ClueSceneKind = 'tiles' | 'receipt' | 'balance';
/** Total a clue evaluates to, given the unknowns' answers (kept consistent by construction). */
declare function clueTotal(clue: Clue, unknowns: Unknown[]): number;
/** A coloured token for an unknown (the reusable atom of every scene). */
declare function UnknownChip({
  u,
  size,
  withLabel
}: {
  u: Unknown;
  size?: number;
  withLabel?: boolean;
}): ReactNode;
interface SceneProps {
  clue: Clue;
  unknowns: Unknown[];
  currency?: string;
  unit?: string;
  store?: string;
}
/** Tiles: "2▲ + 1● = 12". Universal, reads as the equation it is. */
declare function ClueTiles({
  clue,
  unknowns,
  currency,
  unit
}: SceneProps): ReactNode;
/** Receipt: a shop bill listing quantities and the total (unit prices unknown). */
declare function ClueReceipt({
  clue,
  unknowns,
  currency,
  store
}: SceneProps): ReactNode;
/** Balance: buckets (one per coeff, coloured by type) on the left pan vs a weight on the right. */
declare function ClueBalance({
  clue,
  unknowns,
  unit
}: SceneProps): ReactNode;
/** Bar model (tape diagram): each clue is one bar of unit cells grouped by unknown = total. */
declare function ClueBar({
  clue,
  unknowns,
  currency,
  unit
}: SceneProps): ReactNode;
/** Coin piles: each unknown is a stack of coins (coloured by type) = a money total. */
declare function ClueCoins({
  clue,
  unknowns,
  currency
}: SceneProps): ReactNode;
interface ClueSceneMeta {
  name: string;
  label: string;
  render: (q: SceneProps) => ReactNode;
}
declare function registerClueScene(meta: ClueSceneMeta): void;
declare function getClueScene(name: string): ClueSceneMeta | undefined;
declare function listClueScenes(): ClueSceneMeta[];
/** Render one clue in the chosen scene (registry name). Creators extend via registerClueScene. */
declare function ClueScene({
  kind,
  ...rest
}: SceneProps & {
  kind: string;
}): ReactNode;
//#endregion
export { Clue, ClueBalance, ClueBar, ClueCoins, ClueReceipt, ClueScene, ClueSceneKind, ClueSceneMeta, ClueTiles, Unknown, UnknownChip, clueTotal, getClueScene, listClueScenes, registerClueScene };