import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { EquationBalanceLab } from '../src/commerce/accounting/equation-balance.js';
import { JournalPosterLab } from '../src/commerce/accounting/journal-poster.js';
import { StatementSorterLab } from '../src/commerce/accounting/statement-sorter.js';
import equationBalance from '../src/domains/accounting/equation-balance/manifest.js';
import journalPoster from '../src/domains/accounting/journal-poster/manifest.js';
import statementSorter from '../src/domains/accounting/statement-sorter/manifest.js';

const answerAndContinue = (view: ReturnType<typeof render>, answer: string): void => {
  fireEvent.click(view.getByText(answer));
  fireEvent.click(view.getByText('Continue'));
};

describe('authored accounting activities', () => {
  it('rejects incomplete authored accounting records before runtime', () => {
    expect(
      equationBalance.schema.safeParse({
        accounts: [{ id: 'cash', name: 'Cash', category: 'Asset' }],
        transactions: [],
      }).success,
    ).toBe(false);
    expect(
      journalPoster.schema.safeParse({
        accounts: [],
        transactions: [{ id: 't1', prompt: '', debit: 'cash', credit: 'capital', amount: 0 }],
      }).success,
    ).toBe(false);
    expect(
      statementSorter.schema.safeParse({
        accounts: [{ id: '', name: 'Cash', category: 'Asset', balance: 1 }],
      }).success,
    ).toBe(false);
  });

  it('gates the equation model behind a prediction and completes after all balanced transactions', () => {
    const view = render(
      <EquationBalanceLab
        transactions={[
          {
            id: 'one',
            label: 'Owner invests',
            effects: [
              { account: 'cash', delta: 100 },
              { account: 'capital', delta: 100 },
            ],
          },
        ]}
      />,
    );
    expect(view.getByText('Commit to the constraint first')).toBeTruthy();
    answerAndContinue(view, 'preserve both sides of A = L + E');
    fireEvent.click(view.getByText('Continue'));
    fireEvent.click(view.getByText('Apply next ▶'));
    expect(view.getByText('Balanced ✓')).toBeTruthy();
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(false);
    expect(view.getByText(/Assets are 100/)).toBeTruthy();
  });

  it('keeps journal posting interactive inside an authored action gate', () => {
    const view = render(
      <JournalPosterLab
        transactions={[
          { id: 'one', prompt: 'Owner contributes cash', debit: 'cash', credit: 'capital', amount: 100 },
        ]}
      />,
    );
    answerAndContinue(view, 'debit (left) side');
    fireEvent.click(view.getByText('Cash'));
    fireEvent.click(view.getByRole('button', { name: /credit slot/ }));
    fireEvent.click(view.getByText('Capital'));
    fireEvent.click(view.getByText('Post entry'));
    expect(view.getByText(/All entries posted/)).toBeTruthy();
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(false);
    expect(view.getByText(/Total debits are 100/)).toBeTruthy();
  });

  it('uses authored gates for sorting and closing the statements', () => {
    const accounts = [
      { id: 'cash', name: 'Cash', category: 'Asset' as const, balance: 120 },
      { id: 'capital', name: 'Capital', category: 'Equity' as const, balance: 100 },
      { id: 'sales', name: 'Sales', category: 'Income' as const, balance: 20 },
    ];
    const view = render(<StatementSorterLab accounts={accounts} />);
    answerAndContinue(view, 'Income Statement');
    const sendTo = (name: string, statement: 'IS' | 'BS'): void => {
      const pill = view.getByText(name).closest('.statement-account-pill');
      fireEvent.click(
        Array.from(pill!.querySelectorAll('button')).find((button) => button.textContent === statement)!,
      );
    };
    sendTo('Cash', 'BS');
    sendTo('Capital', 'BS');
    sendTo('Sales', 'IS');
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(view.getByText('Continue'));
    fireEvent.click(view.getByText('Close the books ▶'));
    expect(view.getByText('A = L + E holds ✓')).toBeTruthy();
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(false);
    expect(view.getByText(/Profit has been carried to equity/)).toBeTruthy();
  });
});
