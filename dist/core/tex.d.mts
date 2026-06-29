import { ReactNode } from "react";

//#region src/core/tex.d.ts
declare function Tex({
  tex,
  block,
  className
}: {
  tex: string;
  block?: boolean;
  className?: string;
}): ReactNode;
//#endregion
export { Tex };