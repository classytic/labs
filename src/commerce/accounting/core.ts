/**
 * The SIMPLE, CORRECT double-entry core — the single source of truth every
 * accounting lab shares. Deliberately NOT the industry @classytic/ledger engine
 * (events/repositories/FX/fiscal-close): a teaching lab needs only the rules,
 * which are these (verified against that production ledger):
 *
 *   • 5 categories: Asset, Liability, Equity, Income, Expense.
 *   • Normal balance: Assets & Expenses are DEBIT-normal; Liabilities, Equity,
 *     Income are CREDIT-normal.
 *   • Every journal entry: total debits = total credits.
 *   • Accounting equation: Assets = Liabilities + Equity, where Equity absorbs
 *     profit (Income − Expense).
 */

export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type Side = 'debit' | 'credit';

export interface Account {
  id: string;
  name: string;
  category: AccountCategory;
}

/** Assets & Expenses grow on the LEFT (debit); the rest grow on the RIGHT (credit). */
export function normalBalance(category: AccountCategory): Side {
  return category === 'Asset' || category === 'Expense' ? 'debit' : 'credit';
}

/** Which financial statement an account lands on. */
export function statementOf(category: AccountCategory): 'Balance Sheet' | 'Income Statement' {
  return category === 'Income' || category === 'Expense' ? 'Income Statement' : 'Balance Sheet';
}

/** A balanced entry has equal total debits and credits (within a cent). */
export function debitsEqualCredits(lines: ReadonlyArray<{ debit?: number; credit?: number }>): boolean {
  let d = 0, c = 0;
  for (const l of lines) { d += l.debit ?? 0; c += l.credit ?? 0; }
  return Math.abs(d - c) < 0.005;
}

/**
 * Sum signed account balances (natural terms: + = increase on the normal side)
 * into the accounting-equation parts. Equity absorbs profit = Income − Expense,
 * so `assets` should equal `liabilities + equity` whenever every posted entry
 * was balanced.
 */
export function equationParts(
  accounts: ReadonlyArray<Account>,
  balanceOf: (id: string) => number,
): { assets: number; liabilities: number; equity: number; profit: number } {
  let assets = 0, liabilities = 0, equityBase = 0, income = 0, expense = 0;
  for (const a of accounts) {
    const v = balanceOf(a.id);
    if (a.category === 'Asset') assets += v;
    else if (a.category === 'Liability') liabilities += v;
    else if (a.category === 'Equity') equityBase += v;
    else if (a.category === 'Income') income += v;
    else expense += v;
  }
  const profit = income - expense;
  return { assets, liabilities, equity: equityBase + profit, profit };
}

/** Category → CSS token colour, consistent across every accounting lab. */
export const CATEGORY_COLOR: Record<AccountCategory, string> = {
  Asset: 'var(--stage-good)',
  Liability: 'var(--stage-danger)',
  Equity: 'var(--stage-accent)',
  Income: 'var(--stage-accent-2)',
  Expense: 'var(--stage-warn)',
};

/** Compact money label (e.g. 10000 → "10,000"). */
export function money(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
