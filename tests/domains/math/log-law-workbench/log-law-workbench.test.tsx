import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/math/log-law-workbench/activity.js';
import manifest from '../../../../src/domains/math/log-law-workbench/manifest.js';
import LogLawWorkbench from '../../../../src/domains/math/log-law-workbench/runtime.js';

describe('log-law-workbench', () => {
  it('has a valid contract and starts with a prediction', () => {
    expect(manifest.schema.parse({})).toEqual({});
    expect(assessLabExperience(manifest, activity).issues).toEqual([]);
    render(<LogLawWorkbench />);
    expect(screen.getByText(/which expression equals/i)).toBeTruthy();
  });
});
