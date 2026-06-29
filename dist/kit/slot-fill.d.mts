import { ReactNode } from "react";

//#region src/kit/slot-fill.d.ts
interface FillSlot {
  id: string;
  answer: string | number;
  /** Small caption under the blank (e.g. "Day 1"). */
  label?: ReactNode;
}
interface SlotFillState {
  filled: Record<string, string>;
  activeId: string | null;
  solved: boolean;
  wrong: {
    slot: string;
    tile: number;
  } | null;
  usedTiles: Set<number>;
  slots: FillSlot[];
  tiles: (string | number)[];
  /** Try to drop tile `i` into the active blank; wrong shakes + clears. */
  place: (tileIdx: number) => void;
  reset: () => void;
}
/** The headless engine: tile pool + per-slot grading + the shared checkpoint report. */
declare function useSlotFill(slots: FillSlot[], tiles: (string | number)[], activity: string, onSolved?: () => void): SlotFillState;
/** One inline blank, drops anywhere in a sentence/expression. Reads `fill` by slot id. */
declare function Blank({
  fill,
  id,
  width
}: {
  fill: SlotFillState;
  id: string;
  width?: number;
}): ReactNode;
/** The tile tray, tap a tile and it drops into the active blank. */
declare function SlotTray({
  fill
}: {
  fill: SlotFillState;
}): ReactNode;
interface SlotFillProps {
  slots: FillSlot[];
  /** The tile pool: the answers + a few distractors. Order is preserved. */
  tiles: (string | number)[];
  activity: string;
  prompt?: ReactNode;
  /** Fired once when every slot is correct (e.g. to reveal the figure values). */
  onSolved?: () => void;
}
/** Row layout: labelled blanks in a bordered strip + the tray. The common case. */
declare function SlotFill({
  slots,
  tiles,
  activity,
  prompt,
  onSolved
}: SlotFillProps): ReactNode;
//#endregion
export { Blank, FillSlot, SlotFill, SlotFillProps, SlotFillState, SlotTray, useSlotFill };