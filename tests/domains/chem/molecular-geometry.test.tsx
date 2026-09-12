import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  MOLECULES,
  hasDirectionalHybridModel,
  molecularDipole,
  projectVector,
} from '../../../src/chem/molecular-geometry/core.js';
import MolecularGeometryRuntime from '../../../src/domains/chem/molecular-geometry/runtime.js';
import manifest from '../../../src/domains/chem/molecular-geometry/manifest.js';

describe('molecular geometry learning engine', () => {
  it('declares bounded author defaults and complete learning phases', () => {
    expect(manifest.schema.parse({})).toMatchObject({ molecule: 'h2o', showLonePairs: true });
    expect(manifest.experience?.phases).toEqual(['predict', 'act', 'observe', 'explain', 'transfer']);
  });
  it('keeps electron geometry distinct from molecular shape', () => {
    expect(MOLECULES.h2o).toMatchObject({
      electronGeometry: 'tetrahedral',
      shape: 'bent',
      lonePairs: 2,
      angle: '104.5°',
    });
    expect(MOLECULES.nh3).toMatchObject({
      electronGeometry: 'tetrahedral',
      shape: 'trigonal pyramidal',
      lonePairs: 1,
    });
  });
  it('classifies polarity using the authored symmetry model', () => {
    expect(molecularDipole(MOLECULES.co2)).toMatch(/cancel.*non-polar/i);
    expect(molecularDipole(MOLECULES.h2o)).toMatch(/do not cancel.*polar/i);
    expect(projectVector({ x: 1, y: 0, z: 0 }, 30, 20)).toEqual(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number), depth: expect.any(Number) }),
    );
  });
  it('limits directional hybrid rendering to the defensible compact model', () => {
    expect(hasDirectionalHybridModel(MOLECULES.co2)).toBe(true);
    expect(hasDirectionalHybridModel(MOLECULES.bf3)).toBe(true);
    expect(hasDirectionalHybridModel(MOLECULES.ch4)).toBe(true);
    expect(hasDirectionalHybridModel(MOLECULES.sf6)).toBe(false);
  });
  it('renders rotatable molecular evidence with a complete text alternative', () => {
    render(<MolecularGeometryRuntime molecule="h2o" />);
    expect(screen.getByRole('img', { name: /H₂O, bent, bond angle 104\.5°/i })).toBeTruthy();
    expect(screen.getByText(/2 lone-pair domains/i)).toBeTruthy();
  });
});
