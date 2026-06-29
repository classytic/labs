import { Account } from "./core.mjs";
import { ReactNode } from "react";

//#region src/commerce/accounting/statement-sorter.d.ts
interface SortAccount extends Account {
  balance: number;
}
interface StatementSorterProps {
  accounts?: SortAccount[];
  asOfLabel?: string;
  showClosing?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function StatementSorterLab({
  accounts,
  asOfLabel,
  showClosing,
  title,
  prompt,
  objectives
}: StatementSorterProps): ReactNode;
//#endregion
export { SortAccount, StatementSorterLab, StatementSorterProps };