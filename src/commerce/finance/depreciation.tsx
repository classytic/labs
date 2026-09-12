'use client';

/**
 * DepreciationLab — how an asset loses value over its life, the two ways exams ask.
 * On @classytic/stage/finance: STRAIGHT-LINE writes off an equal amount each year
 * (a straight fall to the residual value); REDUCING-BALANCE takes a fixed % of the
 * shrinking book value (big charges early, tailing off). Both book-value paths are
 * drawn together so the difference is visible; charge bars below show the yearly
 * expense pattern, and the asset itself fades as its book value drops.
 *
 * Kernel-backed (straightLine / reducingBalance), authorable (cost, residual, rate,
 * life, method, currency, asset name), predict-first, curriculum-neutral. No loop.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { straightLine, reducingBalance } from '@classytic/stage/finance';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { PlotChart } from '../../kit/finance-viz/plot-chart.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { EvidencePanel, MetricList } from '../activity.js';

export interface DepreciationProps {
  cost?: number;
  residual?: number;
  /** Reducing-balance rate as a percentage (e.g. 25 = 25%/yr). */
  ratePct?: number;
  life?: number;
  method?: 'straight' | 'reducing';
  currency?: string;
  assetLabel?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const SL = 'var(--stage-accent, #3b82f6)';
const RB = 'var(--stage-warn, #e0a020)';

const CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'when',
    prompt: 'Reducing-balance depreciation charges its largest amount in…',
    choices: [
      { value: 'first', label: 'the first year' },
      { value: 'last', label: 'the last year' },
      { value: 'equal', label: 'every year equally' },
    ],
    answer: 'first',
    explain:
      'It takes a fixed % of the book value, which is largest at the start, so the charge is biggest in year 1 and tails off.',
  },
  {
    id: 'sl',
    prompt: 'Straight-line depreciation each year is…',
    choices: [
      { value: 'same', label: 'the same amount every year' },
      { value: 'rising', label: 'rising over time' },
      { value: 'falling', label: 'falling over time' },
    ],
    answer: 'same',
    explain: '(cost − residual) ÷ life is a fixed amount, so the book value falls in a straight line.',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Forecast the expense',
    lead: 'Predict which year carries the largest reducing-balance charge.',
    success: 'charge-forecast',
  },
  {
    id: 'compare',
    phase: 'observe',
    title: 'Compare both schedules',
    lead: 'Read book value and annual expense together.',
    reveal: ['model'],
  },
  {
    id: 'choose',
    phase: 'act',
    title: 'Protect first-year profit',
    lead: 'Choose the method with the smaller first-year expense and inspect year 1.',
    controls: true,
    success: 'method-choice',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the pattern',
    lead: 'Explain why straight-line charges remain level.',
    success: 'pattern-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Plan the replacement horizon',
    lead: 'Scrub through the asset life and compare ending values.',
    reveal: ['transfer'],
    controls: true,
  },
];

export function DepreciationLab({
  cost = 10000,
  residual = 2000,
  ratePct = 25,
  life = 5,
  method: method0 = 'straight',
  currency = '$',
  assetLabel = 'machine',
  title = 'Depreciation, how an asset loses value',
  prompt = 'An asset wears out over its life. Straight-line writes off an equal slice each year; reducing-balance takes a fixed % of what’s left. Compare the two.',
  objectives = [
    'Use straight-line: equal charge (cost − residual) ÷ life each year',
    'Use reducing-balance: a fixed % of the falling book value',
    'See why reducing-balance front-loads the expense',
  ],
}: DepreciationProps = {}): ReactNode {
  const [method, setMethod] = useState<'straight' | 'reducing'>(method0);
  const [year, setYear] = useState(1);

  const sl = straightLine(cost, residual, life);
  const rb = reducingBalance(cost, ratePct / 100, life);
  const y = Math.min(year, life);
  const fmt = (n: number): string => `${currency}${Math.round(n).toLocaleString('en-US')}`;
  const slBook = (yr: number): number => cost - sl.perYear * yr;
  const rbBook = (yr: number): number => (yr === 0 ? cost : rb[yr - 1]!.bookValue);
  const active = method === 'straight' ? sl.schedule : rb;
  const charge = active[y - 1]?.depreciation ?? 0;
  const bookNow = method === 'straight' ? slBook(y) : rbBook(y);

  const isSL = method === 'straight';
  const maxCharge = Math.max(sl.perYear, rb[0]?.depreciation ?? 0) || 1;
  const activeColor = isSL ? SL : RB;
  const lowerFirstMethod: 'straight' | 'reducing' =
    sl.perYear <= (rb[0]?.depreciation ?? Infinity) ? 'straight' : 'reducing';
  const decisionMet = method === lowerFirstMethod && y === 1;

  const chart = (
    <PlotChart
      xMax={life}
      yMax={cost}
      yTicks={[0, cost]}
      formatY={fmt}
      guides={[{ value: residual, label: `residual ${fmt(residual)}`, side: 'left' }]}
      legend={[
        { label: 'straight-line', color: SL },
        { label: 'reducing-balance', color: RB },
      ]}
      ariaLabel={`Depreciation of a ${assetLabel}; book value ${fmt(bookNow)} in year ${y}`}
      height={300}
    >
      {({ X, Y, GY0, GY1 }) => {
        const slPts = Array.from(
          { length: life + 1 },
          (_, i) => `${X(i).toFixed(1)},${Y(slBook(i)).toFixed(1)}`,
        ).join(' ');
        const rbPts = Array.from(
          { length: life + 1 },
          (_, i) => `${X(i).toFixed(1)},${Y(rbBook(i)).toFixed(1)}`,
        ).join(' ');
        return (
          <>
            <polyline
              points={slPts}
              fill="none"
              stroke={SL}
              strokeWidth={isSL ? 3 : 1.5}
              opacity={isSL ? 1 : 0.4}
              strokeLinejoin="round"
            />
            <polyline
              points={rbPts}
              fill="none"
              stroke={RB}
              strokeWidth={!isSL ? 3 : 1.5}
              opacity={!isSL ? 1 : 0.4}
              strokeLinejoin="round"
            />
            <line
              x1={X(y)}
              y1={GY0}
              x2={X(y)}
              y2={GY1}
              stroke="var(--stage-muted)"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <circle
              cx={X(y)}
              cy={Y(bookNow)}
              r={5}
              fill={activeColor}
              stroke="var(--stage-bg)"
              strokeWidth={2}
            />
            <text
              x={X(y)}
              y={GY1 + 16}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill="var(--stage-fg)"
            >
              yr {y}
            </text>
          </>
        );
      }}
    </PlotChart>
  );

  // a compact companion strip: the yearly charge (equal for SL, front-loaded for RB)
  const bars = (
    <div className="finance-comparison-panel finance-charge-panel">
      <div className="finance-panel-label">charge each year ({isSL ? 'equal' : 'front-loaded'})</div>
      <div className="finance-charge-bars">
        {active.map((row, i) => (
          <div key={i} className="finance-charge-column" data-active={i === y - 1}>
            <div
              className="finance-charge-bar"
              style={
                {
                  '--charge-height': `${Math.max(3, (row.depreciation / maxCharge) * 40)}px`,
                  '--charge-color': activeColor,
                } as CSSProperties
              }
              title={`yr ${i + 1}: ${fmt(row.depreciation)}`}
            />
            <span>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const figure = (
    <div className="finance-figure-stack">
      {chart}
      {bars}
    </div>
  );

  const evidence = (
    <EvidencePanel title="Forecast evidence">
      <MetricList
        items={[
          {
            label: `${isSL ? 'Straight-line' : 'Reducing-balance'} year ${y} charge`,
            value: fmt(charge),
            tone: decisionMet ? 'good' : undefined,
          },
          { label: 'Book value after charge', value: fmt(bookNow) },
          { label: 'Straight-line first year', value: fmt(sl.perYear) },
          { label: 'Reducing-balance first year', value: fmt(rb[0]?.depreciation ?? 0) },
        ]}
      />
    </EvidencePanel>
  );

  const controls = (
    <>
      <Field label="method">
        <Segmented
          ariaLabel="method"
          value={isSL ? 'straight' : 'reducing'}
          onChange={setMethod}
          options={[
            { value: 'straight', label: 'straight-line' },
            { value: 'reducing', label: 'reducing-balance' },
          ]}
        />
      </Field>
      <Field label="year" value={`${y} of ${life}`}>
        <Slider value={y} min={1} max={life} step={1} onChange={setYear} ariaLabel="year" />
      </Field>
    </>
  );
  const activity: AuthoredActivity = {
    pattern: 'forecast',
    title,
    objectives,
    steps: STEPS,
    questions: CHALLENGE,
    success: [
      { id: 'charge-forecast', source: 'answer', key: 'when', pendingLabel: 'Commit to a charge forecast.' },
      {
        id: 'method-choice',
        source: 'metric',
        key: 'methodAndYear',
        operator: 'eq',
        value: true,
        pendingLabel: 'Select the lower first-year charge and inspect year 1.',
      },
      {
        id: 'pattern-explanation',
        source: 'answer',
        key: 'sl',
        pendingLabel: 'Explain the straight-line expense pattern.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="depreciation"
      eyebrow="Asset planning"
      title={title}
      description={prompt}
      status={
        <>
          <span>{isSL ? 'straight-line' : 'reducing-balance'}</span>
          <span>year {y}</span>
          <span>book value {fmt(bookNow)}</span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('model') ? evidence : null)}
      controls={({ sequence }) =>
        sequence.current.id === 'choose' || sequence.shows('transfer') ? controls : null
      }
      observation={
        decisionMet
          ? `${lowerFirstMethod === 'straight' ? 'Straight-line' : 'Reducing-balance'} preserves more reported profit in year 1 because its first charge is smaller.`
          : `Straight-line spreads ${fmt(cost - residual)} evenly; reducing balance applies ${ratePct}% to a shrinking book value.`
      }
      transcript={`${assetLabel}, year ${y}. ${isSL ? 'Straight-line' : 'Reducing-balance'} depreciation charge is ${fmt(charge)} and closing book value is ${fmt(bookNow)}.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="method-choice"
            met={sequence.current.id === 'choose' && decisionMet}
            complete={complete}
            outcome={method}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Forecast the expense pattern</strong>
              <span>The schedules open after your prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
