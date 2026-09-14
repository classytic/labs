import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/math/vector-geometry-two-d/activity.js';
import manifest from '../../../../src/domains/math/vector-geometry-two-d/manifest.js';
import VectorGeometry2D from '../../../../src/domains/math/vector-geometry-two-d/runtime.js';

describe('vector-geometry-two-d', () => {
  it('has a valid contract and teaches destination minus start', () => {
    expect(assessLabExperience(manifest, activity).issues).toEqual([]);
    render(<VectorGeometry2D />);
    expect(screen.getByText(/what is ab/i)).toBeTruthy();
  });
});
