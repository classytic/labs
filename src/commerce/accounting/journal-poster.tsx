'use client';

/**
 * JournalPosterLab — post the entry, fill the T-accounts, balance the trial.
 *
 * For each authored business event the learner picks the DEBIT account (left) and
 * the CREDIT account (right) from the chart of accounts. On Post the lab gives
 * INSTANT feedback: a correct entry drops into the matching T-accounts' left/right
 * columns (green); a wrong pick is coached with the reason ("Cash is an Asset — it
 * increases with a DEBIT, the left side") instead of just "wrong". A live trial
 * balance sums ΣDebit vs ΣCredit and only reads level when they match.
 *
 * Reuses the shared accounting core (normalBalance / debit=credit) — no ledger dep.
 * The DEALER mnemonic + trial-balance traps belong in a paired MathDerivation.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useLearner } from '@classytic/stage';
import { Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, LiveRegion } from '../../kit/frame.js';
import { RevealSolution } from '../../kit/pedagogy.js';
import { CATEGORY_COLOR, normalBalance, money, type Account } from './core.js';

export interface JournalTxn { id: string; prompt: string; debit: string; credit: string; amount: number }

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
  { id: 't1', prompt: 'Owner pays $10,000 into the business bank account', debit: 'cash', credit: 'capital', amount: 10000 },
  { id: 't2', prompt: 'Take a $5,000 bank loan (cash received)', debit: 'cash', credit: 'loan', amount: 5000 },
  { id: 't3', prompt: 'Buy equipment for $3,000 cash', debit: 'equip', credit: 'cash', amount: 3000 },
  { id: 't4', prompt: 'Make a cash sale of $2,000', debit: 'cash', credit: 'sales', amount: 2000 },
  { id: 't5', prompt: 'Pay $800 rent in cash', debit: 'rent', credit: 'cash', amount: 800 },
];

interface Posting { debit: string; credit: string; amount: number }

export function JournalPosterLab({
  accounts = DEMO_ACCOUNTS, transactions = DEMO_TXNS, showTrialBalance = true,
  title = 'Post the entry — fill the T-accounts',
  prompt = 'Choose the debit (left) and credit (right) account for each event.',
  objectives,
}: JournalPosterProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [debitId, setDebitId] = useState<string | null>(null);
  const [creditId, setCreditId] = useState<string | null>(null);
  const [posted, setPosted] = useState<Posting[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [wrongHere, setWrongHere] = useState(false);   // a wrong try on THIS event → offer the answer
  const [peeked, setPeeked] = useState(0);             // events the learner revealed (docks the score)
  const learner = useLearner();
  const reported = useRef(false);

  const nameOf = (id: string): string => accounts.find((a) => a.id === id)?.name ?? id;
  const catOf = (id: string): Account['category'] | undefined => accounts.find((a) => a.id === id)?.category;
  const reason = (id: string): string => {
    const c = catOf(id);
    if (!c) return '';
    const article = /^[AEIOU]/.test(c) ? 'an' : 'a';   // an Asset / an Equity / a Liability
    return `${nameOf(id)} is ${article} ${c} — it increases with a ${normalBalance(c).toUpperCase()} (${normalBalance(c) === 'debit' ? 'left' : 'right'}).`;
  };

  const txn = transactions[idx];
  const allDone = idx >= transactions.length;

  const pick = (id: string): void => {
    setFeedback(null);
    if (debitId === id) { setDebitId(null); return; }
    if (creditId === id) { setCreditId(null); return; }
    if (!debitId) setDebitId(id);
    else if (!creditId) setCreditId(id);
  };

  const post = (): void => {
    if (!txn || !debitId || !creditId) return;
    if (debitId === txn.debit && creditId === txn.credit) {
      setPosted((p) => [...p, { debit: txn.debit, credit: txn.credit, amount: txn.amount }]);
      setDebitId(null); setCreditId(null); setWrongHere(false);
      setFeedback({ ok: true, msg: `Posted: debit ${nameOf(txn.debit)} ${money(txn.amount)}, credit ${nameOf(txn.credit)} ${money(txn.amount)} ✓` });
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      if (nextIdx >= transactions.length && !reported.current) {
        reported.current = true;
        // peeking docks the score: solved-on-your-own only if nothing was revealed
        learner?.report({ activity: 'journal-poster', correct: peeked === 0, score: { raw: Math.max(0, transactions.length - peeked), max: transactions.length }, completion: true });
      }
    } else {
      setWrongHere(true);
      setFeedback({ ok: false, msg: `Not quite. ${reason(txn.debit)} ${reason(txn.credit)}` });
    }
  };

  // reveal the answer for the current event: fill the correct picks + count the peek
  const revealAnswer = (): void => {
    if (!txn) return;
    setDebitId(txn.debit); setCreditId(txn.credit); setFeedback(null);
    setPeeked((n) => n + 1);
  };
  const solutionNode = txn ? (
    <>
      Debit <b style={{ color: CATEGORY_COLOR[catOf(txn.debit)!] }}>{nameOf(txn.debit)}</b> (left), credit <b style={{ color: CATEGORY_COLOR[catOf(txn.credit)!] }}>{nameOf(txn.credit)}</b> (right).
      <span style={{ display: 'block', marginTop: 4, fontWeight: 400, fontSize: 12.5, opacity: 0.85 }}>{reason(txn.debit)} {reason(txn.credit)}</span>
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

  const cell = (filled: boolean): React.CSSProperties => ({ flex: 1, padding: '4px 8px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, textAlign: filled ? 'right' : 'left', color: filled ? 'var(--stage-fg)' : 'transparent' });

  const figure = (
    <>
      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 16 }}>
        {/* prompt + pending entry */}
        {allDone ? (
          <p style={{ fontWeight: 700, color: 'var(--stage-good)', margin: 0 }}>All entries posted ✓ — the trial balance is level.</p>
        ) : (
          <>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--stage-muted)', fontWeight: 700 }}>Event {idx + 1} of {transactions.length}</p>
            <p style={{ margin: '0 0 10px', fontWeight: 600 }}>{txn!.prompt} <span style={{ color: 'var(--stage-accent)' }}>(${money(txn!.amount)})</span></p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13 }}>
              <span style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px dashed var(--stage-grid)', background: debitId ? 'color-mix(in oklab, var(--stage-accent) 14%, transparent)' : 'transparent' }}>DEBIT (left): <b>{debitId ? nameOf(debitId) : '—'}</b></span>
              <span style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px dashed var(--stage-grid)', background: creditId ? 'color-mix(in oklab, var(--stage-accent-2) 14%, transparent)' : 'transparent' }}>CREDIT (right): <b>{creditId ? nameOf(creditId) : '—'}</b></span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {accounts.map((a) => (
                <Chip key={a.id} selected={a.id === debitId || a.id === creditId} onClick={() => pick(a.id)}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLOR[a.category], marginRight: 6 }} />{a.name}
                </Chip>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <CheckButton onClick={post} disabled={!debitId || !creditId}>Post entry</CheckButton>
              <button type="button" className="lab-chip" onClick={() => { setDebitId(null); setCreditId(null); setFeedback(null); }}>clear</button>
              {feedback && <StatusPill ok={feedback.ok}>{feedback.msg}</StatusPill>}
            </div>
            {/* shared escape hatch — appears once you've tried; reveals + fills the answer */}
            <div style={{ marginTop: 10 }}>
              <RevealSolution key={idx} available={wrongHere} solution={solutionNode} onReveal={revealAnswer} buttonLabel="Show answer" />
            </div>
          </>
        )}

        {/* T-accounts */}
        {tAccounts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
            {tAccounts.map((a) => {
              const bal = a.debits - a.credits;
              const onNormal = normalBalance(a.category) === 'debit' ? bal : -bal;
              return (
                <div key={a.id} style={{ borderRadius: 8, border: '1px solid var(--stage-grid)', overflow: 'hidden', fontSize: 12 }}>
                  <div style={{ padding: '4px 8px', fontWeight: 700, color: 'var(--stage-bg)', background: CATEGORY_COLOR[a.category] }}>{a.name}</div>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--stage-grid)', background: 'color-mix(in oklab, var(--stage-muted) 8%, transparent)' }}>
                    <span style={{ flex: 1, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'var(--stage-muted)' }}>Dr</span>
                    <span style={{ flex: 1, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'var(--stage-muted)', textAlign: 'right' }}>Cr</span>
                  </div>
                  <div style={{ display: 'flex', minHeight: 22 }}>
                    <span style={cell(a.debits > 0)}>{a.debits > 0 ? money(a.debits) : '·'}</span>
                    <span style={{ ...cell(a.credits > 0), borderLeft: '1px solid var(--stage-grid)' }}>{a.credits > 0 ? money(a.credits) : '·'}</span>
                  </div>
                  <div style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 700, borderTop: '1px solid var(--stage-grid)', color: CATEGORY_COLOR[a.category] }}>{money(Math.abs(onNormal))} {normalBalance(a.category) === 'debit' ? 'Dr' : 'Cr'}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* trial balance */}
        {showTrialBalance && posted.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--stage-grid)', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
            <span>Trial balance:</span>
            <span style={{ color: 'var(--stage-accent)' }}>ΣDr {money(sigmaDebit)}</span>
            <span style={{ color: 'var(--stage-accent-2)' }}>ΣCr {money(sigmaCredit)}</span>
            <StatusPill ok={sigmaDebit === sigmaCredit}>{sigmaDebit === sigmaCredit ? 'level ✓' : 'not level'}</StatusPill>
          </div>
        )}
      </div>

      <LiveRegion>
        {feedback?.msg ?? (allDone ? 'All entries posted.' : txn?.prompt)}
      </LiveRegion>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives}>{figure}</LabFrame>;
}
