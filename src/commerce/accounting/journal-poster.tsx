'use client';
import { Button } from '@/components/ui/button';

/**
 * JournalPosterLab, post the entry, fill the T-accounts, balance the trial.
 *
 * For each authored business event the learner picks the DEBIT account (left) and
 * the CREDIT account (right) from the chart of accounts. On Post the lab gives
 * INSTANT feedback: a correct entry drops into the matching T-accounts' left/right
 * columns (green); a wrong pick is coached with the reason ("Cash is an Asset, it
 * increases with a DEBIT, the left side") instead of just "wrong". A live trial
 * balance sums ΣDebit vs ΣCredit and only reads level when they match.
 *
 * Reuses the shared accounting core (normalBalance / debit=credit), no ledger dep.
 * The DEALER mnemonic + trial-balance traps belong in a paired MathDerivation.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { LiveRegion } from '../../kit/frame.js';
import { RevealSolution } from '../../kit/pedagogy.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { CATEGORY_COLOR, normalBalance, money, type Account } from './core.js';

export interface JournalTxn {
  id: string;
  prompt: string;
  debit: string;
  credit: string;
  amount: number;
}

export interface JournalPosterProps {
  accounts?: Account[];
  transactions?: JournalTxn[];
  showTrialBalance?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const DEMO_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'Cash', category: 'Asset' },
  { id: 'equip', name: 'Equipment', category: 'Asset' },
  { id: 'loan', name: 'Bank loan', category: 'Liability' },
  { id: 'capital', name: 'Capital', category: 'Equity' },
  { id: 'sales', name: 'Sales', category: 'Income' },
  { id: 'rent', name: 'Rent expense', category: 'Expense' },
];
const DEMO_TXNS: JournalTxn[] = [
  {
    id: 't1',
    prompt: 'Owner contributes cash to the business',
    debit: 'cash',
    credit: 'capital',
    amount: 10000,
  },
  { id: 't2', prompt: 'Take a bank loan (cash received)', debit: 'cash', credit: 'loan', amount: 5000 },
  { id: 't3', prompt: 'Buy equipment for cash', debit: 'equip', credit: 'cash', amount: 3000 },
  { id: 't4', prompt: 'Make a cash sale', debit: 'cash', credit: 'sales', amount: 2000 },
  { id: 't5', prompt: 'Pay rent in cash', debit: 'rent', credit: 'cash', amount: 800 },
];
const JOURNAL_QUESTIONS: AuthoredChoiceQuestion[] = [
  {
    id: 'asset-increase',
    prompt: 'An increase in an asset is normally posted on the…',
    choices: [
      { value: 'debit', label: 'debit (left) side' },
      { value: 'credit', label: 'credit (right) side' },
    ],
    answer: 'debit',
    explain: 'Assets have a normal debit balance, so an increase is posted on the left.',
  },
  {
    id: 'trial-balance',
    prompt: 'Why does a correct trial balance stay level?',
    choices: [
      { value: 'equal', label: 'every entry posts equal debits and credits' },
      { value: 'cash', label: 'every entry uses Cash' },
      { value: 'profit', label: 'profit always equals cash' },
    ],
    answer: 'equal',
    explain: 'Double entry records the same amount as a debit and a credit.',
  },
];
const JOURNAL_STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Choose the normal side',
    lead: 'Recall the normal balance before posting.',
    success: 'asset-side',
  },
  {
    id: 'post',
    phase: 'act',
    title: 'Post the journal',
    lead: 'Choose the debit and credit account for every event.',
    reveal: ['journal'],
    controls: true,
    success: 'journal-complete',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the level trial balance',
    lead: 'Connect each entry to equal debit and credit totals.',
    reveal: ['journal'],
    success: 'trial-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Read the completed ledger',
    lead: 'Inspect account balances and the final trial balance.',
    reveal: ['journal'],
  },
];

interface Posting {
  debit: string;
  credit: string;
  amount: number;
}

export function JournalPosterLab({
  accounts = DEMO_ACCOUNTS,
  transactions = DEMO_TXNS,
  showTrialBalance = true,
  title = 'Post the entry: fill the T-accounts',
  prompt = 'Choose the debit (left) and credit (right) account for each event.',
  objectives,
}: JournalPosterProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [debitId, setDebitId] = useState<string | null>(null);
  const [creditId, setCreditId] = useState<string | null>(null);
  const [active, setActive] = useState<'debit' | 'credit'>('debit'); // which slot the next tap fills
  const [posted, setPosted] = useState<Posting[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [wrongHere, setWrongHere] = useState(false); // a wrong try on THIS event → offer the answer
  const [peeked, setPeeked] = useState(0); // events the learner revealed (docks the score)

  const nameOf = (id: string): string => accounts.find((a) => a.id === id)?.name ?? id;
  const catOf = (id: string): Account['category'] | undefined => accounts.find((a) => a.id === id)?.category;
  const reason = (id: string): string => {
    const c = catOf(id);
    if (!c) return '';
    const article = /^[AEIOU]/.test(c) ? 'an' : 'a'; // an Asset / an Equity / a Liability
    return `${nameOf(id)} is ${article} ${c}, it increases with a ${normalBalance(c).toUpperCase()} (${normalBalance(c) === 'debit' ? 'left' : 'right'}).`;
  };

  const txn = transactions[idx];
  const allDone = idx >= transactions.length;

  const pick = (id: string): void => {
    setFeedback(null);
    setAnnouncement(null);
    // tapping an already-assigned account clears its slot and re-activates it
    if (debitId === id) {
      setDebitId(null);
      setActive('debit');
      return;
    }
    if (creditId === id) {
      setCreditId(null);
      setActive('credit');
      return;
    }
    // otherwise fill the ACTIVE slot, then advance focus to the other empty slot
    if (active === 'debit') {
      setDebitId(id);
      setActive(creditId ? 'debit' : 'credit');
    } else {
      setCreditId(id);
      setActive(debitId ? 'credit' : 'debit');
    }
  };

  const post = (): void => {
    if (!txn || !debitId || !creditId) return;
    if (debitId === txn.debit && creditId === txn.credit) {
      setPosted((p) => [...p, { debit: txn.debit, credit: txn.credit, amount: txn.amount }]);
      setDebitId(null);
      setCreditId(null);
      setActive('debit');
      setWrongHere(false);
      setFeedback(null);
      setAnnouncement(
        `Posted debit ${nameOf(txn.debit)} ${money(txn.amount)} and credit ${nameOf(txn.credit)} ${money(txn.amount)}.`,
      );
      const nextIdx = idx + 1;
      setIdx(nextIdx);
    } else {
      setWrongHere(true);
      setFeedback({ ok: false, msg: `Not quite. ${reason(txn.debit)} ${reason(txn.credit)}` });
    }
  };

  // reveal the answer for the current event: fill the correct picks + count the peek
  const revealAnswer = (): void => {
    if (!txn) return;
    setDebitId(txn.debit);
    setCreditId(txn.credit);
    setFeedback(null);
    setAnnouncement(null);
    setPeeked((n) => n + 1);
  };
  const solutionNode = txn ? (
    <>
      Debit{' '}
      <b
        className="account-category-text"
        style={{ '--account-color': CATEGORY_COLOR[catOf(txn.debit)!] } as CSSProperties}
      >
        {nameOf(txn.debit)}
      </b>{' '}
      (left), credit{' '}
      <b
        className="account-category-text"
        style={{ '--account-color': CATEGORY_COLOR[catOf(txn.credit)!] } as CSSProperties}
      >
        {nameOf(txn.credit)}
      </b>{' '}
      (right).
      <span className="journal-solution-reason">
        {reason(txn.debit)} {reason(txn.credit)}
      </span>
    </>
  ) : null;

  // T-accounts from posted entries
  const tAccounts = accounts
    .map((a) => ({
      ...a,
      debits: posted.filter((p) => p.debit === a.id).reduce((s, p) => s + p.amount, 0),
      credits: posted.filter((p) => p.credit === a.id).reduce((s, p) => s + p.amount, 0),
    }))
    .filter((a) => a.debits > 0 || a.credits > 0);
  const sigmaDebit = posted.reduce((s, p) => s + p.amount, 0);
  const sigmaCredit = sigmaDebit; // each posted entry is balanced by construction

  const figure = (
    <>
      <div className="journal-workspace">
        {/* prompt + pending entry */}
        {allDone ? (
          <p className="business-complete">All entries posted ✓, the trial balance is level.</p>
        ) : (
          <>
            <p className="journal-event-prompt">
              {txn!.prompt} <span>{money(txn!.amount)}</span>
            </p>
            {/* two clear slots; tap one to make it active, then tap an account below to fill it */}
            <div className="journal-entry-slots">
              {(['debit', 'credit'] as const).map((which) => {
                const id = which === 'debit' ? debitId : creditId;
                const isActive = active === which;
                const col = id ? CATEGORY_COLOR[catOf(id)!] : 'var(--stage-accent)';
                return (
                  <Button
                    key={which}
                    type="button"
                    variant="outline"
                    onClick={() => setActive(which)}
                    aria-label={`${which} slot${id ? `: ${nameOf(id)}` : ' empty'}${isActive ? ', active' : ''}`}
                    className="journal-entry-slot"
                    data-active={isActive}
                    data-filled={!!id}
                    style={{ '--account-color': col } as CSSProperties}
                  >
                    <span className="journal-slot-label">
                      {which === 'debit' ? 'DEBIT (left)' : 'CREDIT (right)'}
                    </span>
                    <span className="journal-slot-value" data-filled={!!id}>
                      {id ? nameOf(id) : isActive ? 'tap an account ↓' : 'tap to choose'}
                    </span>
                  </Button>
                );
              })}
            </div>
            <div className="journal-account-rack">
              {accounts.map((a) => {
                const slot = a.id === debitId ? 'Dr' : a.id === creditId ? 'Cr' : null;
                return (
                  <Chip key={a.id} selected={slot != null} onClick={() => pick(a.id)}>
                    <span
                      className="account-category-dot"
                      style={{ '--account-color': CATEGORY_COLOR[a.category] } as CSSProperties}
                    />
                    {a.name}
                    {slot && <span className="journal-slot-badge">{slot}</span>}
                  </Chip>
                );
              })}
            </div>
            <div className="journal-actions">
              <CheckButton onClick={post} disabled={!debitId || !creditId}>
                Post entry
              </CheckButton>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDebitId(null);
                  setCreditId(null);
                  setActive('debit');
                  setFeedback(null);
                  setAnnouncement(null);
                }}
              >
                Clear
              </Button>
              {feedback && <StatusPill ok={feedback.ok}>{feedback.msg}</StatusPill>}
            </div>
            {/* shared escape hatch, appears once you've tried; reveals + fills the answer */}
            <div className="journal-reveal">
              <RevealSolution
                key={idx}
                available={wrongHere}
                solution={solutionNode}
                onReveal={revealAnswer}
                buttonLabel="Show answer"
              />
            </div>
          </>
        )}

        {tAccounts.length > 0 && (
          <details className="journal-ledger" open={allDone || undefined}>
            <summary>
              <span>
                Ledger after {posted.length} {posted.length === 1 ? 'entry' : 'entries'}
              </span>
              <span className="journal-ledger-balance">
                ΣDr {money(sigmaDebit)} · ΣCr {money(sigmaCredit)} · level
              </span>
            </summary>
            <div className="journal-ledger-body">
              <div className="t-account-grid">
                {tAccounts.map((a) => {
                  const bal = a.debits - a.credits;
                  const onNormal = normalBalance(a.category) === 'debit' ? bal : -bal;
                  return (
                    <div
                      key={a.id}
                      className="t-account"
                      style={{ '--account-color': CATEGORY_COLOR[a.category] } as CSSProperties}
                    >
                      <div className="t-account-title">{a.name}</div>
                      <div className="t-account-head">
                        <span>Dr</span>
                        <span>Cr</span>
                      </div>
                      <div className="t-account-values">
                        <span data-filled={a.debits > 0}>{a.debits > 0 ? money(a.debits) : '·'}</span>
                        <span data-filled={a.credits > 0}>{a.credits > 0 ? money(a.credits) : '·'}</span>
                      </div>
                      <div className="t-account-balance">
                        {money(Math.abs(onNormal))} {normalBalance(a.category) === 'debit' ? 'Dr' : 'Cr'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {showTrialBalance && (
                <div className="trial-balance">
                  <span>Trial balance</span>
                  <span data-side="debit">ΣDr {money(sigmaDebit)}</span>
                  <span data-side="credit">ΣCr {money(sigmaCredit)}</span>
                  <StatusPill ok={sigmaDebit === sigmaCredit}>
                    {sigmaDebit === sigmaCredit ? 'level ✓' : 'not level'}
                  </StatusPill>
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      <LiveRegion>
        {announcement ?? feedback?.msg ?? (allDone ? 'All entries posted.' : txn?.prompt)}
      </LiveRegion>
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'construction',
    title,
    objectives: objectives ?? [
      'Apply normal-balance rules',
      'Post equal debits and credits',
      'Read a trial balance',
    ],
    steps: JOURNAL_STEPS,
    questions: JOURNAL_QUESTIONS,
    success: [
      {
        id: 'asset-side',
        source: 'answer',
        key: 'asset-increase',
        pendingLabel: 'Choose the normal side for an asset increase.',
      },
      {
        id: 'journal-complete',
        source: 'metric',
        key: 'posted',
        operator: 'eq',
        value: transactions.length,
        pendingLabel: 'Post every event.',
      },
      {
        id: 'trial-explanation',
        source: 'answer',
        key: 'trial-balance',
        pendingLabel: 'Explain why the trial balance remains level.',
      },
    ],
  };
  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="journal-poster"
      eyebrow="Double-entry posting"
      title={title}
      description={prompt}
      status={
        <>
          <strong>{allDone ? 'complete' : `event ${idx + 1}`}</strong>
          <span>
            {posted.length}/{transactions.length} posted
          </span>
          <span>ΣDr {money(sigmaDebit)}</span>
          <span>ΣCr {money(sigmaCredit)}</span>
          {peeked > 0 && <span>{peeked} revealed</span>}
        </>
      }
      transcript={`Journal has ${posted.length} of ${transactions.length} entries posted. Total debits are ${money(sigmaDebit)} and total credits are ${money(sigmaCredit)}. ${allDone ? 'The trial balance is level.' : (txn?.prompt ?? '')}`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="journal-complete"
            met={sequence.current.id === 'post' && allDone}
            complete={complete}
            outcome={`${posted.length}/${transactions.length}`}
          />
          {sequence.shows('journal') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Recall the normal balance first</strong>
              <span>The journal opens after your prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
