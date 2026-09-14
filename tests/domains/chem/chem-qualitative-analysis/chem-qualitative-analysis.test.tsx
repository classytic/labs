import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/chem/chem-qualitative-analysis/activity.js';
import manifest from '../../../../src/domains/chem/chem-qualitative-analysis/manifest.js';
import QualitativeAnalysisBench from '../../../../src/domains/chem/chem-qualitative-analysis/runtime.js';

describe('chem-qualitative-analysis', () => {
  it('offers authorable unknown samples and a valid contract', () => {
    expect(manifest.schema.parse({})).toMatchObject({ sample: 'copper-ii' });
    expect(assessLabExperience(manifest, activity).issues).toEqual([]);
  });
  it('records observation before asking for identification', () => {
    render(<QualitativeAnalysisBench />);
    fireEvent.click(screen.getByRole('radio', { name: /white precipitate forms/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Perform test' }));
    expect(screen.getAllByText(/light blue precipitate forms/i).length).toBeGreaterThan(0);
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
