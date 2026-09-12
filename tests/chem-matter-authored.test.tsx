import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GasBoxLab } from '../src/chem/gas-box/preset.js';
import { SolutionBoxLab } from '../src/chem/solution/solution-box.js';
import { DilutionLab } from '../src/chem/solution/dilution.js';

describe('chemistry matter authored runtime convergence', () => {
  it('guides gas-law prediction before exposing experiment controls', () => {
    const view = render(<GasBoxLab />);
    expect(view.getByText('Predict compression')).toBeTruthy();
    expect(view.queryByRole('slider', { name: 'temperature (kelvin)' })).toBeNull();
    fireEvent.click(view.getByRole('radio', { name: 'doubles' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByText('Watch wall collisions')).toBeTruthy();
    expect(view.getByText(/PV\/nT/)).toBeTruthy();
  });

  it('uses authored prediction and progressive controls for molarity', () => {
    const view = render(<SolutionBoxLab />);
    expect(view.getByText('Predict dilution')).toBeTruthy();
    fireEvent.click(view.getByRole('radio', { name: 'falls' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByRole('slider', { name: 'moles of solute' })).toBeTruthy();
    expect(view.getByRole('slider', { name: 'solution volume in litres' })).toBeTruthy();
  });

  it('keeps conserved-moles evidence inside the dilution runtime', () => {
    const view = render(<DilutionLab />);
    expect(view.getByText('Predict what is conserved')).toBeTruthy();
    fireEvent.click(view.getByRole('radio', { name: 'the moles of solute (the dots)' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getAllByText(/particle count and amount of solute are conserved/i).length).toBeGreaterThan(0);
    expect(view.getByText(/0\.50 moles are taken/)).toBeTruthy();
  });
});
