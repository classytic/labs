import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/physics/physics-practical-studio/activity.js';
import manifest from '../../../../src/domains/physics/physics-practical-studio/manifest.js';
import PhysicsPracticalStudio from '../../../../src/domains/physics/physics-practical-studio/runtime.js';

describe('physics-practical-studio', () => {
  it('has a valid authored contract and configurable gravity', () => {
    expect(manifest.schema.parse({})).toMatchObject({ gravity: 9.81 });
    expect(assessLabExperience(manifest, activity).issues).toEqual([]);
  });
  it('requires suitable apparatus before measurement', () => {
    render(<PhysicsPracticalStudio />);
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect((continueButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'metre rule' }));
    fireEvent.click(screen.getByRole('button', { name: 'stopwatch' }));
    expect((continueButton as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(/independent variable/i)).toBeTruthy();
  });
});
