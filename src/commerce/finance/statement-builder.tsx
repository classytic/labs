'use client';

/**
 * StatementBuilderLab — the two financial statements, and how they LINK. The income
 * statement works out this year's profit (revenue − cost of sales = gross profit,
 * − expenses = net profit); that net profit is then added to capital on the balance
 * sheet, whose assets always equal capital + liabilities. Drag the trading figures
 * and watch the net profit flow into equity — and the assets side (cash) rise to
 * match, so the balance sheet stays balanced.
 *
 * Cash is the balancing figure, so the sheet always balances by construction — the
 * point is the LINK, not arithmetic slips. Terminology + figures are authorable
 * (a creator can relabel "Income Statement" as "Trading, Profit & Loss Account").
 * Predict-first, curriculum-neutral. Interactive, no loop.
 */

import { useState, type ReactNode } from 'react';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { EvidencePanel, MetricList } from '../activity.js';

export interface StatementBuilderProps {
  revenue?: number;
  costOfSales?: number;
  expenses?: number;
  nonCurrentAssets?: number;
  inventory?: number;
  capital?: number;
  loan?: number;
  currentLiabilities?: number;
  currency?: string;
  incomeStatementName?: string;
  balanceSheetName?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'link',
    prompt: 'Where does the net profit from the income statement go?',
    choices: [
      {
        value: 'equity',
        label: 'added to capital (equity) on the balance sheet',
      },
      { value: 'gone', label: 'it disappears' },
      { value: 'liab', label: 'added to liabilities' },
    ],
    answer: 'equity',
    explain:
      'Profit belongs to the owner, so it’s added to capital. That’s the link between the two statements.',
  },
  {
    id: 'balance',
    prompt: 'On the balance sheet, total assets always equal…',
    choices: [
      { value: 'ce', label: 'capital + liabilities' },
      { value: 'rev', label: 'revenue' },
      { value: 'profit', label: 'net profit' },
    ],
    answer: 'ce',
    explain:
      'Everything the business owns (assets) is financed by the owner (capital + profit) or by others (liabilities).',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the link',
    lead: 'Decide where profit flows before opening the statements.',
    success: 'profit-link',
  },
  {
    id: 'trace',
    phase: 'observe',
    title: 'Trace profit into equity',
    lead: 'Follow net profit from performance into financial position.',
    reveal: ['statements'],
  },
  {
    id: 'build',
    phase: 'act',
    title: 'Reach the margin target',
    lead: 'Adjust trading figures until net margin reaches at least 20%.',
    controls: true,
    success: 'margin-target',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain why it balances',
    lead: 'Use the financing relationship, not the balancing figure alone.',
    success: 'balance-equation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Stress-test profitability',
    lead: 'Change revenue and costs, then inspect the linked statements.',
    reveal: ['transfer'],
    controls: true,
  },
];

const row = (
  label: ReactNode,
  val: string,
  opts: { bold?: boolean; top?: boolean; tone?: 'good' | 'danger' } = {},
): ReactNode => (
  <div
    className="finance-statement-row"
    data-bold={opts.bold || undefined}
    data-divided={opts.top || undefined}
    data-tone={opts.tone}
  >
    <span>{label}</span>
    <span>{val}</span>
  </div>
);

export function StatementBuilderLab({
  revenue = 100000,
  costOfSales = 60000,
  expenses = 25000,
  nonCurrentAssets = 50000,
  inventory = 12000,
  capital = 40000,
  loan = 20000,
  currentLiabilities = 7000,
  currency = '$',
  incomeStatementName = 'Income Statement',
  balanceSheetName = 'Balance Sheet',
  title = 'Build the two statements, and see them link',
  prompt = 'Work out the profit, then watch it flow into the balance sheet. Drag the trading figures.',
  objectives = [
    'Build an income statement: revenue − cost of sales − expenses = net profit',
    'See net profit added to capital on the balance sheet',
    'Understand why assets = capital + liabilities (it always balances)',
  ],
}: StatementBuilderProps = {}): ReactNode {
  const [rev, setRev] = useState(revenue);
  const [cos, setCos] = useState(costOfSales);
  const [exp, setExp] = useState(expenses);

  const grossProfit = rev - cos;
  const netProfit = grossProfit - exp;
  const equity = capital + netProfit;
  const totalClaims = equity + loan + currentLiabilities;
  const cash = totalClaims - nonCurrentAssets - inventory; // balancing figure
  const totalAssets = nonCurrentAssets + inventory + cash;
  const netMargin = rev !== 0 ? netProfit / rev : 0;
  const targetMet = netMargin >= 0.2;
  const fmt = (n: number): string =>
    `${n < 0 ? '−' : ''}${currency}${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

  const figure = (
    <div className="finance-statement-grid">
      {/* Income statement */}
      <div className="finance-statement-card">
        <div className="finance-statement-heading">{incomeStatementName.toUpperCase()}</div>
        {row('Revenue', fmt(rev))}
        {row('− Cost of sales', fmt(cos))}
        {row('Gross profit', fmt(grossProfit), { bold: true, top: true })}
        {row('− Expenses', fmt(exp))}
        {row('Net profit', fmt(netProfit), {
          bold: true,
          top: true,
          tone: netProfit >= 0 ? 'good' : 'danger',
        })}
        <div className="finance-statement-link">↓ net profit flows to capital →</div>
      </div>
      {/* Balance sheet */}
      <div className="finance-statement-card finance-statement-card-linked">
        <div className="finance-statement-heading">{balanceSheetName.toUpperCase()}</div>
        {row('Non-current assets', fmt(nonCurrentAssets))}
        {row('Inventory', fmt(inventory))}
        {row('Cash', fmt(cash))}
        {row('Total assets', fmt(totalAssets), { bold: true, top: true })}
        {row('Capital', fmt(capital), {})}
        {row('+ Net profit', fmt(netProfit), { tone: 'good' })}
        {row('Loan', fmt(loan))}
        {row('Current liabilities', fmt(currentLiabilities))}
        {row('Capital + liabilities', fmt(totalClaims), {
          bold: true,
          top: true,
        })}
        <div className="finance-statement-balance">✓ assets = capital + liabilities</div>
      </div>
    </div>
  );

  const evidence = (
    <EvidencePanel title="Linked-statement evidence">
      <MetricList
        items={[
          { label: 'Net profit', value: fmt(netProfit), tone: netProfit >= 0 ? 'good' : 'danger' },
          {
            label: 'Net margin',
            value: `${(netMargin * 100).toFixed(1)}%`,
            tone: targetMet ? 'good' : 'warn',
          },
          { label: 'Closing equity', value: fmt(equity) },
          {
            label: 'Balance check',
            value: totalAssets === totalClaims ? 'Assets = claims' : 'Out of balance',
            tone: totalAssets === totalClaims ? 'good' : 'danger',
          },
        ]}
      />
    </EvidencePanel>
  );

  const controls = (
    <>
      <Field label="revenue" value={fmt(rev)}>
        <Slider value={rev} min={40000} max={200000} step={5000} onChange={setRev} ariaLabel="revenue" />
      </Field>
      <Field label="cost of sales" value={fmt(cos)}>
        <Slider
          value={cos}
          min={20000}
          max={140000}
          step={5000}
          onChange={setCos}
          ariaLabel="cost of sales"
        />
      </Field>
      <Field label="expenses" value={fmt(exp)}>
        <Slider value={exp} min={5000} max={60000} step={1000} onChange={setExp} ariaLabel="expenses" />
      </Field>
    </>
  );
  const activity: AuthoredActivity = {
    pattern: 'construction',
    title,
    objectives,
    steps: STEPS,
    questions: CHALLENGE,
    success: [
      {
        id: 'profit-link',
        source: 'answer',
        key: 'link',
        pendingLabel: 'Predict where net profit is reported next.',
      },
      {
        id: 'margin-target',
        source: 'metric',
        key: 'netMargin',
        operator: 'gte',
        value: 0.2,
        pendingLabel: 'Reach a net margin of at least 20%.',
      },
      {
        id: 'balance-equation',
        source: 'answer',
        key: 'balance',
        pendingLabel: 'Explain the accounting equation.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="statement-builder"
      eyebrow="Financial reporting"
      title={title}
      description={prompt}
      status={
        <>
          <span>profit {fmt(netProfit)}</span>
          <span>margin {(netMargin * 100).toFixed(1)}%</span>
          <span>{targetMet ? 'target met' : 'target 20%'}</span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('statements') ? evidence : null)}
      controls={({ sequence }) =>
        sequence.current.id === 'build' || sequence.shows('transfer') ? controls : null
      }
      observation={
        targetMet
          ? `The business earns at least 20 cents per ${currency}1 of revenue, and that profit increases closing equity.`
          : 'Net profit links the income statement to equity; the business assets are financed by equity and liabilities together.'
      }
      transcript={`Revenue is ${fmt(rev)}, gross profit is ${fmt(grossProfit)}, and net profit is ${fmt(netProfit)}. Net profit increases closing equity to ${fmt(equity)}. Total assets and total claims both equal ${fmt(totalAssets)}.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="margin-target"
            met={sequence.current.id === 'build' && targetMet}
            complete={complete}
            outcome={`${(netMargin * 100).toFixed(1)}%`}
          />
          {sequence.shows('statements') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Predict the reporting link</strong>
              <span>The connected statements open after your prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
