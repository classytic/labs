import { ReactNode } from "react";

//#region src/kit/rich.d.ts
declare function RichText({
  children
}: {
  children: string;
}): ReactNode;
//#endregion
export { RichText };