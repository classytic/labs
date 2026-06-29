'use client';

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

import { useState, type ReactNode } from 'react';
import { CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { CATEGORY_COLOR, statementOf, money, type Account, type AccountCategory } from './core.js';

export interface SortAccount extends Account { balance: number }

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

type Tray = 'IS' | 'BS';

export function StatementSorterLab({
  accounts = DEMO, asOfLabel = '', showClosing = true,
  title = 'Sort the accounts into the two statements',
  prompt = 'Income & Expense → Income Statement; Asset, Liability & Equity → Balance Sheet.',
  objectives,
}: StatementSorterProps): ReactNode {
  const [place, setPlace] = useState<Record<string, Tray>>({});
  const [closed, setClosed] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const send = (a: SortAccount, tray: Tray): void => {
    const correct: Tray = statementOf(a.category) === 'Income Statement' ? 'IS' : 'BS';
    if (tray === correct) { setPlace((p) => ({ ...p, [a.id]: tray })); setHint(null); }
    else setHint(`${a.name} is ${a.category === 'Asset' || a.category === 'Income' ? 'an' : 'a'} ${a.category}, it belongs on the ${statementOf(a.category)}.`);
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

  useCheckpoint({ solved: closed, activity: 'statement-sorter' });

  const close = (): void => { setClosed(true); };

  const Row = ({ a }: { a: SortAccount }): ReactNode => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
      <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLOR[a.category], marginRight: 6 }} />{a.name}</span>
      <span style={{ fontWeight: 600 }}>{money(a.balance)}</span>
    </div>
  );
  const trayStyle: React.CSSProperties = { flex: 1, minWidth: 180, borderRadius: 10, border: '1px solid var(--stage-grid)', background: 'var(--stage-bg)', padding: 12 };

  const figure = (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Income Statement */}
        <div style={trayStyle}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13 }}>Income Statement <span style={{ color: 'var(--stage-muted)', fontWeight: 400 }}>· this period</span></p>
          {inTray('IS').map((a) => <Row key={a.id} a={a} />)}
          {inTray('IS').length === 0 && <p style={{ fontSize: 12, color: 'var(--stage-muted)' }}>drop Income & Expense here</p>}
          {allSorted && (
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--stage-grid)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: profit >= 0 ? 'var(--stage-good)' : 'var(--stage-danger)' }}>
              Net {profit >= 0 ? 'profit' : 'loss'}: {money(Math.abs(profit))}
            </div>
          )}
        </div>

        {/* Balance Sheet */}
        <div style={{ ...trayStyle, borderColor: closed && balanced ? 'var(--stage-good)' : 'var(--stage-grid)' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13 }}>Balance Sheet <span style={{ color: 'var(--stage-muted)', fontWeight: 400 }}>· standing{asOfLabel ? ` ${asOfLabel}` : ''}</span></p>
          {inTray('BS').map((a) => <Row key={a.id} a={a} />)}
          {inTray('BS').length === 0 && <p style={{ fontSize: 12, color: 'var(--stage-muted)' }}>drop Asset, Liability & Equity here</p>}
          {closed && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--stage-accent)' }}><span>+ retained profit → Equity</span><span style={{ fontWeight: 700 }}>{money(profit)}</span></div>}
          {allSorted && (
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--stage-grid)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              A {money(assets)} {balanced ? '=' : '≠'} L {money(liabilities)} + E {money(equity)}
            </div>
          )}
        </div>
    </div>
  );

  const footer = (
    <>
      {/* unsorted cards */}
      {unsorted.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          {hint && <p style={{ fontSize: 12, color: 'var(--stage-warn)', margin: '0 0 6px', fontWeight: 600 }}>{hint}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unsorted.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--stage-grid)' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLOR[a.category], marginRight: 6 }} />{a.name}</span>
                <button type="button" className="lab-chip" onClick={() => send(a, 'IS')}>Income St.</button>
                <button type="button" className="lab-chip" onClick={() => send(a, 'BS')}>Balance Sh.</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="lab-bar" style={{ gap: 10 }}>
          {showClosing && !closed && <CheckButton onClick={close}>Close the books → carry profit to Equity</CheckButton>}
          {closed && <StatusPill ok={balanced}>{balanced ? 'Net profit carried to Equity, A = L + E holds ✓' : 'Equation does not balance'}</StatusPill>}
        </div>
      )}

      <LiveRegion>
        {hint ?? (closed ? `Net profit ${money(profit)} carried to equity; assets ${money(assets)} equal liabilities plus equity ${money(liabilities + equity)}.` : `${unsorted.length} accounts left to sort.`)}
      </LiveRegion>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} footer={footer}>{figure}</LabFrame>;
}
