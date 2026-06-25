/**
 * Widget smoke tests — every shipped widget must MOUNT without throwing and put a
 * canvas (or content) on the page. Guards against import/runtime regressions that
 * typecheck can't catch (bad hooks, missing exports, broken render paths). We stub
 * the canvas 2D context + ResizeObserver since happy-dom has no real canvas.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
// Import the BUILT output — smoke-tests what actually ships, and sidesteps the
// vite `.js`→`.tsx` loader quirk. Requires `npm run build` first (prepublishOnly
// runs build before test).
import { Grapher, DerivativeExplorer, IntegralExplorer, LimitExplorer, GradientDescent, TrigExplorer } from '../dist/math/index.mjs';
import { ProjectileLab, OrbitLab, GravityDrop, RiverBoat } from '../dist/physics/index.mjs';
import { BohrAtom, ReactionProfile, ReactionLab, Battery } from '../dist/chem/index.mjs';
import { CircuitLab, CircuitBuilder } from '../dist/circuits/index.mjs';
import { IntersectingCircles, GeometryBoard } from '../dist/geometry/index.mjs';
import { Derivation } from '../dist/math/index.mjs';

beforeAll(() => {
  // no-op 2D context: any method → noop; getImageData → empty pixels
  const gradient = { addColorStop: () => {} };
  const ctx = new Proxy({}, {
    get: (_t, p) => {
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => gradient;
      return () => {};
    },
    set: () => true,
  });
  // @ts-expect-error test stub
  HTMLCanvasElement.prototype.getContext = () => ctx;
  if (typeof globalThis.ResizeObserver === 'undefined') {
    (globalThis as Record<string, unknown>).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
});

afterEach(() => cleanup());

const widgets: Array<[string, () => React.ReactElement]> = [
  ['Grapher', () => <Grapher equations={['a*sin(b*x)']} params={[{ name: 'a', min: 0, max: 3, value: 1 }]} />],
  ['DerivativeExplorer', () => <DerivativeExplorer equation="x^2" />],
  ['IntegralExplorer', () => <IntegralExplorer equation="0.4*x^2 + 0.5" />],
  ['LimitExplorer', () => <LimitExplorer equation="(x^2 - 1)/(x - 1)" />],
  ['GradientDescent', () => <GradientDescent equation="x^2 + 2*y^2" />],
  ['TrigExplorer', () => <TrigExplorer />],
  ['ProjectileLab', () => <ProjectileLab />],
  ['RiverBoat', () => <RiverBoat boatSpeed={4} current={2} />],
  ['OrbitLab', () => <OrbitLab />],
  ['GravityDrop', () => <GravityDrop />],
  ['BohrAtom', () => <BohrAtom protons={6} />],
  ['ReactionProfile', () => <ReactionProfile deltaH={-40} activationEnergy={60} />],
  ['ReactionLab', () => <ReactionLab a="H" b="Cl" />],
  ['Battery', () => <Battery emf={1.1} />],
  ['CircuitLab', () => <CircuitLab voltage={12} r1={100} r2={200} />],
  ['CircuitBuilder', () => <CircuitBuilder battery={6} components={[{ type: 'switch', closed: true }, { type: 'bulb', ohms: 12 }]} />],
  ['IntersectingCircles', () => <IntersectingCircles r1={3.2} r2={2.8} />],
  ['GeometryBoard', () => <GeometryBoard scene={[
    { type: 'point', id: 'A', x: 2, y: 0, draggable: true, label: 'A' },
    { type: 'point', id: 'B', x: 5, y: 0, draggable: true, label: 'B' },
    { type: 'circle', id: 'cA', center: 'A', radius: 2.5 },
    { type: 'circle', id: 'cB', center: 'B', radius: 2.5 },
    { type: 'intersect', id: 'P', of: ['cA', 'cB'], pick: 0, label: 'P' },
  ]} />],
];

describe('widget smoke', () => {
  for (const [name, make] of widgets) {
    it(`${name} mounts and renders a visual surface`, () => {
      const { container } = render(make());
      // canvas (legacy) OR svg (migrated to the stage engine)
      expect(container.querySelector('canvas, svg')).not.toBeNull();
    });
  }

  it('widgets surface a clear error for a malformed equation (no crash)', () => {
    const { container } = render(<Grapher equations={['2 +']} />);
    // bad equation → legend/error shown, still mounts
    expect(container.textContent).toBeTruthy();
  });

  it('Derivation mounts and renders its steps (no canvas — it is stepped LaTeX)', () => {
    const { container } = render(
      <Derivation steps={['a^2+b^2=c^2', { tex: 'c = \\sqrt{a^2+b^2}', note: 'take roots' }]} />,
    );
    expect(container.querySelector('ol')).not.toBeNull();
    expect(container.textContent).toBeTruthy();
  });
});
