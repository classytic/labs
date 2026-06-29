import { ReactNode } from "react";

//#region src/discrete/sample-space/preset.d.ts
type Reduce = 'sum' | 'diff' | 'max' | 'min' | 'product' | 'same';
type Cmp = 'eq' | 'ge' | 'le' | 'gt' | 'lt';
interface SampleEvent {
  reduce?: Reduce;
  cmp?: Cmp;
  value?: number;
  favorable?: string[];
  label?: string;
}
interface SampleSpaceProps {
  dims?: [number] | [number, number];
  faces?: number[][];
  dice?: boolean;
  outcomes?: string[];
  event?: SampleEvent;
  mode?: 'explore' | 'target';
  showValue?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function SampleSpaceBoardLab({
  dims,
  faces,
  dice,
  outcomes,
  event,
  mode: mode0,
  showValue,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: SampleSpaceProps): ReactNode;
//#endregion
export { Cmp, Reduce, SampleEvent, SampleSpaceBoardLab, SampleSpaceProps };