//#region src/commerce/accounting/core.d.ts
/**
 * The SIMPLE, CORRECT double-entry core, the single source of truth every
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
type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
type Side = 'debit' | 'credit';
interface Account {
  id: string;
  name: string;
  category: AccountCategory;
}
/** Assets & Expenses grow on the LEFT (debit); the rest grow on the RIGHT (credit). */
declare function normalBalance(category: AccountCategory): Side;
/** Which financial statement an account lands on. */
declare function statementOf(category: AccountCategory): 'Balance Sheet' | 'Income Statement';
/** A balanced entry has equal total debits and credits (within a cent). */
declare function debitsEqualCredits(lines: ReadonlyArray<{
  debit?: number;
  credit?: number;
}>): boolean;
/**
 * Sum signed account balances (natural terms: + = increase on the normal side)
 * into the accounting-equation parts. Equity absorbs profit = Income − Expense,
 * so `assets` should equal `liabilities + equity` whenever every posted entry
 * was balanced.
 */
declare function equationParts(accounts: ReadonlyArray<Account>, balanceOf: (id: string) => number): {
  assets: number;
  liabilities: number;
  equity: number;
  profit: number;
};
/** Category → CSS token colour, consistent across every accounting lab. */
declare const CATEGORY_COLOR: Record<AccountCategory, string>;
/** Compact money label (e.g. 10000 → "10,000"). */
declare function money(n: number): string;
//#endregion
export { Account, AccountCategory, CATEGORY_COLOR, Side, debitsEqualCredits, equationParts, money, normalBalance, statementOf };