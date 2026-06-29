import { ReactNode } from "react";

//#region src/physics/waves/preset.d.ts
type WaveMode = 'travelling' | 'superpose' | 'standing';
interface WaveLabProps {
  mode?: WaveMode;
  amplitude?: number;
  wavelength?: number;
  frequency?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function WaveLab({
  mode: mode0,
  amplitude,
  wavelength,
  frequency,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: WaveLabProps): ReactNode;
//#endregion
export { WaveLab, WaveLabProps, WaveMode };