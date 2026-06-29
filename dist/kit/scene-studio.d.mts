import { DataSceneSpec } from "./data-scene.mjs";
import { ReactNode } from "react";

//#region src/kit/scene-studio.d.ts
interface SceneStudioProps {
  spec: DataSceneSpec;
  onChange: (spec: DataSceneSpec) => void;
}
declare function SceneStudio({
  spec,
  onChange
}: SceneStudioProps): ReactNode;
//#endregion
export { SceneStudio, SceneStudioProps };