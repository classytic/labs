'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { ratios } from '@classytic/stage/finance';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { EvidencePanel, MetricList } from '../activity.js';

export type RatioKey =
  'current' | 'quick' | 'grossMargin' | 'netMargin' | 'roce' | 'gearing' | 'inventoryTurnover';
export const RATIO_GROUPS: Record<string, RatioKey[]> = {
  liquidity: ['current', 'quick'],
  profitability: ['grossMargin', 'netMargin', 'roce'],
  gearing: ['gearing'],
  efficiency: ['inventoryTurnover'],
};

export interface RatioLabProps {
  currentAssets?: number;
  inventory?: number;
  currentLiabilities?: number;
  nonCurrentLiabilities?: number;
  equity?: number;
  revenue?: number;
  costOfSales?: number;
  expenses?: number;
  currency?: string;
  show?: RatioKey[] | keyof typeof RATIO_GROUPS;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

type Tone = 'good' | 'warn' | 'danger';
const DIAGNOSE: AuthoredChoiceQuestion[] = [
  {
    id: 'diagnosis',
    prompt: 'Which evidence most directly signals short-term payment risk?',
    choices: [
      { value: 'quick', label: 'quick ratio below 1' },
      {
        value: 'margin',
        label: 'a positive gross margin',
        feedback:
          'Margin describes profitability. The case asks whether liquid assets cover near-term bills.',
      },
      {
        value: 'turnover',
        label: 'inventory turning over',
        feedback:
          'Turnover describes efficiency. Look for a measure comparing liquid assets with current liabilities.',
      },
    ],
    answer: 'quick',
    explain:
      'A quick ratio below 1 means liquid current assets do not cover current liabilities without selling inventory.',
  },
];
const EXPLAIN: AuthoredChoiceQuestion[] = [
  {
    id: 'intervention',
    prompt: 'Why can selling inventory for cash improve the quick ratio without changing the current ratio?',
    choices: [
      { value: 'reclassify', label: 'inventory becomes a liquid current asset' },
      {
        value: 'revenue',
        label: 'revenue automatically doubles',
        feedback:
          'A sale does not automatically double annual revenue, and revenue is not in either liquidity ratio.',
      },
      {
        value: 'debt',
        label: 'long-term debt disappears',
        feedback: 'Converting stock to cash does not erase long-term borrowing.',
      },
    ],
    answer: 'reclassify',
    explain:
      'Current assets stay broadly unchanged, but the quick-ratio numerator rises because cash is included while inventory is excluded.',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Diagnose the risk',
    lead: 'Commit to the strongest evidence before editing the books.',
    success: 'diagnosis',
  },
  {
    id: 'inspect',
    phase: 'observe',
    title: 'Open the ratio evidence',
    lead: 'Read the family of ratios together.',
    reveal: ['model'],
  },
  {
    id: 'repair',
    phase: 'act',
    title: 'Reduce inventory dependence',
    lead: 'Keep both ratios healthy and close their gap to 0.25 or less.',
    controls: true,
    success: 'healthy-liquidity',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Defend the intervention',
    lead: 'Explain what changed inside the ratios.',
    success: 'explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Stress-test the firm',
    lead: 'Change debt and working capital and watch the diagnosis respond.',
    reveal: ['transfer'],
    controls: true,
  },
];

export function RatioLab({
  currentAssets = 300,
  inventory = 100,
  currentLiabilities = 150,
  nonCurrentLiabilities = 200,
  equity = 600,
  revenue = 1000,
  costOfSales = 600,
  expenses = 200,
  currency = '$',
  show,
  title = 'Financial ratios: diagnose a company under pressure',
  prompt = 'Read connected evidence, repair the liquidity problem, then defend why your intervention works.',
  objectives = [
    'Diagnose liquidity, profitability and gearing together',
    'Improve a company by changing underlying figures',
    'Explain why a ratio changes instead of merely reading its value',
  ],
}: RatioLabProps = {}): ReactNode {
  const [ca, setCa] = useState(currentAssets);
  const [inv, setInv] = useState(inventory);
  const [cl, setCl] = useState(currentLiabilities);
  const [ncl, setNcl] = useState(nonCurrentLiabilities);
  const r = ratios({
    currentAssets: ca,
    inventory: inv,
    currentLiabilities: cl,
    nonCurrentLiabilities: ncl,
    equity,
    revenue,
    costOfSales,
    expenses,
  });
  const liquid = r.current >= 1.5 && r.quick >= 1;
  const resilient = liquid && r.current - r.quick <= 0.25;

  const band = (v: number, good: number, warn: number, higherBetter = true): Tone =>
    higherBetter
      ? v >= good
        ? 'good'
        : v >= warn
          ? 'warn'
          : 'danger'
      : v <= good
        ? 'good'
        : v <= warn
          ? 'warn'
          : 'danger';
  const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;
  const allRows: { key: RatioKey; label: string; value: string; raw: number; scale: number; tone: Tone }[] = [
    {
      key: 'current',
      label: 'Current ratio',
      value: r.current.toFixed(2),
      raw: r.current,
      scale: 3,
      tone: band(r.current, 1.5, 1),
    },
    {
      key: 'quick',
      label: 'Quick ratio',
      value: r.quick.toFixed(2),
      raw: r.quick,
      scale: 2,
      tone: band(r.quick, 1, 0.7),
    },
    {
      key: 'grossMargin',
      label: 'Gross margin',
      value: pct(r.grossMargin),
      raw: r.grossMargin,
      scale: 0.6,
      tone: band(r.grossMargin, 0.35, 0.2),
    },
    {
      key: 'netMargin',
      label: 'Net margin',
      value: pct(r.netMargin),
      raw: r.netMargin,
      scale: 0.25,
      tone: band(r.netMargin, 0.1, 0.03),
    },
    {
      key: 'roce',
      label: 'ROCE',
      value: pct(r.roce),
      raw: r.roce,
      scale: 0.3,
      tone: band(r.roce, 0.15, 0.08),
    },
    {
      key: 'gearing',
      label: 'Gearing',
      value: pct(r.gearing),
      raw: r.gearing,
      scale: 0.8,
      tone: band(r.gearing, 0.4, 0.6, false),
    },
    {
      key: 'inventoryTurnover',
      label: 'Inventory turnover',
      value: `${r.inventoryTurnover.toFixed(1)}×`,
      raw: r.inventoryTurnover,
      scale: 10,
      tone: band(r.inventoryTurnover, 5, 3),
    },
  ];
  const keys = !show
    ? allRows.map((row) => row.key)
    : Array.isArray(show)
      ? show
      : (RATIO_GROUPS[show] ?? allRows.map((row) => row.key));
  const rows = allRows.filter((row) => keys.includes(row.key));
  const healthy = rows.filter((row) => row.tone === 'good').length;
  const fmt = (n: number): string => `${currency}${Math.round(n).toLocaleString('en-US')}`;

  const figure = (
    <div className="finance-ratio-list" aria-label="Company ratio evidence">
      {rows.map((row) => (
        <div key={row.key} className="finance-ratio-row" data-tone={row.tone}>
          <span className="finance-ratio-name">{row.label}</span>
          <span className="finance-meter-track">
            <span
              className="finance-ratio-fill"
              style={{ '--finance-meter': `${Math.min(100, (row.raw / row.scale) * 100)}%` } as CSSProperties}
            />
          </span>
          <strong className="finance-ratio-value">{row.value}</strong>
        </div>
      ))}
    </div>
  );
  const evidence = (
    <EvidencePanel title="Diagnostic summary">
      <MetricList
        items={[
          {
            label: 'Liquidity verdict',
            value: resilient ? 'Resilient' : liquid ? 'Inventory-dependent' : 'Intervention needed',
            tone: resilient ? 'good' : 'warn',
          },
          { label: 'Healthy indicators', value: `${healthy}/${rows.length}` },
          { label: 'Working capital', value: fmt(ca - cl), tone: ca >= cl ? 'good' : 'danger' },
        ]}
      />
    </EvidencePanel>
  );
  const controls = (showTransfer: boolean) => (
    <>
      <Field label="current assets" value={fmt(ca)}>
        <Slider value={ca} min={50} max={600} step={10} onChange={setCa} ariaLabel="current assets" />
      </Field>
      <Field label="inventory inside assets" value={fmt(inv)}>
        <Slider
          value={inv}
          min={0}
          max={Math.min(400, ca)}
          step={10}
          onChange={setInv}
          ariaLabel="inventory included in current assets"
        />
      </Field>
      <Field label="current liabilities" value={fmt(cl)}>
        <Slider value={cl} min={50} max={500} step={10} onChange={setCl} ariaLabel="current liabilities" />
      </Field>
      {showTransfer && (
        <Field label="long-term debt" value={fmt(ncl)}>
          <Slider value={ncl} min={0} max={600} step={10} onChange={setNcl} ariaLabel="long-term debt" />
        </Field>
      )}
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'diagnosis',
    title,
    objectives,
    steps: STEPS,
    questions: [...DIAGNOSE, ...EXPLAIN],
    success: [
      {
        id: 'diagnosis',
        source: 'answer',
        key: 'diagnosis',
        pendingLabel: 'Choose the evidence that identifies liquidity risk.',
      },
      {
        id: 'healthy-liquidity',
        source: 'metric',
        key: 'liquidity',
        operator: 'eq',
        value: true,
        pendingLabel: 'Keep current ≥ 1.5 and quick ≥ 1.0, with no more than a 0.25 gap.',
      },
      {
        id: 'explanation',
        source: 'answer',
        key: 'intervention',
        pendingLabel: 'Explain why the intervention works.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="ratio-lab"
      eyebrow="Financial diagnosis"
      title={title}
      description={prompt}
      status={
        <>
          <span>current {r.current.toFixed(2)}</span>
          <span>quick {r.quick.toFixed(2)}</span>
          <span>{resilient ? 'resilient' : liquid ? 'inventory-dependent' : 'exposed'}</span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('model') ? evidence : null)}
      controls={({ sequence }) =>
        sequence.current.id === 'repair' || sequence.shows('transfer')
          ? controls(sequence.shows('transfer'))
          : null
      }
      observation={
        resilient
          ? 'The firm covers near-term bills without depending heavily on an inventory sale.'
          : 'Current ratio includes inventory; quick ratio removes it. Their gap reveals how much liquidity depends on selling stock.'
      }
      transcript={`Current ratio is ${r.current.toFixed(2)} and quick ratio is ${r.quick.toFixed(2)}. Working capital is ${fmt(ca - cl)}. The firm is ${resilient ? 'resilient' : liquid ? 'inventory-dependent' : 'exposed'}.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="healthy-liquidity"
            met={sequence.current.id === 'repair' && resilient}
            complete={complete}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Commit to a diagnosis</strong>
              <span>The company evidence opens after your prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
