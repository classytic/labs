export type MoleculeKey = 'co2' | 'bf3' | 'ch4' | 'nh3' | 'h2o' | 'pcl5' | 'sf6';
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
export interface MoleculeSpec {
  key: MoleculeKey;
  formula: string;
  central: string;
  outer: string;
  bonds: number;
  lonePairs: number;
  electronGeometry: string;
  shape: string;
  hybridization: string;
  angle: string;
  polar: boolean;
  vectors: Vec3[];
}

const norm = (x: number, y: number, z: number): Vec3 => {
  const m = Math.hypot(x, y, z) || 1;
  return { x: x / m, y: y / m, z: z / m };
};
const tetra = [norm(1, 1, 1), norm(-1, -1, 1), norm(-1, 1, -1), norm(1, -1, -1)];
export const MOLECULES: Record<MoleculeKey, MoleculeSpec> = {
  co2: {
    key: 'co2',
    formula: 'CO₂',
    central: 'C',
    outer: 'O',
    bonds: 2,
    lonePairs: 0,
    electronGeometry: 'linear',
    shape: 'linear',
    hybridization: 'sp',
    angle: '180°',
    polar: false,
    vectors: [norm(-1, 0, 0), norm(1, 0, 0)],
  },
  bf3: {
    key: 'bf3',
    formula: 'BF₃',
    central: 'B',
    outer: 'F',
    bonds: 3,
    lonePairs: 0,
    electronGeometry: 'trigonal planar',
    shape: 'trigonal planar',
    hybridization: 'sp²',
    angle: '120°',
    polar: false,
    vectors: [0, 1, 2].map((i) => norm(Math.cos((i * 2 * Math.PI) / 3), Math.sin((i * 2 * Math.PI) / 3), 0)),
  },
  ch4: {
    key: 'ch4',
    formula: 'CH₄',
    central: 'C',
    outer: 'H',
    bonds: 4,
    lonePairs: 0,
    electronGeometry: 'tetrahedral',
    shape: 'tetrahedral',
    hybridization: 'sp³',
    angle: '109.5°',
    polar: false,
    vectors: tetra,
  },
  nh3: {
    key: 'nh3',
    formula: 'NH₃',
    central: 'N',
    outer: 'H',
    bonds: 3,
    lonePairs: 1,
    electronGeometry: 'tetrahedral',
    shape: 'trigonal pyramidal',
    hybridization: 'sp³',
    angle: '≈107°',
    polar: true,
    vectors: tetra,
  },
  h2o: {
    key: 'h2o',
    formula: 'H₂O',
    central: 'O',
    outer: 'H',
    bonds: 2,
    lonePairs: 2,
    electronGeometry: 'tetrahedral',
    shape: 'bent',
    hybridization: 'sp³',
    angle: '104.5°',
    polar: true,
    vectors: tetra,
  },
  pcl5: {
    key: 'pcl5',
    formula: 'PCl₅',
    central: 'P',
    outer: 'Cl',
    bonds: 5,
    lonePairs: 0,
    electronGeometry: 'trigonal bipyramidal',
    shape: 'trigonal bipyramidal',
    hybridization: 'sp³d (introductory model)',
    angle: '90°, 120°, 180°',
    polar: false,
    vectors: [
      norm(0, 0, 1),
      norm(0, 0, -1),
      ...[0, 1, 2].map((i) => norm(Math.cos((i * 2 * Math.PI) / 3), Math.sin((i * 2 * Math.PI) / 3), 0)),
    ],
  },
  sf6: {
    key: 'sf6',
    formula: 'SF₆',
    central: 'S',
    outer: 'F',
    bonds: 6,
    lonePairs: 0,
    electronGeometry: 'octahedral',
    shape: 'octahedral',
    hybridization: 'sp³d² (introductory model)',
    angle: '90°, 180°',
    polar: false,
    vectors: [norm(1, 0, 0), norm(-1, 0, 0), norm(0, 1, 0), norm(0, -1, 0), norm(0, 0, 1), norm(0, 0, -1)],
  },
};

export function projectVector(
  vector: Vec3,
  yawDeg: number,
  pitchDeg: number,
): { x: number; y: number; depth: number } {
  const yaw = (yawDeg * Math.PI) / 180,
    pitch = (pitchDeg * Math.PI) / 180;
  const x1 = vector.x * Math.cos(yaw) + vector.z * Math.sin(yaw);
  const z1 = -vector.x * Math.sin(yaw) + vector.z * Math.cos(yaw);
  return {
    x: x1,
    y: vector.y * Math.cos(pitch) - z1 * Math.sin(pitch),
    depth: vector.y * Math.sin(pitch) + z1 * Math.cos(pitch),
  };
}

export function molecularDipole(spec: MoleculeSpec): string {
  return spec.polar
    ? `bond dipoles do not cancel; ${spec.formula} is polar`
    : `the symmetric bond dipoles cancel; ${spec.formula} is non-polar`;
}

/** Only the compact second-period models are rendered as hybrid directions.
 * Expanded-octet sp3d/sp3d2 labels remain available as historical introductory
 * bookkeeping, but are intentionally not drawn as literal d-orbital hybrids. */
export function hasDirectionalHybridModel(spec: MoleculeSpec): boolean {
  return spec.hybridization === 'sp' || spec.hybridization === 'sp²' || spec.hybridization === 'sp³';
}
