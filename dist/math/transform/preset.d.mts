import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/math/transform/preset.d.ts
type TransformKind = 'translate' | 'reflect' | 'rotate' | 'enlarge';
type ReflectAxis = 'x' | 'y' | 'y=x' | 'y=-x';
interface Transform {
  kind: TransformKind;
  /** translate */
  by?: Vec2;
  /** reflect */
  axis?: ReflectAxis;
  /** rotate (deg, anticlockwise) */
  deg?: number;
  /** enlarge (scale factor) */
  k?: number;
  /** rotate/enlarge centre (default origin). */
  about?: Vec2;
}
interface TransformProps {
  /** The shape to transform (≥3 pts → filled polygon; else just points). */
  shape?: Vec2[];
  transform?: Transform;
  view?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  height?: number;
  /** Extra wrong tiles for the tray (translate). */
  distractors?: number[];
  title?: string;
  prompt?: string;
  activity?: string;
}
/** Apply a transform to a point. Pure, all from stage core math. */
declare function applyTf(p: Vec2, t: Transform): Vec2;
declare function TransformLab(props?: TransformProps): ReactNode;
//#endregion
export { ReflectAxis, Transform, TransformKind, TransformLab, TransformProps, applyTf };