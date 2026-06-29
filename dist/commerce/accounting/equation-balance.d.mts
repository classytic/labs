import { Account } from "./core.mjs";
import { ReactNode } from "react";

//#region src/commerce/accounting/equation-balance.d.ts
interface TxnEffect {
  account: string;
  delta: number;
}
interface Transaction {
  id: string;
  label: string;
  effects: TxnEffect[];
}
interface EquationBalanceProps {
  accounts?: Account[];
  transactions?: Transaction[];
  freePost?: boolean;
  start?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function EquationBalanceLab({
  accounts,
  transactions,
  freePost,
  start,
  title,
  prompt,
  height,
  objectives
}: EquationBalanceProps): ReactNode;
//#endregion
export { EquationBalanceLab, EquationBalanceProps, Transaction, TxnEffect };