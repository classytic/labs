export interface MinimumUncertaintyPacket {
  sigmaX: number;
  sigmaP: number;
  product: number;
  hbar: number;
}

export function minimumUncertaintyPacket(sigmaX: number, hbar = 1): MinimumUncertaintyPacket {
  if (!Number.isFinite(sigmaX) || sigmaX <= 0) throw new RangeError('position spread must be positive');
  if (!Number.isFinite(hbar) || hbar <= 0) throw new RangeError('hbar must be positive');
  const sigmaP = hbar / (2 * sigmaX);
  return { sigmaX, sigmaP, product: sigmaX * sigmaP, hbar };
}

export function gaussianProbability(value: number, sigma: number): number {
  if (!Number.isFinite(sigma) || sigma <= 0) throw new RangeError('spread must be positive');
  return Math.exp(-0.5 * Math.pow(value / sigma, 2));
}
