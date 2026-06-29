import { SceneMeta } from "./scenes.mjs";

//#region src/kit/data-scene.d.ts
type DataSceneSpec = {
  name: string;
  label?: string;
  kind: 'count';
  icon: string;
} | {
  name: string;
  label?: string;
  kind: 'level';
  icon: string;
  slots?: number;
} | {
  name: string;
  label?: string;
  kind: 'level';
  shape: 'box' | 'cup' | 'circle';
  color?: string;
};
/** Build a registry scene from a data spec, no render code authored. */
declare function dataScene(spec: DataSceneSpec): SceneMeta;
/** Build AND register a data scene, so it appears in every lab + authoring picker. */
declare function registerDataScene(spec: DataSceneSpec): SceneMeta;
//#endregion
export { DataSceneSpec, dataScene, registerDataScene };