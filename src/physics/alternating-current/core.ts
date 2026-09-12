/**
 * Alternating currents (Cambridge International A Level Physics 9702, chapter 21).
 *
 * A sinusoidal supply v(t) = V0 sin(2 pi f t) drives a resistor R, so i(t) = v(t) / R. Three
 * ideas live here, and only the middle one is hard:
 *
 *   period and peak   T = 1/f, and v and i share the same shape because R is constant
 *   r.m.s.            V_rms = V0 / sqrt(2), DEFINED by equal heating, not by averaging v
 *   rectification     one diode keeps half the wave, a bridge folds the whole wave up, and a
 *                     capacitor across the load turns the ripple into a nearly steady line
 *
 * The r.m.s. part is the reason this file exists. The mean of v over a whole cycle is zero, so
 * averaging the wave tells a learner nothing. What is NOT zero is the mean of v squared, because
 * squaring makes every value positive. Power is v squared over R, so the mean of v squared is
 * what sets the heating. Take the root of that mean and you have the steady d.c. voltage that
 * would heat the same resistor at the same rate: root, of the mean, of the square.
 *
 * `meanSquareFromPeak` returns the exact answer V0^2 / 2. `meanSquareByIntegration` returns the
 * SAME number by adding up v^2 across one period with Simpson's rule, reading nothing from the
 * algebra. The lab draws the integrated value, so the horizontal line on the graph is a measured
 * mean and not a formula redrawn as a line.
 *
 * Everything here is pure, deterministic and React-free, so it can be tested directly.
 */

export interface AcSupply {
  /** Peak (maximum) voltage V0, in volts. */
  peakVoltageV: number;
  /** Frequency f, in hertz. */
  frequencyHz: number;
  /** Load resistance R, in ohms. */
  resistanceOhm: number;
}

/** One diode keeps the positive halves; a bridge of four folds the negative halves up. */
export type RectifierMode = 'half' | 'full';

/** Period of the supply, T = 1 / f, in seconds. */
export function acPeriodS(frequencyHz: number): number {
  return 1 / frequencyHz;
}

/** v(t) = V0 sin(2 pi f t), in volts. */
export function acVoltageAt(supply: AcSupply, t: number): number {
  return supply.peakVoltageV * Math.sin(2 * Math.PI * supply.frequencyHz * t);
}

/** i(t) = v(t) / R, in amperes. In phase with v, because a resistor has no phase shift. */
export function acCurrentAt(supply: AcSupply, t: number): number {
  return acVoltageAt(supply, t) / supply.resistanceOhm;
}

/** The r.m.s. value of a SINUSOID from its peak: peak / sqrt(2). Works for volts and amps. */
export function rmsFromPeak(peak: number): number {
  return peak / Math.SQRT2;
}

/** The mean of v^2 over a whole cycle, from the algebra: V0^2 / 2. */
export function meanSquareFromPeak(peak: number): number {
  return (peak * peak) / 2;
}

/**
 * The integral of v^2 over ONE whole period, in V^2 s, by Simpson's rule.
 *
 * This is the honest route to the mean square: no identity for sin^2 is used anywhere. The exact
 * answer is V0^2 T / 2, and Simpson's rule on a smooth periodic function reaches it to far more
 * figures than the lab ever prints. `intervals` is rounded up to an even number, as Simpson's
 * rule requires.
 */
export function integrateSquareOverPeriod(
  peakVoltageV: number,
  frequencyHz: number,
  intervals = 720,
): number {
  const n = Math.max(2, Math.ceil(intervals / 2) * 2);
  const T = acPeriodS(frequencyHz);
  const h = T / n;
  const square = (t: number): number => {
    const v = peakVoltageV * Math.sin(2 * Math.PI * frequencyHz * t);
    return v * v;
  };
  let sum = square(0) + square(T);
  for (let k = 1; k < n; k++) sum += square(k * h) * (k % 2 === 1 ? 4 : 2);
  return (h / 3) * sum;
}

/** The mean of v^2 over one period, measured by integration: (integral over T) / T. */
export function meanSquareByIntegration(peakVoltageV: number, frequencyHz: number, intervals = 720): number {
  return integrateSquareOverPeriod(peakVoltageV, frequencyHz, intervals) / acPeriodS(frequencyHz);
}

/**
 * Mean power delivered to R, in watts.
 *
 * P_mean = V_rms^2 / R = V0^2 / (2 R), which is exactly HALF the peak power. This single number
 * is what r.m.s. is for: a steady d.c. supply of V_rms volts across the same R delivers it too.
 */
export function meanAcPowerW(supply: AcSupply): number {
  return (supply.peakVoltageV * supply.peakVoltageV) / (2 * supply.resistanceOhm);
}

export interface AcState {
  /** Period T = 1/f, s. */
  periodS: number;
  peakVoltageV: number;
  /** I0 = V0 / R, A. */
  peakCurrentA: number;
  /** V_rms = V0 / sqrt(2), V. */
  rmsVoltageV: number;
  /** I_rms = I0 / sqrt(2) = V_rms / R, A. */
  rmsCurrentA: number;
  /** Mean of v^2 over a cycle, measured by integration, V^2. */
  meanSquareVoltageV2: number;
  /** Mean of v^2 from the algebra, V0^2 / 2, V^2. The two agree; the lab shows both. */
  meanSquareExactV2: number;
  /** Mean power into R, W. */
  meanPowerW: number;
  /** Peak power into R, V0^2 / R, W. Twice the mean. */
  peakPowerW: number;
}

/** Everything the lab reads off one supply driving one resistor. */
export function acState(supply: AcSupply): AcState {
  const { peakVoltageV, frequencyHz, resistanceOhm } = supply;
  const rmsVoltageV = rmsFromPeak(peakVoltageV);
  return {
    periodS: acPeriodS(frequencyHz),
    peakVoltageV,
    peakCurrentA: peakVoltageV / resistanceOhm,
    rmsVoltageV,
    rmsCurrentA: rmsVoltageV / resistanceOhm,
    meanSquareVoltageV2: meanSquareByIntegration(peakVoltageV, frequencyHz),
    meanSquareExactV2: meanSquareFromPeak(peakVoltageV),
    meanPowerW: meanAcPowerW(supply),
    peakPowerW: (peakVoltageV * peakVoltageV) / resistanceOhm,
  };
}

export interface WavePoint {
  /** Time, s. */
  t: number;
  /** Supply voltage, V. */
  v: number;
  /** Current in R, A. */
  i: number;
}

/** The supply sampled over whole cycles. Deterministic: the same input gives the same points. */
export function acWaveTrace(supply: AcSupply, cycles = 2, samplesPerCycle = 120): WavePoint[] {
  const n = Math.max(4, Math.round(samplesPerCycle));
  const steps = Math.max(1, Math.round(cycles)) * n;
  const dt = acPeriodS(supply.frequencyHz) / n;
  const points: WavePoint[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = k * dt;
    const v = acVoltageAt(supply, t);
    points.push({ t, v, i: v / supply.resistanceOhm });
  }
  return points;
}

/** What the diodes let through: half-wave keeps v when positive, full-wave folds it up. */
export function rectify(v: number, mode: RectifierMode): number {
  return mode === 'half' ? Math.max(0, v) : Math.abs(v);
}

/**
 * Mean of the rectified output over a whole cycle, with no smoothing capacitor.
 *
 * Half-wave gives V0 / pi (0.318 V0), because half the cycle is flat zero. Full-wave gives
 * 2 V0 / pi (0.637 V0). Neither is V_rms: this is a mean HEIGHT, not a heating value.
 */
export function meanRectifiedVoltage(peakVoltageV: number, mode: RectifierMode): number {
  return mode === 'half' ? peakVoltageV / Math.PI : (2 * peakVoltageV) / Math.PI;
}

/** The ripple repeats once per cycle after one diode, twice per cycle after a bridge. */
export function rippleFrequencyHz(frequencyHz: number, mode: RectifierMode): number {
  return mode === 'half' ? frequencyHz : 2 * frequencyHz;
}

export interface RectifiedPoint {
  /** Time, s. */
  t: number;
  /** Supply voltage before the diodes, V. */
  input: number;
  /** Diode output with no capacitor, V. */
  rectified: number;
  /** Voltage across the load with the smoothing capacitor fitted, V. */
  output: number;
}

export interface RectifiedTrace {
  points: RectifiedPoint[];
  /** Largest output voltage in the last whole cycle, V. */
  maxV: number;
  /** Smallest output voltage in the last whole cycle, V. */
  minV: number;
  /** Peak-to-peak ripple in the last whole cycle, V. */
  rippleV: number;
  /** Mean output over the last whole cycle, V. */
  meanV: number;
  /** How often the output dips, Hz. */
  rippleFrequencyHz: number;
  /** Time constant R C, s. Compare it with the period: large R C means small ripple. */
  timeConstantS: number;
}

export interface RectifiedInput {
  supply: AcSupply;
  /** Smoothing capacitance across the load, farads. Zero means no capacitor. */
  capacitanceF: number;
  rectifier: RectifierMode;
  cycles?: number;
  samplesPerCycle?: number;
}

/**
 * The load voltage after rectification, with an ideal peak-detector capacitor.
 *
 * The model is the one a textbook draws: while the rectified wave is above the capacitor
 * voltage the diodes conduct and the capacitor follows the wave up; once the wave falls away
 * the diodes stop conducting and the capacitor discharges through R, decaying by
 * exp(-dt / RC) each step. So the output is
 *
 *   v_out(t) = max( rectified(t), v_out(t - dt) * exp(-dt / RC) )
 *
 * With no capacitor RC is zero, the decay factor is zero, and the output is the bare rectified
 * wave. Charging is instantaneous here (ideal diodes, no series resistance), so the trace is in
 * its steady state from the first peak onward, which is why the ripple and the mean are measured
 * over the LAST whole cycle. Nothing random and nothing clock-based: same input, same trace.
 */
export function acRectifiedTrace({
  supply,
  capacitanceF,
  rectifier,
  cycles = 2,
  samplesPerCycle = 180,
}: RectifiedInput): RectifiedTrace {
  const n = Math.max(8, Math.round(samplesPerCycle));
  const steps = Math.max(1, Math.round(cycles)) * n;
  const T = acPeriodS(supply.frequencyHz);
  const dt = T / n;
  const timeConstantS = supply.resistanceOhm * capacitanceF;
  // capacitanceF === 0 gives dt / 0 = Infinity, so the factor is exactly 0: no smoothing at all.
  const decay = timeConstantS > 0 ? Math.exp(-dt / timeConstantS) : 0;
  const points: RectifiedPoint[] = [];
  let held = 0;
  for (let k = 0; k <= steps; k++) {
    const t = k * dt;
    const input = acVoltageAt(supply, t);
    const rectified = rectify(input, rectifier);
    held = Math.max(rectified, held * decay);
    points.push({ t, input, rectified, output: held });
  }
  // The last whole cycle, endpoint excluded so no sample is counted twice.
  const window = points.slice(steps - n, steps).map((p) => p.output);
  const maxV = Math.max(...window);
  const minV = Math.min(...window);
  return {
    points,
    maxV,
    minV,
    rippleV: maxV - minV,
    meanV: window.reduce((sum, v) => sum + v, 0) / window.length,
    rippleFrequencyHz: rippleFrequencyHz(supply.frequencyHz, rectifier),
    timeConstantS,
  };
}
