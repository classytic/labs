/**
 * @classytic/labs/blocks, accounting (commerce) lab block specs.
 *
 * `defineBlock` editor adapters for the accounting labs. A creator/agent authors
 * the chart of accounts + the transactions; the lab enforces the simple
 * double-entry core (no heavy ledger engine). One domain per file; the registry
 * is assembled in `./index.ts` and exported at `@classytic/labs/blocks/accounting`.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, TextField, ChipToggle, RowsEditor, SelectField, NumField, SmallButton } from './authoring.js';
import { EquationBalanceLab, JournalPosterLab, StatementSorterLab, type Account, type Transaction, type JournalTxn, type SortAccount } from '../commerce/index.js';

const CATEGORIES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

/** Chart-of-accounts editor: id + name + a category dropdown (no raw JSON). */
function AccountsEditor({ accounts, onChange }: { accounts: Account[]; onChange: (a: Account[]) => void }): ReactNode {
  return (
    <RowsEditor<Account>
      rows={accounts} onChange={onChange} addLabel="account"
      newRow={() => ({ id: '', name: '', category: 'Asset' }) as Account}
      columns={[{ key: 'id', label: 'id' }, { key: 'name', label: 'name', grow: true }, { key: 'category', label: 'category', type: 'select', options: CATEGORIES }]}
    />
  );
}

/** Transactions editor for the balance lab: a label + signed effects on accounts. */
function TxnEffectsEditor({ txns, accountIds, onChange }: { txns: Transaction[]; accountIds: string[]; onChange: (t: Transaction[]) => void }): ReactNode {
  const setTxn = (i: number, patch: Partial<Transaction>): void => onChange(txns.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const setEffect = (ti: number, ei: number, patch: Partial<Transaction['effects'][number]>): void =>
    setTxn(ti, { effects: txns[ti]!.effects.map((e, j) => (j === ei ? { ...e, ...patch } : e)) });
  return (
    <div className="w-full space-y-2">
      {txns.map((t, ti) => (
        <div key={ti} className="space-y-1.5 rounded-md border border-border/60 bg-background/40 p-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">when</span>
            <TextField value={t.label} placeholder="Owner invests $10,000 cash" onChange={(v) => setTxn(ti, { label: v })} className="flex-1 text-[11px]" />
            <SmallButton tone="danger" onClick={() => onChange(txns.filter((_, j) => j !== ti))}>✕</SmallButton>
          </div>
          <div className="space-y-1 pl-3">
            {t.effects.map((e, ei) => (
              <div key={ei} className="flex items-center gap-1.5">
                <SelectField value={e.account} options={accountIds} onChange={(v) => setEffect(ti, ei, { account: v })} />
                <span className="text-[11px] text-muted-foreground">changes by</span>
                <NumField value={e.delta} onChange={(v) => setEffect(ti, ei, { delta: v })} />
                <SmallButton tone="danger" onClick={() => setTxn(ti, { effects: t.effects.filter((_, j) => j !== ei) })}>−</SmallButton>
              </div>
            ))}
            <SmallButton onClick={() => setTxn(ti, { effects: [...t.effects, { account: accountIds[0] ?? '', delta: 0 }] })}>+ effect</SmallButton>
          </div>
        </div>
      ))}
      <SmallButton onClick={() => onChange([...txns, { id: `t${txns.length + 1}`, label: '', effects: [] }])}>+ transaction</SmallButton>
    </div>
  );
}

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'Cash', category: 'Asset' },
  { id: 'equip', name: 'Equipment', category: 'Asset' },
  { id: 'loan', name: 'Bank loan', category: 'Liability' },
  { id: 'capital', name: 'Capital', category: 'Equity' },
];
const DEFAULT_TXNS: Transaction[] = [
  { id: 't1', label: 'Owner invests $10,000 cash', effects: [{ account: 'cash', delta: 10000 }, { account: 'capital', delta: 10000 }] },
  { id: 't2', label: 'Take a $5,000 bank loan', effects: [{ account: 'cash', delta: 5000 }, { account: 'loan', delta: 5000 }] },
  { id: 't3', label: 'Buy equipment for $3,000 cash', effects: [{ account: 'equip', delta: 3000 }, { account: 'cash', delta: -3000 }] },
];

const asAccounts = (raw: unknown): Account[] => (Array.isArray(raw) && raw.length ? (raw as Account[]) : DEFAULT_ACCOUNTS);
const asTxns = (raw: unknown): Transaction[] => (Array.isArray(raw) && raw.length ? (raw as Transaction[]) : DEFAULT_TXNS);

export const EquationBalanceBlock = defineBlock({
  key: 'equation-balance',
  tag: 'EquationBalance',
  void: true,
  label: 'Accounting equation balance (A = L + E)',
  description: 'Apply transactions onto a two-pan scale (Assets vs Liabilities + Equity); the beam re-levels after each balanced entry, and a free-post mode tips the books to drill the misconception. Author the chart of accounts + transactions.',
  category: 'interactive',
  schema: z.object({
    accounts: z.array(z.object({ id: z.string(), name: z.string(), category: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']) })).default(DEFAULT_ACCOUNTS),
    transactions: z.array(z.object({ id: z.string(), label: z.string(), effects: z.array(z.object({ account: z.string(), delta: z.number() })) })).default(DEFAULT_TXNS),
    freePost: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const accounts = asAccounts(attributes.accounts);
    const transactions = asTxns(attributes.transactions);
    const widget = <EquationBalanceLab accounts={accounts} transactions={transactions} freePost={attributes.freePost} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="The balance sheet that must stay level" /></ConfigRow>
          <ConfigRow label="free-post drill"><ChipToggle active={!!attributes.freePost} onClick={() => updateAttributes({ freePost: !attributes.freePost })}>tip the books</ChipToggle></ConfigRow>
          <ConfigRow label="accounts"><AccountsEditor accounts={accounts} onChange={(v) => upd({ accounts: v })} /></ConfigRow>
          <ConfigRow label="transactions"><TxnEffectsEditor txns={transactions} accountIds={accounts.map((a) => a.id)} onChange={(v) => upd({ transactions: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

const accountCatSchema = z.object({ id: z.string(), name: z.string(), category: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']) });
const asJournalTxns = (raw: unknown): JournalTxn[] | undefined => (Array.isArray(raw) && raw.length ? (raw as JournalTxn[]) : undefined);
const asSortAccounts = (raw: unknown): SortAccount[] | undefined => (Array.isArray(raw) && raw.length ? (raw as SortAccount[]) : undefined);

export const JournalPosterBlock = defineBlock({
  key: 'journal-poster',
  tag: 'JournalPoster',
  void: true,
  label: 'Journal poster (debits, credits & T-accounts)',
  description: 'Learner picks the debit (left) + credit (right) account for each authored event; instant coached feedback fills the T-accounts and a live trial balance. Author the chart of accounts + the events.',
  category: 'interactive',
  schema: z.object({
    accounts: z.array(accountCatSchema).optional(),
    transactions: z.array(z.object({ id: z.string(), prompt: z.string(), debit: z.string(), credit: z.string(), amount: z.number() })).optional(),
    showTrialBalance: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const accounts = asAccounts(attributes.accounts);
    const ids = accounts.map((a) => a.id);
    const txns = (asJournalTxns(attributes.transactions) ?? []) as JournalTxn[];
    const widget = <JournalPosterLab accounts={accounts} transactions={asJournalTxns(attributes.transactions)} showTrialBalance={attributes.showTrialBalance} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Post the entry" /></ConfigRow>
          <ConfigRow label="accounts"><AccountsEditor accounts={accounts} onChange={(v) => upd({ accounts: v })} /></ConfigRow>
          <ConfigRow label="events"><RowsEditor<JournalTxn>
            rows={txns} onChange={(v) => upd({ transactions: v })} addLabel="event"
            newRow={() => ({ id: `e${txns.length + 1}`, prompt: '', debit: ids[0] ?? '', credit: ids[1] ?? ids[0] ?? '', amount: 0 })}
            columns={[{ key: 'prompt', label: 'event', grow: true }, { key: 'debit', label: 'debit', type: 'select', options: ids }, { key: 'credit', label: 'credit', type: 'select', options: ids }, { key: 'amount', label: 'amount', type: 'number' }]}
          /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const StatementSorterBlock = defineBlock({
  key: 'statement-sorter',
  tag: 'StatementSorter',
  void: true,
  label: 'Statement sorter (the two statements)',
  description: 'Sort each account into the Income Statement or the Balance Sheet (coached), then close the books to carry net profit into Equity and watch A = L + E hold. Author the accounts + balances.',
  category: 'interactive',
  schema: z.object({
    accounts: z.array(accountCatSchema.extend({ balance: z.number() })).optional(),
    asOfLabel: z.string().optional(),
    showClosing: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const sortAccounts = (asSortAccounts(attributes.accounts) ?? []) as SortAccount[];
    const widget = <StatementSorterLab accounts={asSortAccounts(attributes.accounts)} asOfLabel={attributes.asOfLabel} showClosing={attributes.showClosing} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Sort into the statements" /></ConfigRow>
          <ConfigRow label="accounts + balances"><RowsEditor<SortAccount>
            rows={sortAccounts} onChange={(v) => upd({ accounts: v })} addLabel="account"
            newRow={() => ({ id: '', name: '', category: 'Asset', balance: 0 }) as SortAccount}
            columns={[{ key: 'id', label: 'id' }, { key: 'name', label: 'name', grow: true }, { key: 'category', label: 'category', type: 'select', options: CATEGORIES }, { key: 'balance', label: 'balance', type: 'number' }]}
          /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** This domain's block specs + tag→component render map. */
export const accountingBlocks = [EquationBalanceBlock, JournalPosterBlock, StatementSorterBlock] as const;
export const accountingComponents = {
  EquationBalance: EquationBalanceLab,
  JournalPoster: JournalPosterLab,
  StatementSorter: StatementSorterLab,
} as const;
