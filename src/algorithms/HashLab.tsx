'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import { TraceTransport } from './TraceTransport.js';
import { BinaryTransferCheck } from './LearningChecks.js';
import { hashTrace, type HashStrategy } from './hashing.js';

export interface HashLabProps {
  keys?: string[];
  buckets?: number;
  strategy?: HashStrategy;
  predict?: boolean;
  title?: string;
  prompt?: string;
}

const DEFAULT_KEYS = ['mango', 'guava', 'lychee', 'jackfruit', 'papaya', 'banana'];

const SLOT_W = 104;
const SLOT_H = 30;
const GAP = 6;
const LABEL_W = 34;

export function HashLab({
  keys = DEFAULT_KEYS,
  buckets = 7,
  strategy = 'chaining',
  predict = true,
  title,
  prompt,
}: HashLabProps) {
  const trace = useMemo(() => hashTrace(keys, buckets, strategy), [keys, buckets, strategy]);
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<'yes' | 'no'>();
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
  const checkpoint = predict && !!current && step < total;

  const shown = current?.buckets ?? trace.buckets;
  const deepest = Math.max(1, ...shown.map((bucket) => bucket.length));
  const width = LABEL_W + deepest * (SLOT_W + GAP);
  const height = shown.length * (SLOT_H + GAP);

  const placed = current ? trace.steps.indexOf(current) + 1 : 0;
  const liveLoad = (placed / trace.size).toFixed(2);

  return (
    <Activity.Root className="hash-quest algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Hash tables"
          title={title ?? `${trace.size} buckets, ${keys.length} keys`}
          description={
            prompt ??
            'A hash turns a key into a bucket number. Watch what happens when two keys want the same bucket, and what that costs later.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span className="lab-chip">
          Strategy <strong>{strategy === 'chaining' ? 'chaining' : 'linear probing'}</strong>
        </span>
        <span className="lab-chip">
          Load factor <strong>{liveLoad}</strong>
        </span>
        <span className="lab-chip">
          Collisions so far{' '}
          <strong>{trace.steps.slice(0, placed).filter((item) => item.collided).length}</strong>
        </span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="The bucket table">
          <svg
            viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`}
            style={{ width: '100%', maxWidth: width, margin: '0 auto', display: 'block' }}
            role="img"
            aria-label={shown
              .map((bucket, index) => `Bucket ${index}: ${bucket.length ? bucket.join(', ') : 'empty'}`)
              .join('. ')}
          >
            {shown.map((bucket, index) => {
              const y = index * (SLOT_H + GAP);
              const isHome = current?.home === index;
              const isSlot = current?.slot === index;
              return (
                <g key={index}>
                  <text x={0} y={y + SLOT_H / 2 + 4} fontSize={12} fill="currentColor" opacity={0.6}>
                    {index}
                  </text>
                  <rect
                    x={LABEL_W}
                    y={y}
                    width={SLOT_W}
                    height={SLOT_H}
                    rx={5}
                    fill="none"
                    stroke={isHome ? 'var(--stage-accent, #6366f1)' : 'var(--stage-wire, #94a3b8)'}
                    strokeWidth={isHome ? 2 : 1}
                    strokeDasharray={bucket.length ? undefined : '3 3'}
                    opacity={isHome ? 1 : 0.5}
                  />
                  {bucket.map((key, depth) => {
                    const x = LABEL_W + depth * (SLOT_W + GAP);
                    const fresh = isSlot && key === current?.key;
                    return (
                      <g key={key}>
                        <rect
                          x={x}
                          y={y}
                          width={SLOT_W}
                          height={SLOT_H}
                          rx={5}
                          fill={
                            fresh
                              ? current?.collided
                                ? 'var(--stage-warn, #f59e0b)'
                                : 'var(--stage-live, #22c55e)'
                              : 'var(--stage-wire, #94a3b8)'
                          }
                          opacity={fresh ? 1 : 0.45}
                        />
                        <text
                          x={x + SLOT_W / 2}
                          y={y + SLOT_H / 2 + 4}
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={fresh ? 700 : 500}
                          fill="currentColor"
                        >
                          {key}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {checkpoint && current && (
            <div className="tree-prediction">
              <span>
                Next key is &ldquo;{current.key}&rdquo;. Its home is bucket {current.home}. Will it collide?
              </span>
              <AssessedChoiceGroup
                value={guess}
                onChange={setGuess}
                ariaLabel={`Will ${current.key} collide in bucket ${current.home}?`}
                options={(['yes', 'no'] as const).map((choice) => ({
                  value: choice,
                  label: choice === 'yes' ? 'Yes' : 'No',
                  tone:
                    guess === choice
                      ? (choice === 'yes') === current.collided
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {guess && (
                <small aria-live="polite">
                  {(guess === 'yes') === current.collided ? (
                    <>
                      <Check aria-hidden="true" /> Correct. Advance to place it.
                    </>
                  ) : (
                    'Look at whether bucket ' + current.home + ' already holds something.'
                  )}
                </small>
              )}
            </div>
          )}
        </Activity.Canvas>

        <Activity.Inspector label="What collisions cost">
          <div className="heap-inspector">
            <section>
              <h4>Final table</h4>
              <dl>
                <div>
                  <dt>Load factor</dt>
                  <dd>{trace.loadFactor.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>Collisions</dt>
                  <dd>{trace.collisions}</dd>
                </div>
                <div>
                  <dt>{strategy === 'chaining' ? 'Longest chain' : 'Average probes'}</dt>
                  <dd>{strategy === 'chaining' ? trace.longestChain : trace.averageProbes.toFixed(2)}</dd>
                </div>
                {trace.dropped.length > 0 && (
                  <div>
                    <dt>Did not fit</dt>
                    <dd>{trace.dropped.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </section>
            <section>
              <h4>Why it matters</h4>
              <p>
                {strategy === 'chaining'
                  ? 'A lookup checks one bucket, then walks its chain. The longest chain is the worst case, so it is the chain length, not the table size, that decides speed.'
                  : 'A lookup probes forward until it finds the key or an empty slot. As the table fills, runs of full slots join up and probes climb sharply.'}
              </p>
            </section>
          </div>
        </Activity.Inspector>
      </Activity.Workspace>

      {complete && (
        <BinaryTransferCheck
          id="hash-transfer-title"
          prompt="Does doubling the number of buckets always halve the number of collisions?"
          answer={transferAnswer}
          correct="no"
          onAnswer={setTransferAnswer}
          correctFeedback="Right. More buckets lowers the load factor and collisions fall on average, but a hash that spreads keys badly can still pile them into one bucket however large the table is."
          retryFeedback="Think about a hash that returns the same number for every key. What would more buckets change?"
        />
      )}

      <Activity.Feedback>
        <strong>{current?.collided ? 'Collision' : complete ? 'Result' : 'Place'}</strong>
        <span>{current?.message ?? 'No keys to insert.'}</span>
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
        message={current?.message ?? ''}
        setStep={setStep}
        canAdvance={!checkpoint || Boolean(guess)}
      />
    </Activity.Root>
  );
}
