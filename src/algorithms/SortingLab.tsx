'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import { TraceTransport } from './TraceTransport.js';
import { BinaryTransferCheck } from './LearningChecks.js';
import { SORT_COMPLEXITY, SORT_LABEL, sortCosts, sortTrace, type SortAlgorithm } from './sorting.js';
import type { SequenceDecision, SequenceItem } from './sequence-contract.js';

export interface SortingLabProps {
  values?: number[];
  algorithm?: SortAlgorithm;
  predict?: boolean;
  /** Show every algorithm's cost on this same input. The complexity payoff. */
  showCosts?: boolean;
  title?: string;
  prompt?: string;
}

const DEFAULT_VALUES = [7, 2, 9, 1, 5, 8, 3];

/** Bars are drawn in SVG so the lab needs no stylesheet of its own. */
const BAR_W = 34;
const BAR_GAP = 8;
const CHART_H = 150;

function Bars({
  items,
  active,
  tone,
  done,
}: {
  items: SequenceItem[];
  active: number[];
  tone: 'compare' | 'act' | 'idle';
  done: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const width = items.length * BAR_W + (items.length - 1) * BAR_GAP;
  const highlight = tone === 'act' ? 'var(--stage-warn, #f59e0b)' : 'var(--stage-accent, #6366f1)';
  return (
    <svg
      viewBox={`0 0 ${Math.max(width, 1)} ${CHART_H + 26}`}
      style={{ width: '100%', maxWidth: width, margin: '0 auto', display: 'block' }}
      role="img"
      aria-label={`Array: ${items.map((item) => item.value).join(', ')}`}
    >
      {items.map((item, index) => {
        const height = Math.max(6, (item.value / max) * CHART_H);
        const x = index * (BAR_W + BAR_GAP);
        const on = active.includes(index);
        return (
          <g key={item.id}>
            <rect
              x={x}
              y={CHART_H - height}
              width={BAR_W}
              height={height}
              rx={4}
              fill={done ? 'var(--stage-live, #22c55e)' : on ? highlight : 'var(--stage-wire, #94a3b8)'}
              opacity={done || on ? 1 : 0.55}
            />
            <text
              x={x + BAR_W / 2}
              y={CHART_H + 16}
              textAnchor="middle"
              fontSize={13}
              fill="currentColor"
              fontWeight={on ? 700 : 400}
            >
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SortingLab({
  values = DEFAULT_VALUES,
  algorithm = 'bubble',
  predict = true,
  showCosts = true,
  title,
  prompt,
}: SortingLabProps) {
  const trace = useMemo(() => sortTrace(values, algorithm), [values, algorithm]);
  const costs = useMemo(() => (showCosts ? sortCosts(values) : []), [values, showCosts]);
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<SequenceDecision>();
  const [transferAnswer, setTransferAnswer] = useState<'yes' | 'no'>();

  useEffect(() => {
    setStep(0);
    setGuess(undefined);
    setTransferAnswer(undefined);
  }, [trace]);
  useEffect(() => setGuess(undefined), [step]);

  const event = trace.events[step]!;
  const complete = step === trace.events.length - 1;
  const checkpoint = predict && event.type === 'sequence-compare';

  // Cost SO FAR, not the total: a learner should watch the number climb while the bars move.
  const runningCost = useMemo(() => {
    let comparisons = 0;
    let writes = 0;
    for (let i = 0; i <= step; i++) {
      const item = trace.events[i]!;
      if (item.type === 'sequence-compare') comparisons++;
      if (item.type === 'sequence-swap') writes += 2;
      if (item.type === 'sequence-write') writes++;
    }
    return { comparisons, writes };
  }, [trace, step]);

  const active =
    event.type === 'sequence-compare' || event.type === 'sequence-swap'
      ? event.indices
      : event.type === 'sequence-write'
        ? [event.index]
        : [];
  const tone =
    event.type === 'sequence-swap' || event.type === 'sequence-write'
      ? 'act'
      : event.type === 'sequence-compare'
        ? 'compare'
        : 'idle';

  return (
    <Activity.Root className="sorting-quest algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Sorting, and what it costs"
          title={title ?? `${SORT_LABEL[algorithm]}, one decision at a time`}
          description={
            prompt ??
            'Every comparison and every write is counted, so the cost of the method is visible while it runs.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span className="lab-chip">
          Method <strong>{SORT_LABEL[algorithm]}</strong>
        </span>
        <span className="lab-chip">
          Comparisons <strong>{runningCost.comparisons}</strong>
        </span>
        <span className="lab-chip">
          Writes <strong>{runningCost.writes}</strong>
        </span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="The array being sorted">
          <Bars items={event.items} active={active} tone={tone} done={event.type === 'sequence-complete'} />
          {checkpoint && (
            <div className="tree-prediction">
              <span>
                Compare {event.items[event.indices[0]]?.value} and {event.items[event.indices[1]]?.value}.
                Swap or keep?
              </span>
              <AssessedChoiceGroup
                value={guess}
                onChange={setGuess}
                ariaLabel="Predict whether the highlighted values swap"
                options={(['swap', 'keep'] as SequenceDecision[]).map((choice) => ({
                  value: choice,
                  label: choice === 'swap' ? 'Swap' : 'Keep',
                  tone:
                    guess === choice
                      ? guess === event.decision
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {guess && (
                <small aria-live="polite">
                  {guess === event.decision ? (
                    <>
                      <Check aria-hidden="true" /> Correct. Advance to apply it.
                    </>
                  ) : (
                    'Not this time. Read the two highlighted bars again before deciding.'
                  )}
                </small>
              )}
            </div>
          )}
        </Activity.Canvas>

        <Activity.Inspector label="What this method costs">
          <div className="heap-inspector">
            <section>
              <h4>Growth</h4>
              <p>
                {SORT_LABEL[algorithm]} is {SORT_COMPLEXITY[algorithm]} on average.
              </p>
            </section>
            {showCosts && (
              <section>
                <h4>Every method, same input</h4>
                <dl>
                  {costs.map((cost) => (
                    <div key={cost.algorithm}>
                      <dt>{SORT_LABEL[cost.algorithm]}</dt>
                      <dd>
                        {cost.comparisons} comparisons, {cost.writes} writes
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>

      {complete && (
        <BinaryTransferCheck
          id="sorting-transfer-title"
          prompt="Would the method with the fewest comparisons here always win on a much larger array?"
          answer={transferAnswer}
          correct="no"
          onAnswer={setTransferAnswer}
          correctFeedback="Right. On a small array the counts are close and the constant factors matter. Growth only decides the winner as n gets large."
          retryFeedback="Compare the counts above against the growth rates. On seven values a quadratic method can still look competitive."
        />
      )}

      <Activity.Feedback>
        <strong>
          {event.type === 'sequence-complete'
            ? 'Result'
            : event.type === 'sequence-swap'
              ? 'Swap'
              : event.type === 'sequence-write'
                ? 'Write'
                : event.type === 'sequence-compare'
                  ? 'Compare'
                  : 'Start'}
        </strong>
        <span>{event.message}</span>
      </Activity.Feedback>

      <Activity.Transcript>
        <ol>
          {trace.events.map((item, index) => (
            <li key={index} data-current={index === step || undefined}>
              {item.message}
            </li>
          ))}
        </ol>
      </Activity.Transcript>

      <TraceTransport
        step={step}
        count={trace.events.length}
        message={event.message}
        setStep={setStep}
        canAdvance={!checkpoint || Boolean(guess)}
      />
    </Activity.Root>
  );
}
