import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ClassifierThresholdLab from '../../../src/domains/ml/classifier-threshold/runtime.js';
import RegressionLab from '../../../src/domains/ml/regression/runtime.js';
import classifierThresholdManifest from '../../../src/domains/ml/classifier-threshold/manifest.js';
import regressionManifest from '../../../src/domains/ml/regression/manifest.js';
import DecisionBoundaryLab from '../../../src/domains/ml/decision-boundary/runtime.js';
import KMeansLab from '../../../src/domains/ml/kmeans/runtime.js';
import KNNBoundaryLab from '../../../src/domains/ml/knn/runtime.js';
import decisionBoundaryManifest from '../../../src/domains/ml/decision-boundary/manifest.js';
import kmeansManifest from '../../../src/domains/ml/kmeans/manifest.js';
import knnManifest from '../../../src/domains/ml/knn/manifest.js';

describe('machine-learning flagship experiences', () => {
  it('connects a threshold prediction to live precision and recall evidence', () => {
    render(<ClassifierThresholdLab />);
    fireEvent.click(screen.getByRole('radio', { name: 'recall falls' }));
    const thresholdInput = screen
      .getAllByRole('slider', { name: 'decision threshold' })
      .find((element) => element.tagName === 'INPUT');
    expect(thresholdInput).toBeDefined();
    fireEvent.change(thresholdInput!, { target: { value: '7' } });
    expect(screen.getByText(/at 7\.0, \d+ positives are caught/i)).not.toBeNull();
    expect(screen.getByText(/raising the threshold means fewer points clear the bar/i)).not.toBeNull();
  });

  it('connects trend prediction, residual evidence, and the best-fit result', () => {
    render(<RegressionLab />);
    fireEvent.click(screen.getByRole('radio', { name: /slope up/i }));
    fireEvent.click(screen.getByRole('button', { name: /reveal best fit/i }));
    expect(screen.getAllByText(/best fit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/residual-square area is now near its minimum/i)).not.toBeNull();
  });

  it('makes k-means stepping and local-minimum transfer explicit', () => {
    render(<KMeansLab />);
    fireEvent.click(screen.getByRole('button', { name: /step/i }));
    expect(screen.getAllByText(/iteration 1/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('radio', { name: /restart from different centroid seeds/i }));
    expect(screen.getByText(/different seeds can lead/i)).not.toBeNull();
  });

  it('separates a k-NN query vote from model validation', () => {
    render(<KNNBoundaryLab />);
    const scene = screen.getByRole('img', { name: /use arrow keys to move the test point/i });
    fireEvent.keyDown(scene, { key: 'ArrowRight' });
    const kInput = screen
      .getAllByRole('slider', { name: 'number of neighbours' })
      .find((element) => element.tagName === 'INPUT');
    fireEvent.change(kInput!, { target: { value: '7' } });
    fireEvent.click(screen.getByRole('radio', { name: 'it stays the same' }));
    expect(screen.getByText(/query is not part of the labelled training set/i)).not.toBeNull();
    expect(screen.getByText(/changing k changes the model itself/i)).not.toBeNull();
  });

  it('uses XOR to expose the limit of one linear boundary', () => {
    render(<DecisionBoundaryLab />);
    fireEvent.click(screen.getByRole('button', { name: 'xor' }));
    fireEvent.click(screen.getByRole('radio', { name: /xor: opposite corners/i }));
    expect(screen.getAllByText(/single line can.?t split xor/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/richer representation or nonlinear boundary/i)).not.toBeNull();
  });

  it('rejects authoring data that cannot produce a truthful bounded model', () => {
    expect(classifierThresholdManifest.schema.safeParse({ span: 10, threshold: 11 }).success).toBe(false);
    expect(
      classifierThresholdManifest.schema.safeParse({ span: 10, positives: [2, 12], negatives: [1, 4] })
        .success,
    ).toBe(false);
    expect(
      regressionManifest.schema.safeParse({
        span: 10,
        data: [
          { x: 1, y: 2 },
          { x: 1, y: 4 },
          { x: 1, y: 6 },
        ],
      }).success,
    ).toBe(false);
    expect(
      regressionManifest.schema.safeParse({
        span: 10,
        data: [
          { x: 1, y: 2 },
          { x: 4, y: 12 },
          { x: 8, y: 7 },
        ],
      }).success,
    ).toBe(false);
    expect(
      kmeansManifest.schema.safeParse({
        k: 4,
        seeds: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
      }).success,
    ).toBe(false);
    expect(
      kmeansManifest.schema.safeParse({
        span: 10,
        points: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
          { x: 12, y: 3 },
        ],
      }).success,
    ).toBe(false);
    expect(knnManifest.schema.safeParse({ k: 4 }).success).toBe(false);
    expect(decisionBoundaryManifest.schema.safeParse({ seed: -1 }).success).toBe(false);
  });
});
