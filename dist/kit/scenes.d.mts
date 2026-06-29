import { GuessTone } from "./vessel.mjs";
import { ReactNode } from "react";

//#region src/kit/scenes.d.ts
interface QuantityInput {
  /** 0..1 fill level (level scenes). */
  frac?: number;
  /** discrete count (count scenes). */
  count?: number;
  /** newly-added items to light up (count scenes). */
  highlight?: number;
  /** optional learner reading line, 0..1 (level scenes). */
  guessFrac?: number;
  guessTone?: GuessTone;
  color?: string;
  label?: string;
  width?: number;
  height?: number;
}
type QuantityScene = (q: QuantityInput) => ReactNode;
interface SceneMeta {
  name: string;
  kind: 'level' | 'count';
  label: string;
  render: QuantityScene;
}
declare function registerScene(meta: SceneMeta): void;
declare function getScene(name: string): SceneMeta | undefined;
declare function listScenes(kind?: 'level' | 'count'): SceneMeta[];
//#endregion
export { QuantityInput, QuantityScene, SceneMeta, getScene, listScenes, registerScene };