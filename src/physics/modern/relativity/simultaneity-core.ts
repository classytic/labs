import { SPEED_OF_LIGHT } from '../constants.js';
import { lorentzTransform, validBeta, type SpacetimeEvent } from './core.js';
export interface SimultaneityState {
  beta: number;
  separationM: number;
  platform: { left: SpacetimeEvent; right: SpacetimeEvent; deltaTimeNs: number };
  train: { left: SpacetimeEvent; right: SpacetimeEvent; deltaTimeNs: number };
  firstInTrain: 'left' | 'right' | 'simultaneous';
}
export function simultaneityState(beta: number, separationM = 300): SimultaneityState {
  const b = validBeta(beta);
  if (!Number.isFinite(separationM) || separationM <= 0) throw new RangeError('separation must be positive');
  const halfLightSeconds = separationM / (2 * SPEED_OF_LIGHT),
    left = { x: -halfLightSeconds, ct: 0 },
    right = { x: halfLightSeconds, ct: 0 },
    leftPrime = lorentzTransform(left, b),
    rightPrime = lorentzTransform(right, b),
    deltaTimeNs = (rightPrime.ct - leftPrime.ct) * 1e9;
  return {
    beta: b,
    separationM,
    platform: { left, right, deltaTimeNs: 0 },
    train: { left: leftPrime, right: rightPrime, deltaTimeNs },
    firstInTrain: Math.abs(deltaTimeNs) < 1e-9 ? 'simultaneous' : deltaTimeNs < 0 ? 'right' : 'left',
  };
}
