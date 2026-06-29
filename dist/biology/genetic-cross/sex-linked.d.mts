import { ReactNode } from "react";

//#region src/biology/genetic-cross/sex-linked.d.ts
interface SexLinkedCrossProps {
  allele?: string;
  dominant?: string;
  recessive?: string;
  mother?: [string, string];
  father?: string;
  predictFirst?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function SexLinkedCrossLab({
  allele,
  dominant,
  recessive,
  mother,
  father,
  predictFirst,
  title,
  prompt,
  objectives
}: SexLinkedCrossProps): ReactNode;
//#endregion
export { SexLinkedCrossLab, SexLinkedCrossProps };