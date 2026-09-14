import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/math/modulus-cases/activity.js';
import manifest from '../../../../src/domains/math/modulus-cases/manifest.js';
import ModulusCases from '../../../../src/domains/math/modulus-cases/runtime.js';

describe('modulus-cases', () => {
  it('has a valid contract and starts from distance meaning', () => {
    expect(assessLabExperience(manifest, activity).issues).toEqual([]);
    render(<ModulusCases />);
    expect(screen.getByText(/what does/i)).toBeTruthy();
  });
});
