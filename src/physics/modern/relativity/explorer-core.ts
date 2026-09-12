import { lorentzTransform, spacetimeInterval, validBeta, type SpacetimeEvent } from './core.js';
export type IntervalKind = 'timelike' | 'lightlike' | 'spacelike';
export interface LorentzExplorerState {
  beta: number;
  event: SpacetimeEvent;
  transformed: SpacetimeEvent;
  interval: number;
  transformedInterval: number;
  kind: IntervalKind;
}
export function intervalKind(interval: number, tolerance = 1e-9): IntervalKind {
  return Math.abs(interval) <= tolerance ? 'lightlike' : interval > 0 ? 'timelike' : 'spacelike';
}
export function lorentzExplorerState(event: SpacetimeEvent, beta: number): LorentzExplorerState {
  if (!Number.isFinite(event.x) || !Number.isFinite(event.ct))
    throw new RangeError('event coordinates must be finite');
  const b = validBeta(beta),
    transformed = lorentzTransform(event, b),
    interval = spacetimeInterval(event);
  return {
    beta: b,
    event,
    transformed,
    interval,
    transformedInterval: spacetimeInterval(transformed),
    kind: intervalKind(interval),
  };
}
