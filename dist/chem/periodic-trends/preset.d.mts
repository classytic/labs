import { ReactNode } from "react";

//#region src/chem/periodic-trends/preset.d.ts
type PropKey = 'radius' | 'ie' | 'en';
interface PeriodicTrendsProps {
  property?: PropKey;
  /** Symbol to highlight initially (e.g. 'Cl'). */
  highlight?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function PeriodicTrendsLab({
  property: prop0,
  highlight,
  title,
  prompt,
  objectives
}?: PeriodicTrendsProps): ReactNode;
//#endregion
export { PeriodicTrendsLab, PeriodicTrendsProps };