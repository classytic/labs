import { SPEED_OF_LIGHT } from '../constants.js';
import { lorentzGamma, lorentzTransform, validBeta, type SpacetimeEvent } from './core.js';
export interface LengthContractionState {
  beta: number;
  gamma: number;
  properLengthM: number;
  contractedLengthM: number;
  platformEvents: { rear: SpacetimeEvent; front: SpacetimeEvent };
  rodEvents: { rear: SpacetimeEvent; front: SpacetimeEvent };
  rodTimeOffsetNs: number;
}
export function lengthContractionState(beta: number, properLengthM = 100): LengthContractionState {
  const b = Math.abs(validBeta(beta));
  if (!Number.isFinite(properLengthM) || properLengthM <= 0)
    throw new RangeError('proper length must be positive');
  const gamma = lorentzGamma(b),
    contractedLengthM = properLengthM / gamma,
    rear = { x: 0, ct: 0 },
    front = { x: contractedLengthM / SPEED_OF_LIGHT, ct: 0 },
    rearPrime = lorentzTransform(rear, b),
    frontPrime = lorentzTransform(front, b);
  return {
    beta: b,
    gamma,
    properLengthM,
    contractedLengthM,
    platformEvents: { rear, front },
    rodEvents: { rear: rearPrime, front: frontPrime },
    rodTimeOffsetNs: (frontPrime.ct - rearPrime.ct) * 1e9,
  };
}
