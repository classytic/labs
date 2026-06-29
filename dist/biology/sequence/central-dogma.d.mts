import { ReactNode } from "react";

//#region src/biology/sequence/central-dogma.d.ts
interface CentralDogmaProps {
  dna?: string[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function CentralDogmaLab({
  dna,
  title,
  prompt,
  objectives
}: CentralDogmaProps): ReactNode;
//#endregion
export { CentralDogmaLab, CentralDogmaProps };