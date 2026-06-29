import { ReactNode } from "react";

//#region src/physics/waves/string.d.ts
type StringMode = 'pulse' | 'resonance';
type EndType = 'fixed' | 'free';
interface StringReflectionProps {
  mode?: StringMode;
  end?: EndType;
  frequency?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function StringReflectionLab({
  mode: mode0,
  end: end0,
  frequency,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: StringReflectionProps): ReactNode;
//#endregion
export { EndType, StringMode, StringReflectionLab, StringReflectionProps };