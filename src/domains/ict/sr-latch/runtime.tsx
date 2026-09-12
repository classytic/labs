'use client';

/**
 * SrLatchLab — the first circuit whose output depends on its past.
 *
 * Every circuit before this one in a digital logic course is combinational: same inputs, same
 * output, always. The prediction question is built to hit that assumption directly. Both inputs
 * are low; what is Q? A student who has only seen combinational logic answers 0, and the lab then
 * shows two identical input states giving two different answers. That contradiction is the moment
 * the idea of stored state arrives, and it arrives as something observed rather than defined.
 *
 * The rest of the activity pulls the same thread. Stepping through gate delays shows that a set is
 * a chain of events (Q̅ falls, then Q rises because Q̅ fell), which is what "each gate is held by
 * the other" means in practice. The forbidden input is then shown rather than stated: releasing S
 * and R together leaves two identical gates with no reason to pick a side, and the trace strip
 * turns into a square wave that never stops.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActionButton } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { LatchScene } from '../../../logic/LatchScene.js';
import {
  RESET_STATE,
  SET_STATE,
  delaysToSettle,
  latchMode,
  settleLatch,
  type LatchInputs,
  type LatchSettle,
} from '../../../logic/latch.js';

export interface SrLatchProps {
  /** Whether the latch starts holding a 1 or a 0. */
  startSet?: boolean;
  title?: string;
  prompt?: string;
}

const LATCH_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Find out how two gates can remember a bit',
  objectives: [
    'Explain why a latch can give different outputs for the same inputs',
    'Trace a set through the two gates one gate delay at a time',
    'Say which wire is holding the stored bit when both inputs are low',
    'Explain why S and R must never be released together from both high',
  ],
  success: [
    {
      id: 'predict-hold',
      source: 'answer',
      key: 'same-inputs',
      pendingLabel: 'Predict Q when both inputs are low.',
    },
    {
      id: 'held-a-one',
      source: 'metric',
      key: 'held',
      pendingLabel: 'Set the latch, then release S and watch Q stay high.',
    },
    {
      id: 'saw-the-race',
      source: 'metric',
      key: 'race',
      pendingLabel: 'Force both inputs high, then release them together.',
    },
    {
      id: 'why-forbidden',
      source: 'answer',
      key: 'forbidden',
      pendingLabel: 'Say why S = R = 1 is called forbidden.',
    },
  ],
  questions: [
    {
      id: 'same-inputs',
      prompt: 'This circuit has two inputs, S and R, and both of them are 0. What is the output Q?',
      choices: [
        {
          value: 'zero',
          label: 'Q is 0, because both inputs are 0',
          feedback:
            'That is how every circuit before this one behaved. This one has two gates feeding each other.',
        },
        {
          value: 'one',
          label: 'Q is 1',
          feedback: 'It can be, and it can also be 0 with exactly the same inputs.',
        },
        { value: 'depends', label: 'It depends on which input was high most recently' },
      ],
      answer: 'depends',
      explain:
        'With both inputs low, each NOR gate just inverts the other gate’s output, so either state keeps itself in place. The output is decided by the last input that was high. Identical inputs, different outputs: that is what it means for a circuit to remember.',
    },
    {
      id: 'forbidden',
      prompt: 'Why is S = 1 and R = 1 called the forbidden input for a NOR latch?',
      choices: [
        {
          value: 'damage',
          label: 'It shorts the power supply and can damage the gates',
          feedback: 'Nothing is damaged. The problem is logical, and you saw it on the trace.',
        },
        {
          value: 'both-low',
          label:
            'Both outputs go to 0, and releasing both inputs together leaves the gates with no way to decide',
        },
        {
          value: 'ignored',
          label: 'The latch ignores it and keeps its previous value',
          feedback: 'Look at the lamps while both inputs are high. Something did change.',
        },
      ],
      answer: 'both-low',
      explain:
        'While both inputs are high, Q and Q̅ are both 0, which breaks the promise that one is the opposite of the other. Release both at the same instant and the two identical gates rise together and fall together. Real gates settle on whichever happens to be slightly faster, so the stored value is effectively random.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Same inputs, same output?',
      lead: 'Two NOR gates, each feeding its output back into the other. Both inputs are low.',
      success: 'predict-hold',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Set it, then let go',
      lead: 'Turn S on, then off again. Watch Q after S is released.',
      controls: true,
      success: 'held-a-one',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'One gate delay at a time',
      lead: 'Replay the last change and step through it. Notice which output moves first.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'The input you must not use',
      lead: 'Turn both inputs on, then release them together with the button.',
      controls: true,
      success: 'saw-the-race',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Why it is forbidden',
      lead: 'You have seen what happens. Now say why a designer rules it out.',
      controls: true,
      success: 'why-forbidden',
    },
  ],
};

const describe = (inputs: LatchInputs, result: LatchSettle): string => {
  const mode = latchMode(inputs);
  if (result.oscillating) {
    return 'Both inputs were released at the same instant. The two gates rise together, then fall together, and never settle.';
  }
  const q = result.final.q ? 1 : 0;
  const delays = delaysToSettle(result);
  const took = delays
    ? ` It took ${delays} gate delay${delays === 1 ? '' : 's'} to settle.`
    : ' Nothing had to change.';
  if (mode === 'hold') {
    return `Both inputs are low, and Q is ${q}. Nothing outside the gates is holding it there: each gate is being held by the other.${took}`;
  }
  if (mode === 'forbidden') {
    return `S and R are both high, so both gates are forced low. Q and Q̅ are both 0.${took}`;
  }
  return `${mode === 'set' ? 'S' : 'R'} is high, so Q is forced to ${q}.${took}`;
};

export function SrLatchLab({ startSet = false, title, prompt }: SrLatchProps = {}): ReactNode {
  const start = startSet ? SET_STATE : RESET_STATE;
  const [inputs, setInputs] = useState<LatchInputs>({ s: false, r: false });
  const [result, setResult] = useState<LatchSettle>(() => settleLatch({ s: false, r: false }, start));
  const [cursor, setCursor] = useState(() => result.steps.length - 1);
  const [wasSet, setWasSet] = useState(startSet);

  const apply = useCallback(
    (next: LatchInputs, context: AuthoredActivityContext) => {
      const settled = settleLatch(next, result.final);
      setInputs(next);
      setResult(settled);
      // Land on the settled state; stepping back through the delays is an explicit choice.
      setCursor(settled.steps.length - 1);
      if (next.s && !next.r) setWasSet(true);
      if (!next.s && !next.r && wasSet && settled.final.q && settled.stable)
        context.complete('held-a-one', 'held');
      if (settled.oscillating) context.complete('saw-the-race', 'race');
    },
    [result.final, wasSet],
  );

  const toggle = useCallback(
    (which: 's' | 'r', context: AuthoredActivityContext) =>
      apply({ ...inputs, [which]: !inputs[which] }, context),
    [apply, inputs],
  );

  const bothHigh = inputs.s && inputs.r;
  const headline = useMemo(() => describe(inputs, result), [inputs, result]);
  const last = result.steps.length - 1;

  return (
    <AuthoredActivityRuntime
      activity={LATCH_ACTIVITY}
      activityId="sr-latch"
      eyebrow="Sequential logic"
      title={title ?? 'Two gates that remember'}
      description={
        prompt ??
        'Cross two NOR gates so each one feeds the other, and the pair can hold a bit with nothing holding it but itself.'
      }
      status={
        <>
          <span>
            S <strong>{inputs.s ? 1 : 0}</strong> · R <strong>{inputs.r ? 1 : 0}</strong>
          </span>
          <span>{latchMode(inputs)}</span>
          <span data-delivered={result.stable || undefined}>
            {result.oscillating ? 'oscillating' : `Q = ${result.final.q ? 1 : 0}`}
          </span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Showing gate delay</span>
              <strong>
                {Math.min(cursor, last)} of {last}
              </strong>
            </div>
            <span>{result.oscillating ? 'never settles' : 'settled'}</span>
          </div>
          <div className="lab-activity-fields">
            <ActionButton onClick={() => setCursor(0)} disabled={last === 0}>
              Replay from the change
            </ActionButton>
            <ActionButton onClick={() => setCursor((c) => Math.min(last, c + 1))} disabled={cursor >= last}>
              Next gate delay
            </ActionButton>
          </div>
          <div className="lab-activity-fields">
            <ActionButton onClick={() => apply({ s: false, r: false }, context)} disabled={!bothHigh}>
              Release S and R together
            </ActionButton>
          </div>
          <p className="lab-note">
            Tap the S and R switches on the circuit. Releasing them one at a time is always safe; only
            releasing both at the same instant causes a race.
          </p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <LatchScene
          inputs={inputs}
          result={result}
          cursor={cursor}
          onToggle={(which) => toggle(which, context)}
          label={`NOR latch. S is ${inputs.s ? 1 : 0}, R is ${inputs.r ? 1 : 0}. ${headline}`}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default SrLatchLab;
