import { ReactNode } from "react";

//#region src/physics/vector-board/view.d.ts
interface FlatVec {
  label?: string;
  dx?: number | string;
  dy?: number | string;
  color?: string;
  drag?: boolean;
}
interface VectorBoardViewProps {
  vectors?: FlatVec[];
  combine?: 'sum' | 'diff' | 'none';
  goalX?: number | string;
  goalY?: number | string;
  tol?: number;
  components?: boolean;
  angle?: boolean;
  parallelogram?: boolean;
  title?: string;
  prompt?: string;
  view?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  resultantLabel?: string;
  objectives?: string[];
  hints?: string[];
}
declare function VectorBoardView({
  vectors,
  combine,
  goalX,
  goalY,
  tol,
  components,
  angle,
  parallelogram,
  title,
  prompt,
  view,
  resultantLabel,
  objectives,
  hints
}: VectorBoardViewProps): ReactNode;
//#endregion
export { VectorBoardView };