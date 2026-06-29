import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/circuits/cmos-gate/preset.d.ts
interface CmosInverterProps {
  vdd?: number;
  vth?: number;
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function CmosInverterLab({
  vdd,
  vth,
  show,
  title,
  prompt,
  ask,
  activity
}?: CmosInverterProps): ReactNode;
interface RNmosNotProps {
  vdd?: number;
  vth?: number;
  /** pull-up resistance (Ω). */
  rpull?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function RNmosNotLab({
  vdd,
  vth,
  rpull,
  title,
  prompt,
  ask,
  activity
}?: RNmosNotProps): ReactNode;
interface CmosNandProps {
  vdd?: number;
  vth?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function CmosNandLab({
  vdd,
  vth,
  title,
  prompt,
  ask,
  activity
}?: CmosNandProps): ReactNode;
interface CmosNorProps {
  vdd?: number;
  vth?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function CmosNorLab({
  vdd,
  vth,
  title,
  prompt,
  ask,
  activity
}?: CmosNorProps): ReactNode;
//#endregion
export { CmosInverterLab, CmosInverterProps, CmosNandLab, CmosNandProps, CmosNorLab, CmosNorProps, RNmosNotLab, RNmosNotProps };