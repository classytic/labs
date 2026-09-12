/**
 * Flow through a narrowing pipe: continuity and Bernoulli's equation.
 *
 * Squeeze a pipe and the pressure in the narrow part goes DOWN. It feels backwards, because
 * squeezing sounds like pressing. The two rules behind it are simple. The same volume of water
 * passes every section each second, so where the pipe is narrow the water must move faster:
 * A₁v₁ = A₂v₂. And the water only speeds up if something pushes it forward, which means the
 * pressure behind it must be higher than the pressure ahead: P + ½ρv² stays the same along the
 * pipe. Fast water is low-pressure water.
 *
 * Idealised as the syllabus does: incompressible, no viscosity, a horizontal pipe, and pressure
 * read by open vertical tubes whose water columns stand at a height h = (P − P_atm) ÷ ρg.
 */

export const WATER_DENSITY = 1000;
export const G = 9.8;

export interface VenturiFlow {
  /** Water speed in the wide pipe, m/s. */
  inletSpeed: number;
  /** Throat radius as a fraction of the wide pipe's radius, between 0 and 1. */
  throatRatio: number;
  /** Height of the water column over the wide pipe, m: its gauge pressure as a head. */
  inletHead: number;
  density?: number;
  g?: number;
}

/** The pipe's length in metres, and where its sections begin and end. */
export const PIPE = { length: 3, converge: [0.8, 1.3], diverge: [1.7, 2.2] } as const;

/** Radius at position x along the pipe, as a fraction of the wide radius. Smooth, no steps. */
export function radiusAt(x: number, throatRatio: number): number {
  const [c0, c1] = PIPE.converge,
    [d0, d1] = PIPE.diverge;
  const ease = (f: number): number => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, f)));
  if (x <= c0 || x >= d1) return 1;
  if (x < c1) return 1 - (1 - throatRatio) * ease((x - c0) / (c1 - c0));
  if (x <= d0) return throatRatio;
  return throatRatio + (1 - throatRatio) * ease((x - d0) / (d1 - d0));
}

/**
 * Speed from continuity. The area goes as the radius squared, so halving the radius quarters the
 * area and quadruples the speed.
 */
export function speedAt(f: VenturiFlow, x: number): number {
  const r = radiusAt(x, f.throatRatio);
  return f.inletSpeed / (r * r);
}

/** Pressure relative to the wide pipe, Pa, from P + ½ρv² = constant. */
export function pressureDrop(f: VenturiFlow, x: number): number {
  const rho = f.density ?? WATER_DENSITY;
  const v = speedAt(f, x);
  return 0.5 * rho * (v * v - f.inletSpeed * f.inletSpeed);
}

/**
 * The height the water stands in an open tube at x. It falls by (v² − v₁²) ÷ 2g where the water
 * is faster, and below zero the tube would suck air in instead of holding water: that is how a
 * Venturi pump and a perfume spray work.
 */
export function headAt(f: VenturiFlow, x: number): number {
  const g = f.g ?? G;
  const v = speedAt(f, x);
  return f.inletHead - (v * v - f.inletSpeed * f.inletSpeed) / (2 * g);
}

/** The throat speed and the head lost there, for the readout. */
export function throat(f: VenturiFlow): { speed: number; headDrop: number; pressureDrop: number } {
  const mid = (PIPE.converge[1] + PIPE.diverge[0]) / 2;
  return {
    speed: speedAt(f, mid),
    headDrop: f.inletHead - headAt(f, mid),
    pressureDrop: pressureDrop(f, mid),
  };
}
