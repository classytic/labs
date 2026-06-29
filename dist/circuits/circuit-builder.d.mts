import { ReactNode } from "react";

//#region src/circuits/circuit-builder.d.ts
type CircuitComponent = {
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
interface CircuitBuilderProps {
  battery?: number | string;
  components?: CircuitComponent[];
  title?: string;
  height?: number;
}
declare function CircuitBuilder({
  battery,
  components,
  title,
  height
}?: CircuitBuilderProps): ReactNode;
//#endregion
export { CircuitBuilder, CircuitBuilderProps, CircuitComponent };