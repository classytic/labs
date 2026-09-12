'use client';

import { useState, type ReactNode } from 'react';
import { apportion } from '@classytic/stage/finance';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { ApportionBar } from '../../kit/finance-viz/apportion-bar.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { EvidencePanel, MetricList } from '../activity.js';

export interface ApportionPart {
  name: string;
  weight: number;
}
export interface ApportionProps {
  total?: number;
  parts?: ApportionPart[];
  poolLabel?: string;
  basisLabel?: string;
  unitLabel?: string;
  currency?: string;
  maxWeight?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activityId?: string;
}
const DEFAULT_PARTS: ApportionPart[] = [
  { name: 'Machining', weight: 4000 },
  { name: 'Assembly', weight: 3000 },
  { name: 'Finishing', weight: 2000 },
  { name: 'Admin', weight: 1000 },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the allocation',
    lead: 'Read the basis before seeing the split.',
    success: 'largest-share',
  },
  {
    id: 'inspect',
    phase: 'observe',
    title: 'Reveal the allocation',
    lead: 'Connect segment width, basis share and allocated cost.',
    reveal: ['allocation'],
  },
  {
    id: 'construct',
    phase: 'act',
    title: 'Meet the target',
    lead: 'Adjust the final department until it receives 25% of the pool.',
    controls: true,
    success: 'target-share',
  },
  {
    id: 'justify',
    phase: 'explain',
    title: 'Defend the basis',
    lead: 'Explain why every department pays the same rate.',
    success: 'fair-rate',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Change the scenario',
    lead: 'Change the shared pool and compare what changes and what does not.',
    reveal: ['transfer'],
    controls: true,
  },
];

export function ApportionLab({
  total = 60000,
  parts = DEFAULT_PARTS,
  poolLabel = 'overhead',
  basisLabel = 'machine-hours',
  unitLabel = 'hrs',
  currency = '$',
  maxWeight = 8000,
  title = 'Apportionment: build and defend a fair allocation',
  prompt = 'Allocate one shared bill in proportion to an authored basis, hit a target share, then explain the fairness rule.',
  objectives = [
    'Connect basis share with cost share',
    'Construct an allocation that meets a target',
    'Distinguish the common rate from each department’s total cost',
  ],
  activityId = 'apportion',
}: ApportionProps = {}): ReactNode {
  const [pool, setPool] = useState(total);
  const [weights, setWeights] = useState(parts.map((part) => part.weight));
  const targetIndex = Math.max(0, parts.length - 1);
  const largestInitial = parts.reduce(
    (best, part, index) => (part.weight > parts[best]!.weight ? index : best),
    0,
  );
  const predictionQuestions: AuthoredChoiceQuestion[] = [
    {
      id: 'largest',
      prompt: `Which department should receive the largest share of the ${poolLabel}?`,
      choices: parts.map((part, index) => ({
        value: `${index}`,
        label: part.name,
        feedback:
          index === largestInitial
            ? undefined
            : `${part.name} does not carry the largest authored ${basisLabel}.`,
      })),
      answer: `${largestInitial}`,
      explain: `${parts[largestInitial]!.name} carries the largest share of the ${basisLabel}, so it receives the largest share of the pool.`,
    },
  ];
  const explanationQuestions: AuthoredChoiceQuestion[] = [
    {
      id: 'rate',
      prompt: `Why is the cost per ${unitLabel} the same for every department?`,
      choices: [
        { value: 'common', label: `one pool is divided by the total ${basisLabel}` },
        {
          value: 'largest',
          label: 'the largest department chooses the rate',
          feedback: 'Department size changes total allocated cost, not the common rate.',
        },
        {
          value: 'equal',
          label: 'every department receives an equal total',
          feedback: 'Totals are proportional, not equal. The rate per basis unit is what stays equal.',
        },
      ],
      answer: 'common',
      explain: `The common rate is total ${poolLabel} ÷ total ${basisLabel}; each department then pays that rate on its own amount.`,
    },
  ];
  const totalBasis = weights.reduce((sum, value) => sum + value, 0) || 1;
  const shares = apportion(pool, weights);
  const targetShare = weights[targetIndex]! / totalBasis;
  const targetMet = Math.abs(targetShare - 0.25) <= 0.01;
  const rate = pool / totalBasis;
  const fmt = (value: number): string => `${currency}${Math.round(value).toLocaleString('en-US')}`;

  const segments = parts.map((part, index) => ({ label: part.name, weight: weights[index]! }));
  const figure = (
    <ApportionBar
      total={pool}
      segments={segments}
      format={fmt}
      weightLabel={unitLabel}
      caption={`width = share of ${basisLabel} = share of ${poolLabel}`}
    />
  );
  const evidence = (
    <EvidencePanel title="Allocation evidence">
      <MetricList
        items={[
          {
            label: `${parts[targetIndex]!.name} target`,
            value: `${(targetShare * 100).toFixed(1)}% / 25%`,
            tone: targetMet ? 'good' : 'warn',
          },
          { label: `Common rate`, value: `${fmt(rate)} / ${unitLabel}` },
          { label: `${parts[targetIndex]!.name} allocation`, value: fmt(shares[targetIndex]!) },
        ]}
      />
    </EvidencePanel>
  );
  const controls = (showTransfer: boolean) => (
    <>
      {parts.map((part, index) => (
        <Field
          key={part.name}
          label={`${part.name} ${basisLabel}`}
          value={`${weights[index]!.toLocaleString('en-US')} ${unitLabel}`}
        >
          <Slider
            value={weights[index]!}
            min={0}
            max={maxWeight}
            step={Math.max(50, Math.round(maxWeight / 80))}
            onChange={(value) =>
              setWeights((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
            }
            ariaLabel={`${part.name} ${basisLabel}`}
          />
        </Field>
      ))}
      {showTransfer && (
        <Field label={`total ${poolLabel}`} value={fmt(pool)}>
          <Slider
            value={pool}
            min={10000}
            max={120000}
            step={1000}
            onChange={setPool}
            ariaLabel={`total ${poolLabel}`}
          />
        </Field>
      )}
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'allocation',
    title,
    objectives,
    steps: STEPS,
    questions: [...predictionQuestions, ...explanationQuestions],
    success: [
      {
        id: 'largest-share',
        source: 'answer',
        key: 'largest',
        pendingLabel: 'Predict which department receives the largest share.',
      },
      {
        id: 'target-share',
        source: 'metric',
        key: 'targetShare',
        operator: 'between',
        min: 0.24,
        max: 0.26,
        pendingLabel: 'Bring the final department to a 25% share (within 1 percentage point).',
      },
      { id: 'fair-rate', source: 'answer', key: 'rate', pendingLabel: 'Explain the common allocation rate.' },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId={activityId}
      eyebrow="Cost allocation"
      title={title}
      description={prompt}
      status={
        <>
          <span>
            {fmt(pool)} {poolLabel}
          </span>
          <span>
            {parts[targetIndex]!.name} {(targetShare * 100).toFixed(1)}%
          </span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('allocation') ? evidence : null)}
      controls={({ sequence }) =>
        sequence.current.id === 'construct' || sequence.shows('transfer')
          ? controls(sequence.shows('transfer'))
          : null
      }
      observation={
        targetMet
          ? `${parts[targetIndex]!.name} now receives one quarter of both the basis and the shared pool.`
          : `Every segment uses the same ${fmt(rate)} per ${unitLabel} rate; different totals come only from different basis amounts.`
      }
      transcript={`${fmt(pool)} of ${poolLabel} is allocated across ${parts.length} departments using ${totalBasis.toLocaleString('en-US')} ${unitLabel}. ${parts[targetIndex]!.name} receives ${(targetShare * 100).toFixed(1)} percent, or ${fmt(shares[targetIndex]!)}.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="target-share"
            met={sequence.current.id === 'construct' && targetMet}
            complete={complete}
            outcome={`${(targetShare * 100).toFixed(1)}%`}
          />
          {sequence.shows('allocation') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Predict from the authored basis</strong>
              <span>The allocation opens after you commit.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
