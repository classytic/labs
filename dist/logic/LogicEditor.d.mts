import { LogicDoc } from "./contract.mjs";
import { ReactNode } from "react";

//#region src/logic/LogicEditor.d.ts
interface LogicEditorProps {
  value: LogicDoc;
  onChange: (doc: LogicDoc) => void;
}
declare function LogicEditor({
  value,
  onChange
}: LogicEditorProps): ReactNode;
//#endregion
export { LogicEditor, LogicEditorProps };