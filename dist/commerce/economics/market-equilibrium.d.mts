import { Curve } from "./core.mjs";
import { ReactNode } from "react";

//#region src/commerce/economics/market-equilibrium.d.ts
interface MarketEquilibriumProps {
  demand?: Curve;
  supply?: Curve;
  shiftControls?: {
    demand?: boolean;
    supply?: boolean;
  };
  priceMax?: number;
  qtyMax?: number;
  goodLabel?: string;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function MarketEquilibriumLab({
  demand,
  supply,
  shiftControls,
  priceMax,
  qtyMax,
  goodLabel,
  title,
  prompt,
  height,
  objectives
}: MarketEquilibriumProps): ReactNode;
//#endregion
export { MarketEquilibriumLab, MarketEquilibriumProps };