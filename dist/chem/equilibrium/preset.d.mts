import { ReactNode } from "react";

//#region src/chem/equilibrium/preset.d.ts
interface LeChatelierProps {
  /** Reactant (left side, coefficient 1) name. */
  reactantName?: string;
  /** Product (right side) name. */
  productName?: string;
  /** Product stoichiometric coefficient ν (A ⇌ ν·B). */
  productCoeff?: number;
  /** Product colour token, the flask tints toward this as product forms. */
  productColor?: string;
  /** Reactant colour token. */
  reactantColor?: string;
  /** Equilibrium constant K = [B]^ν/[A] at room temperature. */
  K?: number;
  /** Is the forward reaction endothermic? (heating then favours the product). Default true. */
  endothermic?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function LeChatelierLab({
  reactantName,
  productName,
  productCoeff,
  productColor,
  reactantColor,
  K,
  endothermic,
  title,
  prompt,
  objectives
}?: LeChatelierProps): ReactNode;
//#endregion
export { LeChatelierLab, LeChatelierProps };