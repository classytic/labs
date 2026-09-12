'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import { buildHeap, extractHeap, insertHeap, type HeapKind, type HeapOperation } from './heap.js';
import { HeapDualView } from './HeapDualView.js';
import type { SequenceDecision } from './sequence-contract.js';
import { TraceTransport } from './TraceTransport.js';
import { BinaryTransferCheck } from './LearningChecks.js';

export interface HeapQuestLabProps {
  values?: number[];
  kind?: HeapKind;
  operation?: HeapOperation;
  value?: number;
  predict?: boolean;
  title?: string;
  prompt?: string;
}
const DEFAULT_VALUES = [7, 2, 9, 1, 5, 8, 3];

export function HeapQuestLab({
  values = DEFAULT_VALUES,
  kind = 'min',
  operation = 'build',
  value = 0,
  predict = true,
  title,
  prompt,
}: HeapQuestLabProps) {
  const trace = useMemo(
    () =>
      operation === 'build'
        ? buildHeap(values, kind)
        : operation === 'insert'
          ? insertHeap(values, value, kind)
          : extractHeap(values, kind),
    [kind, operation, value, values],
  );
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<SequenceDecision>();
  const [selectedId, setSelectedId] = useState<string>();
  const [transferAnswer, setTransferAnswer] = useState<'yes' | 'no'>();
  useEffect(() => {
    setStep(0);
    setGuess(undefined);
    setTransferAnswer(undefined);
  }, [trace]);
  useEffect(() => setGuess(undefined), [step]);
  const event = trace.events[step]!;
  const items = event.items;
  const checkpoint = predict && event.type === 'sequence-compare';
  const choices: SequenceDecision[] =
    event.type === 'sequence-compare' && event.reason === 'choose-child'
      ? ['left', 'right']
      : ['swap', 'keep'];
  const heading =
    operation === 'build'
      ? `Build a ${kind}-heap`
      : operation === 'insert'
        ? `Insert ${value} and bubble up`
        : `Extract the ${kind === 'min' ? 'minimum' : 'maximum'} root`;
  const activeIndices =
    event.type === 'sequence-compare' || event.type === 'sequence-swap' ? event.indices : [];
  const complete = step === trace.events.length - 1;
  return (
    <Activity.Root className="heap-quest algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Priority queue quest"
          title={title ?? heading}
          description={
            prompt ??
            'Keep the tree and array synchronized while every comparison protects the heap invariant.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <span className="lab-chip">
          Heap <strong>{kind}</strong>
        </span>
        <span className="lab-chip">
          Size <strong>{items.length}</strong>
        </span>
        {trace.removed && step === trace.events.length - 1 && (
          <span className="lab-chip">
            Extracted <strong>{trace.removed.value}</strong>
          </span>
        )}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Synchronized heap tree and array">
          <HeapDualView items={items} event={event} selectedId={selectedId} onSelect={setSelectedId} />
          {checkpoint && (
            <div className="tree-prediction heap-prediction">
              <span>
                {event.reason === 'choose-child'
                  ? 'Which child has stronger priority?'
                  : 'Does this pair swap or stop?'}
              </span>
              <AssessedChoiceGroup
                value={guess}
                onChange={setGuess}
                ariaLabel="Predict the next heap decision"
                options={choices.map((choice) => ({
                  value: choice,
                  label: choice[0]!.toUpperCase() + choice.slice(1),
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
                      <Check aria-hidden="true" /> Correct—advance to apply the decision.
                    </>
                  ) : (
                    `Try again: compare ${items[activeIndices[0]!]?.value} and ${items[activeIndices[1]!]?.value} for a ${kind}-heap.`
                  )}
                </small>
              )}
            </div>
          )}
        </Activity.Canvas>
        <Activity.Inspector label="Heap invariant">
          <div className="heap-inspector">
            <section>
              <h4>Invariant</h4>
              <p>
                Every parent has {kind === 'min' ? 'less or equal' : 'greater or equal'} priority than its
                children.
              </p>
            </section>
            <section>
              <h4>Index rules</h4>
              <code>parent(i) = ⌊(i−1)/2⌋</code>
              <code>left(i) = 2i+1</code>
              <code>right(i) = 2i+2</code>
            </section>
            <section>
              <h4>Complexity</h4>
              <dl>
                <div>
                  <dt>Build</dt>
                  <dd>O(n)</dd>
                </div>
                <div>
                  <dt>Insert</dt>
                  <dd>O(log n)</dd>
                </div>
                <div>
                  <dt>Extract</dt>
                  <dd>O(log n)</dd>
                </div>
              </dl>
            </section>
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      {complete && (
        <BinaryTransferCheck
          id="heap-transfer-title"
          prompt="Does a valid heap require the whole array to be sorted?"
          answer={transferAnswer}
          correct="no"
          onAnswer={setTransferAnswer}
          correctFeedback="Exactly. A heap guarantees parent–child priority, not global sorted order."
          retryFeedback="Inspect siblings and cousins: only each parent–child relationship is constrained."
        />
      )}
      <Activity.Feedback>
        <strong>
          {event.type === 'sequence-complete'
            ? 'Result'
            : event.type === 'sequence-swap'
              ? 'Repair'
              : event.type === 'sequence-compare'
                ? 'Compare'
                : 'Observe'}
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
          {transferAnswer && (
            <li>
              Transfer answer: a heap{' '}
              {transferAnswer === 'no'
                ? 'is only partially ordered'
                : 'was incorrectly treated as fully sorted'}
              .
            </li>
          )}
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
