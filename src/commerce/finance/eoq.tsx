'use client';

import { useState, type ReactNode } from 'react';
import { eoq } from '@classytic/stage/finance';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { TradeoffCurve } from '../../kit/finance-viz/tradeoff-curve.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { EvidencePanel, MetricList } from '../activity.js';

export interface EOQProps {
  annualDemand?: number;
  orderCost?: number;
  holdingCostPerUnit?: number;
  orderQty?: number;
  currency?: string;
  unitLabel?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const PREDICT: AuthoredChoiceQuestion = {
  id: 'big',
  prompt: 'If you order in much bigger batches, your holding cost…',
  choices: [
    {
      value: 'up',
      label: 'rises',
      feedback: 'Yes: a larger delivery leaves more stock on the shelf between orders.',
    },
    {
      value: 'down',
      label: 'falls',
      feedback:
        'A larger delivery leaves more average inventory to store, even though fewer orders are placed.',
    },
    {
      value: 'same',
      label: 'stays the same',
      feedback: 'Average inventory changes with batch size, so storage cost cannot stay fixed.',
    },
  ],
  answer: 'up',
  explain: 'Bigger batches raise average stock and holding cost while reducing how often an order is placed.',
};

const EXPLAIN: AuthoredChoiceQuestion = {
  id: 'balance',
  prompt: 'Why does total cost bottom out at EOQ?',
  choices: [
    { value: 'equal', label: 'ordering cost equals holding cost' },
    {
      value: 'zero',
      label: 'holding cost becomes zero',
      feedback:
        'The business still carries stock. EOQ balances two positive costs rather than eliminating one.',
    },
    {
      value: 'maximum',
      label: 'ordering cost is highest',
      feedback: 'Ordering cost is highest for tiny batches. At EOQ it balances holding cost.',
    },
  ],
  answer: 'equal',
  explain: 'At the minimum, the falling ordering-cost pressure balances the rising holding-cost pressure.',
};

const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Commit a forecast',
    lead: 'Predict before opening the model.',
    success: 'batch-prediction',
  },
  {
    id: 'optimize',
    phase: 'act',
    title: 'Find the cheapest policy',
    lead: 'Drag the graph marker into its lowest-cost region.',
    reveal: ['model'],
    controls: true,
    success: 'near-optimum',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Reveal the benchmark',
    lead: 'Compare your policy with calculated EOQ.',
    reveal: ['optimum'],
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the balance',
    lead: 'Use the two cost lines as evidence.',
    success: 'balance-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Stress-test the policy',
    lead: 'Change demand and costs, then find the new optimum.',
    reveal: ['scenario'],
    controls: true,
  },
];

export function EOQLab({
  annualDemand = 5000,
  orderCost = 50,
  holdingCostPerUnit = 3,
  orderQty = 120,
  currency = '$',
  unitLabel = 'units',
  title = 'Economic order quantity: run the cheapest policy',
  prompt = 'Small batches create frequent orders. Large batches create storage cost. Find the policy that balances both.',
  objectives = [
    'See ordering and holding costs pull in opposite directions',
    'Find EOQ from the cost evidence before revealing it',
    'Transfer the policy to a changed operating scenario',
  ],
}: EOQProps = {}): ReactNode {
  const [D, setD] = useState(annualDemand);
  const [S, setS] = useState(orderCost);
  const [H, setH] = useState(holdingCostPerUnit);
  const [qty, setQty] = useState(orderQty);

  const optimum = eoq(D, S, H);
  const orderingCost = (q: number): number => (q > 0 ? (D / q) * S : 0);
  const holdingCost = (q: number): number => (q / 2) * H;
  const totalAt = (q: number): number => orderingCost(q) + holdingCost(q);
  const fmt = (n: number): string => `${currency}${Math.round(n).toLocaleString('en-US')}`;
  const qLo = Math.max(15, Math.min(qty, Math.round(optimum * 0.2)));
  const qMax = Math.max(qty * 1.1, Math.round(optimum * 2.4), 40);
  const nearOptimum = Math.abs(qty - optimum) / Math.max(1, optimum) <= 0.05;
  const savings = Math.max(0, totalAt(qty) - totalAt(optimum));

  const activity: AuthoredActivity = {
    pattern: 'optimization',
    title,
    objectives,
    steps: STEPS,
    questions: [PREDICT, EXPLAIN],
    success: [
      {
        id: 'batch-prediction',
        source: 'answer',
        key: 'big',
        pendingLabel: 'Choose a prediction to open the model.',
      },
      {
        id: 'near-optimum',
        source: 'metric',
        key: 'orderQty',
        operator: 'between',
        pendingLabel: 'Move within 5% of the best order quantity.',
      },
      {
        id: 'balance-explanation',
        source: 'answer',
        key: 'balance',
        pendingLabel: 'Explain why the total-cost curve bottoms out.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="eoq"
      eyebrow="Inventory strategy"
      title={title}
      description={prompt}
      status={
        <>
          <span>
            order {qty} {unitLabel}
          </span>
          <span>{fmt(totalAt(qty))}/yr</span>
          {nearOptimum && <span>efficient policy</span>}
        </>
      }
      evidence={({ sequence }) =>
        sequence.shows('model') ? (
          <EvidencePanel title="Operating evidence">
            <MetricList
              items={[
                {
                  label: 'Your annual cost',
                  value: `${fmt(totalAt(qty))}/yr`,
                  tone: nearOptimum ? 'good' : 'warn',
                },
                { label: 'Ordering cost', value: fmt(orderingCost(qty)) },
                { label: 'Holding cost', value: fmt(holdingCost(qty)) },
                ...(sequence.shows('optimum')
                  ? [
                      {
                        label: 'EOQ benchmark',
                        value: `${Math.round(optimum)} ${unitLabel}`,
                        tone: 'good' as const,
                      },
                      { label: 'Available saving', value: `${fmt(savings)}/yr` },
                    ]
                  : []),
              ]}
            />
          </EvidencePanel>
        ) : null
      }
      controls={({ sequence }) =>
        sequence.shows('model') ? (
          <>
            <Field label="order size" value={`${qty} ${unitLabel}`}>
              <Slider
                value={qty}
                min={10}
                max={600}
                step={10}
                onChange={setQty}
                ariaLabel="your order size"
              />
            </Field>
            {sequence.shows('scenario') && (
              <Field label="annual demand" value={`${D.toLocaleString('en-US')} ${unitLabel}`}>
                <Slider
                  value={D}
                  min={500}
                  max={20000}
                  step={500}
                  onChange={setD}
                  ariaLabel="annual demand"
                />
              </Field>
            )}
            {sequence.shows('scenario') && (
              <Field label="cost per order" value={fmt(S)}>
                <Slider
                  value={S}
                  min={10}
                  max={200}
                  step={5}
                  onChange={setS}
                  ariaLabel="ordering cost per order"
                />
              </Field>
            )}
            {sequence.shows('scenario') && (
              <Field label="holding per unit" value={fmt(H)}>
                <Slider
                  value={H}
                  min={1}
                  max={20}
                  step={1}
                  onChange={setH}
                  ariaLabel="holding cost per unit per year"
                />
              </Field>
            )}
          </>
        ) : null
      }
      observation={({ sequence }) =>
        sequence.shows('optimum')
          ? nearOptimum
            ? 'Your order policy is within 5% of EOQ. Ordering and holding costs are nearly balanced.'
            : 'Larger, rarer orders raise holding cost; smaller, frequent orders raise ordering cost. EOQ is where the two balance, and the evidence shows what that would save.'
          : 'The total-cost curve falls, bottoms out, then rises. Find its lowest region without being given the formula result.'
      }
      transcript={`Current order quantity is ${qty} ${unitLabel}. Ordering cost is ${fmt(orderingCost(qty))}; holding cost is ${fmt(holdingCost(qty))}; total annual cost is ${fmt(totalAt(qty))}.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="near-optimum"
            met={sequence.current.id === 'optimize' && nearOptimum}
            complete={complete}
          />
          {sequence.shows('model') ? (
            <TradeoffCurve
              domain={[qLo, qMax]}
              falling={orderingCost}
              rising={holdingCost}
              optimum={sequence.shows('optimum') ? optimum : undefined}
              marker={qty}
              onMarkerChange={setQty}
              markerStep={10}
              labels={{
                x: `order size (${unitLabel})`,
                total: 'total cost',
                falling: 'ordering',
                rising: 'holding',
                optimum: 'EOQ',
              }}
              format={fmt}
              yMax={totalAt(optimum) * 2.6}
            />
          ) : (
            <div className="commerce-model-lock">
              <strong>Make a prediction first</strong>
              <span>The cost model opens after you commit.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
