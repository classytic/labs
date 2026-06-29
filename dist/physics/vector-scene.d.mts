import { ReactNode } from "react";

//#region src/physics/vector-scene.d.ts
interface SceneVector {
  id: string;
  /** Base components (ignored if `combine` is set). */
  dx?: number;
  dy?: number;
  /** Anchor the tail at another vector's tip (tip-to-tail); default = origin. */
  from?: string;
  /** Derived: components = of[0] (op) of[1]. */
  combine?: {
    op: 'add' | 'sub';
    of: [string, string];
  };
  /** Drag the tip to set dx,dy (base vectors only). */
  draggable?: boolean;
  /** Show dashed x/y component decomposition. */
  components?: boolean;
  color?: string;
  label?: string;
}
interface VectorSceneProps {
  vectors?: SceneVector[];
  view?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  title?: string;
  height?: number;
}
declare function VectorScene({
  vectors,
  view,
  title,
  height
}?: VectorSceneProps): ReactNode;
//#endregion
export { SceneVector, VectorScene, VectorSceneProps };