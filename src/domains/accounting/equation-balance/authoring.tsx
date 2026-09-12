'use client';

/**
 * Equation-balance authoring — a custom editor (loaded only in the CMS editor chunk). The
 * transactions carry a NESTED `effects` array (account → signed delta) the schema-driven form
 * can't edit well, so this ships a chart-of-accounts editor + a transaction-effects editor.
 */

import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  TextField,
  ChipToggle,
  RowsEditor,
  SelectField,
  NumField,
  SmallButton,
} from '../../../blocks/authoring.js';
import { asAccounts, asTxns, type Account, type Transaction } from '../shared.js';

const CATEGORIES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

/** Chart-of-accounts editor: id + name + a category dropdown (no raw JSON). */
function AccountsEditor({
  accounts,
  onChange,
}: {
  accounts: Account[];
  onChange: (a: Account[]) => void;
}): ReactNode {
  return (
    <RowsEditor<Account>
      rows={accounts}
      onChange={onChange}
      addLabel="account"
      newRow={() => ({ id: '', name: '', category: 'Asset' }) as Account}
      columns={[
        { key: 'id', label: 'id' },
        { key: 'name', label: 'name', grow: true },
        { key: 'category', label: 'category', type: 'select', options: CATEGORIES },
      ]}
    />
  );
}

/** Transactions editor: a label + signed effects on accounts. */
function TxnEffectsEditor({
  txns,
  accountIds,
  onChange,
}: {
  txns: Transaction[];
  accountIds: string[];
  onChange: (t: Transaction[]) => void;
}): ReactNode {
  const setTxn = (i: number, patch: Partial<Transaction>): void =>
    onChange(txns.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const setEffect = (ti: number, ei: number, patch: Partial<Transaction['effects'][number]>): void =>
    setTxn(ti, { effects: txns[ti]!.effects.map((e, j) => (j === ei ? { ...e, ...patch } : e)) });
  return (
    <div className="w-full space-y-2">
      {txns.map((t, ti) => (
        <div key={ti} className="space-y-1.5 rounded-md border border-border/60 bg-background/40 p-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">when</span>
            <TextField
              value={t.label}
              placeholder="Owner invests $10,000 cash"
              onChange={(v) => setTxn(ti, { label: v })}
              className="flex-1 text-[11px]"
            />
            <SmallButton tone="danger" onClick={() => onChange(txns.filter((_, j) => j !== ti))}>
              ✕
            </SmallButton>
          </div>
          <div className="space-y-1 pl-3">
            {t.effects.map((e, ei) => (
              <div key={ei} className="flex items-center gap-1.5">
                <SelectField
                  value={e.account}
                  options={accountIds}
                  onChange={(v) => setEffect(ti, ei, { account: v })}
                />
                <span className="text-[11px] text-muted-foreground">changes by</span>
                <NumField value={e.delta} onChange={(v) => setEffect(ti, ei, { delta: v })} />
                <SmallButton
                  tone="danger"
                  onClick={() => setTxn(ti, { effects: t.effects.filter((_, j) => j !== ei) })}
                >
                  −
                </SmallButton>
              </div>
            ))}
            <SmallButton
              onClick={() =>
                setTxn(ti, { effects: [...t.effects, { account: accountIds[0] ?? '', delta: 0 }] })
              }
            >
              + effect
            </SmallButton>
          </div>
        </div>
      ))}
      <SmallButton onClick={() => onChange([...txns, { id: `t${txns.length + 1}`, label: '', effects: [] }])}>
        + transaction
      </SmallButton>
    </div>
  );
}

export default function EquationBalanceAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const accounts = asAccounts(value.accounts);
  const transactions = asTxns(value.transactions);
  return (
    <ConfigPanel>
      <ConfigRow label="title">
        <TextField
          value={(value.title as string) ?? ''}
          onChange={(v) => onChange({ title: v })}
          placeholder="The balance sheet that must stay level"
        />
      </ConfigRow>
      <ConfigRow label="free-post drill">
        <ChipToggle active={!!value.freePost} onClick={() => onChange({ freePost: !value.freePost })}>
          tip the books
        </ChipToggle>
      </ConfigRow>
      <ConfigRow label="accounts">
        <AccountsEditor accounts={accounts} onChange={(v) => onChange({ accounts: v })} />
      </ConfigRow>
      <ConfigRow label="transactions">
        <TxnEffectsEditor
          txns={transactions}
          accountIds={accounts.map((a) => a.id)}
          onChange={(v) => onChange({ transactions: v })}
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
