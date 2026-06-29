import { CIRCUIT_NETWORK_ASSET } from "./asset.mjs";
import { ReactNode } from "react";
import { SceneDoc } from "@classytic/stage";

//#region src/circuits/circuit/preset.d.ts
type CircuitComponentSpec = {
  type: 'resistor';
  ohms: number;
  label?: string;
} | {
  type: 'bulb';
  ohms: number;
  label?: string;
} | {
  type: 'switch';
  closed?: boolean;
  label?: string;
};
interface CircuitGoal {
  kind: 'lightBulb' | 'targetCurrent' | 'allLit';
  /** flat component index (across all branches in declaration order); omit for "total"/first bulb */
  comp?: number;
  value?: number;
  tol?: number;
}
interface CircuitNetworkProps {
  emf?: number;
  emfRange?: [number, number, number];
  internalR?: number;
  /** each inner array is a series chain; multiple arrays are in PARALLEL */
  branches?: CircuitComponentSpec[][];
  goal?: CircuitGoal;
  prompt?: string;
  controlId?: string;
  height?: number;
}
declare function circuitDoc({
  emf,
  emfRange,
  internalR,
  branches,
  goal
}: CircuitNetworkProps): SceneDoc;
declare function CircuitNetworkLab(props: CircuitNetworkProps): ReactNode;
//#endregion
export { CircuitComponentSpec, CircuitGoal, CircuitNetworkLab, CircuitNetworkProps, circuitDoc };