export type OrbitalKind = '1s' | '2s' | '2p-x' | '2p-y' | '2p-z' | '3d-z2' | '3d-xy';

export interface OrbitalPoint {
  x: number;
  y: number;
  z: number;
  phase: 1 | -1;
  density: number;
}
export interface ProjectedPoint extends OrbitalPoint {
  px: number;
  py: number;
  depth: number;
}

const fract = (value: number): number => value - Math.floor(value);

/** Deterministic qualitative samples of hydrogen-like orbital probability density.
 * The points communicate symmetry, phase and nodes; they are not an electron trajectory. */
export function orbitalCloud(kind: OrbitalKind, count = 420): OrbitalPoint[] {
  const points: OrbitalPoint[] = [];
  for (let i = 1; i <= count * 8 && points.length < count; i += 1) {
    const u = fract(i * 0.754877666),
      v = fract(i * 0.569840296),
      w = fract(i * 0.438579021);
    const r =
      -Math.log(Math.max(1e-5, 1 - u)) * (kind.startsWith('1') ? 0.72 : kind.startsWith('2') ? 1.05 : 1.25);
    const theta = Math.acos(1 - 2 * v),
      phi = 2 * Math.PI * w;
    const x = r * Math.sin(theta) * Math.cos(phi),
      y = r * Math.sin(theta) * Math.sin(phi),
      z = r * Math.cos(theta);
    let angular = 1,
      radial = Math.exp(-r),
      phase: 1 | -1 = 1;
    if (kind === '2s') {
      angular = Math.abs(1 - r / 1.35);
      phase = r < 1.35 ? 1 : -1;
      radial = Math.exp(-r * 0.75);
    }
    if (kind === '2p-x') {
      angular = Math.abs(x) / Math.max(r, 0.001);
      phase = x >= 0 ? 1 : -1;
    }
    if (kind === '2p-y') {
      angular = Math.abs(y) / Math.max(r, 0.001);
      phase = y >= 0 ? 1 : -1;
    }
    if (kind === '2p-z') {
      angular = Math.abs(z) / Math.max(r, 0.001);
      phase = z >= 0 ? 1 : -1;
    }
    if (kind === '3d-z2') {
      const q = 3 * z * z - r * r;
      angular = Math.abs(q) / Math.max(r * r, 0.001);
      phase = q >= 0 ? 1 : -1;
      radial = Math.exp(-r * 0.72);
    }
    if (kind === '3d-xy') {
      const q = x * y;
      angular = Math.min(1, (4 * Math.abs(q)) / Math.max(r * r, 0.001));
      phase = q >= 0 ? 1 : -1;
      radial = Math.exp(-r * 0.72);
    }
    const density = Math.min(1, angular * angular * radial * 2.8);
    if (fract(i * 0.31234567) < density) points.push({ x, y, z, phase, density });
  }
  return points;
}

export function projectOrbital(
  points: readonly OrbitalPoint[],
  yawDeg: number,
  pitchDeg: number,
  scale = 58,
): ProjectedPoint[] {
  const yaw = (yawDeg * Math.PI) / 180,
    pitch = (pitchDeg * Math.PI) / 180;
  return points
    .map((point) => {
      const x1 = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
      const z1 = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
      const y1 = point.y * Math.cos(pitch) - z1 * Math.sin(pitch);
      const depth = point.y * Math.sin(pitch) + z1 * Math.cos(pitch);
      return { ...point, px: 210 + x1 * scale, py: 170 - y1 * scale, depth };
    })
    .sort((a, b) => a.depth - b.depth);
}

export function orbitalFacts(kind: OrbitalKind): {
  n: number;
  l: number;
  angularNodes: number;
  radialNodes: number;
  label: string;
} {
  if (kind === '1s')
    return { n: 1, l: 0, angularNodes: 0, radialNodes: 0, label: 'spherical probability density' };
  if (kind === '2s')
    return { n: 2, l: 0, angularNodes: 0, radialNodes: 1, label: 'spherical density with one radial node' };
  if (kind.startsWith('2p'))
    return { n: 2, l: 1, angularNodes: 1, radialNodes: 0, label: 'two phases separated by a nodal plane' };
  return { n: 3, l: 2, angularNodes: 2, radialNodes: 0, label: 'd-orbital density with two angular nodes' };
}
