/**
 * Interactive-problem ENGINE + representation as CMS blocks — they register in
 * mathBlocks (→ slash menu via labsBlocks), render a config panel in editing mode,
 * and the live lab in preview. (Key-uniqueness/well-formedness is in blocks.test.tsx.)
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { InteractiveProblemBlock, TriangleTrigBlock, mathBlocks, mathComponents } from '../dist/blocks/math.mjs';

const Q12 = {
  equations: [{ expr: 'abs(x - 4)' }, { expr: 'k/x' }],
  params: [{ name: 'k', min: 0.5, max: 12, value: 2, step: 0.5 }],
  xRange: [0.1, 12], yRange: [-0.5, 10],
  derive: [{ kind: 'intersections', of: [0, 1] }],
  ask: { prompt: 'largest k for 3 intersections?', answer: { kind: 'number', value: 4, tol: 0.05 } },
  title: 'Q12',
};

describe('engine/representation blocks are registered', () => {
  it('appear in mathBlocks + the render map', () => {
    const keys = mathBlocks.map((b) => b.key);
    expect(keys).toContain('interactive-problem');
    expect(keys).toContain('triangle-trig');
    expect(typeof mathComponents.InteractiveProblem).toBe('function');
    expect(typeof mathComponents.TriangleTrig).toBe('function');
  });
});

describe('InteractiveProblem block', () => {
  it('preview mode renders the live lab (plot + derived readout)', () => {
    const { container } = render(<div>{InteractiveProblemBlock.Component({ attributes: Q12, mode: 'preview' })}</div>);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).toMatch(/intersection points/i);
  });

  it('editing mode renders the authoring panel', () => {
    const { getByText } = render(<div>{InteractiveProblemBlock.Component({ attributes: Q12, mode: 'editing', updateAttributes: vi.fn() })}</div>);
    expect(getByText(/\+ equation/)).toBeTruthy();
    expect(getByText(/\+ derive/)).toBeTruthy();
    expect(getByText(/Question \(graded\)/)).toBeTruthy();
  });
});

describe('TriangleTrig block', () => {
  it('editing mode exposes the trig knobs', () => {
    const { getByText } = render(<div>{TriangleTrigBlock.Component({ attributes: { angleDeg: 31, leg: 15, legKind: 'opposite', mode: 'depression' }, mode: 'editing', updateAttributes: vi.fn() })}</div>);
    expect(getByText(/Angle θ/)).toBeTruthy();
    expect(getByText(/Framing/)).toBeTruthy();
  });
});
