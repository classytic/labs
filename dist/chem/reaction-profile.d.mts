import { ReactNode } from "react";

//#region src/chem/reaction-profile.d.ts
interface ReactionProfileProps {
  /** Products − reactants energy. Negative = exothermic. */
  deltaH?: number | string;
  /** Activation energy (hump height above reactants). */
  activationEnergy?: number | string;
  catalyst?: boolean;
  title?: string;
  height?: number;
}
declare function ReactionProfile({
  deltaH,
  activationEnergy,
  catalyst: catalystInit,
  title,
  height
}?: ReactionProfileProps): ReactNode;
//#endregion
export { ReactionProfile, ReactionProfileProps };