'use client';

import { useState, type ReactNode } from 'react';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { StockTimeline, type StockGuide } from '../../kit/finance-viz/stock-timeline.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type {
  AuthoredActivity,
  AuthoredActivityStep,
  AuthoredChoiceQuestion,
} from '../../kit/activity-authoring.js';
import type { LearningSequence } from '../../kit/learning-sequence.js';
import { EvidencePanel, MetricList } from '../activity.js';
import { simulateInventoryPolicy, type InventoryScenario } from './inventory-policy.js';

export interface ReorderPointProps {
  usagePerDay?: number;
  orderQty?: number;
  leadTimeDays?: number;
  bufferStock?: number;
  unitLabel?: string;
  days?: number;
  scenario?: InventoryScenario;
  /** false opens a single-step explorer; true uses the authored learning sequence. */
  guided?: boolean;
  /** Override the canonical sequence without replacing the simulation. */
  steps?: AuthoredActivityStep[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const ROL = 'var(--stage-warn, #e0a020)';
const BUF = 'var(--stage-danger, #e03131)';
const DEFAULT_STEPS: AuthoredActivityStep[] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Choose the ordering trigger',
    lead: 'Account for the delivery delay before stock reaches zero.',
    success: 'reorder-trigger',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Reveal the reorder level',
    lead: 'Follow the sawtooth and connect the amber line to lead-time demand.',
    reveal: ['reorder'],
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the safety buffer',
    lead: 'Identify which uncertainty the buffer absorbs.',
    reveal: ['reorder', 'buffer'],
    success: 'buffer-purpose',
  },
  {
    id: 'act',
    phase: 'act',
    title: 'Survive a demand spike',
    lead: 'Demand doubles for three days. Change the buffer until every requested unit is served.',
    reveal: ['reorder', 'buffer', 'disruption'],
    controls: true,
    success: 'resilient-policy',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Test a supplier delay',
    lead: 'Now make the second delivery arrive late. Compare the same policy under a different risk.',
    reveal: ['reorder', 'buffer', 'disruption', 'transfer'],
    controls: true,
  },
];
const EXPLORER_STEPS: AuthoredActivityStep[] = [
  {
    id: 'explore',
    phase: 'act',
    title: 'Explore the inventory policy',
    lead: 'Change the operating assumptions and inspect the resulting sawtooth.',
    reveal: ['reorder', 'buffer'],
    controls: true,
  },
];

const QUESTIONS: AuthoredChoiceQuestion[] = [
  {
    id: 'when',
    prompt: 'You should place a new order when stock falls to…',
    choices: [
      { value: 'rol', label: 'the reorder level' },
      {
        value: 'zero',
        label: 'zero',
        feedback: 'Waiting for zero guarantees a stockout during the delivery lead time.',
      },
      {
        value: 'buffer',
        label: 'the buffer stock',
        feedback: 'The buffer is the remaining cushion, not the ordering trigger.',
      },
    ],
    answer: 'rol',
    explain:
      'Ordering at the reorder level gives the delivery time to arrive before the safety buffer is exhausted.',
  },
  {
    id: 'buffer',
    prompt: 'Buffer (safety) stock protects the operation against…',
    choices: [
      { value: 'late', label: 'late deliveries or a demand spike' },
      {
        value: 'cost',
        label: 'high order costs',
        feedback: 'Order cost affects order quantity economics, not the purpose of safety stock.',
      },
      { value: 'tax', label: 'tax', feedback: 'Tax does not determine the operational safety buffer.' },
    ],
    answer: 'late',
    explain: 'The buffer preserves service when replenishment is late or demand is unexpectedly high.',
  },
];

export function ReorderPointLab({
  usagePerDay = 20,
  orderQty = 120,
  leadTimeDays = 5,
  bufferStock = 40,
  unitLabel = 'units',
  days = 60,
  scenario = 'supplier-delay',
  guided = true,
  steps,
  title = 'Stock control: when to reorder',
  prompt = 'Start with one clean stock cycle, then protect customers from a demand spike and a late supplier.',
  objectives = [
    'Read a stock sawtooth',
    'Calculate reorder level from lead-time demand and buffer',
    'Stress-test a replenishment policy',
  ],
}: ReorderPointProps = {}): ReactNode {
  const [usage, setUsage] = useState(usagePerDay);
  const [qty, setQty] = useState(orderQty);
  const [lead, setLead] = useState(leadTimeDays);
  const [buffer, setBuffer] = useState(bufferStock);
  const [transferScenario, setTransferScenario] = useState<InventoryScenario>(scenario);
  const scenarioFor = (sequence: LearningSequence): InventoryScenario =>
    sequence.current.id === 'act'
      ? 'demand-spike'
      : sequence.shows('transfer')
        ? transferScenario
        : guided
          ? 'steady'
          : transferScenario;
  const simulate = (sequence: LearningSequence) =>
    simulateInventoryPolicy({
      usagePerDay: usage,
      orderQty: qty,
      leadTimeDays: lead,
      bufferStock: buffer,
      days,
      scenario: scenarioFor(sequence),
    });
  const changed =
    usage !== usagePerDay || qty !== orderQty || lead !== leadTimeDays || buffer !== bufferStock;

  const controls = (sequence: LearningSequence) => {
    const showTransferControls = sequence.shows('transfer') || !guided;
    return (
      <>
        {showTransferControls ? (
          <div className="lab-segmented-field">
            <span className="lab-field-label">Operating event</span>
            <Segmented
              ariaLabel="operating event"
              value={transferScenario}
              onChange={setTransferScenario}
              options={[
                { value: 'steady', label: 'Steady' },
                { value: 'demand-spike', label: 'Demand spike' },
                { value: 'supplier-delay', label: 'Late supplier' },
              ]}
            />
          </div>
        ) : null}
        {sequence.current.id === 'act' ? (
          <Field label="safety buffer" value={`${buffer} ${unitLabel}`}>
            <Slider
              value={buffer}
              min={0}
              max={Math.max(120, bufferStock * 3)}
              step={10}
              onChange={setBuffer}
              ariaLabel="buffer stock"
            />
          </Field>
        ) : null}
        {showTransferControls ? (
          <>
            <Field label="usage / day" value={`${usage} ${unitLabel}`}>
              <Slider
                value={usage}
                min={2}
                max={Math.max(60, usagePerDay * 2)}
                step={2}
                onChange={setUsage}
                ariaLabel="usage per day"
              />
            </Field>
            <Field label="order size" value={`${qty} ${unitLabel}`}>
              <Slider
                value={qty}
                min={20}
                max={Math.max(300, orderQty * 2)}
                step={10}
                onChange={setQty}
                ariaLabel="order quantity"
              />
            </Field>
            <Field label="lead time" value={`${lead} days`}>
              <Slider
                value={lead}
                min={1}
                max={Math.max(20, leadTimeDays * 2)}
                step={1}
                onChange={setLead}
                ariaLabel="lead time days"
              />
            </Field>
            <Field label="safety buffer" value={`${buffer} ${unitLabel}`}>
              <Slider
                value={buffer}
                min={0}
                max={Math.max(120, bufferStock * 3)}
                step={10}
                onChange={setBuffer}
                ariaLabel="buffer stock"
              />
            </Field>
          </>
        ) : null}
      </>
    );
  };

  const activity: AuthoredActivity = {
    pattern: 'investigation',
    title,
    objectives,
    steps: steps ?? (guided ? DEFAULT_STEPS : EXPLORER_STEPS),
    questions: guided ? QUESTIONS : undefined,
    success: guided
      ? [
          {
            id: 'reorder-trigger',
            source: 'answer',
            key: 'when',
            pendingLabel: 'Choose when the order should be placed.',
          },
          {
            id: 'buffer-purpose',
            source: 'answer',
            key: 'buffer',
            pendingLabel: 'Explain what safety stock protects against.',
          },
          {
            id: 'resilient-policy',
            source: 'metric',
            key: 'serviceLevel',
            operator: 'eq',
            value: 1,
            pendingLabel: 'Adjust the safety buffer until service reaches 100%.',
          },
        ]
      : undefined,
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="reorder-point"
      eyebrow="Inventory operations"
      title={title}
      description={prompt}
      status={({ sequence }) => <span>{scenarioFor(sequence).replace('-', ' ')}</span>}
      evidence={({ sequence }) => {
        const result = simulate(sequence);
        const showDisruption = sequence.shows('disruption') || !guided;
        return sequence.shows('reorder') ? (
          <EvidencePanel title="Inventory evidence">
            <Readout
              tone={result.lostUnits ? 'info' : 'result'}
              accent={result.lostUnits ? BUF : undefined}
              value={`reorder at ${Math.round(result.reorderPoint)} ${unitLabel}`}
              sub={`${usage}/day × ${lead} days + ${buffer} buffer`}
            />
            {showDisruption ? (
              <MetricList
                items={[
                  {
                    label: 'Customer demand served',
                    value: `${(result.serviceLevel * 100).toFixed(1)}%`,
                    tone: result.lostUnits ? 'danger' : 'good',
                  },
                  {
                    label: 'Lost demand',
                    value: `${Math.round(result.lostUnits)} ${unitLabel}`,
                    tone: result.lostUnits ? 'danger' : 'good',
                  },
                  { label: 'Average stock', value: `${Math.round(result.averageStock)} ${unitLabel}` },
                  { label: 'Orders placed', value: result.ordersPlaced },
                ]}
              />
            ) : null}
            <p>
              {showDisruption
                ? result.eventLabel
                : result.lostUnits
                  ? `This policy loses ${Math.round(result.lostUnits)} ${unitLabel}.`
                  : 'The delivery lands before stock reaches zero; the buffer absorbs the modeled lead-time exposure.'}
            </p>
          </EvidencePanel>
        ) : (
          <EvidencePanel title="Operating pattern">
            <Readout
              value={`selling ${usage} ${unitLabel}/day`}
              sub={`stock rises by ${qty} when each delivery lands`}
            />
          </EvidencePanel>
        );
      }}
      controls={({ sequence }) => (sequence.current.controls ? controls(sequence) : null)}
      observation={({ sequence }) =>
        sequence.shows('buffer')
          ? 'Amber marks the ordering trigger; red marks the remaining protection. They serve different decisions.'
          : 'Daily usage creates the downward slope; each completed replenishment creates the upward jump.'
      }
      transcript={({ sequence }) => {
        const result = simulate(sequence);
        return `Over ${days} days in the ${scenarioFor(sequence).replace('-', ' ')} scenario, demand uses ${usage} per day, orders add ${qty}, lead time is ${lead} days, and the reorder point is ${Math.round(result.reorderPoint)}. The policy serves ${(result.serviceLevel * 100).toFixed(1)} percent of requested units and loses ${Math.round(result.lostUnits)}.`;
      }}
    >
      {({ sequence, complete }) => {
        const result = simulate(sequence);
        const guides: StockGuide[] = [];
        if (sequence.shows('reorder'))
          guides.push({ level: result.reorderPoint, color: ROL, label: 'reorder level' });
        if (sequence.shows('buffer') && buffer > 0)
          guides.push({ level: buffer, color: BUF, label: 'buffer' });
        return (
          <>
            <AuthoredMetricGate
              conditionId="resilient-policy"
              met={sequence.current.id === 'act' && changed && result.serviceLevel === 1}
              complete={complete}
              outcome="100% demand served"
            />
            <StockTimeline
              series={result.series}
              guides={guides}
              dangerBelow={sequence.shows('buffer') ? buffer : undefined}
              caption={
                sequence.shows('disruption') || !guided
                  ? result.eventLabel
                  : 'supplier → warehouse → customer'
              }
              xLabel={`${days} days →`}
            />
          </>
        );
      }}
    </AuthoredActivityRuntime>
  );
}
