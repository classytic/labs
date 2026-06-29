import { ReactNode } from "react";

//#region src/commerce/economics/elasticity-revenue.d.ts
interface ElasticityRevenueProps {
  pivot?: {
    p: number;
    q: number;
  };
  priceMax?: number;
  qtyMax?: number;
  anchorPresets?: Array<{
    label: string;
    slope: number;
  }>;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function ElasticityRevenueLab({
  pivot,
  priceMax,
  qtyMax,
  anchorPresets,
  title,
  prompt,
  height,
  objectives
}: ElasticityRevenueProps): ReactNode;
//#endregion
export { ElasticityRevenueLab, ElasticityRevenueProps };