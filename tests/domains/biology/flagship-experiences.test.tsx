import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhotosynthesisFactorsLab } from '../../../src/biology/photosynthesis-factors/preset.js';
import { RespirationLab } from '../../../src/biology/respiration/preset.js';
import photosynthesisManifest from '../../../src/domains/biology/photosynthesis-factors/manifest.js';
import { PunnettCrossLab } from '../../../src/biology/punnett-cross/preset.js';
import geneticCrossManifest from '../../../src/domains/biology/genetic-cross/manifest.js';
import punnettManifest from '../../../src/domains/biology/punnett-cross/manifest.js';
import sexLinkedManifest from '../../../src/domains/biology/sex-linked-cross/manifest.js';
import { EnzymeRateLab } from '../../../src/biology/enzyme-rate/preset.js';
import { SequenceLab } from '../../../src/biology/sequence/preset.js';
import enzymeManifest from '../../../src/domains/biology/enzyme-rate/manifest.js';
import sequenceManifest from '../../../src/domains/biology/sequence/manifest.js';
import centralDogmaManifest from '../../../src/domains/biology/central-dogma/manifest.js';

describe('biology flagship experiences', () => {
  it('requires an actual limiting-factor comparison before explanation', () => {
    render(<PhotosynthesisFactorsLab />);
    const co2 = screen.getByRole('slider', { name: 'carbon dioxide concentration' });
    fireEvent.change(co2, { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: /freeze curve/i }));
    fireEvent.click(screen.getByRole('radio', { name: /another factor/i }));
    fireEvent.click(screen.getByRole('radio', { name: /enzymes denature/i }));
    expect(screen.getAllByText(/slowest worker sets the pace/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/past the optimum the enzymes lose their shape/i)).not.toBeNull();
  });

  it('compares both day and night before explaining net gas exchange', () => {
    render(<RespirationLab />);
    fireEvent.click(screen.getByRole('button', { name: 'Night' }));
    expect(screen.getAllByText(/CO₂ OUT, O₂ IN/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('radio', { name: 'CO₂' })[0]!);
    fireEvent.click(screen.getAllByRole('radio', { name: 'O₂' })[1]!);
    expect(screen.getByText(/no photosynthesis in the dark/i)).not.toBeNull();
    expect(screen.getByText(/photosynthesis fixes more CO₂/i)).not.toBeNull();
  });

  it('collects a real ratio prediction before revealing a shared Punnett grid', () => {
    render(<PunnettCrossLab />);
    const reveal = screen.getByRole('button', { name: /reveal the cross/i });
    expect(reveal.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: '3:1' }));
    expect(reveal.hasAttribute('disabled')).toBe(false);
    fireEvent.click(reveal);
    expect(screen.getAllByText(/3:1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/equally likely gamete pairing/i)).not.toBeNull();
  });

  it('makes irreversible thermal denaturation an observed transfer task', () => {
    render(<EnzymeRateLab />);
    const temperature = screen.getByRole('slider', { name: 'temperature' });
    fireEvent.change(temperature, { target: { value: '55' } });
    fireEvent.change(temperature, { target: { value: '40' } });
    fireEvent.click(screen.getByRole('radio', { name: /activity remains low/i }));
    expect(screen.getByText(/does not refold the denatured enzyme/i)).not.toBeNull();
  });

  it('connects translation construction to mutation transfer reasoning', () => {
    render(<SequenceLab kind="translation" />);
    fireEvent.click(screen.getByRole('button', { name: 'Met' }));
    fireEvent.click(screen.getByRole('button', { name: 'empty slot under AUG' }));
    expect(screen.getByText(/1\/5 paired/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /different amino acid or stop/i }));
    expect(screen.getByText(/some changed codons are synonymous/i)).not.toBeNull();
  });

  it('rejects biologically unusable factor ranges', () => {
    expect(photosynthesisManifest.schema.safeParse({ light: 101 }).success).toBe(false);
    expect(photosynthesisManifest.schema.safeParse({ co2: -1 }).success).toBe(false);
    expect(photosynthesisManifest.schema.safeParse({ temperature: 55 }).success).toBe(false);
    expect(photosynthesisManifest.schema.safeParse({ tempOptimum: 0 }).success).toBe(false);
    expect(punnettManifest.schema.safeParse({ alleleLetter: 'A', parent1: 'Bb' }).success).toBe(false);
    expect(punnettManifest.schema.safeParse({ dominantLabel: 'tall', recessiveLabel: 'tall' }).success).toBe(
      false,
    );
    expect(sexLinkedManifest.schema.safeParse({ allele: 'B', mother: ['B', 'c'] }).success).toBe(false);
    expect(geneticCrossManifest.schema.safeParse({ preset: 'custom' }).success).toBe(false);
    expect(geneticCrossManifest.schema.safeParse({ preset: 'blood-type', parent1: ['A', 'x'] }).success).toBe(
      false,
    );
    expect(
      geneticCrossManifest.schema.safeParse({
        preset: 'custom',
        spec: {
          alleles: [
            { symbol: 'A', rank: 2, trait: 'one' },
            { symbol: 'A', rank: 1, trait: 'two' },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      enzymeManifest.schema.safeParse({ factor: 'pH', optimum: 7, factorMin: 0, factorMax: 20 }).success,
    ).toBe(false);
    expect(enzymeManifest.schema.safeParse({ optimum: 80, factorMin: 0, factorMax: 80 }).success).toBe(false);
    expect(sequenceManifest.schema.safeParse({ kind: 'translation', template: ['ATG'] }).success).toBe(false);
    expect(sequenceManifest.schema.safeParse({ kind: 'replication', template: ['U'] }).success).toBe(false);
    expect(centralDogmaManifest.schema.safeParse({ dna: ['A', 'T', 'G', 'C'] }).success).toBe(false);
  });
});
