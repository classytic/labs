import { ReactNode } from "react";

//#region src/physics/carnot/preset.d.ts
interface CarnotProps {
  /** Initial hot-reservoir temperature, K (default 500). */
  hotK?: number;
  /** Initial cold-reservoir temperature, K (default 300). */
  coldK?: number;
  /** Default gas (learner can still toggle). */
  gas?: 'monatomic' | 'diatomic';
  /** Initial isothermal expansion ratio V₂/V₁ (default 2). */
  expansionRatio?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function CarnotCycleLab({
  hotK,
  coldK,
  gas,
  expansionRatio,
  title,
  prompt,
  objectives
}?: CarnotProps): ReactNode;
//#endregion
export { CarnotCycleLab, CarnotProps };