import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/accounting/bank-reconciliation/activity.js';
import manifest from '../../../../src/domains/accounting/bank-reconciliation/manifest.js';
import BankReconciliation from '../../../../src/domains/accounting/bank-reconciliation/runtime.js';

describe('bank-reconciliation', () => {
  it('has a valid contract and authorable opening balance', () => {
    expect(manifest.schema.parse({})).toMatchObject({ openingCashBook: 1200 });
    expect(assessLabExperience(manifest, activity).issues).toEqual([]);
  });
  it('updates the cash book before timing differences unlock', () => {
    render(<BankReconciliation />);
    fireEvent.click(screen.getByRole('radio', { name: /update the cash book/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const deduct = screen.getAllByRole('button', { name: /^deduct$/i });
    const add = screen.getAllByRole('button', { name: /^add$/i });
    fireEvent.click(deduct[0]!);
    fireEvent.click(deduct[1]!);
    fireEvent.click(add[2]!);
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getAllByText('$1,300').length).toBeGreaterThan(0);
  });
});
