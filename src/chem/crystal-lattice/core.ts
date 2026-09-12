export type CrystalLatticeKind = 'simple-cubic' | 'body-centred' | 'face-centred';

export interface LatticeFacts {
  label: string;
  atomsPerCell: number;
  coordination: number;
  packingEfficiency: number;
}

export interface LatticePoint {
  x: number;
  y: number;
  z: number;
  site: 'corner' | 'body' | 'face';
}

export const LATTICE_FACTS: Record<CrystalLatticeKind, LatticeFacts> = {
  'simple-cubic': { label: 'Simple cubic', atomsPerCell: 1, coordination: 6, packingEfficiency: Math.PI / 6 },
  'body-centred': {
    label: 'Body-centred cubic',
    atomsPerCell: 2,
    coordination: 8,
    packingEfficiency: (Math.sqrt(3) * Math.PI) / 8,
  },
  'face-centred': {
    label: 'Face-centred cubic',
    atomsPerCell: 4,
    coordination: 12,
    packingEfficiency: Math.PI / (3 * Math.sqrt(2)),
  },
};

const basis = (kind: CrystalLatticeKind): LatticePoint[] => {
  const corners: LatticePoint[] = [0, 1].flatMap((x) =>
    [0, 1].flatMap((y) => [0, 1].map((z) => ({ x, y, z, site: 'corner' as const }))),
  );
  if (kind === 'body-centred') return [...corners, { x: 0.5, y: 0.5, z: 0.5, site: 'body' }];
  if (kind === 'face-centred')
    return [
      ...corners,
      { x: 0.5, y: 0.5, z: 0, site: 'face' },
      { x: 0.5, y: 0.5, z: 1, site: 'face' },
      { x: 0.5, y: 0, z: 0.5, site: 'face' },
      { x: 0.5, y: 1, z: 0.5, site: 'face' },
      { x: 0, y: 0.5, z: 0.5, site: 'face' },
      { x: 1, y: 0.5, z: 0.5, site: 'face' },
    ];
  return corners;
};

/** Unique lattice sites for an n×n×n block; shared boundary atoms are emitted once. */
export function latticePoints(kind: CrystalLatticeKind, repetitions = 1): LatticePoint[] {
  const n = Math.max(1, Math.min(3, Math.round(repetitions)));
  const points = new Map<string, LatticePoint>();
  for (let x = 0; x < n; x += 1)
    for (let y = 0; y < n; y += 1)
      for (let z = 0; z < n; z += 1) {
        basis(kind).forEach((point) => {
          const item = { ...point, x: point.x + x, y: point.y + y, z: point.z + z };
          points.set(`${item.x}:${item.y}:${item.z}`, item);
        });
      }
  return [...points.values()];
}

export function projectedLatticePoint(
  point: LatticePoint,
  repetitions: number,
): { x: number; y: number; depth: number } {
  const scale = 150 / Math.max(1, repetitions);
  return {
    x: 210 + (point.x - point.z) * scale * 0.72,
    y: 220 - point.y * scale + (point.x + point.z) * scale * 0.34,
    depth: point.x + point.y + point.z,
  };
}
