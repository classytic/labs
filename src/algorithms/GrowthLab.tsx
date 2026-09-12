'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup, Slider } from '../kit/controls.js';
import {
  GROWTH_CLASSES,
  GROWTH_EXAMPLE,
  GROWTH_NOTATION,
  formatOperations,
  growthAt,
  intractableAt,
  operations,
  timesSlower,
} from './growth.js';

export interface GrowthLabProps {
  /** Input sizes the slider steps through. Powers of two keep the halving story honest. */
  sizes?: number[];
  start?: number;
  predict?: boolean;
  title?: string;
  prompt?: string;
}

const DEFAULT_SIZES = [8, 16, 32, 64, 128, 256, 512, 1000];

const ROW_H = 34;
const GAP = 8;
const LABEL_W = 118;
const TRACK_W = 300;

/** The answer is about 100x. Students reliably guess 10x, which is the misconception to catch. */
const CHOICES = ['about 10 times', 'about 100 times', 'about 10 000 times'] as const;
const CORRECT = 'about 100 times';

export function GrowthLab({
  sizes = DEFAULT_SIZES,
  start = 0,
  predict = true,
  title,
  prompt,
}: GrowthLabProps) {
  const steps = sizes.length ? sizes : DEFAULT_SIZES;
  const [index, setIndex] = useState(() => Math.min(Math.max(0, start), steps.length - 1));
  const [guess, setGuess] = useState<string>();
  const n = steps[index]!;
  const rows = useMemo(() => growthAt(n), [n]);
  const intractable = useMemo(() => intractableAt(n), [n]);
  const answered = !predict || guess === CORRECT;

  const width = LABEL_W + TRACK_W + 130;
  const height = rows.length * (ROW_H + GAP);

  return (
    <Activity.Root className="growth-explorer algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="How badly does it scale?"
          title={title ?? 'Growth you can read as a number'}
          description={
            prompt ??
            'Every class below is a real algorithm from this course. Move the input size and watch which ones stay usable.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span className="lab-chip">
          Input size <strong>{n.toLocaleString('en-US')}</strong>
        </span>
        <span className="lab-chip">
          Bubble sort <strong>{formatOperations(operations('quadratic', n))}</strong>
        </span>
        <span className="lab-chip">
          Merge sort <strong>{formatOperations(operations('linearithmic', n))}</strong>
        </span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="Operations by growth class, on a logarithmic scale">
          {predict && !answered && (
            <div className="tree-prediction">
              <span>
                Before you look: at an input of 1000, roughly how many times more work does bubble sort do
                than merge sort?
              </span>
              <AssessedChoiceGroup
                value={guess}
                onChange={setGuess}
                ariaLabel="Predict the relative work at input size 1000"
                options={CHOICES.map((choice) => ({
                  value: choice,
                  label: choice,
                  tone:
                    guess === choice
                      ? choice === CORRECT
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {guess && guess !== CORRECT && (
                <small aria-live="polite">
                  Not quite. Work it out: 1000 squared against 1000 × log₂(1000), which is about 10 per value.
                </small>
              )}
            </div>
          )}

          {answered && (
            <>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                style={{ width: '100%', maxWidth: width, margin: '0 auto', display: 'block' }}
                role="img"
                aria-label={rows
                  .map(
                    (row) => `${GROWTH_NOTATION[row.kind]}: ${formatOperations(row.operations)} operations`,
                  )
                  .join('. ')}
              >
                {rows.map((row, position) => {
                  const y = position * (ROW_H + GAP);
                  const barW = Math.max(2, row.share * TRACK_W);
                  const worst = position === rows.length - 1;
                  return (
                    <g key={row.kind}>
                      <text x={0} y={y + ROW_H / 2 + 5} fontSize={13} fill="currentColor" fontWeight={600}>
                        {GROWTH_NOTATION[row.kind]}
                      </text>
                      <rect
                        x={LABEL_W}
                        y={y + 6}
                        width={barW}
                        height={ROW_H - 12}
                        rx={4}
                        fill={worst ? 'var(--stage-warn, #f59e0b)' : 'var(--stage-accent, #6366f1)'}
                        opacity={worst ? 1 : 0.7}
                      />
                      <text
                        x={LABEL_W + barW + 8}
                        y={y + ROW_H / 2 + 5}
                        fontSize={12}
                        fill="currentColor"
                        opacity={0.85}
                      >
                        {formatOperations(row.operations)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Bar length is logarithmic. On a linear scale every bar but the slowest would be invisible.
              </p>
              <p
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'color-mix(in oklab, var(--stage-warn, #f59e0b) 12%, transparent)',
                }}
              >
                <strong>{intractable.notation}</strong> is not on the chart because it shares no scale with
                these. {intractable.example} at n = {n.toLocaleString('en-US')} takes{' '}
                <strong>{formatOperations(intractable.operations)}</strong> operations.
              </p>
            </>
          )}
        </Activity.Canvas>

        <Activity.Inspector label="What each class is">
          <div className="heap-inspector">
            <section>
              <h4>Input size</h4>
              <Slider
                value={index}
                min={0}
                max={steps.length - 1}
                step={1}
                onChange={setIndex}
                ariaLabel="input size"
                valueText={`${n} items`}
              />
              <p>n = {n.toLocaleString('en-US')}</p>
            </section>
            <section>
              <h4>Where you have seen it</h4>
              <dl>
                {GROWTH_CLASSES.map((kind) => (
                  <div key={kind}>
                    <dt>{GROWTH_NOTATION[kind]}</dt>
                    <dd>{GROWTH_EXAMPLE[kind]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </Activity.Inspector>
      </Activity.Workspace>

      <Activity.Feedback>
        <strong>{answered ? 'Read it' : 'Predict first'}</strong>
        <span>
          {!answered ? (
            'Commit to an answer to reveal the chart.'
          ) : guess === CORRECT ? (
            <>
              <Check aria-hidden="true" /> At n = 1000 bubble sort does about{' '}
              {Math.round(timesSlower('quadratic', 'linearithmic', 1000))} times the work of merge sort. At n
              = 8 it is barely twice, which is why small examples hide the problem.
            </>
          ) : (
            `At n = ${n.toLocaleString('en-US')}, the slowest class here does ${formatOperations(
              rows[rows.length - 1]!.operations,
            )} operations. Growth decides which algorithms are usable at all.`
          )}
        </span>
      </Activity.Feedback>
    </Activity.Root>
  );
}
