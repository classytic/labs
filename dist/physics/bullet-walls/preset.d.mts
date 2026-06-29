import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/bullet-walls/preset.d.ts
interface BulletWallsProps {
  speed?: number;
  /** Energy a single plank drains, expressed as the v² it removes (m²/s²). */
  toughness?: number;
  planks?: number;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide any knob, e.g. `{ lock: ['plank toughness'] }` to fix the toughness. */
  controlConfig?: ControlConfig;
}
declare function BulletWallsLab({
  speed,
  toughness,
  planks,
  mass,
  title,
  prompt,
  objectives,
  controlConfig
}: BulletWallsProps): ReactNode;
//#endregion
export { BulletWallsLab, BulletWallsProps };