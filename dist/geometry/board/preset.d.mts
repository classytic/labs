import { ReactNode } from "react";
import { SceneDoc, ViewBox } from "@classytic/stage";

//#region src/geometry/board/preset.d.ts
type View = ViewBox;
type GeoElement = {
  type: 'point';
  id: string;
  x: number;
  y: number;
  draggable?: boolean;
  label?: string;
  color?: string;
} | {
  type: 'circle';
  id: string;
  center: string;
  radius?: number;
  through?: string;
  color?: string;
} | {
  type: 'line';
  id?: string;
  through: [string, string];
  color?: string;
  dashed?: boolean;
} | {
  type: 'segment';
  id?: string;
  from: string;
  to: string;
  color?: string;
  label?: string;
  dashed?: boolean;
} | {
  type: 'intersect';
  id: string;
  of: [string, string];
  pick?: 0 | 1;
  label?: string;
  color?: string;
} | {
  type: 'midpoint';
  id: string;
  of: [string, string];
  label?: string;
  color?: string;
} | {
  type: 'measure';
  kind: 'distance';
  of: [string, string];
  label?: string;
};
interface GeometryBoardProps {
  scene?: GeoElement[];
  view?: View;
  title?: string;
  prompt?: string;
  subtitle?: string;
  height?: number;
}
/** Convert a declarative geometry construction into a portable SceneDoc. Stable
 *  ids (index-based for unnamed segments/lines/measures) keep resolve continuity. */
declare function geoSceneToDoc(scene: GeoElement[], view: View): SceneDoc;
declare function GeometryBoard({
  scene,
  view,
  title,
  prompt,
  height
}: GeometryBoardProps): ReactNode;
//#endregion
export { GeoElement, GeometryBoard, GeometryBoardProps, geoSceneToDoc };