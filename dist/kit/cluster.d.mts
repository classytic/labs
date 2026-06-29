import { ReactNode } from "react";

//#region src/kit/cluster.d.ts
interface DotClusterProps {
  count: number;
  /** Highlight the last `highlight` items (e.g. the ones added this step). */
  highlight?: number;
  /** Diameter of the dish (px). */
  size?: number;
  color?: string;
  highlightColor?: string;
  /** Dish ring tint; set `emphasis` to draw the bold "current" ring. */
  emphasis?: boolean;
  /** Caption above (e.g. "Day 2"). */
  label?: string;
  /** Chip below (the value, or "?" while hidden). */
  value?: ReactNode;
}
declare function DotCluster({
  count,
  highlight,
  size,
  color,
  highlightColor,
  emphasis,
  label,
  value
}: DotClusterProps): ReactNode;
//#endregion
export { DotCluster, DotClusterProps };