import { CircuitDoc } from "./contract.mjs";
import { ReactNode } from "react";

//#region src/build/CircuitPlayer.d.ts
interface CircuitPlayerProps {
  doc: CircuitDoc;
  flow?: boolean;
  ariaLabel?: string;
  /** notified after every tap with the new doc (e.g. to check a goal). */
  onChange?: (doc: CircuitDoc) => void;
}
declare function CircuitPlayer({
  doc: authored,
  flow,
  ariaLabel,
  onChange
}: CircuitPlayerProps): ReactNode;
//#endregion
export { CircuitPlayer, CircuitPlayerProps };