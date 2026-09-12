'use client';

/**
 * BreakEvenLab — the classic break-even chart. On @classytic/stage/finance: revenue
 * rises from the origin (price·units), total cost starts at the fixed cost and rises
 * by the variable cost per unit; where they cross is BREAK-EVEN. Left of it the
 * revenue line is below total cost → LOSS (shaded red); right of it → PROFIT (green).
 * Drag price / cost / fixed cost and the break-even point moves; drag the output
 * marker to read profit/loss and the margin of safety.
 *
 * Kernel-backed (breakEven / profitAt), authorable (fixed cost, price, variable cost,
 * currency, unit label), predict-first, curriculum-neutral. Interactive, no loop.
 */

import { useState, type ReactNode } from 'react';
import { breakEven, profitAt } from '@classytic/stage/finance';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { PlotChart } from '../../kit/finance-viz/plot-chart.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { EvidencePanel, MetricList } from '../activity.js';

export interface BreakEvenProps {
  fixedCost?: number;
  price?: number;
  variableCost?: number;
  currency?: string;
  unitLabel?: string;
  /** fixed width of the units axis; defaults to a stable value from the scenario so dragging price doesn't rescale the chart. */
  unitsMax?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const REV = 'var(--stage-good, #16a34a)';
const COST = 'var(--stage-warn, #e0a020)';
const LOSS = 'var(--stage-danger, #e03131)';

const CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'below',
    prompt: 'Selling fewer units than the break-even point means the business makes…',
    choices: [
      { value: 'loss', label: 'a loss (revenue < total cost)' },
      { value: 'profit', label: 'a profit' },
      { value: 'nothing', label: 'exactly zero, always' },
    ],
    answer: 'loss',
    explain:
      'Below break-even the revenue line sits under total cost, so the gap is a loss. You only profit once you pass it.',
  },
  {
    id: 'price',
    prompt: 'Raising the selling price moves the break-even point…',
    choices: [
      { value: 'lower', label: 'lower (fewer units needed)' },
      { value: 'higher', label: 'higher (more units needed)' },
      { value: 'same', label: 'nowhere' },
    ],
    answer: 'lower',
    explain:
      'A higher price means more contribution per unit, so fewer units are needed to cover the fixed cost.',
  },
];

const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Forecast the launch',
    lead: 'Predict what happens below break-even.',
    success: 'loss-forecast',
  },
  {
    id: 'inspect',
    phase: 'observe',
    title: 'Open the launch model',
    lead: 'Locate cost, revenue and their crossing point.',
    reveal: ['model'],
  },
  {
    id: 'decide',
    phase: 'act',
    title: 'Build a viable launch',
    lead: 'Increase output or price until profit equals the fixed-cost investment.',
    controls: true,
    success: 'target-profit',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the leverage',
    lead: 'Explain how price changes the break-even point.',
    success: 'price-effect',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Stress-test the plan',
    lead: 'Change every cost assumption and rebuild a viable launch.',
    reveal: ['transfer'],
    controls: true,
  },
];

export function BreakEvenLab({
  fixedCost = 2000,
  price = 20,
  variableCost = 12,
  currency = '$',
  unitLabel = 'units',
  unitsMax,
  title = 'Break-even, where revenue catches costs',
  prompt = 'Revenue climbs from zero; total cost starts at the fixed cost. Where they cross is break-even: a loss before it, profit after. Change the numbers and watch it move.',
  objectives = [
    'Find break-even: fixed cost ÷ contribution per unit',
    'Read the loss zone (before) and profit zone (after) off the chart',
    'See how price, cost or fixed cost shift the break-even point',
  ],
}: BreakEvenProps = {}): ReactNode {
  const [fc, setFc] = useState(fixedCost);
  const [pr, setPr] = useState(price);
  const [vc, setVc] = useState(variableCost);

  // STABLE units axis: fixed once from the authored scenario (or an explicit unitsMax),
  // so dragging price/cost only rotates the lines and slides the break-even point — it
  // never rescales the chart or shoves the "your output" slider around.
  const [maxUnits] = useState(() => {
    if (unitsMax && unitsMax > 0) return unitsMax;
    const c0 = price - variableCost;
    const be0 = c0 > 0 ? fixedCost / c0 : 0;
    return Math.max(20, Math.ceil(Math.max(be0 * 2.2, 100) / 10) * 10);
  });
  const [output, setOutput] = useState(() => {
    const c0 = price - variableCost;
    const be0 = c0 > 0 ? fixedCost / c0 : 0;
    return Math.min(maxUnits, Math.round((be0 || 50) * 1.4));
  });

  const be = breakEven({ fixedCost: fc, price: pr, variableCost: vc });
  const beUnits = Number.isFinite(be.units) && be.units > 0 ? be.units : 0;
  const out = Math.min(output, maxUnits);
  const contribution = pr - vc;
  const hasBE = contribution > 0 && beUnits > 0 && beUnits <= maxUnits;

  const fmt = (n: number): string => `${currency}${Math.round(n).toLocaleString('en-US')}`;
  const revenueAt = (u: number): number => pr * u;
  const totalCostAt = (u: number): number => fc + vc * u;
  const maxMoney = Math.max(revenueAt(maxUnits), totalCostAt(maxUnits)) * 1.05 || 1;
  const profit = profitAt(out, { fixedCost: fc, price: pr, variableCost: vc });
  const viable = profit >= fc;
  const targetOutput = contribution > 0 ? Math.ceil((fc * 2) / contribution) : null;

  const figure = (
    <PlotChart
      xMax={maxUnits}
      yMax={maxMoney}
      yTicks={[0, maxMoney]}
      formatY={fmt}
      xLabel={`${unitLabel} →`}
      guides={[{ value: fc, label: `fixed cost ${fmt(fc)}`, side: 'right' }]}
      legend={[
        { label: 'revenue', color: REV },
        { label: 'total cost', color: COST },
      ]}
      ariaLabel={`Break-even chart; break-even at ${Math.round(beUnits)} ${unitLabel}`}
    >
      {({ X, Y: Ym, GY0, GY1 }) => {
        // loss shading spans to break-even if it's in view, else the whole frame
        const splitU = hasBE ? beUnits : maxUnits;
        const lossPoly = `${X(0)},${Ym(totalCostAt(0))} ${X(splitU)},${Ym(
          totalCostAt(splitU),
        )} ${X(splitU)},${Ym(revenueAt(splitU))} ${X(0)},${Ym(0)}`;
        const profitPoly = hasBE
          ? `${X(beUnits)},${Ym(revenueAt(beUnits))} ${X(maxUnits)},${Ym(
              revenueAt(maxUnits),
            )} ${X(maxUnits)},${Ym(totalCostAt(maxUnits))} ${X(beUnits)},${Ym(totalCostAt(beUnits))}`
          : null;
        return (
          <>
            <polygon points={lossPoly} fill={LOSS} opacity={0.14} />
            {profitPoly && <polygon points={profitPoly} fill={REV} opacity={0.16} />}
            <line
              x1={X(0)}
              y1={Ym(totalCostAt(0))}
              x2={X(maxUnits)}
              y2={Ym(totalCostAt(maxUnits))}
              stroke={COST}
              strokeWidth={3}
            />
            <line
              x1={X(0)}
              y1={Ym(0)}
              x2={X(maxUnits)}
              y2={Ym(revenueAt(maxUnits))}
              stroke={REV}
              strokeWidth={3}
            />
            {hasBE && (
              <>
                <line
                  x1={X(beUnits)}
                  y1={Ym(revenueAt(beUnits))}
                  x2={X(beUnits)}
                  y2={GY1}
                  stroke="var(--stage-fg)"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <circle
                  cx={X(beUnits)}
                  cy={Ym(revenueAt(beUnits))}
                  r={5}
                  fill="var(--stage-fg)"
                  stroke="var(--stage-bg)"
                  strokeWidth={2}
                />
                <text
                  x={X(beUnits)}
                  y={GY1 + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="var(--stage-fg)"
                >
                  BE {Math.round(beUnits)}
                </text>
              </>
            )}
            <line
              x1={X(out)}
              y1={GY0}
              x2={X(out)}
              y2={GY1}
              stroke="var(--stage-accent, #3b82f6)"
              strokeWidth={1.5}
            />
            <text
              x={X(out)}
              y={GY0 - 4}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill="var(--stage-accent, #3b82f6)"
            >
              you
            </text>
          </>
        );
      }}
    </PlotChart>
  );

  const evidence = (
    <EvidencePanel title="Launch evidence">
      <MetricList
        items={[
          {
            label: 'Profit at your output',
            value: profit >= 0 ? fmt(profit) : `−${fmt(-profit)}`,
            tone: viable ? 'good' : profit >= 0 ? 'warn' : 'danger',
          },
          { label: 'Target profit', value: fmt(fc) },
          {
            label: 'Output needed at current price',
            value: targetOutput == null ? 'raise price first' : `${targetOutput} ${unitLabel}`,
          },
          { label: 'Break-even output', value: hasBE ? `${Math.ceil(beUnits)} ${unitLabel}` : 'not viable' },
          {
            label: 'Contribution per unit',
            value: fmt(be.contributionPerUnit),
            tone: contribution > 0 ? 'good' : 'danger',
          },
        ]}
      />
    </EvidencePanel>
  );

  const controls = (showTransfer: boolean) => (
    <>
      <Field label="your output" value={`${out} ${unitLabel}`}>
        <Slider value={out} min={0} max={maxUnits} step={1} onChange={setOutput} ariaLabel="output units" />
      </Field>
      <Field label="price / unit" value={fmt(pr)}>
        <Slider value={pr} min={1} max={50} step={1} onChange={setPr} ariaLabel="selling price per unit" />
      </Field>
      {showTransfer && (
        <>
          <Field label="fixed cost" value={fmt(fc)}>
            <Slider value={fc} min={500} max={8000} step={100} onChange={setFc} ariaLabel="fixed cost" />
          </Field>
          <Field label="variable / unit" value={fmt(vc)}>
            <Slider
              value={vc}
              min={0}
              max={40}
              step={1}
              onChange={setVc}
              ariaLabel="variable cost per unit"
            />
          </Field>
        </>
      )}
    </>
  );
  const activity: AuthoredActivity = {
    pattern: 'forecast',
    title,
    objectives,
    steps: STEPS,
    questions: CHALLENGE,
    success: [
      {
        id: 'loss-forecast',
        source: 'answer',
        key: 'below',
        pendingLabel: 'Commit to a forecast before opening the chart.',
      },
      {
        id: 'target-profit',
        source: 'metric',
        key: 'profit',
        operator: 'gte',
        value: fc,
        pendingLabel: 'Reach a profit at least equal to fixed cost.',
      },
      {
        id: 'price-effect',
        source: 'answer',
        key: 'price',
        pendingLabel: 'Explain the effect of raising price.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="break-even"
      eyebrow="Product launch"
      title={title}
      description={prompt}
      status={
        <>
          <span>output {out}</span>
          <span>{profit >= 0 ? `profit ${fmt(profit)}` : `loss ${fmt(-profit)}`}</span>
          <span>{viable ? 'target met' : 'target pending'}</span>
        </>
      }
      task={({ sequence }) =>
        sequence.current.id === 'decide' ? (
          <p className="commerce-task-copy">
            At the current {fmt(contribution)} contribution per unit, set output to at least{' '}
            {targetOutput == null ? 'a viable level after raising price' : `${targetOutput} ${unitLabel}`}, or
            raise price to lower that target.
          </p>
        ) : null
      }
      evidence={({ sequence }) => (sequence.shows('model') ? evidence : null)}
      controls={({ sequence }) =>
        sequence.current.id === 'decide' || sequence.shows('transfer')
          ? controls(sequence.shows('transfer'))
          : null
      }
      observation={({ sequence }) =>
        viable
          ? `The launch covers its ${fmt(fc)} fixed investment and earns the same amount again as profit.`
          : sequence.current.id === 'decide' && contribution > 0
            ? `Profit needs another ${fmt(fc - profit)}. At the current price, move output to ${targetOutput} ${unitLabel}, or raise price to lower the required output.`
            : contribution > 0
              ? `Every unit contributes ${fmt(contribution)} after variable cost. Output beyond ${Math.ceil(beUnits)} builds profit.`
              : 'Price does not cover variable cost, so raise price before increasing output.'
      }
      transcript={`Output is ${out} ${unitLabel}. Revenue is ${fmt(revenueAt(out))}; total cost is ${fmt(totalCostAt(out))}; ${profit >= 0 ? 'profit' : 'loss'} is ${fmt(Math.abs(profit))}.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="target-profit"
            met={sequence.current.id === 'decide' && viable}
            complete={complete}
            outcome={`${out}`}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Forecast the risk first</strong>
              <span>The launch chart opens after your prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
