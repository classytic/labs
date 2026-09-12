/**
 * Shared defaults + attribute coercers for the double-entry accounting labs (equation-balance,
 * journal-poster, statement-sorter). Array attrs can round-trip from MDX as JSON strings, so the
 * runtimes read them through these coercers; a missing/empty array falls back to a starter set.
 */
import type { Account, Transaction, JournalTxn, SortAccount } from '../../commerce/index.js';

export type { Account, Transaction, JournalTxn, SortAccount };

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'Cash', category: 'Asset' },
  { id: 'equip', name: 'Equipment', category: 'Asset' },
  { id: 'loan', name: 'Bank loan', category: 'Liability' },
  { id: 'capital', name: 'Capital', category: 'Equity' },
];

export const DEFAULT_TXNS: Transaction[] = [
  {
    id: 't1',
    label: 'Owner invests $10,000 cash',
    effects: [
      { account: 'cash', delta: 10000 },
      { account: 'capital', delta: 10000 },
    ],
  },
  {
    id: 't2',
    label: 'Take a $5,000 bank loan',
    effects: [
      { account: 'cash', delta: 5000 },
      { account: 'loan', delta: 5000 },
    ],
  },
  {
    id: 't3',
    label: 'Buy equipment for $3,000 cash',
    effects: [
      { account: 'equip', delta: 3000 },
      { account: 'cash', delta: -3000 },
    ],
  },
];

export const asAccounts = (raw: unknown): Account[] =>
  Array.isArray(raw) && raw.length ? (raw as Account[]) : DEFAULT_ACCOUNTS;
export const asTxns = (raw: unknown): Transaction[] =>
  Array.isArray(raw) && raw.length ? (raw as Transaction[]) : DEFAULT_TXNS;
export const asJournalTxns = (raw: unknown): JournalTxn[] | undefined =>
  Array.isArray(raw) && raw.length ? (raw as JournalTxn[]) : undefined;
export const asSortAccounts = (raw: unknown): SortAccount[] | undefined =>
  Array.isArray(raw) && raw.length ? (raw as SortAccount[]) : undefined;
