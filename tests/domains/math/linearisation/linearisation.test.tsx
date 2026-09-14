import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/math/linearisation/activity.js';
import manifest from '../../../../src/domains/math/linearisation/manifest.js';
import LinearisationLab from '../../../../src/domains/math/linearisation/runtime.js';

describe('linearisation', () => {
  it('has a valid contract and asks for transformed axes', () => {
    expect(assessLabExperience(manifest, activity).issues).toEqual([]);
    render(<LinearisationLab />);
    expect(screen.getByText(/which plot is linear/i)).toBeTruthy();
  });
});
