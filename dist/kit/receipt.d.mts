import { ReactNode } from "react";

//#region src/kit/receipt.d.ts
interface ReceiptItem {
  qty: number;
  name: string;
  /** unit price. */
  unit: number;
}
interface ReceiptSceneProps {
  store?: string;
  items: ReceiptItem[];
  currency?: string;
  /** show the computed total-items value (else "—"). */
  revealItems?: boolean;
  /** show the computed total-cost value (else "—"). */
  revealCost?: boolean;
  width?: number;
}
declare function ReceiptScene({
  store,
  items,
  currency,
  revealItems,
  revealCost,
  width
}: ReceiptSceneProps): ReactNode;
//#endregion
export { ReceiptItem, ReceiptScene, ReceiptSceneProps };