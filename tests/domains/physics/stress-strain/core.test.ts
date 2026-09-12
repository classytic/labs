/**
 * Deformation of solids (9702 ch. 6). Two things are pinned here.
 *
 * 1. The arithmetic of the worked example a learner can check by hand: a 2.0 m steel wire of
 *    diameter 0.60 mm under 40 N.
 * 2. The claim the whole lab is built on: with the same material, wires of different diameter
 *    and different original length give the SAME stress-strain gradient, exactly, while their
 *    force-extension gradients differ.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MATERIALS,
  areaOf,
  limitStrain,
  material,
  plotStrainMax,
  plotStressMax,
  stressStrainCurve,
  wireState,
} from '../../../../src/physics/stress-strain/core.js';
import StressStrainLab from '../../../../src/domains/physics/stress-strain/runtime.js';

const steel = material('steel');

describe('wire under load: the worked example', () => {
  const state = wireState({ material: steel, diameterMm: 0.6, lengthM: 2, loadN: 40 });

  it('area A = pi (0.30 mm)^2 = 2.827e-7 m^2', () => {
    expect(state.areaM2).toBeCloseTo(2.827e-7, 10);
  });

  it('stress = F/A = 1.415e8 Pa', () => {
    expect(state.stressPa / 1e8).toBeCloseTo(1.4147, 3);
  });

  it('strain = stress/E = 6.74e-4', () => {
    expect(state.strain * 1e4).toBeCloseTo(6.7367, 3);
  });

  it('extension = strain x L = 1.35 mm', () => {
    expect(state.extensionM * 1000).toBeCloseTo(1.347, 3);
  });

  it('k = A E / L = F / x = 2.97e4 N/m', () => {
    expect(state.springConstantNPerM).toBeCloseTo(40 / state.extensionM, 6);
    expect(state.springConstantNPerM / 1e4).toBeCloseTo(2.9688, 3);
  });

  it('stored energy is the triangle 1/2 F x while the graph is straight', () => {
    expect(state.beyondLimit).toBe(false);
    expect(state.energyJ).toBeCloseTo(0.5 * 40 * state.extensionM, 12);
    expect(state.energyJ).toBeCloseTo(0.026947, 6);
  });

  it('the limit of proportionality for this wire is 70.7 N and 2.38 mm', () => {
    expect(state.limitLoadN).toBeCloseTo(70.686, 3);
    expect(state.limitExtensionM * 1000).toBeCloseTo(2.381, 3);
  });
});

describe('E belongs to the material, k belongs to the wire', () => {
  const thin = wireState({ material: steel, diameterMm: 0.3, lengthM: 2, loadN: 5 });
  const thick = wireState({ material: steel, diameterMm: 1.2, lengthM: 3.5, loadN: 5 });

  it('the same material gives an identical stress-strain gradient', () => {
    // gradient of the sigma-epsilon graph, measured the way a learner would
    expect(thin.stressPa / thin.strain).toBeCloseTo(thick.stressPa / thick.strain, 6);
    expect(thin.stressPa / thin.strain).toBeCloseTo(steel.E, 6);
    expect(thin.youngModulusPa).toBe(thick.youngModulusPa);
  });

  it('the same material gives DIFFERENT force-extension gradients', () => {
    expect(thin.springConstantNPerM).not.toBeCloseTo(thick.springConstantNPerM, 0);
    // k = A E / L: 16 times the area over 1.75 times the length
    expect(thick.springConstantNPerM / thin.springConstantNPerM).toBeCloseTo(16 / 1.75, 6);
  });

  it('the plotted curve and both of its axis ranges are identical for any wire', () => {
    // The curve is a pure function of the material, so no wire dimension can reach it.
    expect(stressStrainCurve(steel)).toEqual(stressStrainCurve(material('steel')));
    expect(plotStrainMax(steel)).toBe(plotStrainMax(material('steel')));
    expect(plotStressMax(steel)).toBe(plotStressMax(material('steel')));
  });

  it('every material has a positive modulus and a limit strain under one percent', () => {
    for (const m of MATERIALS) {
      expect(m.E).toBeGreaterThan(1e10);
      expect(limitStrain(m)).toBeGreaterThan(0);
      expect(limitStrain(m)).toBeLessThan(0.01);
    }
  });
});

describe('beyond the limit', () => {
  it('steel keeps stretching past the limit of proportionality', () => {
    const past = wireState({ material: steel, diameterMm: 0.6, lengthM: 2, loadN: 90 });
    expect(past.beyondLimit).toBe(true);
    expect(past.broken).toBe(false);
    expect(past.extensionM).toBeGreaterThan(past.limitExtensionM);
    // the bent part stores more than the triangle would
    expect(past.energyJ).toBeGreaterThan(0.5 * 40 * past.limitExtensionM);
  });

  it('glass snaps instead: its strain stops at the limit', () => {
    const glass = material('glass');
    const snapped = wireState({ material: glass, diameterMm: 0.6, lengthM: 2, loadN: 90 });
    expect(snapped.broken).toBe(true);
    expect(snapped.strain).toBeCloseTo(limitStrain(glass), 12);
    expect(areaOf(0.6)).toBeCloseTo(2.827e-7, 10);
  });
});

describe('runtime', () => {
  it('renders from authored attributes without throwing', () => {
    const markup = renderToStaticMarkup(
      createElement(StressStrainLab, {
        material: 'copper',
        diameterMm: 0.8,
        lengthM: 1.5,
        loadN: 20,
        graph: 'stress-strain',
      }),
    );
    expect(markup).toContain('copper');
  });

  /**
   * The drawn proof, not just the arithmetic: two different wires of the same material must
   * produce the SAME plotted path in stress-strain mode, and different paths in the other mode.
   */
  const paths = (attrs: Record<string, unknown>): string[] =>
    Array.from(renderToStaticMarkup(createElement(StressStrainLab, attrs)).matchAll(/ d="([^"]+)"/g)).map(
      (m) => m[1] as string,
    );

  it('the stress-strain curve is drawn at identical coordinates for two different wires', () => {
    const a = paths({ material: 'steel', diameterMm: 0.3, lengthM: 1, loadN: 5, graph: 'stress-strain' });
    const b = paths({ material: 'steel', diameterMm: 1.5, lengthM: 3, loadN: 5, graph: 'stress-strain' });
    // The clamp, the wire and the load block differ, so compare the longest path: the curve.
    const longest = (list: string[]): string => list.reduce((x, y) => (y.length > x.length ? y : x), '');
    expect(longest(a)).toBe(longest(b));
    expect(longest(a).length).toBeGreaterThan(200);
  });

  it('the force-extension curve is NOT drawn at identical coordinates for those wires', () => {
    const longest = (list: string[]): string => list.reduce((x, y) => (y.length > x.length ? y : x), '');
    const a = paths({ material: 'steel', diameterMm: 0.3, lengthM: 1, loadN: 5, graph: 'force-extension' });
    const b = paths({ material: 'steel', diameterMm: 1.5, lengthM: 3, loadN: 5, graph: 'force-extension' });
    expect(longest(a)).not.toBe(longest(b));
  });
});
