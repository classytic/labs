/**
 * Canned cycles for CycleLab, the data a creator/agent picks (or replaces with
 * their own nodes/edges). Each is just `{ nodes, edges }` for the shared
 * CycleDiagram, so a new cycle (nitrogen, carbon-in-ocean, food chain…) is DATA,
 * not a new component. Process labels on the ring edges are the assessment targets
 * for the label-the-process challenge.
 */

import type { CycleNode, CycleEdge } from '../kit/cycle.js';

export interface CycleSpec { nodes: CycleNode[]; edges: CycleEdge[] }

/** Water cycle, a clean 5-stage ring; each edge is one distinct process. */
export const WATER_CYCLE: CycleSpec = {
  nodes: [
    { id: 'ocean', label: 'Ocean', tone: 'var(--stage-accent-2)' },
    { id: 'vapour', label: 'Water vapour', tone: 'var(--stage-muted)' },
    { id: 'clouds', label: 'Clouds', tone: 'var(--stage-fg)' },
    { id: 'precip', label: 'Rain & snow', tone: 'var(--stage-accent)' },
    { id: 'rivers', label: 'Rivers & ground', tone: 'var(--stage-good)' },
  ],
  edges: [
    { from: 'ocean', to: 'vapour', label: 'evaporation' },
    { from: 'vapour', to: 'clouds', label: 'condensation' },
    { from: 'clouds', to: 'precip', label: 'precipitation' },
    { from: 'precip', to: 'rivers', label: 'infiltration' },
    { from: 'rivers', to: 'ocean', label: 'runoff' },
  ],
};

/** Rock cycle, a ring PLUS shortcuts: any rock can skip ahead (heat, re-weather). */
export const ROCK_CYCLE: CycleSpec = {
  nodes: [
    { id: 'magma', label: 'Magma', tone: 'var(--stage-danger)' },
    { id: 'igneous', label: 'Igneous', tone: 'var(--stage-accent)' },
    { id: 'sediment', label: 'Sediment', tone: 'var(--stage-warn)' },
    { id: 'sedimentary', label: 'Sedimentary', tone: 'var(--stage-good)' },
    { id: 'metamorphic', label: 'Metamorphic', tone: 'var(--stage-accent-2)' },
  ],
  edges: [
    { from: 'magma', to: 'igneous', label: 'cooling' },
    { from: 'igneous', to: 'sediment', label: 'weathering' },
    { from: 'sediment', to: 'sedimentary', label: 'compaction' },
    { from: 'sedimentary', to: 'metamorphic', label: 'heat & pressure' },
    { from: 'metamorphic', to: 'magma', label: 'melting' },
    // shortcuts, the cycle is not one-way
    { from: 'igneous', to: 'metamorphic', label: 'heat & pressure' },
    { from: 'sedimentary', to: 'sediment', label: 'weathering' },
  ],
};

/** Carbon cycle, branched (CO₂ in/out by several routes); ties to photo/respiration. */
export const CARBON_CYCLE: CycleSpec = {
  nodes: [
    { id: 'air', label: 'Atmospheric CO₂', tone: 'var(--stage-muted)' },
    { id: 'plants', label: 'Plants', tone: 'var(--stage-good)' },
    { id: 'animals', label: 'Animals', tone: 'var(--stage-accent)' },
    { id: 'dead', label: 'Dead matter', tone: 'var(--stage-warn)' },
    { id: 'fossil', label: 'Fossil fuels', tone: 'var(--stage-fg)' },
  ],
  edges: [
    { from: 'air', to: 'plants', label: 'photosynthesis' },
    { from: 'plants', to: 'animals', label: 'feeding' },
    { from: 'animals', to: 'dead', label: 'death' },
    { from: 'dead', to: 'air', label: 'decomposition' },
    { from: 'plants', to: 'air', label: 'respiration' },
    { from: 'animals', to: 'air', label: 'respiration' },
    { from: 'dead', to: 'fossil', label: 'fossilisation' },
    { from: 'fossil', to: 'air', label: 'combustion' },
  ],
};

export const CYCLE_PRESETS = { water: WATER_CYCLE, rock: ROCK_CYCLE, carbon: CARBON_CYCLE } as const;
export type CyclePresetKey = keyof typeof CYCLE_PRESETS;
