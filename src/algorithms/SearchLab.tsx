'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import { TraceTransport } from './TraceTransport.js';
import { BinaryTransferCheck } from './LearningChecks.js';
import { binarySearchTrace, type SearchDecision } from './search.js';

export interface SearchLabProps {
  values?: number[];
  target?: number;
  predict?: boolean;
  title?: string;
  prompt?: string;
}

const DEFAULT_VALUES = [1, 3, 5, 7, 9, 11, 13, 15];

const CELL = 42;
const GAP = 6;
const ROW_H = 46;

/** Cells are SVG so the lab carries no stylesheet of its own. */
function Cells({
  values,
  lo,
  hi,
  mid,
  found,
  showProbe,
}: {
  values: number[];
  lo: number;
  hi: number;
  mid: number;
  found: boolean;
  showProbe: boolean;
}) {
  const width = values.length * CELL + (values.length - 1) * GAP;
  return (
    <svg
      viewBox={`0 0 ${Math.max(width, 1)} ${ROW_H + 30}`}
      style={{ width: '100%', maxWidth: width, margin: '0 auto', display: 'block' }}
      role="img"
      aria-label={`Positions ${lo} to ${hi} are still being searched. Probing position ${mid}.`}
    >
      {values.map((value, index) => {
        const inWindow = index >= lo && index <= hi;
        const isProbe = showProbe && index === mid;
        const x = index * (CELL + GAP);
        const fill = isProbe
          ? found
            ? 'var(--stage-live, #22c55e)'
            : 'var(--stage-accent, #6366f1)'
          : inWindow
            ? 'var(--stage-wire, #94a3b8)'
            : 'transparent';
        return (
          <g key={index}>
            <rect
              x={x}
              y={0}
              width={CELL}
              height={ROW_H}
              rx={6}
              fill={fill}
              opacity={isProbe ? 1 : inWindow ? 0.5 : 0.15}
              stroke={inWindow ? 'none' : 'var(--stage-wire, #94a3b8)'}
              strokeDasharray={inWindow ? undefined : '3 3'}
            />
            <text
              x={x + CELL / 2}
              y={ROW_H / 2 + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={isProbe ? 700 : 500}
              fill="currentColor"
              opacity={inWindow ? 1 : 0.35}
            >
              {value}
            </text>
            <text
              x={x + CELL / 2}
              y={ROW_H + 18}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >
              {index}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SearchLab({
  values = DEFAULT_VALUES,
  target = 13,
  predict = true,
  title,
  prompt,
}: SearchLabProps) {
  const trace = useMemo(() => binarySearchTrace(values, target), [values, target]);
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<SearchDecision>();
  const [transferAnswer, setTransferAnswer] = useState<'yes' | 'no'>();

  useEffect(() => {
    setStep(0);
    setGuess(undefined);
    setTransferAnswer(undefined);
  }, [trace]);
  useEffect(() => setGuess(undefined), [step]);

  const total = trace.steps.length;
  const current = trace.steps[Math.min(step, Math.max(0, total - 1))];
  const complete = total === 0 || step >= total - 1;
  // The last probe answers itself, so there is nothing left to predict there.
  const checkpoint = predict && !!current && current.decision !== 'found' && step < total - 1;

  const message = current?.message ?? `Nothing to search: the array is empty.`;
  const saved = trace.linearComparisons - trace.comparisons;

  return (
    <Activity.Root className="search-quest algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Searching, and what it costs"
          title={title ?? `Find ${target} by halving`}
          description={
            prompt ??
            'Each probe throws away half of what is left. Watch how few probes a sorted array needs, and what a scan would have cost.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span className="lab-chip">
          Probes so far <strong>{Math.min(step + 1, total)}</strong>
        </span>
        <span className="lab-chip">
          Still possible <strong>{current ? current.hi - current.lo + 1 : 0}</strong>
        </span>
        <span className="lab-chip">
          A scan would take <strong>{trace.linearComparisons}</strong>
        </span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="The sorted array and the window still being searched">
          <Cells
            values={trace.values}
            lo={current?.lo ?? 0}
            hi={current?.hi ?? trace.values.length - 1}
            mid={current?.mid ?? -1}
            found={current?.decision === 'found'}
            showProbe={!!current}
          />
          {checkpoint && current && (
            <div className="tree-prediction">
              <span>
                The probe holds {trace.values[current.mid]} and the target is {target}. Which half survives?
              </span>
              <AssessedChoiceGroup
                value={guess}
                onChange={setGuess}
                ariaLabel="Predict which half of the sorted array remains"
                options={(['left', 'right'] as SearchDecision[]).map((choice) => ({
                  value: choice,
                  label: choice === 'left' ? 'Keep left half' : 'Keep right half',
                  tone:
                    guess === choice
                      ? guess === current.decision
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {guess && (
                <small aria-live="polite">
                  {guess === current.decision ? (
                    <>
                      <Check aria-hidden="true" /> Correct. Advance to discard the other half.
                    </>
                  ) : (
                    'Not quite. The array is sorted, so everything on one side of the probe can be ruled out at once.'
                  )}
                </small>
              )}
            </div>
          )}
        </Activity.Canvas>

        <Activity.Inspector label="Halving against scanning">
          <div className="heap-inspector">
            <section>
              <h4>This search</h4>
              <dl>
                <div>
                  <dt>Binary probes</dt>
                  <dd>{trace.comparisons}</dd>
                </div>
                <div>
                  <dt>Linear scan</dt>
                  <dd>{trace.linearComparisons}</dd>
                </div>
                <div>
                  <dt>Result</dt>
                  <dd>{trace.foundIndex === -1 ? 'not present' : `index ${trace.foundIndex}`}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h4>Why it stays small</h4>
              <p>
                Each probe halves the window, so {trace.values.length} values need at most {trace.worstCase}{' '}
                probes. Doubling the array adds one probe, not double the work.
              </p>
            </section>
            {saved !== 0 && (
              <section>
                <h4>On this input</h4>
                <p>
                  {saved > 0
                    ? `Halving saved ${saved} comparison${saved === 1 ? '' : 's'}.`
                    : `A scan was actually ${-saved} cheaper here, because the target sits near the front.`}
                </p>
              </section>
            )}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>

      {complete && (
        <BinaryTransferCheck
          id="search-transfer-title"
          prompt="Would this method still work if the array were not sorted?"
          answer={transferAnswer}
          correct="no"
          onAnswer={setTransferAnswer}
          correctFeedback="Correct. Discarding a half is only justified because order guarantees the target cannot be there. Without sorting, the probe tells you nothing about the rest."
          retryFeedback="Look at what each probe lets you rule out, and ask what makes that safe."
        />
      )}

      <Activity.Feedback>
        <strong>{current?.decision === 'found' ? 'Found' : complete ? 'Result' : 'Probe'}</strong>
        <span>
          {complete && trace.foundIndex === -1 && total > 0
            ? `${message} The window is now empty, so ${target} is not in this array.`
            : message}
        </span>
      </Activity.Feedback>

      <Activity.Transcript>
        <ol>
          {trace.steps.map((item, index) => (
            <li key={index} data-current={index === step || undefined}>
              {item.message}
            </li>
          ))}
        </ol>
      </Activity.Transcript>

      <TraceTransport
        step={step}
        count={Math.max(total, 1)}
        message={message}
        setStep={setStep}
        canAdvance={!checkpoint || Boolean(guess)}
      />
    </Activity.Root>
  );
}
