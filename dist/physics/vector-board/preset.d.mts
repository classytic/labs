import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/physics/vector-board/preset.d.ts
interface BoardVector {
  id?: string;
  /** Tail anchor (default origin). */
  tail?: Vec2;
  /** Components (dx, dy) from the tail. */
  comp: Vec2;
  color?: string;
  label?: string;
  /** Head is draggable by the learner. */
  drag?: boolean;
}
interface VectorBoardProps {
  view?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  vectors: BoardVector[];
  /** sum → a+b+… resultant; diff → a−b (relative velocity); none → no resultant. */
  combine?: 'sum' | 'diff' | 'none';
  resultantLabel?: string;
  resultantColor?: string;
  show?: {
    components?: boolean;
    angle?: boolean;
    magnitude?: boolean;
    parallelogram?: boolean;
  };
  /** Drag-to-match: solved when the resultant lands within `tol` of `match`. */
  goal?: {
    match: Vec2;
    tol?: number;
  };
  /** Snap dragged heads to this grid (math units). */
  snap?: number;
  /** Learner-visible objectives (goal banner). */
  objectives?: string[];
  /** Progressive hints (each taken docks the score). */
  hints?: string[];
  title?: string;
  prompt?: string;
  height?: number;
}
declare function VectorBoardLab({
  view: viewProp,
  vectors,
  combine,
  resultantLabel,
  resultantColor,
  show,
  goal,
  snap,
  objectives,
  hints: hintList,
  title,
  prompt,
  height
}: VectorBoardProps): ReactNode;
//#endregion
export { BoardVector, VectorBoardLab, VectorBoardProps };