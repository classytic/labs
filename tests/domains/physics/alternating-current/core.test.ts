/**
 * Alternating currents (9702 ch. 21). Three things are pinned here.
 *
 * 1. The mains numbers a learner can check by hand: a 325 V peak supply at 50 Hz across 50 ohms
 *    gives V_rms = 230 V and a mean power of 1056 W.
 * 2. The claim the r.m.s. view is built on: the mean of v squared, added up across one whole
 *    period with no use of any trigonometric identity, equals V0 squared over 2.
 * 3. Rectification means: full-wave has a mean of 2 V0 / pi, half-wave V0 / pi, and a smoothing
 *    capacitor cuts the ripple as the capacitance rises.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  acPeriodS,
  acRectifiedTrace,
  acState,
  acVoltageAt,
  acWaveTrace,
  integrateSquareOverPeriod,
  meanAcPowerW,
  meanRectifiedVoltage,
  meanSquareByIntegration,
  meanSquareFromPeak,
  rectify,
  rippleFrequencyHz,
  rmsFromPeak,
  type AcSupply,
} from '../../../../src/physics/alternating-current/core.js';
import AlternatingCurrentLab from '../../../../src/domains/physics/alternating-current/runtime.js';

const mains: AcSupply = { peakVoltageV: 325, frequencyHz: 50, resistanceOhm: 50 };

describe('the mains supply: the worked example', () => {
  const state = acState(mains);

  it('period T = 1/f = 20 ms', () => {
    expect(acPeriodS(50)).toBeCloseTo(0.02, 12);
    expect(state.periodS * 1000).toBeCloseTo(20, 9);
  });

  it('V_rms = V0 / sqrt(2) = 229.8 V', () => {
    expect(state.rmsVoltageV).toBeCloseTo(229.8097, 4);
    expect(rmsFromPeak(325)).toBeCloseTo(325 / Math.SQRT2, 12);
  });

  it('peak current I0 = V0/R = 6.5 A and I_rms = 4.60 A', () => {
    expect(state.peakCurrentA).toBeCloseTo(6.5, 12);
    expect(state.rmsCurrentA).toBeCloseTo(4.5962, 4);
  });

  it('mean power = V0^2 / (2R) = 1056 W, half the peak power', () => {
    expect(state.meanPowerW).toBeCloseTo(1056.25, 9);
    expect(meanAcPowerW(mains)).toBeCloseTo(1056.25, 9);
    expect(state.peakPowerW).toBeCloseTo(2 * state.meanPowerW, 9);
  });

  it('v(t) peaks a quarter of a period in and is zero at 0 and T/2', () => {
    expect(acVoltageAt(mains, 0)).toBeCloseTo(0, 12);
    expect(acVoltageAt(mains, 0.005)).toBeCloseTo(325, 9);
    expect(acVoltageAt(mains, 0.01)).toBeCloseTo(0, 9);
    expect(acVoltageAt(mains, 0.015)).toBeCloseTo(-325, 9);
  });
});

describe('r.m.s. is the ROOT of the MEAN of the SQUARE, counted off the wave', () => {
  it('integrating v^2 over one whole period gives V0^2 T / 2 = 1056.25 V^2 s', () => {
    const integral = integrateSquareOverPeriod(325, 50);
    expect(integral).toBeCloseTo((325 * 325 * 0.02) / 2, 6);
    expect(integral).toBeCloseTo(1056.25, 6);
  });

  it('the integrated mean square equals V0^2 / 2 = 52 812.5 V^2', () => {
    const measured = meanSquareByIntegration(325, 50);
    expect(measured).toBeCloseTo(meanSquareFromPeak(325), 6);
    expect(measured).toBeCloseTo(52812.5, 6);
    // three significant figures is the bar the lab prints at
    expect(Number(measured.toPrecision(3))).toBe(Number((52812.5).toPrecision(3)));
  });

  it('the root of that mean is V_rms, for any peak and any frequency', () => {
    for (const [peak, f] of [
      [325, 50],
      [12, 60],
      [400, 5],
      [5, 200],
    ] as const) {
      expect(Math.sqrt(meanSquareByIntegration(peak, f))).toBeCloseTo(rmsFromPeak(peak), 6);
    }
  });

  it('the mean of v itself is zero, which is why it cannot be the heating value', () => {
    const points = acWaveTrace(mains, 1, 720);
    // drop the duplicated endpoint so no sample is counted twice
    const cycle = points.slice(0, points.length - 1);
    const mean = cycle.reduce((sum, p) => sum + p.v, 0) / cycle.length;
    expect(Math.abs(mean)).toBeLessThan(1e-9);
  });

  it('the mean power equals V_rms^2 / R, which is what "equal heating" means', () => {
    const state = acState(mains);
    expect((state.rmsVoltageV * state.rmsVoltageV) / mains.resistanceOhm).toBeCloseTo(state.meanPowerW, 6);
  });
});

describe('rectification', () => {
  it('one diode keeps the positive halves; a bridge folds the negative ones up', () => {
    expect(rectify(-200, 'half')).toBe(0);
    expect(rectify(-200, 'full')).toBe(200);
    expect(rectify(200, 'half')).toBe(200);
  });

  it('the mean of the bare rectified wave is 2 V0 / pi (full) and V0 / pi (half)', () => {
    expect(meanRectifiedVoltage(325, 'full')).toBeCloseTo((2 * 325) / Math.PI, 12);
    expect(meanRectifiedVoltage(325, 'full')).toBeCloseTo(206.9, 1);
    expect(meanRectifiedVoltage(325, 'half')).toBeCloseTo(325 / Math.PI, 12);
    expect(meanRectifiedVoltage(325, 'full') / 325).toBeCloseTo(0.6366, 4);
    // it is NOT the r.m.s. value: 0.637 V0 against 0.707 V0
    expect(meanRectifiedVoltage(325, 'full')).not.toBeCloseTo(rmsFromPeak(325), 0);
  });

  it('the ripple repeats once per cycle after a diode, twice after a bridge', () => {
    expect(rippleFrequencyHz(50, 'half')).toBe(50);
    expect(rippleFrequencyHz(50, 'full')).toBe(100);
  });

  it('with no capacitor the traced mean matches 2 V0 / pi', () => {
    const trace = acRectifiedTrace({ supply: mains, capacitanceF: 0, rectifier: 'full' });
    expect(trace.meanV).toBeCloseTo(meanRectifiedVoltage(325, 'full'), 1);
    expect(trace.rippleV).toBeCloseTo(325, 0);
    expect(trace.points.every((p) => p.output >= 0)).toBe(true);
  });

  it('with no capacitor the half-wave mean matches V0 / pi', () => {
    const trace = acRectifiedTrace({ supply: mains, capacitanceF: 0, rectifier: 'half' });
    expect(trace.meanV).toBeCloseTo(meanRectifiedVoltage(325, 'half'), 1);
  });

  it('more capacitance means less ripple and a mean closer to the peak', () => {
    const none = acRectifiedTrace({ supply: mains, capacitanceF: 0, rectifier: 'full' });
    const some = acRectifiedTrace({ supply: mains, capacitanceF: 1e-3, rectifier: 'full' });
    const lots = acRectifiedTrace({ supply: mains, capacitanceF: 5e-3, rectifier: 'full' });
    expect(some.rippleV).toBeLessThan(none.rippleV);
    expect(lots.rippleV).toBeLessThan(some.rippleV);
    expect(lots.meanV).toBeGreaterThan(some.meanV);
    expect(lots.meanV).toBeLessThan(325);
    expect(lots.maxV).toBeCloseTo(325, 0);
  });

  it('is deterministic: the same input gives an identical trace', () => {
    const a = acRectifiedTrace({ supply: mains, capacitanceF: 1e-3, rectifier: 'full' });
    const b = acRectifiedTrace({ supply: mains, capacitanceF: 1e-3, rectifier: 'full' });
    expect(a.points).toEqual(b.points);
  });
});

describe('runtime', () => {
  it('renders from authored attributes without throwing', () => {
    const markup = renderToStaticMarkup(
      createElement(AlternatingCurrentLab, {
        peakVoltageV: 325,
        frequencyHz: 50,
        resistanceOhm: 50,
        view: 'rms',
      }),
    );
    // the readouts print what the model computes: V_rms = 229.8 V and a mean square of 52 813 V²
    expect(markup).toContain('229.8');
    expect(markup).toContain('52 813');
    expect(markup).toContain('1056');
  });

  it('draws a different set of paths in each view', () => {
    const paths = (attrs: Record<string, unknown>): string =>
      Array.from(renderToStaticMarkup(createElement(AlternatingCurrentLab, attrs)).matchAll(/ d="([^"]+)"/g))
        .map((m) => m[1] as string)
        .join('|');
    const waveform = paths({ view: 'waveform' });
    const rms = paths({ view: 'rms' });
    const rectification = paths({ view: 'rectification' });
    expect(waveform).not.toBe(rms);
    expect(rms).not.toBe(rectification);
    expect(waveform.length).toBeGreaterThan(500);
  });
});
