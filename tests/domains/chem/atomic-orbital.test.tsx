import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { orbitalCloud, orbitalFacts, projectOrbital } from '../../../src/chem/orbitals/core.js';
import AtomicOrbitalRuntime from '../../../src/domains/chem/atomic-orbital/runtime.js';
import manifest from '../../../src/domains/chem/atomic-orbital/manifest.js';

describe('atomic orbital learning engine', () => {
  it('declares bounded author defaults and the misconception-safe contract', () => {
    expect(manifest.schema.parse({})).toMatchObject({ orbital: '2p-z', samples: 420 });
    expect(manifest.experience?.objectives.join(' ')).toMatch(/classical electron path/i);
  });
  it('reports correct hydrogenic node counts for the included orbitals', () => {
    expect(orbitalFacts('2s')).toMatchObject({ radialNodes: 1, angularNodes: 0 });
    expect(orbitalFacts('2p-z')).toMatchObject({ radialNodes: 0, angularNodes: 1 });
    expect(orbitalFacts('3d-xy')).toMatchObject({ radialNodes: 0, angularNodes: 2 });
  });
  it('generates deterministic phase-bearing samples and rotatable projections', () => {
    const cloud = orbitalCloud('2p-z', 160),
      again = orbitalCloud('2p-z', 160);
    expect(cloud).toEqual(again);
    expect(new Set(cloud.map((point) => point.phase))).toEqual(new Set([-1, 1]));
    expect(projectOrbital(cloud, 45, 20)).toHaveLength(cloud.length);
  });
  it('renders a textual alternative that rejects the orbit-path misconception', () => {
    render(<AtomicOrbitalRuntime orbital="2s" />);
    expect(screen.getByRole('img', { name: /2s orbital probability/i })).toBeTruthy();
    expect(screen.getByText(/do not trace electron motion/i)).toBeTruthy();
  });
});
