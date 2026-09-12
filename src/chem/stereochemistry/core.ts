export type StereochemistryMolecule = 'lactic-acid' | 'alanine' | 'bromochlorofluoromethane';
export type Enantiomer = 'R' | 'S';
export interface ChiralGroup {
  label: string;
  priority: 1 | 2 | 3 | 4;
  tone: 'accent' | 'secondary' | 'warning' | 'neutral';
}
export interface ChiralSpec {
  name: string;
  formula: string;
  center: string;
  groups: readonly [ChiralGroup, ChiralGroup, ChiralGroup, ChiralGroup];
}
export interface ChiralVector {
  x: number;
  y: number;
  z: number;
}

export const CHIRAL_MOLECULES: Record<StereochemistryMolecule, ChiralSpec> = {
  'lactic-acid': {
    name: 'Lactic acid',
    formula: 'CH₃CH(OH)CO₂H',
    center: 'C*',
    groups: [
      { label: 'OH', priority: 1, tone: 'accent' },
      { label: 'CO₂H', priority: 2, tone: 'secondary' },
      { label: 'CH₃', priority: 3, tone: 'warning' },
      { label: 'H', priority: 4, tone: 'neutral' },
    ],
  },
  alanine: {
    name: 'Alanine',
    formula: 'NH₂CH(CH₃)CO₂H',
    center: 'Cα',
    groups: [
      { label: 'NH₂', priority: 1, tone: 'accent' },
      { label: 'CO₂H', priority: 2, tone: 'secondary' },
      { label: 'CH₃', priority: 3, tone: 'warning' },
      { label: 'H', priority: 4, tone: 'neutral' },
    ],
  },
  bromochlorofluoromethane: {
    name: 'Bromochlorofluoromethane',
    formula: 'CHBrClF',
    center: 'C*',
    groups: [
      { label: 'Br', priority: 1, tone: 'accent' },
      { label: 'Cl', priority: 2, tone: 'secondary' },
      { label: 'F', priority: 3, tone: 'warning' },
      { label: 'H', priority: 4, tone: 'neutral' },
    ],
  },
};

const BASE_VECTORS: readonly ChiralVector[] = [
  { x: 1, y: 1, z: 1 },
  { x: -1, y: -1, z: 1 },
  { x: -1, y: 1, z: -1 },
  { x: 1, y: -1, z: -1 },
];

/** Ideal tetrahedral directions. Mirroring x produces the opposite enantiomer. */
export function chiralVectors(enantiomer: Enantiomer): ChiralVector[] {
  return BASE_VECTORS.map(({ x, y, z }) => ({ x: enantiomer === 'R' ? x : -x, y, z }));
}

export function mirrorEnantiomer(enantiomer: Enantiomer): Enantiomer {
  return enantiomer === 'R' ? 'S' : 'R';
}
export const TETRAHEDRAL_ANGLE = 109.5;

export function rotateChiralVector(vector: ChiralVector, yaw: number, pitch: number): ChiralVector {
  const y = (yaw * Math.PI) / 180,
    p = (pitch * Math.PI) / 180;
  const x1 = vector.x * Math.cos(y) + vector.z * Math.sin(y),
    z1 = -vector.x * Math.sin(y) + vector.z * Math.cos(y);
  return {
    x: x1,
    y: vector.y * Math.cos(p) - z1 * Math.sin(p),
    z: vector.y * Math.sin(p) + z1 * Math.cos(p),
  };
}
