export const XRAY_MATERIALS = {
  softTissue: { label: 'soft tissue', muAt60Kev: 0.21, energyExponent: 0.55 },
  bone: { label: 'bone', muAt60Kev: 0.55, energyExponent: 1.35 },
  aluminium: { label: 'aluminium', muAt60Kev: 0.75, energyExponent: 1.7 },
} as const;

export type XrayMaterialId = keyof typeof XRAY_MATERIALS;

export interface AttenuationLayer {
  muCmInv: number;
  thicknessCm: number;
}

export interface XrayImageState {
  energyKev: number;
  tissueTransmission: number;
  bonePathTransmission: number;
  detectorContrast: number;
}

export interface XrayPhoton {
  id: number;
  attenuationSample: number;
  laneOffset: number;
}

export interface XrayPhotonState extends XrayPhoton {
  pathProgress: number;
  absorbed: boolean;
  detected: boolean;
}

export interface XrayExposureState {
  progress: number;
  tissuePhotons: XrayPhotonState[];
  bonePhotons: XrayPhotonState[];
  tissueDetected: number;
  boneDetected: number;
}

export function transmittedFraction(layers: readonly AttenuationLayer[]): number {
  const opticalDepth = layers.reduce((sum, layer) => {
    if (!Number.isFinite(layer.muCmInv) || layer.muCmInv < 0)
      throw new RangeError('attenuation coefficient must be non-negative');
    if (!Number.isFinite(layer.thicknessCm) || layer.thicknessCm < 0)
      throw new RangeError('layer thickness must be non-negative');
    return sum + layer.muCmInv * layer.thicknessCm;
  }, 0);
  return Math.exp(-opticalDepth);
}

/** Educational interpolation around 60 keV; use authored coefficients for quantitative work. */
export function illustrativeMu(material: XrayMaterialId, energyKev: number): number {
  if (!Number.isFinite(energyKev) || energyKev <= 0) throw new RangeError('photon energy must be positive');
  const materialData = XRAY_MATERIALS[material];
  return materialData.muAt60Kev * Math.pow(60 / energyKev, materialData.energyExponent);
}

export function xrayImageState(
  energyKev: number,
  tissueThicknessCm: number,
  boneThicknessCm: number,
): XrayImageState {
  const tissueMu = illustrativeMu('softTissue', energyKev);
  const boneMu = illustrativeMu('bone', energyKev);
  const tissueTransmission = transmittedFraction([{ muCmInv: tissueMu, thicknessCm: tissueThicknessCm }]);
  const bonePathTransmission = transmittedFraction([
    { muCmInv: tissueMu, thicknessCm: tissueThicknessCm },
    { muCmInv: boneMu, thicknessCm: boneThicknessCm },
  ]);
  return {
    energyKev,
    tissueTransmission,
    bonePathTransmission,
    detectorContrast: tissueTransmission - bonePathTransmission,
  };
}

/** Stable stratified photons avoid random SSR output and permit fair path comparisons. */
export function createXrayPhotonCohort(count = 30): XrayPhoton[] {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('photon count must be a positive integer');
  return Array.from({ length: count }, (_, id) => ({
    id,
    attenuationSample: (id + 0.5) / count,
    laneOffset: (((id * 19) % count) / Math.max(1, count - 1) - 0.5) * 42,
  }));
}

function photonAt(photon: XrayPhoton, transmission: number, progress: number): XrayPhotonState {
  const opticalDepth = -Math.log(Math.max(Number.EPSILON, transmission));
  const absorptionDepth = -Math.log(1 - photon.attenuationSample);
  const materialDepth = opticalDepth === 0 ? 1 : Math.min(1, absorptionDepth / opticalDepth);
  const absorbed = materialDepth < 1;
  const absorptionProgress = absorbed ? 0.36 + materialDepth * 0.28 : 1;
  return {
    ...photon,
    pathProgress: Math.min(progress, absorptionProgress),
    absorbed: absorbed && progress >= absorptionProgress,
    detected: !absorbed && progress >= 1,
  };
}

export function xrayExposureAt(
  state: XrayImageState,
  cohort: readonly XrayPhoton[],
  progress: number,
): XrayExposureState {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const tissuePhotons = cohort.map((photon) => photonAt(photon, state.tissueTransmission, p));
  const bonePhotons = cohort.map((photon) => photonAt(photon, state.bonePathTransmission, p));
  return {
    progress: p,
    tissuePhotons,
    bonePhotons,
    tissueDetected: tissuePhotons.filter((photon) => photon.detected).length,
    boneDetected: bonePhotons.filter((photon) => photon.detected).length,
  };
}
