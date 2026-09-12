'use client';

/**
 * TwosComplementLab — negative numbers without a minus sign.
 *
 * It opens on 7 + 1, the sum that breaks. A student used to ordinary arithmetic says 8; the adder
 * says 1000, which in two's complement is −8. The wheel shows why at once: the walk from 7 crossed
 * the overflow line at the bottom.
 *
 * The rest of the lab derives, rather than states, the rules a first course hands out. Negation is
 * a mirror across the wheel, and "invert and add one" is what that mirror costs in bits.
 * Subtraction uses the same adder on the negation, which is why a processor needs no subtractor.
 * The transfer question lands on the one asymmetry: −8 has no partner, so negating it overflows.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Chip, Slider } from '../../../kit/controls.js';
import { Field, LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { TwosScene, type TwosOperation } from '../../../logic/TwosScene.js';
import { add, bitsOf, fromSigned, negate, subtract, toSigned } from '../../../logic/twos.js';

export interface TwosComplementProps {
  a?: number;
  b?: number;
  operation?: TwosOperation;
  title?: string;
  prompt?: string;
}

const TWOS_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Find out how one adder handles negative numbers',
  objectives: [
    'Read a 4-bit pattern as a two’s complement value from −8 to 7',
    'Explain overflow as crossing the line between 7 and −8',
    'Derive "invert and add one" as the mirror image on the wheel',
    'Subtract by adding the negation on the same adder',
  ],
  success: [
    { id: 'predict-overflow', source: 'answer', key: 'seven-plus-one', pendingLabel: 'Predict 0111 + 0001.' },
    { id: 'walked', source: 'metric', key: 'walked', pendingLabel: 'Try a few sums on the wheel.' },
    {
      id: 'subtracted',
      source: 'metric',
      key: 'subtracted',
      pendingLabel: 'Subtract to get a negative answer.',
    },
    {
      id: 'minus-eight',
      source: 'answer',
      key: 'negate-eight',
      pendingLabel: 'Say what −(−8) comes out as.',
    },
  ],
  questions: [
    {
      id: 'seven-plus-one',
      prompt: 'Four bits, two’s complement. The adder is given 0111 and 0001. What comes out?',
      choices: [
        {
          value: 'eight',
          label: '1000, which is 8',
          feedback: 'In two’s complement the top bit counts as −8, so 1000 cannot mean +8.',
        },
        { value: 'minus-eight', label: '1000, which is −8: the answer overflowed' },
        {
          value: 'zero',
          label: '0000, because the result is too big',
          feedback:
            'The adder does not clear itself. It produces a pattern, and the question is what that pattern means.',
        },
      ],
      answer: 'minus-eight',
      explain:
        'The adder produces 1000 either way. Read as two’s complement, the top bit is worth −8, so 7 + 1 has come out as −8. On the wheel, the walk from 7 crossed the line between 7 and −8. That crossing is overflow: the true answer, 8, does not exist in four bits.',
    },
    {
      id: 'negate-eight',
      prompt: 'What does "invert and add one" give for −8, which is 1000?',
      choices: [
        { value: 'eight', label: '+8', feedback: 'There is no +8 in four bits. Try it on the wheel.' },
        { value: 'itself', label: '1000 again, still −8, because +8 does not fit' },
        { value: 'zero', label: '0000', feedback: 'Inverting 1000 gives 0111; adding one gives 1000 again.' },
      ],
      answer: 'itself',
      explain:
        'Inverting 1000 gives 0111, and adding one gives 1000 again. On the wheel, −8 sits on the mirror axis opposite 0, so it is its own reflection. Sixteen patterns, with zero in the non-negative half, leave one more negative value than positive, and that one has no partner.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Seven plus one',
      lead: 'Sixteen patterns round a wheel. The top half of the wheel means negative.',
      success: 'predict-overflow',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Walk the wheel',
      lead: 'Change a and b. Adding a positive b walks forward, a negative b walks back. Watch for the red line.',
      reveal: ['result'],
      controls: true,
      success: 'walked',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Negation is a mirror',
      lead: 'Switch to negate. Each value lands on its mirror image across the dashed line.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Subtraction for free',
      lead: 'Switch to subtract and make the answer negative. The adder is the same one.',
      controls: true,
      success: 'subtracted',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'The value with no partner',
      lead: 'Two values sit on the mirror line. One of them causes trouble.',
      controls: true,
      success: 'minus-eight',
    },
  ],
};

const clamp = (value: number): number => Math.max(-8, Math.min(7, Math.round(value)));

export function TwosComplementLab({
  a: authoredA = 7,
  b: authoredB = 1,
  operation: authoredOp = 'add',
  title,
  prompt,
}: TwosComplementProps = {}): ReactNode {
  const [op, setOp] = useState<TwosOperation>(authoredOp);
  const [a, setA] = useState(clamp(authoredA));
  const [b, setB] = useState(clamp(authoredB));
  const [tries, setTries] = useState(0);

  const pa = fromSigned(a);
  const pb = fromSigned(b);
  const view = useMemo(() => {
    if (op === 'negate') {
      const n = negate(pa);
      return { addend: pb, result: n.result, overflow: n.overflow, carryOut: false, inverted: n.inverted };
    }
    const sum = op === 'subtract' ? subtract(pa, pb) : add(pa, pb);
    return {
      addend: op === 'subtract' ? negate(pb).result : pb,
      result: sum.result,
      overflow: sum.overflow,
      carryOut: sum.carryOut,
      inverted: undefined,
    };
  }, [op, pa, pb]);

  const note = useCallback(
    (nextOp: TwosOperation, nextA: number, nextB: number, context: AuthoredActivityContext) => {
      const count = tries + 1;
      setTries(count);
      if (count >= 3) context.complete('walked', 'walked');
      if (nextOp === 'subtract') {
        const got = subtract(fromSigned(nextA), fromSigned(nextB));
        if (toSigned(got.result) < 0 && !got.overflow) context.complete('subtracted', 'subtracted');
      }
    },
    [tries],
  );

  const shownA = a;
  const headline =
    op === 'negate'
      ? view.overflow
        ? `Negating ${shownA} gives ${toSigned(view.result)} again: invert ${bitsOf(pa)} to ${bitsOf(view.inverted ?? 0)}, add 1, and you are back where you started.`
        : `The negative of ${shownA} is ${toSigned(view.result)}: invert ${bitsOf(pa)} to ${bitsOf(view.inverted ?? 0)}, then add 1.`
      : view.overflow
        ? `${shownA} ${op === 'add' ? '+' : '−'} ${b} should be ${op === 'add' ? a + b : a - b}, which does not fit, so the adder gives ${toSigned(view.result)}. That is overflow.`
        : `${shownA} ${op === 'add' ? '+' : '−'} ${b} = ${toSigned(view.result)}, computed by the same adder${op === 'subtract' ? ' adding the negation of b' : ''}.`;

  return (
    <AuthoredActivityRuntime
      activity={TWOS_ACTIVITY}
      activityId="twos-complement"
      eyebrow="Numbers"
      title={title ?? 'Negative numbers without a minus sign'}
      description={
        prompt ??
        'Put the sixteen 4-bit patterns on a wheel and call the top half negative. Then one adder does addition, subtraction and negation.'
      }
      status={(context) => (
        <>
          <span>
            a <strong>{a}</strong> · b <strong>{b}</strong>
          </span>
          <span>{op === 'add' ? 'add' : op === 'subtract' ? 'subtract' : 'negate a'}</span>
          <span>
            {context.sequence.shows('result')
              ? view.overflow
                ? 'overflow'
                : `= ${toSigned(view.result)}`
              : '= ?'}
          </span>
        </>
      )}
      inspector={(context) => (
        <>
          <div className="lab-activity-fields">
            {(['add', 'subtract', 'negate'] as const).map((choice) => (
              <Chip
                key={choice}
                selected={op === choice}
                onClick={() => {
                  setOp(choice);
                  note(choice, a, b, context);
                }}
              >
                {choice === 'add' ? 'a + b' : choice === 'subtract' ? 'a − b' : 'negate a'}
              </Chip>
            ))}
          </div>
          <Field
            label="a"
            value={
              <b>
                {a} · {bitsOf(pa)}
              </b>
            }
          >
            <Slider
              value={a}
              min={-8}
              max={7}
              step={1}
              onChange={(value) => {
                setA(value);
                note(op, value, b, context);
              }}
              ariaLabel="a"
            />
          </Field>
          {op !== 'negate' && (
            <Field
              label="b"
              value={
                <b>
                  {b} · {bitsOf(pb)}
                </b>
              }
            >
              <Slider
                value={b}
                min={-8}
                max={7}
                step={1}
                onChange={(value) => {
                  setB(value);
                  note(op, a, value, context);
                }}
                ariaLabel="b"
              />
            </Field>
          )}
          <LiveRegion>
            {context.sequence.shows('result') ? headline : 'Predict first. The result is hidden.'}
          </LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <TwosScene
          operation={op}
          a={pa}
          b={pb}
          addend={view.addend}
          result={view.result}
          overflow={view.overflow}
          carryOut={view.carryOut}
          inverted={view.inverted}
          revealed={context.sequence.shows('result')}
          label={`Two’s complement wheel. ${context.sequence.shows('result') ? headline : 'Result hidden until you predict.'}`}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default TwosComplementLab;
