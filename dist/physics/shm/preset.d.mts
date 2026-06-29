import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/shm/preset.d.ts
type SHMMode = 'spring' | 'pendulum';
interface SimpleHarmonicProps {
  mode?: SHMMode;
  /** Spring stiffness k (N/m). */
  k?: number;
  /** Pendulum length L (m). */
  length?: number;
  mass?: number;
  /** Amplitude: metres (spring) or degrees (pendulum). */
  amplitude?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Focus a lesson: set `mode` + `controlConfig:{ hide:['mode'] }` for spring-only or pendulum-only. */
  controlConfig?: ControlConfig;
}
declare function SimpleHarmonicLab({
  mode,
  k,
  length,
  mass,
  amplitude,
  title,
  prompt,
  objectives,
  controlConfig
}: SimpleHarmonicProps): ReactNode;
//#endregion
export { SHMMode, SimpleHarmonicLab, SimpleHarmonicProps };