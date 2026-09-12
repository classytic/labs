export interface SpacetimeEvent {
  x: number;
  ct: number;
}
export type LightClockEventName = 'emission' | 'outbound' | 'reflection' | 'return';
export interface LightClockState {
  beta: number;
  gamma: number;
  progress: number;
  event: LightClockEventName;
  properElapsed: number;
  coordinateElapsed: number;
  shipX: number;
  photonY: number;
  mirrorHeight: number;
  photonPathLength: number;
}
export function validBeta(beta: number, max = 0.995): number {
  if (!Number.isFinite(beta)) throw new RangeError('beta must be finite');
  return Math.max(-max, Math.min(max, beta));
}
export function lorentzGamma(beta: number): number {
  const b = validBeta(beta);
  return 1 / Math.sqrt(1 - b * b);
}
export const coordinateTime = (properTime: number, beta: number): number => properTime * lorentzGamma(beta);
export const properTime = (coordinate: number, beta: number): number => coordinate / lorentzGamma(beta);
export function lorentzTransform(event: SpacetimeEvent, beta: number): SpacetimeEvent {
  const b = validBeta(beta),
    g = lorentzGamma(b);
  return { x: g * (event.x - b * event.ct), ct: g * (event.ct - b * event.x) };
}
export function inverseLorentzTransform(event: SpacetimeEvent, beta: number): SpacetimeEvent {
  return lorentzTransform(event, -beta);
}
export const spacetimeInterval = (a: SpacetimeEvent, b: SpacetimeEvent = { x: 0, ct: 0 }): number =>
  (a.ct - b.ct) ** 2 - (a.x - b.x) ** 2;
export function lightClockState(beta: number, properTick = 2, progress = 0): LightClockState {
  const b = validBeta(beta),
    g = lorentzGamma(b),
    p = Math.max(0, Math.min(1, progress)),
    h = properTick / 2,
    tau = p * properTick,
    ct = g * tau,
    localPhase = p <= 0.5 ? p * 2 : (1 - p) * 2;
  return {
    beta: b,
    gamma: g,
    progress: p,
    event:
      p === 0 ? 'emission' : p < 0.5 ? 'outbound' : p === 0.5 ? 'reflection' : p < 1 ? 'return' : 'return',
    properElapsed: tau,
    coordinateElapsed: ct,
    shipX: b * ct,
    photonY: h * localPhase,
    mirrorHeight: h,
    photonPathLength: ct,
  };
}
export function lightClockEvents(
  beta: number,
  properTick = 2,
): Record<'emission' | 'reflection' | 'return', SpacetimeEvent> {
  const g = lorentzGamma(beta),
    h = properTick / 2;
  return {
    emission: { x: 0, ct: 0 },
    reflection: { x: beta * g * h, ct: g * h },
    return: { x: beta * g * properTick, ct: g * properTick },
  };
}
