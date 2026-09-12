import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ElasticityRevenueLab } from '../src/commerce/economics/elasticity-revenue.js';
import { DemandShiftVsMoveLab } from '../src/commerce/economics/demand-shift-vs-move.js';
import elasticityManifest from '../src/domains/economics/elasticity-revenue/manifest.js';
import ElasticityRuntime from '../src/domains/economics/elasticity-revenue/runtime.js';

describe('commerce economics authored runtime convergence', () => {
  it('validates and forwards the complete authored elasticity setup', () => {
    const authored = {
      pivotP: 6,
      pivotQ: 4,
      priceMax: 14,
      qtyMax: 16,
      height: 360,
      anchorPresets: [
        { label: 'Essential medicine', slope: 2.1 },
        { label: 'Competitive brand', slope: 0.3 },
      ],
      objectives: ['Compare two authored markets'],
    };
    expect(elasticityManifest.schema.safeParse(authored).success).toBe(true);
    expect(elasticityManifest.schema.safeParse({ anchorPresets: [] }).success).toBe(false);
    expect(
      elasticityManifest.schema.safeParse({ anchorPresets: [{ label: 'Impossible', slope: 0 }] }).success,
    ).toBe(false);
    expect(elasticityManifest.schema.safeParse({ height: 120 }).success).toBe(false);

    const view = render(<ElasticityRuntime {...authored} />);
    fireEvent.click(view.getByRole('radio', { name: 'changes — elastic up top, inelastic near the bottom' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByRole('button', { name: 'Essential medicine' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Competitive brand' })).toBeTruthy();
  });

  it('gates elasticity evidence, an inelastic configuration, and the revenue explanation', async () => {
    const view = render(<ElasticityRevenueLab />);

    expect(view.getByText('Predict before inspecting')).toBeTruthy();
    expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByRole('radio', { name: 'changes — elastic up top, inelastic near the bottom' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByLabelText(/Demand elasticity/)).toBeTruthy();
    expect(view.getByText('Elasticity evidence')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(view.getByRole('button', { name: '💉 insulin (few substitutes)' }));
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('radio', { name: 'raises total revenue' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('Stress-test the curve')).toBeTruthy();
    expect(view.getByRole('slider', { name: 'rotate the demand curve (substitutes)' })).toBeTruthy();
    expect(view.getByText(/Demand slope 2\.20/)).toBeTruthy();
  });

  it('requires a correct TRIBE forecast before explaining a demand shift', async () => {
    const view = render(<DemandShiftVsMoveLab />);

    expect(view.getByText('Classify the change first')).toBeTruthy();
    fireEvent.click(view.getByRole('radio', { name: 'a movement along demand' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Supply and demand; equilibrium price/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('button', { name: 'Incomes rise' }));
    expect(view.getByText(/Predict how “Incomes rise”/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'both UP' }));
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(view.getAllByText(/Right, Incomes rise shifts demand right/).length).toBeGreaterThan(0);
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('radio', { name: 'a shift of the demand curve' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByText('Test more scenarios')).toBeTruthy();
    expect(view.getByText(/Demand has shifted by 2\.0/)).toBeTruthy();
  });
});
