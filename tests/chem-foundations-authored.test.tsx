import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PeriodicTrendsLab } from '../src/chem/periodic-trends/preset.js';
import { StoichiometryLab } from '../src/chem/stoichiometry/preset.js';
import { TitrationLab } from '../src/chem/titration/preset.js';
import type { AuthoredActivity } from '../src/kit/activity-authoring.js';

describe('chemistry foundations use the authored activity runtime', () => {
  it('gates the periodic model behind prediction and advances through a property comparison', async () => {
    const view = render(<PeriodicTrendsLab />);

    expect(view.getByText('Predict the direction')).toBeTruthy();
    expect(view.queryByLabelText(/Periodic table coloured/)).toBeNull();
    fireEvent.click(view.getByRole('radio', { name: 'decreases' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByLabelText(/Periodic table coloured by Atomic radius/)).toBeTruthy();
    fireEvent.change(view.getByRole('combobox', { name: 'colour by' }), {
      target: { value: 'ie' },
    });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(view.getByText(/Ionisation energy grows/)).toBeTruthy();
  });

  it('keeps the stoichiometry engine interactive inside authored gates', async () => {
    const view = render(<StoichiometryLab />);

    expect(view.queryByRole('img', { name: /limiting reagent/ })).toBeNull();
    fireEvent.click(view.getByRole('radio', { name: /runs out first/ }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByRole('img', { name: /limiting reagent/ })).toBeTruthy();

    const hydrogen = view.getByRole('slider', { name: 'amount of H₂ in moles' });
    fireEvent.change(hydrogen, { target: { value: '5' } });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(view.getByText(/limiting H₂/)).toBeTruthy();
  });

  it('connects the titration curve to the shared authored progression', async () => {
    const view = render(<TitrationLab />);

    fireEvent.click(view.getByRole('radio', { name: 'pKa' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Titration, 12\.0 millilitres added/)).toBeTruthy();
    expect(
      view.getByRole('region', { name: /Titration apparatus and pH curve/ }).getAttribute('tabindex'),
    ).toBe('0');

    fireEvent.change(view.getByRole('slider', { name: 'volume of base added (mL)' }), {
      target: { value: '25' },
    });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(view.getAllByText(/equivalence point/).length).toBeGreaterThan(0);
  });

  it('makes experimental landmarks and indicator evidence directly operable', async () => {
    const view = render(<TitrationLab />);
    fireEvent.click(view.getByRole('radio', { name: 'pKa' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.change(view.getByRole('combobox', { name: 'titration landmarks' }), {
      target: { value: 'half' },
    });
    expect(view.getByLabelText(/12\.5 millilitres added, pH 4\.76/i)).toBeTruthy();
    fireEvent.change(view.getByRole('combobox', { name: 'indicator' }), {
      target: { value: 'bromothymol-blue' },
    });
    expect(view.getByText('pH 6–7.6')).toBeTruthy();
  });

  it('lets hosts replace the lesson contract without replacing the chemistry model', () => {
    const activity: AuthoredActivity = {
      pattern: 'investigation',
      title: 'Creator sequence',
      objectives: ['Inspect a creator-selected trend'],
      steps: [
        { id: 'inspect', phase: 'act', title: 'Creator-defined step', reveal: ['model'], controls: true },
      ],
    };
    const view = render(<PeriodicTrendsLab activity={activity} />);

    expect(view.getByText('Creator-defined step')).toBeTruthy();
    expect(view.getByLabelText(/Periodic table coloured/)).toBeTruthy();
  });
});
