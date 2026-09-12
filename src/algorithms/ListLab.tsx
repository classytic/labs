'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import { TraceTransport } from './TraceTransport.js';
import {
  OPERATION_LABEL,
  compareStructures,
  type ListKind,
  type ListOperation,
  type ListRun,
} from './lists.js';

export interface ListLabProps {
  values?: number[];
  operation?: ListOperation;
  /** Position for a read, or the value for a search or an insert. */
  argument?: number;
  predict?: boolean;
  title?: string;
  prompt?: string;
}

const DEFAULT_VALUES = [4, 8, 15, 16, 23, 42];

const CELL = 46;
const GAP_ARRAY = 4;
const GAP_LINKED = 22;
const ROW_H = 40;

/** One structure's row. The gap between cells is what shows a pointer has to be followed. */
function Row({ run, step, gap }: { run: ListRun; step: number; gap: number }) {
  // Draw the snapshot for THIS step, not the finished result. Reading run.values made the
  // picture contradict its own caption: "move 42 from position 5 to 6" beside an array where
  // everything had already moved. Past this structure's last step it holds its final state,
  // which is what should happen while the other structure is still working.
  const at = Math.min(step, run.steps.length - 1);
  const values = at >= 0 ? run.steps[at]!.values : run.values;
  const touched = step < run.steps.length ? run.steps[step]!.index : -1;
  const width = Math.max(1, values.length * CELL + Math.max(0, values.length - 1) * gap);
  return (
    <svg
      viewBox={`0 0 ${width} ${ROW_H + 4}`}
      style={{ width: '100%', maxWidth: width, margin: '0 auto', display: 'block' }}
      role="img"
      aria-label={`${run.kind}: ${values.join(', ')}`}
    >
      {values.map((value, index) => {
        const x = index * (CELL + gap);
        const on = index === touched;
        return (
          <g key={index}>
            {gap > 8 && index < values.length - 1 && (
              <line
                x1={x + CELL}
                y1={ROW_H / 2}
                x2={x + CELL + gap}
                y2={ROW_H / 2}
                stroke="var(--stage-wire, #94a3b8)"
                strokeWidth={1.5}
                markerEnd=""
                opacity={0.7}
              />
            )}
            <rect
              x={x}
              y={0}
              width={CELL}
              height={ROW_H}
              rx={5}
              fill={on ? 'var(--stage-accent, #6366f1)' : 'var(--stage-wire, #94a3b8)'}
              opacity={on ? 1 : 0.4}
            />
            <text
              x={x + CELL / 2}
              y={ROW_H / 2 + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={on ? 700 : 500}
              fill="currentColor"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ListLab({
  values = DEFAULT_VALUES,
  operation = 'insert-front',
  argument = 99,
  predict = true,
  title,
  prompt,
}: ListLabProps) {
  const comparison = useMemo(
    () => compareStructures(values, operation, argument),
    [values, operation, argument],
  );
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<ListKind | 'same'>();

  useEffect(() => {
    setStep(0);
    setGuess(undefined);
  }, [comparison]);

  const total = Math.max(comparison.array.steps.length, comparison.linked.steps.length);
  const answered = !predict || guess !== undefined;
  const correct = comparison.winner ?? 'same';
  const arrayCost = Math.min(step + 1, comparison.array.steps.length);
  const linkedCost = Math.min(step + 1, comparison.linked.steps.length);
  const message =
    step < comparison.array.steps.length
      ? comparison.array.steps[step]!.message
      : (comparison.linked.steps[Math.min(step, comparison.linked.steps.length - 1)]?.message ?? '');

  return (
    <Activity.Root className="list-compare algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Array against linked list"
          title={title ?? OPERATION_LABEL[operation]}
          description={
            prompt ??
            'The same operation on both structures, counting every cell moved and every pointer followed. Neither one wins at everything.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span className="lab-chip">
          Array touches <strong>{answered ? arrayCost : '?'}</strong>
        </span>
        <span className="lab-chip">
          List touches <strong>{answered ? linkedCost : '?'}</strong>
        </span>
        <span className="lab-chip">
          Length <strong>{values.length}</strong>
        </span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="Both structures, running the same operation">
          {!answered && (
            <div className="tree-prediction">
              <span>Before you step through it: which structure does less work for this operation?</span>
              <AssessedChoiceGroup
                value={guess}
                onChange={setGuess}
                ariaLabel="Predict which data structure does less work"
                options={(['array', 'linked', 'same'] as const).map((choice) => ({
                  value: choice,
                  label: choice === 'linked' ? 'Linked list' : choice === 'same' ? 'Same work' : 'Array',
                  tone:
                    guess === choice
                      ? choice === correct
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
            </div>
          )}

          {answered && (
            <>
              <p className="list-structure-label">Array, contiguous cells at known addresses</p>
              <Row run={comparison.array} step={step} gap={GAP_ARRAY} />
              <p className="list-structure-label" data-spaced>
                Linked list, nodes joined by pointers
              </p>
              <Row run={comparison.linked} step={step} gap={GAP_LINKED} />
              {guess && (
                <small className="list-prediction-feedback" aria-live="polite">
                  {guess === correct ? (
                    <>
                      <Check aria-hidden="true" /> Correct.{' '}
                      {correct === 'same'
                        ? 'They tie here.'
                        : `The ${correct === 'linked' ? 'linked list' : 'array'} does less work.`}
                    </>
                  ) : correct === 'same' ? (
                    'Actually they tie: both have to look at the same number of items.'
                  ) : (
                    `Actually the ${correct === 'linked' ? 'linked list' : 'array'} wins this one.`
                  )}
                </small>
              )}
            </>
          )}
        </Activity.Canvas>

        <Activity.Inspector label="Where the cost comes from">
          <div className="heap-inspector">
            <section>
              <h4>Array</h4>
              <p>
                {comparison.array.cost} touch{comparison.array.cost === 1 ? '' : 'es'}.{' '}
                {comparison.array.note}
              </p>
            </section>
            <section>
              <h4>Linked list</h4>
              <p>
                {comparison.linked.cost} touch{comparison.linked.cost === 1 ? '' : 'es'}.{' '}
                {comparison.linked.note}
              </p>
            </section>
            <section>
              <h4>The trade</h4>
              <p>
                An array can jump to any position but has to shift to make room at the front. A list splices
                at the front for free but has to walk to reach a position. Choose by which operation you do
                most.
              </p>
            </section>
          </div>
        </Activity.Inspector>
      </Activity.Workspace>

      <Activity.Feedback>
        <strong>{step >= total - 1 ? 'Result' : 'Step'}</strong>
        <span>{answered ? message : 'Commit to an answer to step through it.'}</span>
      </Activity.Feedback>

      <Activity.Transcript>
        <ol>
          {comparison.array.steps.map((item, index) => (
            <li key={`a${index}`} data-current={index === step || undefined}>
              Array: {item.message}
            </li>
          ))}
          {comparison.linked.steps.map((item, index) => (
            <li key={`l${index}`}>List: {item.message}</li>
          ))}
        </ol>
      </Activity.Transcript>

      <TraceTransport
        step={step}
        count={Math.max(total, 1)}
        message={message}
        setStep={setStep}
        canAdvance={answered}
      />
    </Activity.Root>
  );
}
