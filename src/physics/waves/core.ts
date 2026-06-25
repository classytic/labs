/**
 * Wave kernel — the pure maths every waves lab trusts. A travelling wave is
 * y(x,t) = A·sin(kx − ωt + φ) with k = 2π/λ (spatial) and ω = 2πf (temporal); its
 * speed is v = fλ (one wavelength passes every period). Two equal waves going
 * opposite ways add to a STANDING wave 2A·sin(kx)·cos(ωt) — fixed nodes (always 0)
 * and antinodes (max swing); a string clamped both ends fits n half-wavelengths in
 * its length L (harmonic n ⇒ λ = 2L/n). Superposing two near frequencies gives
 * BEATS at |f₁−f₂|. The labs render these; they never re-derive them.
 */

export interface WaveSpec { amp: number; wavelength: number; freq: number; phase?: number }

export const waveK = (wavelength: number): number => (2 * Math.PI) / wavelength;
export const waveOmega = (freq: number): number => 2 * Math.PI * freq;
export const speed = (w: WaveSpec): number => w.freq * w.wavelength;     // v = fλ
export const period = (freq: number): number => (freq ? 1 / freq : Infinity);

/** Displacement of one travelling wave at position x, time t. */
export function waveY(w: WaveSpec, x: number, t: number): number {
  return w.amp * Math.sin(waveK(w.wavelength) * x - waveOmega(w.freq) * t + (w.phase ?? 0));
}

/** Superposition: the sum of several waves at (x,t). */
export function sumY(ws: WaveSpec[], x: number, t: number): number {
  return ws.reduce((s, w) => s + waveY(w, x, t), 0);
}

/** Standing wave on a string of length L, harmonic n: 2A·sin(kx)·cos(ωt). */
export function standingY(amp: number, L: number, n: number, freq: number, x: number, t: number): number {
  const k = (n * Math.PI) / L;
  return 2 * amp * Math.sin(k * x) * Math.cos(waveOmega(freq) * t);
}

/** The harmonic wavelength for a string fixed at both ends: λ = 2L/n. */
export const harmonicWavelength = (L: number, n: number): number => (2 * L) / n;

/** Node positions (displacement always 0) for harmonic n on [0, L]: x = mL/n. */
export function nodes(L: number, n: number): number[] {
  return Array.from({ length: n + 1 }, (_, m) => (m * L) / n);
}

/** Antinode positions (max swing) for harmonic n on [0, L]: x = (m+½)L/n. */
export function antinodes(L: number, n: number): number[] {
  return Array.from({ length: n }, (_, m) => ((m + 0.5) * L) / n);
}

/** Beat frequency when two close tones overlap: |f₁ − f₂|. */
export const beatFreq = (f1: number, f2: number): number => Math.abs(f1 - f2);
