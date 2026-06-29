import { CircuitDoc } from "./contract.mjs";
import { ReactNode } from "react";

//#region src/build/CircuitEditor.d.ts
interface CircuitEditorProps {
  value: CircuitDoc;
  onChange: (doc: CircuitDoc) => void;
}
declare function CircuitEditor({
  value,
  onChange
}: CircuitEditorProps): ReactNode;
//#endregion
export { CircuitEditor, CircuitEditorProps };