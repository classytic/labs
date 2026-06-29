import { CircuitDoc } from "./contract.mjs";
import { PointerEvent, ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/build/CircuitScene.d.ts
interface CircuitEditorBag {
  /** draw a small handle at every pin terminal (for wiring). */
  showPins?: boolean;
  /** a part body was clicked (select it). */
  onSelect?: (partId: string) => void;
  /** the pin a pending wire starts from (highlighted). */
  wireStart?: {
    partId: string;
    pin: string;
  };
  /** pointer went down on a part body (begin a drag). */
  onPartPointerDown?: (partId: string, e: PointerEvent) => void;
  /** pointer went down on a pin: a click wires it, a drag moves the part (click-vs-drag). */
  onPinPointerDown?: (partId: string, pin: string, e: PointerEvent) => void;
  /** a wire edge was clicked (select / branch / delete — the editor decides). */
  onWireClick?: (wireId: string) => void;
  /** highlight one wire as selected. */
  selectedWireId?: string;
  /** pointer went down on the BODY of the selected wire (grab to bend / reroute it). */
  onWireBodyDown?: (wireId: string, e: PointerEvent) => void;
  /** pointer went down on an existing bend handle (drag to move that bend). */
  onWireWaypointDown?: (wireId: string, index: number, e: PointerEvent) => void;
  /** pointer went down on a wire's endpoint ring (drag to detach / re-target that end). */
  onWireEndDown?: (wireId: string, end: 'a' | 'b', e: PointerEvent) => void;
  /** the empty canvas was pressed (clear selection, or drop a routing bend while drawing). */
  onBackground?: (e: PointerEvent) => void;
  /** live rubber-band while drawing a wire: origin terminal → any dropped bends → the cursor. */
  wirePreview?: {
    from: Vec2;
    mids?: Vec2[];
    to: Vec2;
    valid?: boolean;
  };
}
interface CircuitSceneProps {
  doc: CircuitDoc;
  /** show moving charge dots on live wires (default true). */
  flow?: boolean;
  ariaLabel?: string;
  /** when set, tappable parts (e.g. switches) are clickable and call this with the part id. */
  onPartTap?: (partId: string) => void;
  /** highlight one part as selected (authoring). */
  selectedId?: string;
  /** authoring affordances; omit for the read-only / learner view. */
  editor?: CircuitEditorBag;
}
declare function CircuitScene({
  doc,
  flow,
  ariaLabel,
  onPartTap,
  selectedId,
  editor
}: CircuitSceneProps): ReactNode;
//#endregion
export { CircuitEditorBag, CircuitScene, CircuitSceneProps };