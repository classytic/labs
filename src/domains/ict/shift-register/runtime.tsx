'use client';

/**
 * ShiftRegisterLab — a stream in, a word out, and the order it arrives in.
 *
 * The prediction is about order because that is what students get wrong. Send 1, 0, 1, 1 and most
 * expect the register to read 1011. It reads 1101 from the input end, because the first bit sent has
 * been travelling longest. The history grid shows each bit as a diagonal, so the reversal is seen
 * happening rather than explained.
 *
 * The challenge makes the learner use it: load a pattern chosen so that sending it in reading order
 * produces the wrong answer. The transfer question is the reason the circuit is on every hobby
 * board: three microcontroller pins driving eight LEDs.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActionButton } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { ShiftScene } from '../../../logic/ShiftScene.js';
import { fromBits, runShift, toBits } from '../../../logic/shift.js';

export interface ShiftRegisterProps {
  /** Pattern for the loading challenge, read from the input end. */
  target?: string;
  title?: string;
  prompt?: string;
}

const SHIFT_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Turn a stream of bits into a word',
  objectives: [
    'Trace bits through a serial-in, parallel-out shift register one clock edge at a time',
    'Explain why the first bit sent ends up at the far end of the register',
    'Load a chosen pattern by sending its bits in the right order',
    'Explain how a shift register lets a few pins control many outputs',
  ],
  success: [
    {
      id: 'predict-order',
      source: 'answer',
      key: 'which-order',
      pendingLabel: 'Predict what the register holds.',
    },
    { id: 'fed-four', source: 'metric', key: 'fed', pendingLabel: 'Feed at least four bits.' },
    { id: 'loaded', source: 'metric', key: 'loaded', pendingLabel: 'Load the target pattern.' },
    { id: 'few-pins', source: 'answer', key: 'three-pins', pendingLabel: 'Explain the three-pin trick.' },
  ],
  questions: [
    {
      id: 'which-order',
      prompt:
        'An empty 4-stage register receives 1, then 0, then 1, then 1, one bit per clock edge. Reading the stages from the input end, what does it hold?',
      choices: [
        {
          value: 'same',
          label: '1011, the same order they were sent',
          feedback: 'The newest bit is at the input end, so the order comes out the other way round.',
        },
        { value: 'reversed', label: '1101, the order reversed' },
        {
          value: 'last',
          label: '0001, only the last bit is kept',
          feedback: 'Every stage keeps a bit; each edge just moves them all one place along.',
        },
      ],
      answer: 'reversed',
      explain:
        'Each edge moves every stored bit one stage along and puts the new bit in stage 1. The first bit sent has moved three times, so it is in stage 4. The last bit sent is in stage 1. Read from the input end, the word is reversed.',
    },
    {
      id: 'three-pins',
      prompt:
        'A microcontroller has three spare pins and must switch eight LEDs on and off. How does a shift register make that possible?',
      choices: [
        {
          value: 'serial',
          label:
            'The eight values are sent one after another on one data pin, and the register outputs all eight at once',
        },
        {
          value: 'fast',
          label: 'It switches between the LEDs so quickly that they all seem lit',
          feedback:
            'That is a different trick, called multiplexing. The register really holds all eight at once.',
        },
        {
          value: 'boost',
          label: 'It multiplies each pin into several electrically',
          feedback: 'Nothing is multiplied. The values arrive in time instead of in space.',
        },
      ],
      answer: 'serial',
      explain:
        'One pin carries the data, one carries the clock that shifts it, and one tells the register when to show the new word. Eight clock edges load eight bits, and all eight outputs change together. Chain two registers and the same three pins drive sixteen LEDs.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Which order?',
      lead: 'Four bits go in one at a time. Decide how they come out before you send them.',
      success: 'predict-order',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Feed it',
      lead: 'Each button sets the input and pulses the clock once. Send 1, 0, 1, 1 and watch the grid.',
      controls: true,
      success: 'fed-four',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Every bit draws a diagonal',
      lead: 'Follow one bit down the grid. It moves one stage right on every row.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Load a pattern',
      lead: 'Make the register hold the target row. Think about which bit has to go in first.',
      reveal: ['target'],
      controls: true,
      success: 'loaded',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Three pins, eight lamps',
      lead: 'This is why the circuit is on almost every microcontroller project board.',
      controls: true,
      success: 'few-pins',
    },
  ],
};

export function ShiftRegisterLab({
  target: authoredTarget = '1100',
  title,
  prompt,
}: ShiftRegisterProps = {}): ReactNode {
  const target = useMemo(
    () => toBits(/^[01]{4}$/.test(authoredTarget) ? authoredTarget : '1100'),
    [authoredTarget],
  );
  const [fed, setFed] = useState<boolean[]>([]);
  const history = useMemo(() => runShift(fed), [fed]);
  const now = history[history.length - 1]!;

  const feed = useCallback(
    (bit: boolean, context: AuthoredActivityContext) => {
      const next = [...fed, bit];
      setFed(next);
      if (next.length >= 4) context.complete('fed-four', 'fed');
      const stages = runShift(next).at(-1)!.stages;
      if (fromBits(stages) === fromBits(target)) context.complete('loaded', 'loaded');
    },
    [fed, target],
  );

  const headline = fed.length
    ? `The register holds ${fromBits(now.stages)}, read from the input end. The last bit sent, ${fed.at(-1) ? 1 : 0}, is in stage 1.`
    : 'The register is empty. Feed it a bit.';

  return (
    <AuthoredActivityRuntime
      activity={SHIFT_ACTIVITY}
      activityId="shift-register"
      eyebrow="Sequential logic"
      title={title ?? 'A stream in, a word out'}
      description={
        prompt ??
        'Bits arrive one per clock edge and every edge moves the stored ones along. After four edges, four bits sent one at a time can be read all at once.'
      }
      status={
        <>
          <span>
            holds <strong>{fromBits(now.stages)}</strong>
          </span>
          <span>{fed.length} bits fed</span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="lab-activity-fields">
            <ActionButton onClick={() => feed(false, context)}>Feed 0</ActionButton>
            <ActionButton onClick={() => feed(true, context)}>Feed 1</ActionButton>
            <ActionButton onClick={() => setFed([])} disabled={!fed.length}>
              Empty it
            </ActionButton>
          </div>
          <p className="lab-note">Each button sets the input, then pulses the clock once.</p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <ShiftScene
          history={history}
          target={context.sequence.shows('target') ? target : undefined}
          label={`Four-stage shift register. ${headline}`}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default ShiftRegisterLab;
