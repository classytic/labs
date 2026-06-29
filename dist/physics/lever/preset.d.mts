import { BALANCE_LEVER_ASSET } from "./asset.mjs";
import { ReactNode } from "react";
import { SceneDoc } from "@classytic/stage";

//#region src/physics/lever/preset.d.ts
interface LeverItemSpec {
  side: 'L' | 'R';
  dist: number;
  weight: number | 'unknown';
}
interface LeverBalanceProps {
  items?: LeverItemSpec[];
  start?: number;
  maxWeight?: number;
  controlId?: string;
  height?: number;
}
declare function leverBalanceDoc({
  items,
  start,
  maxWeight
}: LeverBalanceProps): SceneDoc;
declare function LeverBalanceLab({
  items,
  start,
  maxWeight,
  controlId,
  height
}: LeverBalanceProps): ReactNode;
//#endregion
export { LeverBalanceLab, LeverBalanceProps, LeverItemSpec, leverBalanceDoc };