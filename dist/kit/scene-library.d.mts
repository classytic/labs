import { DataSceneSpec } from "./data-scene.mjs";
import { ReactNode } from "react";

//#region src/kit/scene-library.d.ts
declare function loadSceneLibrary(): DataSceneSpec[];
declare function saveSceneLibrary(specs: DataSceneSpec[]): void;
/** Bulk-register saved skins. Call once at app boot: registerScenes(loadSceneLibrary()). */
declare function registerScenes(specs: DataSceneSpec[]): void;
interface SceneLibrary {
  specs: DataSceneSpec[];
  upsert: (spec: DataSceneSpec, prevName?: string) => void;
  remove: (name: string) => void;
}
/** Load + register saved skins on mount; mutations persist and re-register. */
declare function useSceneLibrary(): SceneLibrary;
declare function SceneLibraryManager({
  onUse
}: {
  onUse?: (spec: DataSceneSpec) => void;
}): ReactNode;
//#endregion
export { SceneLibrary, SceneLibraryManager, loadSceneLibrary, registerScenes, saveSceneLibrary, useSceneLibrary };