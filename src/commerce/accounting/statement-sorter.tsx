'use client';
import { Button } from '@/components/ui/button';

/**
 * StatementSorterLab, sort the accounts into the two statements.
 *
 * The financial statements aren't new objects, they're a SORTING of the ledger
 * accounts into their home: Income/Expense → Income Statement (this period's
 * "result"), Asset/Liability/Equity → Balance Sheet (the cumulative "standing").
 * The learner sends each account to a statement (wrong picks are coached, not just
 * marked wrong); then "Close the books" carries net profit (Income − Expense) into
 * Equity and the Balance Sheet equation A = L + E visibly holds.
 *
 * Reuses the accounting core (statementOf / equationParts). No ledger dep.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { CheckButton } from '../../kit/controls.js';
import { Field, LiveRegion } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { CATEGORY_COLOR, statementOf, money, type Account, type AccountCategory } from './core.js';
import { EvidencePanel } from '../activity.js';

export interface SortAccount extends Account {
  balance: number;
}

export interface StatementSorterProps {
  accounts?: SortAccount[];
  asOfLabel?: string;
  showClosing?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const DEMO: SortAccount[] = [
  { id: 'cash', name: 'Cash', category: 'Asset', balance: 13200 },
  { id: 'equip', name: 'Equipment', category: 'Asset', balance: 3000 },
  { id: 'loan', name: 'Bank loan', category: 'Liability', balance: 5000 },
  { id: 'capital', name: 'Capital', category: 'Equity', balance: 10000 },
  { id: 'sales', name: 'Sales', category: 'Income', balance: 2000 },
  { id: 'rent', name: 'Rent expense', category: 'Expense', balance: 800 },
];
const SORTER_QUESTIONS: AuthoredChoiceQuestion[] = [
  {
    id: 'income-home',
    prompt: 'Income and Expense accounts belong on the…',
    choices: [
      { value: 'is', label: 'Income Statement' },
      { value: 'bs', label: 'Balance Sheet' },
    ],
    answer: 'is',
    explain:
      'Income and Expense measure performance for the period; the other categories describe financial position.',
  },
];
const SORTER_STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the account homes',
    lead: 'Separate period performance from financial position.',
    success: 'statement-home',
  },
  {
    id: 'sort',
    phase: 'act',
    title: 'Sort every account',
    lead: 'Send each authored account to its statement.',
    reveal: ['sorter'],
    controls: true,
    success: 'all-sorted',
  },
  {
    id: 'close',
    phase: 'explain',
    title: 'Close the books',
    lead: 'Carry this period’s result into equity.',
    reveal: ['sorter'],
    controls: true,
    success: 'books-closed',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Read the linked statements',
    lead: 'Verify how performance changes financial position.',
    reveal: ['sorter'],
  },
];

type Tray = 'IS' | 'BS';

export function StatementSorterLab({
  accounts = DEMO,
  asOfLabel = '',
  showClosing = true,
  title = 'Sort the accounts into the two statements',
  prompt = 'Income & Expense → Income Statement; Asset, Liability & Equity → Balance Sheet.',
  objectives,
}: StatementSorterProps): ReactNode {
  const [place, setPlace] = useState<Record<string, Tray>>({});
  const [closed, setClosed] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const send = (a: SortAccount, tray: Tray): void => {
    const correct: Tray = statementOf(a.category) === 'Income Statement' ? 'IS' : 'BS';
    if (tray === correct) {
      setPlace((p) => ({ ...p, [a.id]: tray }));
      setHint(null);
    } else
      setHint(
        `${a.name} is ${a.category === 'Asset' || a.category === 'Income' ? 'an' : 'a'} ${a.category}, it belongs on the ${statementOf(a.category)}.`,
      );
  };

  const unsorted = accounts.filter((a) => !place[a.id]);
  const inTray = (t: Tray): SortAccount[] => accounts.filter((a) => place[a.id] === t);
  const income = accounts.filter((a) => a.category === 'Income').reduce((s, a) => s + a.balance, 0);
  const expense = accounts.filter((a) => a.category === 'Expense').reduce((s, a) => s + a.balance, 0);
  const profit = income - expense;
  const assets = accounts.filter((a) => a.category === 'Asset').reduce((s, a) => s + a.balance, 0);
  const liabilities = accounts.filter((a) => a.category === 'Liability').reduce((s, a) => s + a.balance, 0);
  const equityBase = accounts.filter((a) => a.category === 'Equity').reduce((s, a) => s + a.balance, 0);
  const equity = equityBase + (closed ? profit : 0);
  const balanced = Math.abs(assets - (liabilities + equity)) < 0.005;
  const allSorted = unsorted.length === 0;

  const close = (): void => {
    setClosed(true);
  };

  const Row = ({ a }: { a: SortAccount }): ReactNode => (
    <div className="business-ledger-row">
      <span>
        <span
          className="account-category-dot"
          style={{ '--account-color': CATEGORY_COLOR[a.category] } as CSSProperties}
        />
        {a.name}
      </span>
      <span className="statement-account-value">{money(a.balance)}</span>
    </div>
  );

  const figure = (
    <div className="statement-sorter-board">
      {/* Income Statement */}
      <div className="statement-tray">
        <p className="statement-tray-title">
          Income Statement <span>· this period</span>
        </p>
        {inTray('IS').map((a) => (
          <Row key={a.id} a={a} />
        ))}
        {inTray('IS').length === 0 && <p className="statement-tray-empty">send Income &amp; Expense here</p>}
        {allSorted && (
          <div className="statement-tray-total" data-tone={profit >= 0 ? 'good' : 'danger'}>
            Net {profit >= 0 ? 'profit' : 'loss'}: {money(Math.abs(profit))}
          </div>
        )}
      </div>

      {/* Balance Sheet */}
      <div className="statement-tray" data-balanced={closed && balanced}>
        <p className="statement-tray-title">
          Balance Sheet <span>· standing{asOfLabel ? ` ${asOfLabel}` : ''}</span>
        </p>
        {inTray('BS').map((a) => (
          <Row key={a.id} a={a} />
        ))}
        {inTray('BS').length === 0 && (
          <p className="statement-tray-empty">send Asset, Liability &amp; Equity here</p>
        )}
        {closed && (
          <div className="business-ledger-row statement-retained">
            <span>+ retained profit → Equity</span>
            <span>{money(profit)}</span>
          </div>
        )}
        {allSorted && (
          <div className="statement-tray-total">
            A {money(assets)} {balanced ? '=' : '≠'} L {money(liabilities)} + E {money(equity)}
          </div>
        )}
      </div>
    </div>
  );

  const sorted = accounts.length - unsorted.length;
  const evidence = (
    <EvidencePanel title="Classification evidence">
      <div>
        {closed ? (
          <span className="statement-status-stack">
            <span className="statement-status-title" data-tone={balanced ? 'good' : 'danger'}>
              {balanced ? 'A = L + E holds ✓' : 'Does not balance'}
            </span>
            <span className="commerce-muted">
              net {profit >= 0 ? 'profit' : 'loss'} {money(Math.abs(profit))} carried into equity
            </span>
          </span>
        ) : allSorted ? (
          <span className="business-feedback">
            All sorted. Now <strong>close the books</strong> to carry the profit into equity.
          </span>
        ) : (
          <span className="statement-status-stack">
            <span className="statement-progress">
              {sorted}/{accounts.length} accounts sorted
            </span>
            {hint && <span className="statement-hint">{hint}</span>}
          </span>
        )}
      </div>
      <p className="statement-explainer">
        Income &amp; Expense build this period’s result; Asset, Liability &amp; Equity show the standing.
      </p>
    </EvidencePanel>
  );

  const controls =
    unsorted.length > 0 ? (
      <>
        <Field label="send each account to its statement">
          <span className="lab-field-row statement-account-rack">
            {unsorted.map((a) => (
              <span key={a.id} className="statement-account-pill">
                <span
                  className="account-category-dot"
                  style={{ '--account-color': CATEGORY_COLOR[a.category] } as CSSProperties}
                />
                <span className="statement-account-name">{a.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="lab-chip"
                  onClick={() => send(a, 'IS')}
                >
                  IS
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="lab-chip"
                  onClick={() => send(a, 'BS')}
                >
                  BS
                </Button>
              </span>
            ))}
          </span>
        </Field>
      </>
    ) : showClosing && !closed ? (
      <>
        <Field label="finish">
          <CheckButton onClick={close}>Close the books ▶</CheckButton>
        </Field>
      </>
    ) : undefined;

  const activity: AuthoredActivity = {
    pattern: 'allocation',
    title,
    objectives: objectives ?? [
      'Classify accounts by statement',
      'Calculate the period result',
      'Carry profit into equity',
    ],
    steps: showClosing ? SORTER_STEPS : SORTER_STEPS.filter((step) => step.id !== 'close'),
    questions: SORTER_QUESTIONS,
    success: [
      {
        id: 'statement-home',
        source: 'answer',
        key: 'income-home',
        pendingLabel: 'Choose the home for Income and Expense.',
      },
      {
        id: 'all-sorted',
        source: 'metric',
        key: 'sorted',
        operator: 'eq',
        value: accounts.length,
        pendingLabel: 'Sort every account.',
      },
      ...(showClosing
        ? [{ id: 'books-closed', source: 'action' as const, key: 'close', pendingLabel: 'Close the books.' }]
        : []),
    ],
  };
  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="statement-sorter"
      eyebrow="Financial statements"
      title={title}
      description={prompt}
      status={
        <>
          <strong>{closed ? 'books closed' : 'sorting'}</strong>
          <span>
            {sorted}/{accounts.length} placed
          </span>
          <span>profit {money(profit)}</span>
          {closed && <span>{balanced ? 'balanced' : 'check equation'}</span>}
        </>
      }
      evidence={({ sequence }) => (sequence.shows('sorter') ? evidence : null)}
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation={
        closed
          ? 'Closing transfers the period result into equity, connecting the income statement with the balance sheet.'
          : 'Income and Expense accounts describe performance for the period; Asset, Liability and Equity accounts describe financial position.'
      }
      transcript={`${sorted} of ${accounts.length} accounts are sorted. Net profit is ${money(profit)}. ${closed ? `Profit has been carried to equity and the equation ${balanced ? 'balances' : 'does not balance'}.` : 'The books remain open.'}`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="all-sorted"
            met={sequence.current.id === 'sort' && allSorted}
            complete={complete}
            outcome={`${sorted}/${accounts.length}`}
          />
          <AuthoredMetricGate
            conditionId="books-closed"
            met={sequence.current.id === 'close' && closed}
            complete={complete}
            outcome="closed"
          />
          {sequence.shows('sorter') ? (
            <>
              {figure}
              <LiveRegion>
                {hint ??
                  (closed
                    ? `Net profit ${money(profit)} carried to equity.`
                    : `${unsorted.length} accounts left to sort.`)}
              </LiveRegion>
            </>
          ) : (
            <div className="commerce-model-lock">
              <strong>Classify the statement types first</strong>
              <span>The sorting workspace opens after your prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
