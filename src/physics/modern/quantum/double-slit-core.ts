export interface SlitSetup {
  wavelengthNm: number;
  slitSeparationUm: number;
  slitWidthUm: number;
  screenDistanceM: number;
  whichPath: boolean;
}
interface SlitSample {
  positionMm: number;
  bin: number;
}
export function slitIntensity(positionMm: number, s: SlitSetup): number {
  const y = positionMm / 1000,
    lambda = s.wavelengthNm * 1e-9,
    d = s.slitSeparationUm * 1e-6,
    a = s.slitWidthUm * 1e-6,
    theta = Math.atan2(y, s.screenDistanceM),
    alpha = (Math.PI * a * Math.sin(theta)) / lambda,
    beta = (Math.PI * d * Math.sin(theta)) / lambda,
    envelope = alpha === 0 ? 1 : (Math.sin(alpha) / alpha) ** 2,
    fringes = s.whichPath ? 1 : (1 + Math.cos(2 * beta)) / 2;
  return envelope * fringes;
}
function random(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
export function sampleSlitDetections(count: number, setup: SlitSetup, bins = 101, seed = 17): SlitSample[] {
  const weights = Array.from({ length: bins }, (_, i) => slitIntensity(-40 + (80 * i) / (bins - 1), setup)),
    total = weights.reduce((a, b) => a + b, 0),
    cdf: number[] = [];
  weights.reduce((a, w, i) => ((cdf[i] = a + w / total), a + w / total), 0);
  return Array.from({ length: Math.max(0, Math.min(5000, Math.floor(count))) }, (_, i) => {
    const r = random(seed + i),
      bin = Math.max(
        0,
        cdf.findIndex((v) => v >= r),
      );
    return { bin, positionMm: -40 + (80 * bin) / (bins - 1) };
  });
}
export function fringeSpacingMm(s: SlitSetup): number {
  return ((s.wavelengthNm * 1e-9 * s.screenDistanceM) / (s.slitSeparationUm * 1e-6)) * 1000;
}
