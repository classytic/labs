'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { Chip } from '../../../kit/controls.js';
import { LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';

type Side = 'add' | 'deduct';
interface ReconItem {
  id: string;
  label: string;
  amount: number;
  stage: 'cash-book' | 'timing';
  side: Side;
  source: string;
}
const ITEMS: ReconItem[] = [
  {
    id: 'charge',
    label: 'Bank charge',
    amount: 30,
    stage: 'cash-book',
    side: 'deduct',
    source: 'bank statement',
  },
  {
    id: 'debit',
    label: 'Direct debit',
    amount: 120,
    stage: 'cash-book',
    side: 'deduct',
    source: 'bank statement',
  },
  {
    id: 'credit',
    label: 'Credit transfer received',
    amount: 250,
    stage: 'cash-book',
    side: 'add',
    source: 'bank statement',
  },
  {
    id: 'cheque',
    label: 'Cheque not yet presented',
    amount: 180,
    stage: 'timing',
    side: 'add',
    source: 'cash book',
  },
  {
    id: 'deposit',
    label: 'Deposit not yet credited',
    amount: 300,
    stage: 'timing',
    side: 'deduct',
    source: 'cash book',
  },
];
const money = (value: number): string => `$${value.toLocaleString()}`;
interface BankReconciliationProps {
  title?: string;
  prompt?: string;
  openingCashBook?: number;
}

export default function BankReconciliation({
  title = 'Bank Reconciliation Workbench',
  prompt = 'Classify each difference in the required order and watch the two records converge.',
  openingCashBook = 1200,
}: BankReconciliationProps): ReactNode {
  const [placements, setPlacements] = useState<Record<string, Side>>({});
  const cashItems = ITEMS.filter((item) => item.stage === 'cash-book');
  const timingItems = ITEMS.filter((item) => item.stage === 'timing');
  const stageCorrect = (items: ReconItem[]): boolean =>
    items.every((item) => placements[item.id] === item.side);
  const cashReady = stageCorrect(cashItems);
  const timingReady = cashReady && stageCorrect(timingItems);
  const updatedCashBook = useMemo(
    () =>
      cashItems.reduce(
        (balance, item) => balance + (item.side === 'add' ? item.amount : -item.amount),
        openingCashBook,
      ),
    [openingCashBook],
  );
  const bankStatement = useMemo(
    () =>
      timingItems.reduce(
        (balance, item) => balance + (item.side === 'add' ? item.amount : -item.amount),
        updatedCashBook,
      ),
    [updatedCashBook],
  );
  const place = (id: string, side: Side): void => setPlacements((current) => ({ ...current, [id]: side }));
  const controlsFor = (items: ReconItem[]): ReactNode => (
    <div className="lab-statlist">
      {items.map((item) => (
        <div className="lab-stat" key={item.id}>
          <span className="lab-stat-label">
            {item.label} · {money(item.amount)}
          </span>
          <span>
            <Chip selected={placements[item.id] === 'add'} onClick={() => place(item.id, 'add')}>
              add
            </Chip>{' '}
            <Chip selected={placements[item.id] === 'deduct'} onClick={() => place(item.id, 'deduct')}>
              deduct
            </Chip>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="bank-reconciliation"
      eyebrow="Accounting verification"
      title={title}
      description={prompt}
      status={
        <>
          <span>{cashReady ? 'cash book updated' : 'update cash book first'}</span>
          <span>{timingReady ? 'reconciled' : 'differences remain'}</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'update'
          ? controlsFor(cashItems)
          : sequence.current.id === 'reconcile'
            ? controlsFor(timingItems)
            : null
      }
      evidence={
        <>
          <Readout value={money(updatedCashBook)} sub="updated cash-book balance" />
          <StatList>
            <Stat label="opening cash book" value={money(openingCashBook)} />
            <Stat
              label="bank statement"
              value={timingReady ? money(bankStatement) : 'complete timing items'}
            />
          </StatList>
        </>
      }
      observation={
        timingReady
          ? `Starting with ${money(updatedCashBook)}, add the unpresented cheque and deduct the deposit not credited to reach the bank-statement balance of ${money(bankStatement)}.`
          : cashReady
            ? 'The updated cash-book balance is the starting point for reconciliation; timing differences do not change the cash book.'
            : 'Items first discovered on the bank statement must be entered in the cash book before reconciliation.'
      }
      transcript={
        <LiveRegion>{`${Object.keys(placements).length} of ${ITEMS.length} items placed. Updated cash-book balance ${money(updatedCashBook)}.${timingReady ? ` Reconciled bank-statement balance ${money(bankStatement)}.` : ''}`}</LiveRegion>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="cash-book-ready"
            met={cashReady}
            complete={complete}
            outcome={money(updatedCashBook)}
          />
          <AuthoredMetricGate
            conditionId="reconciled"
            met={timingReady}
            complete={complete}
            outcome={money(bankStatement)}
          />
          <StatList>
            {ITEMS.map((item) => (
              <Stat
                key={item.id}
                label={`${item.label} · source: ${item.source}`}
                value={placements[item.id] ?? 'unplaced'}
              />
            ))}
          </StatList>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
