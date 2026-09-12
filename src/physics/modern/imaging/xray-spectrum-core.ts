export const XRAY_TARGETS = {
  tungsten: { label: 'tungsten', thresholdKev: 69.5, linesKev: [59.3, 67.2] },
  molybdenum: { label: 'molybdenum', thresholdKev: 20, linesKev: [17.5, 19.6] },
} as const;

export type XrayTargetId = keyof typeof XRAY_TARGETS;
export interface SpectrumBin {
  energyKev: number;
  unfiltered: number;
  filtered: number;
  characteristic: number;
}
export interface XraySpectrumState {
  endpointKev: number;
  bins: SpectrumBin[];
  meanEnergyKev: number;
  relativeOutput: number;
  removedFraction: number;
}

export interface SpectrumPhoton {
  id: number;
  energyKev: number;
  characteristic: boolean;
  filterSample: number;
  transmitted: boolean;
}

export interface XraySpectrumExposure {
  progress: number;
  photons: SpectrumPhoton[];
  emitted: number;
  filteredOut: number;
  detected: number;
  detectedMeanEnergyKev: number;
  detectedBins: number[];
}

/** Conceptual aluminium-filter attenuation. Use measured coefficient tables for quantitative work. */
export function aluminiumFilterTransmission(energyKev: number, thicknessMm: number): number {
  if (energyKev <= 0 || thicknessMm < 0)
    throw new RangeError('energy must be positive and thickness non-negative');
  const muCmInv = 1.15 * Math.pow(30 / energyKev, 2.75) + 0.08;
  return Math.exp((-muCmInv * thicknessMm) / 10);
}

export function xraySpectrum(
  kvp: number,
  filtrationMmAl: number,
  target: XrayTargetId,
  binCount = 96,
): XraySpectrumState {
  if (!Number.isFinite(kvp) || kvp <= 10) throw new RangeError('tube voltage must exceed 10 kVp');
  if (!Number.isFinite(filtrationMmAl) || filtrationMmAl < 0)
    throw new RangeError('filtration must be non-negative');
  const targetData = XRAY_TARGETS[target];
  const bins: SpectrumBin[] = [];
  let unfilteredSum = 0,
    filteredSum = 0,
    weightedEnergy = 0;
  for (let index = 1; index <= binCount; index++) {
    const energyKev = (kvp * index) / binCount;
    const continuum = Math.max(0, ((kvp - energyKev) * energyKev) / (kvp * kvp));
    const characteristic =
      kvp > targetData.thresholdKev
        ? targetData.linesKev.reduce(
            (sum, line) =>
              sum + Math.exp(-0.5 * Math.pow((energyKev - line) / Math.max(0.45, kvp / binCount), 2)) * 0.16,
            0,
          )
        : 0;
    const unfiltered = continuum + characteristic;
    const filtered = unfiltered * aluminiumFilterTransmission(energyKev, filtrationMmAl);
    bins.push({ energyKev, unfiltered, filtered, characteristic });
    unfilteredSum += unfiltered;
    filteredSum += filtered;
    weightedEnergy += filtered * energyKev;
  }
  return {
    endpointKev: kvp,
    bins,
    meanEnergyKev: filteredSum ? weightedEnergy / filteredSum : 0,
    relativeOutput: filteredSum / binCount,
    removedFraction: unfilteredSum ? 1 - filteredSum / unfilteredSum : 0,
  };
}

/** Deterministically samples the authored spectrum so animation and SSR agree exactly. */
export function createSpectrumPhotonCohort(
  state: XraySpectrumState,
  filtrationMmAl: number,
  count = 48,
): SpectrumPhoton[] {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('photon count must be a positive integer');
  const weights = state.bins.map((bin) => bin.unfiltered);
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cumulative = 0;
  const cdf = weights.map((weight) => (cumulative += weight / total));
  return Array.from({ length: count }, (_, id) => {
    const quantile = (id + 0.5) / count;
    const binIndex = Math.min(
      cdf.findIndex((value) => value >= quantile),
      state.bins.length - 1,
    );
    const bin = state.bins[Math.max(0, binIndex)]!;
    const filterSample = (((id * 29) % count) + 0.5) / count;
    return {
      id,
      energyKev: bin.energyKev,
      characteristic: bin.characteristic > Math.max(0.02, bin.unfiltered * 0.4),
      filterSample,
      transmitted: filterSample <= aluminiumFilterTransmission(bin.energyKev, filtrationMmAl),
    };
  });
}

export function xraySpectrumExposureAt(
  photons: readonly SpectrumPhoton[],
  progress: number,
  binCount = 18,
): XraySpectrumExposure {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const emitted = Math.min(photons.length, Math.floor(p * photons.length + 1e-9));
  const active = photons.slice(0, emitted);
  const detectedPhotons = active.filter((photon) => photon.transmitted);
  const endpoint = Math.max(...photons.map((photon) => photon.energyKev), 1);
  const detectedBins = Array.from({ length: binCount }, () => 0);
  for (const photon of detectedPhotons) {
    const index = Math.min(binCount - 1, Math.floor((photon.energyKev / endpoint) * binCount));
    detectedBins[index]! += 1;
  }
  return {
    progress: p,
    photons: [...photons],
    emitted,
    filteredOut: active.length - detectedPhotons.length,
    detected: detectedPhotons.length,
    detectedMeanEnergyKev: detectedPhotons.length
      ? detectedPhotons.reduce((sum, photon) => sum + photon.energyKev, 0) / detectedPhotons.length
      : 0,
    detectedBins,
  };
}
