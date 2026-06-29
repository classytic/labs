import { BALANCE_ALGEBRA_ASSET } from "./asset.mjs";
import { ReactNode } from "react";
import { SceneDoc } from "@classytic/stage";

//#region src/math/balance-algebra/preset.d.ts
interface BalanceEquation {
  coef: number;
  addend: number;
  rhs: number;
  answer: number;
}
declare function balanceAlgebraDoc(eq: BalanceEquation): SceneDoc;
interface BalanceAlgebraProps {
  coef?: number;
  addend?: number;
  rhs?: number;
  answer?: number;
  controlId?: string;
  height?: number;
}
declare function BalanceAlgebraLab({
  coef,
  addend,
  rhs,
  answer,
  controlId,
  height
}: BalanceAlgebraProps): ReactNode;
//#endregion
export { BalanceAlgebraLab, BalanceAlgebraProps, BalanceEquation, balanceAlgebraDoc };