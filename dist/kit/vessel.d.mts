import { ReactNode } from "react";

//#region src/kit/vessel.d.ts
type GuessTone = 'idle' | 'ok' | 'no';
interface VesselGlyphProps {
  /** top-left x,y and size of the vessel bounding box (px). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** TRUE liquid level, 0..1 of the inner height. */
  fillFrac: number;
  /** liquid colour token. */
  color?: string;
  /** discrete objects piled at the bottom (count). */
  objects?: number;
  /** object colour token. */
  objectColor?: string;
  /** optional learner-reading dashed line, 0..1 of the inner height. */
  guessFrac?: number;
  /** colour the reading line by correctness. */
  guessTone?: GuessTone;
}
/** The pure <g> vessel, glass + liquid + objects + optional reading line. */
declare function VesselGlyph({
  x,
  y,
  w,
  h,
  fillFrac,
  color,
  objects,
  objectColor,
  guessFrac,
  guessTone
}: VesselGlyphProps): ReactNode;
interface VesselProps {
  width?: number;
  height?: number;
  /** TRUE liquid level, 0..1. */
  fillFrac: number;
  guessFrac?: number;
  guessTone?: GuessTone;
  objects?: number;
  liquidColor?: string;
  objectColor?: string;
  label?: string;
  /** draw a 0..max scale up the right side; pass the axis max + unit for readouts. */
  scaleMax?: number;
  scaleStep?: number;
  unit?: string;
}
/** Self-contained vessel (its own <svg>), drops in beside a graph as the concrete twin. */
declare function Vessel({
  width,
  height,
  fillFrac,
  guessFrac,
  guessTone,
  objects,
  liquidColor,
  objectColor,
  label,
  scaleMax,
  scaleStep,
  unit
}: VesselProps): ReactNode;
//#endregion
export { GuessTone, Vessel, VesselGlyph, VesselGlyphProps, VesselProps };