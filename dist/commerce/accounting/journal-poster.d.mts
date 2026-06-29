import { Account } from "./core.mjs";
import { ReactNode } from "react";

//#region src/commerce/accounting/journal-poster.d.ts
interface JournalTxn {
  id: string;
  prompt: string;
  debit: string;
  credit: string;
  amount: number;
}
interface JournalPosterProps {
  accounts?: Account[];
  transactions?: JournalTxn[];
  showTrialBalance?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function JournalPosterLab({
  accounts,
  transactions,
  showTrialBalance,
  title,
  prompt,
  objectives
}: JournalPosterProps): ReactNode;
//#endregion
export { JournalPosterLab, JournalPosterProps, JournalTxn };