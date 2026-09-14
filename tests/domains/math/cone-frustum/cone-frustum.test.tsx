import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cutForRemovedShare, frustumParts } from '../../../../src/math/cone-frustum/core.js';
import ConeFrustum from '../../../../src/domains/math/cone-frustum/runtime.js';

const CONE = { radius: 3, height: 6 };
const FULL = (Math.PI * 9 * 6) / 3;

describe('cone-frustum', () => {
  it('renders and asks for a share of the volume', () => {
    render(<ConeFrustum />);
    expect(screen.getByText(/carry away/i)).toBeTruthy();
  });

  it('keeps the two pieces adding up to the whole cone', () => {
    for (const cut of [0.5, 2, 3, 5.5]) {
      const p = frustumParts(CONE, cut);
      expect(p.topVolume + p.frustumVolume).toBeCloseTo(FULL, 9);
      expect(p.topSlant + p.frustumSlant).toBeCloseTo(p.fullSlant, 9);
    }
  });

  it('gives the small cone one ratio for every length', () => {
    const p = frustumParts(CONE, 2);
    expect(p.topRadius / CONE.radius).toBeCloseTo(p.k, 12);
    expect(p.topHeight / CONE.height).toBeCloseTo(p.k, 12);
    expect(p.topSlant / p.fullSlant).toBeCloseTo(p.k, 12);
  });

  /** The whole point of the lab: the share is k³, so halfway up is an eighth and not a half. */
  it('removes an eighth when the cut is halfway up', () => {
    const p = frustumParts(CONE, CONE.height / 2);
    expect(p.k).toBeCloseTo(0.5, 12);
    expect(p.removedShare).toBeCloseTo(0.125, 12);
  });

  it('puts the half-volume cut near the base, not the middle', () => {
    const cut = cutForRemovedShare(CONE, 0.5);
    expect(frustumParts(CONE, cut).removedShare).toBeCloseTo(0.5, 12);
    // About a fifth of the way up, which is the answer nobody guesses.
    expect(cut / CONE.height).toBeLessThan(0.25);
  });
});
