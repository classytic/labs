import { describe, expect, it } from 'vitest';
import {
  calculusPathway,
  chemistryFoundationsPathway,
  pathwayToMdx,
  quantumFoundationsPathway,
} from '../src/pathways/index.js';

describe('calculus pathway', () => {
  it('is ordered by conceptual prerequisites and has unique lab ids', () => {
    expect(calculusPathway.steps.map((step) => step.id)).toEqual([
      'limit-explorer',
      'derivative-explorer',
      'integral-explorer',
      'fundamental-theorem',
      'taylor-series',
      'differential-equation',
      'phase-portrait',
      'gradient-descent',
      'newton-method',
    ]);
    expect(new Set(calculusPathway.steps.map((step) => step.id)).size).toBe(calculusPathway.steps.length);
  });

  it('generates portable MDX without importing runtimes', () => {
    const mdx = pathwayToMdx(calculusPathway);
    expect(mdx).toContain('<LimitExplorer equation="(x^2 - 1)/(x - 1)"');
    expect(mdx).toContain('<TaylorSeries equation="sin(x)"');
    expect(mdx).toContain('<DifferentialEquation equation="x - y"');
    expect(mdx).toContain('<PhasePortrait dx="y"');
    expect(mdx).toContain('<NewtonMethod equation="x^3 - x - 2"');
    expect(mdx.split('\n\n')).toHaveLength(9);
  });
});

describe('quantum foundations pathway', () => {
  it('moves from experimental evidence to representation and programming', () => {
    expect(quantumFoundationsPathway.steps.map((step) => step.id)).toEqual([
      'photoelectric-effect',
      'double-slit',
      'bloch-sphere',
      'quantum-gates',
    ]);
    expect(new Set(quantumFoundationsPathway.steps.map((step) => step.id)).size).toBe(4);
  });

  it('generates portable MDX without loading WebGL or lab runtimes', () => {
    const mdx = pathwayToMdx(quantumFoundationsPathway);
    expect(mdx).toContain('<PhotoelectricEffectLab metal="sodium"');
    expect(mdx).toContain('<DoubleSlitLab detections={80}');
    expect(mdx).toContain('<BlochSphereLab preset="plus" measurementAxis="z"');
    expect(mdx).toContain('<QuantumGateJourneyLab />');
    expect(mdx.split('\n\n')).toHaveLength(4);
  });
});

describe('chemistry foundations pathway', () => {
  it('changes representation in a deliberate prerequisite order', () => {
    expect(chemistryFoundationsPathway.steps.map((step) => step.id)).toEqual([
      'bohr-atom',
      'periodic-trends',
      'atomic-orbital',
      'molecular-geometry',
      'reaction-lab',
      'stoichiometry',
      'solution-box',
      'titration',
    ]);
    expect(new Set(chemistryFoundationsPathway.steps.map((step) => step.id)).size).toBe(
      chemistryFoundationsPathway.steps.length,
    );
  });

  it('generates portable authorable MDX without importing chemistry runtimes', () => {
    const mdx = pathwayToMdx(chemistryFoundationsPathway);
    expect(mdx).toContain('<AtomicOrbitalLab orbital="2p-z" view="cloud"');
    expect(mdx).toContain(
      '<MolecularGeometryLab molecule="h2o" showLonePairs={true} showDipoles={true} showHybridOrbitals={true}',
    );
    expect(mdx).toContain('<Titration analyte="weak-acid" concAcid={0.1}');
    expect(mdx.split('\n\n')).toHaveLength(8);
  });
});
