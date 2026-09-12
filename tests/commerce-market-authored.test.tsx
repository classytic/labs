import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarketEquilibriumLab } from '../src/commerce/economics/market-equilibrium.js';

describe('market equilibrium authored learner path', () => {
  it('gates prediction, market clearing, explanation, and transfer with accessible evidence', async () => {
    const view = render(<MarketEquilibriumLab />);

    expect(view.getByText('Predict the market pressure first')).toBeTruthy();
    expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);
    expect(view.getByText(/quantity demanded is .* quantity supplied is/i)).toBeTruthy();

    fireEvent.click(view.getByRole('radio', { name: 'a surplus — sellers cut the price' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByLabelText(/Supply and demand; price/)).toBeTruthy();
    expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByRole('button', { name: 'Snap to equilibrium' }));
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('Read the adjustment evidence')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('radio', { name: 'rises' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('Move the equilibrium')).toBeTruthy();
    const demandShift = view.getByRole('slider', { name: 'shift the demand curve' });
    fireEvent.change(demandShift, { target: { value: '1' } });
    await waitFor(() =>
      expect(view.queryByText('Shift demand or supply to create a new equilibrium.')).toBeNull(),
    );
    expect(view.getByRole('button', { name: 'Complete' })).toBeTruthy();
  });
});
