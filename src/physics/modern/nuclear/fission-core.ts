export type Criticality = 'subcritical' | 'critical' | 'supercritical';

export interface FissionGeneration {
  generation: number;
  sourceNeutrons: number;
  controlCaptured: number;
  leaked: number;
  fuelCaptured: number;
  fissions: number;
  emittedNeutrons: number;
  energyMeV: number;
}

export interface FissionChainState {
  kEffective: number;
  criticality: Criticality;
  generations: FissionGeneration[];
  totalExpectedFissions: number;
  totalExpectedEnergyMeV: number;
  neutronsPerFission: number;
  leakageFraction: number;
  controlCaptureFraction: number;
}

export interface FissionChainScenario {
  baseK?: number;
  controlInsertion?: number;
  generationCount?: number;
  initialNeutrons?: number;
  neutronsPerFission?: number;
  leakageFraction?: number;
  maxControlCapture?: number;
}

export const ENERGY_PER_FISSION_MEV = 200;
export const DEFAULT_NEUTRONS_PER_FISSION = 2.43;
export const DEFAULT_LEAKAGE_FRACTION = 0.12;
export const DEFAULT_MAX_CONTROL_CAPTURE = 0.72;

function fraction(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return Math.max(0, Math.min(1, value));
}

export function effectiveMultiplication(
  baseK: number,
  controlInsertion: number,
  maxControlCapture = DEFAULT_MAX_CONTROL_CAPTURE,
): number {
  if (!Number.isFinite(baseK) || baseK < 0) throw new RangeError('baseK must be non-negative');
  return (
    baseK *
    (1 - fraction(controlInsertion, 'controlInsertion') * fraction(maxControlCapture, 'maxControlCapture'))
  );
}

export function criticalityOf(k: number): Criticality {
  return Math.abs(k - 1) < 0.025 ? 'critical' : k < 1 ? 'subcritical' : 'supercritical';
}

/** Expected-value model with an explicit, conserved source-neutron ledger. */
export function simulateFissionChain({
  baseK = 1.35,
  controlInsertion = 0.36,
  generationCount = 7,
  initialNeutrons = 1,
  neutronsPerFission = DEFAULT_NEUTRONS_PER_FISSION,
  leakageFraction = DEFAULT_LEAKAGE_FRACTION,
  maxControlCapture = DEFAULT_MAX_CONTROL_CAPTURE,
}: FissionChainScenario = {}): FissionChainState {
  if (!Number.isFinite(initialNeutrons) || initialNeutrons < 0)
    throw new RangeError('initialNeutrons must be non-negative');
  if (!Number.isFinite(neutronsPerFission) || neutronsPerFission <= 0)
    throw new RangeError('neutronsPerFission must be positive');
  const leakage = fraction(leakageFraction, 'leakageFraction');
  const insertion = fraction(controlInsertion, 'controlInsertion');
  const maximumCapture = fraction(maxControlCapture, 'maxControlCapture');
  const controlCaptureFraction = insertion * maximumCapture;
  const possibleMultiplier = (1 - leakage) * neutronsPerFission;
  if (baseK > possibleMultiplier + Number.EPSILON) {
    throw new RangeError(
      `baseK cannot exceed ${possibleMultiplier.toFixed(3)} for this leakage and neutron yield`,
    );
  }
  const fuelFissionProbability = possibleMultiplier === 0 ? 0 : baseK / possibleMultiplier;
  const kEffective = effectiveMultiplication(baseK, insertion, maximumCapture);
  const generations: FissionGeneration[] = [];
  let sourceNeutrons = initialNeutrons;
  let totalExpectedFissions = 0;

  const count = Math.max(1, Math.min(12, Math.floor(generationCount)));
  for (let generation = 0; generation < count; generation += 1) {
    const controlCaptured = sourceNeutrons * controlCaptureFraction;
    const afterControl = sourceNeutrons - controlCaptured;
    const leaked = afterControl * leakage;
    const reachingFuel = afterControl - leaked;
    const fissions = reachingFuel * fuelFissionProbability;
    const fuelCaptured = reachingFuel - fissions;
    const emittedNeutrons = fissions * neutronsPerFission;
    generations.push({
      generation,
      sourceNeutrons,
      controlCaptured,
      leaked,
      fuelCaptured,
      fissions,
      emittedNeutrons,
      energyMeV: fissions * ENERGY_PER_FISSION_MEV,
    });
    totalExpectedFissions += fissions;
    sourceNeutrons = emittedNeutrons;
  }

  return {
    kEffective,
    criticality: criticalityOf(kEffective),
    generations,
    totalExpectedFissions,
    totalExpectedEnergyMeV: totalExpectedFissions * ENERGY_PER_FISSION_MEV,
    neutronsPerFission,
    leakageFraction: leakage,
    controlCaptureFraction,
  };
}
