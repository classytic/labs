import { LogicDoc } from "./contract.mjs";
import { PortRef } from "./edit-ops.mjs";
import { PointerEvent, ReactNode } from "react";

//#region src/logic/LogicEditScene.d.ts
interface LogicEditSceneProps {
  doc: LogicDoc;
  selectedId?: string;
  wireStart?: PortRef;
  /** cursor position (canvas coords) while a wire is pending: the rubber-band trails to it. */
  previewCursor?: {
    x: number;
    y: number;
  };
  onNodePointerDown?: (id: string, e: PointerEvent) => void;
  onPortPointerDown?: (ref: PortRef, e: PointerEvent) => void;
  onBackground?: () => void;
  ariaLabel?: string;
}
declare function LogicEditScene({
  doc,
  selectedId,
  wireStart,
  previewCursor,
  onNodePointerDown,
  onPortPointerDown,
  onBackground,
  ariaLabel
}: LogicEditSceneProps): ReactNode;
//#endregion
export { LogicEditScene, LogicEditSceneProps };