'use client';

/**
 * BinaryCounterLab — counting and dividing are the same circuit.
 *
 * The waves are drawn one clock edge at a time, as the learner pulses the clock, so the pattern is
 * built in front of them rather than shown finished. That is what makes the prediction honest: by
 * the time the fours bit has changed twice, they have watched it take four edges each time.
 *
 * The design step is a decade counter. A student told "use an AND gate on Q3 and Q0" learns a
 * recipe; a student who slides the modulus and sees the gate's inputs change with it learns why
 * only the 1-bits of the last count matter. The transfer question then takes the halving pattern
 * somewhere they have met it without knowing: the watch on their wrist.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActionButton, Slider } from '../../../kit/controls.js';
import { Field, LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { CounterScene } from '../../../logic/CounterScene.js';
import { detectLabel, runCounter, toBinary } from '../../../logic/counter.js';

export interface BinaryCounterProps {
  /** Counts 0 to modulus - 1, then starts again. 16 is a plain 4-bit counter. */
  modulus?: number;
  title?: string;
  prompt?: string;
}

/**
 * Enough clock periods to see the full counter roll over. At 16 the learner could count to 15 and
 * never watch it return to 0, which is the event the whole length lesson depends on.
 */
const PERIODS = 18;

const COUNTER_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Build a counter and make it stop where you want',
  objectives: [
    'Read a count off four flip-flop outputs, and read it off their waveforms',
    'Explain why each bit of a counter changes half as often as the bit before it',
    'Design the reset logic for a counter of any length up to 16',
    'Use the halving pattern to work out how many stages divide a frequency down',
  ],
  success: [
    {
      id: 'predict-fours',
      source: 'answer',
      key: 'how-often',
      pendingLabel: 'Predict how often the fours bit changes.',
    },
    {
      id: 'clocked-it',
      source: 'metric',
      key: 'clocked',
      pendingLabel: 'Pulse the clock at least eight times.',
    },
    {
      id: 'made-a-decade',
      source: 'metric',
      key: 'decade',
      pendingLabel: 'Set the counter to count 0 to 9 and clock it past 9.',
    },
    {
      id: 'watch-stages',
      source: 'answer',
      key: 'watch',
      pendingLabel: 'Work out how many stages a quartz watch needs.',
    },
  ],
  questions: [
    {
      id: 'how-often',
      prompt:
        'A counter goes 0, 1, 2, 3 and so on, one step per clock edge. Q0 is the ones bit and changes on every edge. How many edges pass between changes of Q2, the fours bit?',
      // Three short answers fill one row of the side-by-side layout; "1" was only ever the ones bit.
      choices: [
        { value: 'two', label: '2', feedback: 'That is the twos bit. Each place value doubles the wait.' },
        { value: 'four', label: '4' },
        { value: 'eight', label: '8', feedback: 'That is the eights bit, one place further.' },
      ],
      answer: 'four',
      explain:
        'Q2 is 0 for counts 0 to 3 and 1 for counts 4 to 7, so it changes every four edges. Each bit waits twice as long as the one before it. Drawn as waveforms, each row is the clock divided by two again.',
    },
    {
      id: 'watch',
      prompt:
        'A quartz watch crystal vibrates 32,768 times a second. How many divide-by-two stages turn that into one tick per second?',
      choices: [
        {
          value: 'thousands',
          label: '32,768, one per vibration',
          feedback:
            'Each stage halves the rate, so the number of stages grows much more slowly than the rate.',
        },
        { value: 'fifteen', label: '15, because 32,768 is 2 to the power 15' },
        {
          value: 'sixteen',
          label: '16, one for each bit of a 16-bit number',
          feedback: 'Close. Count the halvings: 32,768, 16,384, and so on down to 1.',
        },
      ],
      answer: 'fifteen',
      explain:
        'Each stage halves the frequency, exactly as each row of your counter does. 32,768 is 2 to the 15, so fifteen halvings reach one per second. That number was chosen for watches precisely because it is a power of two.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'How often does the fours bit change?',
      lead: 'Four flip-flops counting up, one step per clock edge.',
      success: 'predict-fours',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Clock it',
      lead: 'Pulse the clock and watch the waves fill in underneath the register.',
      controls: true,
      success: 'clocked-it',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Each row halves',
      lead: 'Compare each row with the one above it. Then read one column from the bottom up.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Stop at nine',
      lead: 'Slide the counter length to 10 and clock it past 9. Watch which bits the reset gate reads.',
      controls: true,
      success: 'made-a-decade',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'The one on your wrist',
      lead: 'The halving you have been watching is also how a watch keeps time.',
      controls: true,
      success: 'watch-stages',
    },
  ],
};

export function BinaryCounterLab({
  modulus: authored = 16,
  title,
  prompt,
}: BinaryCounterProps = {}): ReactNode {
  const [modulus, setModulus] = useState(Math.max(2, Math.min(16, authored)));
  const [edges, setEdges] = useState(0);
  const run = useMemo(() => runCounter(modulus, PERIODS), [modulus]);
  const count = run.counts[Math.min(edges, PERIODS - 1)] ?? 0;

  const pulse = useCallback(
    (context: AuthoredActivityContext, by = 1) => {
      const next = Math.min(PERIODS - 1, edges + by);
      setEdges(next);
      if (next >= 8) context.complete('clocked-it', 'clocked');
      if (modulus === 10 && next >= 10) context.complete('made-a-decade', 'decade');
    },
    [edges, modulus],
  );

  const changeLength = useCallback(
    (value: number, context: AuthoredActivityContext) => {
      setModulus(value);
      if (value === 10 && edges >= 10) context.complete('made-a-decade', 'decade');
    },
    [edges],
  );

  const headline =
    modulus === 16
      ? `The count is ${count}, which is ${toBinary(count)} in binary. Four bits count to 15 and wrap to 0 by themselves.`
      : `The count is ${count}, which is ${toBinary(count)}. It resets after ${modulus - 1}, because a gate watching ${detectLabel(modulus)} fires on that count and clears the register on the next edge.`;

  return (
    <AuthoredActivityRuntime
      activity={COUNTER_ACTIVITY}
      activityId="binary-counter"
      eyebrow="Sequential logic"
      title={title ?? 'Counting is dividing'}
      description={
        prompt ??
        'Four flip-flops count in binary, and each one changes half as often as the one before. Add one gate and the counter stops wherever you choose.'
      }
      status={
        <>
          <span>
            count <strong>{count}</strong> · {toBinary(count)}
          </span>
          <span>counts 0 to {modulus - 1}</span>
          <span>
            edge {edges} of {PERIODS - 1}
          </span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="lab-activity-fields">
            <ActionButton onClick={() => pulse(context)} disabled={edges >= PERIODS - 1}>
              Pulse the clock
            </ActionButton>
            <ActionButton onClick={() => pulse(context, PERIODS)} disabled={edges >= PERIODS - 1}>
              Run to the end
            </ActionButton>
            <ActionButton onClick={() => setEdges(0)} disabled={edges === 0}>
              Start again
            </ActionButton>
          </div>
          <Field label="counter length" value={<b>{modulus === 16 ? '16 (full)' : modulus}</b>}>
            <Slider
              value={modulus}
              min={2}
              max={16}
              step={1}
              onChange={(value) => changeLength(value, context)}
              ariaLabel="counter length"
            />
          </Field>
          <p className="lab-note">
            {modulus === 16
              ? 'At 16 there is no reset gate: four bits roll over from 1111 to 0000 on their own.'
              : `The last count is ${modulus - 1} = ${toBinary(modulus - 1)}. The gate reads only the 1 bits, ${detectLabel(modulus)}, because no smaller count has all of them set.`}
          </p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      <CounterScene
        run={run}
        modulus={modulus}
        edges={edges}
        label={`A 4-bit counter after ${edges} clock edges. ${headline}`}
      />
    </AuthoredActivityRuntime>
  );
}

export default BinaryCounterLab;
