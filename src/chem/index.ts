// @classytic/labs/chem — interactive chemistry labs.
// ── On the @classytic/stage engine (SVG + CanvasLayer particles, accessible, themed). ──

// Kinetic-theory gas box — pressure measured from wall collisions, PV=nRT emerges:
export { GasBoxLab, type GasBoxProps } from './gas-box/index.js';
// Concentration family — solute dots in a box (shared SolutionField); M=n/V + dilution:
export { SolutionField, type SolutionFieldProps, SolutionBoxLab, type SolutionBoxProps, DilutionLab, type DilutionProps } from './solution/index.js';
export { BohrAtom, type BohrAtomProps } from './bohr-atom.js';
export { ReactionProfile, type ReactionProfileProps } from './reaction-profile.js';
export { ReactionLab, type ReactionLabProps } from './reaction-lab.js';
export { Battery, type BatteryProps } from './battery.js';
// Diffusion — two gases mixing on the `particles` kinetic-theory core (entropy):
export { DiffusionLab, type DiffusionProps } from './diffusion/index.js';
// Chemical equilibrium / Le Chatelier — N₂O₄⇌2NO₂ on the `equilibrium` core (Q→K, shifts):
export { LeChatelierLab, type LeChatelierProps } from './equilibrium/index.js';
// Acid–base titration — pH curve (buffer/equivalence) on the `@classytic/stage/chem` kernel:
export { TitrationLab, type TitrationProps } from './titration/index.js';
// Electrochemistry — galvanic cell EMF via the Nernst equation (same chem kernel):
export { ElectrochemLab, type ElectrochemProps } from './electrochem/index.js';
// Reaction kinetics — collision model + Arrhenius (rate vs T / Eₐ / catalyst), same kernel:
export { KineticsLab, type KineticsProps } from './kinetics/index.js';
// Stoichiometry — limiting reagent as a recipe (extent, yield, leftovers), same kernel:
export { StoichiometryLab, type StoichiometryProps } from './stoichiometry/index.js';
// Periodic trends — the table as a heatmap (radius / ionisation energy / electronegativity):
export { PeriodicTrendsLab, type PeriodicTrendsProps } from './periodic-trends/index.js';
