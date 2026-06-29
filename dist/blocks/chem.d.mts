import { LabBlock } from "./lab-block.mjs";
import { GasBoxLab } from "../chem/gas-box/preset.mjs";
import { SolutionBoxLab } from "../chem/solution/solution-box.mjs";
import { DilutionLab } from "../chem/solution/dilution.mjs";
import { BohrAtom } from "../chem/bohr-atom.mjs";
import { ReactionProfile } from "../chem/reaction-profile.mjs";
import { ReactionLab } from "../chem/reaction-lab.mjs";
import { Battery } from "../chem/battery.mjs";
import { LeChatelierLab } from "../chem/equilibrium/preset.mjs";
import { TitrationLab } from "../chem/titration/preset.mjs";
import { ElectrochemLab } from "../chem/electrochem/preset.mjs";
import { KineticsLab } from "../chem/kinetics/preset.mjs";
import { StoichiometryLab } from "../chem/stoichiometry/preset.mjs";
import { PeriodicTrendsLab } from "../chem/periodic-trends/preset.mjs";
import { z } from "zod";

//#region src/blocks/chem.d.ts
declare const LeChatelierBlock: LabBlock;
declare const ElectrochemBlock: LabBlock;
declare const PeriodicTrendsBlock: LabBlock;
declare const StoichiometryBlock: LabBlock;
declare const KineticsBlock: LabBlock;
declare const TitrationBlock: LabBlock;
declare const GasBoxBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  holdConstant: z.ZodDefault<z.ZodEnum<{
    none: "none";
    volume: "volume";
    temperature: "temperature";
    pressure: "pressure";
  }>>;
  particleCount: z.ZodDefault<z.ZodNumber>;
  temperature: z.ZodDefault<z.ZodNumber>;
  volume: z.ZodDefault<z.ZodNumber>;
  showGauge: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const SolutionBoxBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  moles: z.ZodDefault<z.ZodNumber>;
  volume: z.ZodDefault<z.ZodNumber>;
  showProbe: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const DilutionBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  stockConcentration: z.ZodDefault<z.ZodNumber>;
  aliquotVolume: z.ZodDefault<z.ZodNumber>;
  finalVolume: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const BohrAtomBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  protons: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ReactionProfileBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  deltaH: z.ZodOptional<z.ZodNumber>;
  activationEnergy: z.ZodOptional<z.ZodNumber>;
  catalyst: z.ZodOptional<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ReactionLabBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodOptional<z.ZodString>;
  b: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const BatteryBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  emf: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const chemBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  holdConstant: z.ZodDefault<z.ZodEnum<{
    none: "none";
    volume: "volume";
    temperature: "temperature";
    pressure: "pressure";
  }>>;
  particleCount: z.ZodDefault<z.ZodNumber>;
  temperature: z.ZodDefault<z.ZodNumber>;
  volume: z.ZodDefault<z.ZodNumber>;
  showGauge: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  moles: z.ZodDefault<z.ZodNumber>;
  volume: z.ZodDefault<z.ZodNumber>;
  showProbe: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  stockConcentration: z.ZodDefault<z.ZodNumber>;
  aliquotVolume: z.ZodDefault<z.ZodNumber>;
  finalVolume: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  protons: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  deltaH: z.ZodOptional<z.ZodNumber>;
  activationEnergy: z.ZodOptional<z.ZodNumber>;
  catalyst: z.ZodOptional<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodOptional<z.ZodString>;
  b: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  emf: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock];
declare const chemComponents: {
  readonly GasBox: typeof GasBoxLab;
  readonly SolutionBox: typeof SolutionBoxLab;
  readonly Dilution: typeof DilutionLab;
  readonly BohrAtom: typeof BohrAtom;
  readonly ReactionProfile: typeof ReactionProfile;
  readonly ReactionLab: typeof ReactionLab;
  readonly Battery: typeof Battery;
  readonly LeChatelier: typeof LeChatelierLab;
  readonly Titration: typeof TitrationLab;
  readonly Electrochem: typeof ElectrochemLab;
  readonly Kinetics: typeof KineticsLab;
  readonly Stoichiometry: typeof StoichiometryLab;
  readonly PeriodicTrends: typeof PeriodicTrendsLab;
};
//#endregion
export { BatteryBlock, BohrAtomBlock, DilutionBlock, ElectrochemBlock, GasBoxBlock, KineticsBlock, LeChatelierBlock, PeriodicTrendsBlock, ReactionLabBlock, ReactionProfileBlock, SolutionBoxBlock, StoichiometryBlock, TitrationBlock, chemBlocks, chemComponents };