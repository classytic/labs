/**
 * The interactive-problem ENGINE + triangle-trig as canonical manifests: the manifest carries the
 * real schema, the runtime chunk renders the live lab, and the authoring chunk renders the custom
 * editor (equation / derive / graded-question builders). Imports from SRC (not the built dist).
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import problemManifest from '../../../src/domains/math/interactive-problem/manifest.js';
import InteractiveProblemRuntime from '../../../src/domains/math/interactive-problem/runtime.js';
import InteractiveProblemAuthoring from '../../../src/domains/math/interactive-problem/authoring.js';
import triangleManifest from '../../../src/domains/math/triangle-trig/manifest.js';
import TriangleTrigAuthoring from '../../../src/domains/math/triangle-trig/authoring.js';

const Q12 = {
  equations: [{ expr: 'abs(x - 4)' }, { expr: 'k/x' }],
  params: [{ name: 'k', min: 0.5, max: 12, value: 2, step: 0.5 }],
  xRange: [0.1, 12],
  yRange: [-0.5, 10],
  derive: [{ kind: 'intersections', of: [0, 1] }],
  ask: { prompt: 'largest k for 3 intersections?', answer: { kind: 'number', value: 4, tol: 0.05 } },
  title: 'Q12',
};

describe('interactive-problem manifest', () => {
  it('has the canonical id/tag and its schema accepts a real problem', () => {
    expect(problemManifest.id).toBe('interactive-problem');
    expect(problemManifest.schema.safeParse(Q12).success).toBe(true);
  });

  it('runtime renders the live lab (plot + derived readout)', () => {
    const { container } = render(<div>{InteractiveProblemRuntime(Q12)}</div>);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).toMatch(/intersection points/i);
  });

  it('authoring renders the engine editor', () => {
    const { getByText } = render(<div>{InteractiveProblemAuthoring({ value: Q12, onChange: vi.fn() })}</div>);
    expect(getByText(/\+ equation/)).toBeTruthy();
    expect(getByText(/\+ derive/)).toBeTruthy();
    expect(getByText(/Question \(graded\)/)).toBeTruthy();
  });
});

describe('triangle-trig manifest', () => {
  it('is the canonical triangle-trig lab', () => {
    expect(triangleManifest.id).toBe('triangle-trig');
  });

  it('authoring exposes the trig knobs', () => {
    const { getByText } = render(
      <div>
        {TriangleTrigAuthoring({
          value: { angleDeg: 31, leg: 15, legKind: 'opposite', mode: 'depression' },
          onChange: vi.fn(),
        })}
      </div>,
    );
    expect(getByText(/Angle θ/)).toBeTruthy();
    expect(getByText(/Framing/)).toBeTruthy();
  });
});
