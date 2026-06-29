import { ReactNode } from "react";

//#region src/physics/waves/ripple.d.ts
type RippleView = 'ripples' | 'fringes';
interface RippleTankProps {
  wavelength?: number;
  view?: RippleView;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function RippleTankLab({
  wavelength,
  view: view0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: RippleTankProps): ReactNode;
//#endregion
export { RippleTankLab, RippleTankProps, RippleView };