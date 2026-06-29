import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/circuits/semiconductor/preset.d.ts
interface MosfetInsideProps {
  /** the p-channel mirror: n-substrate, p+ wells, holes form the channel, gate pulled below source. */
  pmos?: boolean;
  vth?: number;
  k?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function MosfetInsideLab({
  pmos,
  vth,
  k,
  title,
  prompt,
  ask,
  activity
}?: MosfetInsideProps): ReactNode;
interface PnJunctionProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function PnJunctionLab({
  title,
  prompt,
  ask,
  activity
}?: PnJunctionProps): ReactNode;
type DopeMode = 'intrinsic' | 'n' | 'p';
interface SiliconLatticeProps {
  /** doping the lab opens on (default 'intrinsic'). */
  mode?: DopeMode;
  /** initial temperature 0..1 (default 0.2). */
  temperature?: number;
  /** hide the doping toggle so the lab stays on one case (focused authoring). */
  lockDoping?: boolean;
  /** show the temperature slider (default true). */
  showTemperature?: boolean;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function SiliconLatticeLab({
  mode: mode0,
  temperature: temp0,
  lockDoping,
  showTemperature,
  title,
  prompt,
  ask,
  activity
}?: SiliconLatticeProps): ReactNode;
interface ConductionProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function ConductionLab({
  title,
  prompt,
  ask,
  activity
}?: ConductionProps): ReactNode;
interface HallProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function HallEffectLab({
  title,
  prompt,
  ask,
  activity
}?: HallProps): ReactNode;
interface BjtInsideProps {
  pnp?: boolean;
  beta?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function BjtInsideLab({
  pnp,
  beta,
  title,
  prompt,
  ask,
  activity
}?: BjtInsideProps): ReactNode;
//#endregion
export { BjtInsideLab, BjtInsideProps, ConductionLab, ConductionProps, HallEffectLab, HallProps, MosfetInsideLab, MosfetInsideProps, PnJunctionLab, PnJunctionProps, SiliconLatticeLab, SiliconLatticeProps };