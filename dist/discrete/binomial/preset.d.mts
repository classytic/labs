import { ReactNode } from "react";

//#region src/discrete/binomial/preset.d.ts
interface BinomialProps {
  n?: number;
  p?: number;
  showNormal?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function BinomialDistributionLab({
  n: n0,
  p: p0,
  showNormal: sn0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: BinomialProps): ReactNode;
//#endregion
export { BinomialDistributionLab, BinomialProps };