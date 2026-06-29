import { ReactNode } from "react";

//#region src/circuits/ac-dc/preset.d.ts
type WaveMode = 'ac' | 'dc';
interface AcDcProps {
  startMode?: WaveMode;
  volts?: number;
  freqHz?: number;
}
declare function AcDcLab({
  startMode,
  volts: volts0,
  freqHz: freq0
}?: AcDcProps): ReactNode;
//#endregion
export { AcDcLab, AcDcProps };