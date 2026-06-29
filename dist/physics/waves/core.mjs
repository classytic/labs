//#region src/physics/waves/core.ts
const waveK = (wavelength) => 2 * Math.PI / wavelength;
const waveOmega = (freq) => 2 * Math.PI * freq;
const speed = (w) => w.freq * w.wavelength;
const period = (freq) => freq ? 1 / freq : Infinity;
/** Displacement of one travelling wave at position x, time t. */
function waveY(w, x, t) {
	return w.amp * Math.sin(waveK(w.wavelength) * x - waveOmega(w.freq) * t + (w.phase ?? 0));
}
/** Superposition: the sum of several waves at (x,t). */
function sumY(ws, x, t) {
	return ws.reduce((s, w) => s + waveY(w, x, t), 0);
}
/** Standing wave on a string of length L, harmonic n: 2A·sin(kx)·cos(ωt). */
function standingY(amp, L, n, freq, x, t) {
	const k = n * Math.PI / L;
	return 2 * amp * Math.sin(k * x) * Math.cos(waveOmega(freq) * t);
}
/** The harmonic wavelength for a string fixed at both ends: λ = 2L/n. */
const harmonicWavelength = (L, n) => 2 * L / n;
/** Node positions (displacement always 0) for harmonic n on [0, L]: x = mL/n. */
function nodes(L, n) {
	return Array.from({ length: n + 1 }, (_, m) => m * L / n);
}
/** Antinode positions (max swing) for harmonic n on [0, L]: x = (m+½)L/n. */
function antinodes(L, n) {
	return Array.from({ length: n }, (_, m) => (m + .5) * L / n);
}
/** Beat frequency when two close tones overlap: |f₁ − f₂|. */
const beatFreq = (f1, f2) => Math.abs(f1 - f2);

//#endregion
export { antinodes, beatFreq, harmonicWavelength, nodes, period, speed, standingY, sumY, waveOmega, waveY };