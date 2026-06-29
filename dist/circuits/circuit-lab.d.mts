import { ReactNode } from "react";

//#region src/circuits/circuit-lab.d.ts
interface CircuitLabProps {
  voltage?: number | string;
  r1?: number | string;
  r2?: number | string;
  mode?: 'series' | 'parallel';
  title?: string;
  height?: number;
}
declare function CircuitLab({
  voltage,
  r1,
  r2,
  mode: modeInit,
  height
}?: CircuitLabProps): ReactNode;
//#endregion
export { CircuitLab, CircuitLabProps };