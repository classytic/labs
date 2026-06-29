import { ReceiptItem } from "../../kit/receipt.mjs";
import { ReactNode } from "react";

//#region src/math/receipt/preset.d.ts
interface ReceiptProps {
  store?: string;
  items?: ReceiptItem[];
  currency?: string;
  /** Which totals to ask for. Default both. */
  ask?: {
    items?: boolean;
    cost?: boolean;
  };
  /** Extra wrong tiles (numbers for items, e.g. 18; pass cost ones as "$16"). */
  distractors?: (string | number)[];
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function ReceiptLab(props?: ReceiptProps): ReactNode;
//#endregion
export { ReceiptLab, ReceiptProps };