export const HC_EV_NM = 1239.841984;
export const METALS = {
  sodium: { name: 'sodium', symbol: 'Na', workFunctionEv: 2.46 },
  aluminium: { name: 'aluminium', symbol: 'Al', workFunctionEv: 4.08 },
  zinc: { name: 'zinc', symbol: 'Zn', workFunctionEv: 4.31 },
  copper: { name: 'copper', symbol: 'Cu', workFunctionEv: 4.7 },
  platinum: { name: 'platinum', symbol: 'Pt', workFunctionEv: 6.35 },
} as const;
export type PhotoMetalId = keyof typeof METALS;
export interface PhotoelectricState {
  wavelengthNm: number;
  photonEnergyEv: number;
  workFunctionEv: number;
  thresholdWavelengthNm: number;
  emits: boolean;
  maxKineticEnergyEv: number;
  stoppingPotentialV: number;
  relativeCurrent: number;
}
export function photoelectricState(
  wavelengthNm: number,
  workFunctionEv: number,
  intensity = 0.6,
  biasV = 0,
): PhotoelectricState {
  if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0)
    throw new RangeError('wavelength must be positive');
  if (!Number.isFinite(workFunctionEv) || workFunctionEv <= 0)
    throw new RangeError('work function must be positive');
  const photonEnergyEv = HC_EV_NM / wavelengthNm,
    thresholdWavelengthNm = HC_EV_NM / workFunctionEv,
    maxKineticEnergyEv = Math.max(0, photonEnergyEv - workFunctionEv),
    emits = maxKineticEnergyEv > 0,
    stoppingPotentialV = maxKineticEnergyEv;
  const saturation = Math.max(0, Math.min(1, intensity)),
    collection = biasV >= 0 ? 1 : Math.max(0, 1 + biasV / Math.max(0.001, stoppingPotentialV));
  return {
    wavelengthNm,
    photonEnergyEv,
    workFunctionEv,
    thresholdWavelengthNm,
    emits,
    maxKineticEnergyEv,
    stoppingPotentialV,
    relativeCurrent: emits ? saturation * collection : 0,
  };
}
