'use client';

import { useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { Chip } from '../../../kit/controls.js';
import { LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';

type Account = 'sales' | 'purchases';
type Side = 'debit' | 'credit';
interface Entry {
  id: string;
  label: string;
  amount: number;
  account: Account;
  side: Side;
  source: string;
}
const ENTRIES: Entry[] = [
  {
    id: 'sales-opening',
    label: 'Opening trade receivables',
    amount: 900,
    account: 'sales',
    side: 'debit',
    source: 'previous ledger balance',
  },
  {
    id: 'credit-sales',
    label: 'Credit sales',
    amount: 2400,
    account: 'sales',
    side: 'debit',
    source: 'sales journal',
  },
  {
    id: 'cash-received',
    label: 'Cash received',
    amount: 1800,
    account: 'sales',
    side: 'credit',
    source: 'cash book',
  },
  {
    id: 'returns-in',
    label: 'Returns inward',
    amount: 100,
    account: 'sales',
    side: 'credit',
    source: 'sales returns journal',
  },
  {
    id: 'discount-allowed',
    label: 'Discount allowed',
    amount: 50,
    account: 'sales',
    side: 'credit',
    source: 'cash book',
  },
  {
    id: 'bad-debts',
    label: 'Bad debts',
    amount: 70,
    account: 'sales',
    side: 'credit',
    source: 'general journal',
  },
  {
    id: 'purchases-opening',
    label: 'Opening trade payables',
    amount: 700,
    account: 'purchases',
    side: 'credit',
    source: 'previous ledger balance',
  },
  {
    id: 'credit-purchases',
    label: 'Credit purchases',
    amount: 1800,
    account: 'purchases',
    side: 'credit',
    source: 'purchases journal',
  },
  {
    id: 'cash-paid',
    label: 'Cash paid',
    amount: 1400,
    account: 'purchases',
    side: 'debit',
    source: 'cash book',
  },
  {
    id: 'returns-out',
    label: 'Returns outward',
    amount: 90,
    account: 'purchases',
    side: 'debit',
    source: 'purchases returns journal',
  },
  {
    id: 'discount-received',
    label: 'Discount received',
    amount: 40,
    account: 'purchases',
    side: 'debit',
    source: 'cash book',
  },
];
const money = (value: number): string => `$${value.toLocaleString()}`;
interface ControlAccountBuilderProps {
  title?: string;
  prompt?: string;
}

export default function ControlAccountBuilder({
  title = 'Control Account Builder',
  prompt = 'Post journal totals to one control account at a time, then read the closing balance.',
}: ControlAccountBuilderProps): ReactNode {
  const [placements, setPlacements] = useState<Record<string, Side>>({});
  const itemsFor = (account: Account): Entry[] => ENTRIES.filter((entry) => entry.account === account);
  const accountReady = (account: Account): boolean =>
    itemsFor(account).every((entry) => placements[entry.id] === entry.side);
  const salesReady = accountReady('sales');
  const purchasesReady = accountReady('purchases');
  const balanceFor = (account: Account): number => {
    const entries = itemsFor(account);
    const debit = entries
      .filter((entry) => entry.side === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const credit = entries
      .filter((entry) => entry.side === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);
    return Math.abs(debit - credit);
  };
  const place = (id: string, side: Side): void => setPlacements((current) => ({ ...current, [id]: side }));
  const builder = (account: Account): ReactNode => (
    <div className="lab-statlist">
      {itemsFor(account).map((entry) => (
        <div className="lab-stat" key={entry.id}>
          <span className="lab-stat-label">
            {entry.label} · {money(entry.amount)}
          </span>
          <span>
            <Chip selected={placements[entry.id] === 'debit'} onClick={() => place(entry.id, 'debit')}>
              debit
            </Chip>{' '}
            <Chip selected={placements[entry.id] === 'credit'} onClick={() => place(entry.id, 'credit')}>
              credit
            </Chip>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="control-account-builder"
      eyebrow="Accounting control"
      title={title}
      description={prompt}
      status={
        <>
          <span>{salesReady ? 'sales control balanced' : 'sales control open'}</span>
          <span>{purchasesReady ? 'purchases control balanced' : 'purchases control open'}</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'sales'
          ? builder('sales')
          : sequence.current.id === 'purchases'
            ? builder('purchases')
            : null
      }
      evidence={({ sequence }) => {
        const account: Account = sequence.current.id === 'sales' ? 'sales' : 'purchases';
        const ready = account === 'sales' ? salesReady : purchasesReady;
        return (
          <>
            <Readout
              value={ready ? money(balanceFor(account)) : '—'}
              sub={`${account} ledger closing balance`}
            />
            <StatList>
              <Stat
                label="balance represents"
                value={account === 'sales' ? 'trade receivables' : 'trade payables'}
              />
              <Stat label="source checked" value="books of prime entry" />
            </StatList>
          </>
        );
      }}
      observation={
        purchasesReady
          ? 'The purchases ledger control closing credit balance represents the total owed to suppliers.'
          : salesReady
            ? 'The sales ledger control closing debit balance represents the total owed by credit customers.'
            : 'A control account collects totals from books of prime entry; individual customer and supplier accounts remain in the subsidiary ledgers.'
      }
      transcript={
        <LiveRegion>{`${Object.keys(placements).length} of ${ENTRIES.length} entries placed. Sales ledger control ${salesReady ? `closes at ${money(balanceFor('sales'))}` : 'is incomplete'}. Purchases ledger control ${purchasesReady ? `closes at ${money(balanceFor('purchases'))}` : 'is incomplete'}.`}</LiveRegion>
      }
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="sales-built"
            met={salesReady}
            complete={complete}
            outcome={money(balanceFor('sales'))}
          />
          <AuthoredMetricGate
            conditionId="purchases-built"
            met={purchasesReady}
            complete={complete}
            outcome={money(balanceFor('purchases'))}
          />
          <StatList>
            {itemsFor(sequence.current.id === 'sales' ? 'sales' : 'purchases').map((entry) => (
              <Stat
                key={entry.id}
                label={`${entry.label} · ${entry.source}`}
                value={placements[entry.id] ?? 'unplaced'}
              />
            ))}
          </StatList>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
