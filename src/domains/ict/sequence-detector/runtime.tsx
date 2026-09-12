'use client';

/**
 * SequenceDetectorLab — design a state machine by choosing what it should find.
 *
 * The state diagram is generated from the learner's pattern, so changing four bits produces a new
 * machine with new arrows, and the learner can feed it input and watch it work. That is the "I
 * built this" moment: a student sets their own pattern (their roll number's last digits in binary,
 * say) and has a working detector for it in seconds.
 *
 * The prediction targets overlap, because it is the exam's favourite trap. The detector for 101 has
 * just fired; the next two bits are 0 and 1. A student who thinks of a match as "used up" says it
 * cannot fire again so soon. Feeding the bits shows the last 1 of the first match starting the
 * second, and the overlap switch then makes the other convention concrete on the tape.
 *
 * The transfer question points at something they have already met: a network card finds the start
 * of every Ethernet frame with a detector like this: the frame opens with alternating 1s and 0s,
 * and the first 11 (the end of the start frame delimiter) says the frame begins on the next bit.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActionButton, Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredQuestion } from '../../../kit/activity-authoring.js';
import { DetectorScene } from '../../../logic/DetectorScene.js';
import {
  bitsToFireAgain,
  borderOf,
  buildDetector,
  partialFallbacks,
  runDetector,
  type MachineKind,
} from '../../../logic/detector.js';

export interface SequenceDetectorProps {
  /** The bits to detect, 2 to 4 of them. */
  pattern?: string;
  overlap?: boolean;
  /** Moore keeps the output in a state; Mealy puts it on the arrow. */
  machine?: 'moore' | 'mealy';
  /** Bits already fed in when the lab opens. */
  input?: string;
  title?: string;
  prompt?: string;
}

/**
 * The prediction is generated from the pattern the lesson opens with, because a fixed question
 * about 101 beside a figure of some other machine asks about one thing while showing another. The
 * form chosen is correct for every pattern: after a match, how many more bits before it can fire
 * again? The answer is the pattern length minus its longest border (the part of the end that is
 * also the start), and for patterns with no border the honest answer is "all of them".
 */
function fireAgainQuestion(pattern: string, overlap: boolean): AuthoredQuestion {
  const n = pattern.length;
  const border = borderOf(pattern);
  const need = bitsToFireAgain(pattern, overlap);
  // Always exactly three short numbers. The renderer lays short answers out side by side, and a
  // fourth option left an orphan on a second row; a long label made the cards uneven.
  const distinct = [...new Set([1, need, n])];
  const options = (distinct.length < 3 ? [...distinct, n + 1] : distinct).sort((a, b) => a - b);
  return {
    id: 'fires-again',
    prompt: `The detector for ${pattern} has just output a 1. What is the fewest further bits it needs before it can output a 1 again?`,
    choices: options.map((value) => ({
      value: String(value),
      label: `${value}`,
      ...(value === need
        ? {}
        : {
            feedback:
              value === n
                ? `That would be true if nothing carried over. Look at how ${pattern} ends and how it begins.`
                : value < need
                  ? `Too few. The last ${n} bits must spell ${pattern}, and that many new bits cannot make it.`
                  : 'More than it needs. Some of the bits it has just seen can be used again.',
          }),
    })),
    answer: String(need),
    explain: !overlap
      ? `This detector does not allow overlapping matches, so after a match it starts again from nothing and needs all ${n} bits.`
      : border
        ? `The end of ${pattern} is ${border}, and ${pattern} also begins with ${border}. An overlapping detector keeps those ${border.length} bit${border.length === 1 ? '' : 's'}, so it needs only ${need} more.`
        : `No part of the end of ${pattern} is also its beginning, so nothing carries over from one match to the next. It needs all ${n} bits again.`,
  };
}

const DETECTOR_ACTIVITY_BASE: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Design a machine that finds a pattern in a stream of bits',
  objectives: [
    'Build the states of a sequence detector from the pattern it detects',
    'Explain where a wrong bit sends the machine, and why it is not always the start',
    'Distinguish overlapping from non-overlapping detection on the same input',
    'Design and test a detector for a pattern of your own',
  ],
  success: [
    {
      id: 'predict-overlap',
      source: 'answer',
      key: 'fires-again',
      pendingLabel: 'Predict how soon the detector can fire again.',
    },
    {
      id: 'made-it-fire',
      source: 'metric',
      key: 'fired',
      pendingLabel: 'Feed bits until the detector fires twice.',
    },
    {
      id: 'own-pattern',
      source: 'metric',
      key: 'own',
      pendingLabel: 'Change the pattern and make your new detector fire.',
    },
    {
      id: 'where-used',
      source: 'answer',
      key: 'ethernet',
      pendingLabel: 'Say where a detector like this runs inside a computer.',
    },
    {
      id: 'mealy-why',
      source: 'answer',
      key: 'mealy-states',
      pendingLabel: 'Switch to Mealy and say why it needs one state fewer.',
    },
  ],
  // The first question, `fires-again`, is generated per pattern by `fireAgainQuestion`.
  questions: [
    {
      id: 'mealy-states',
      prompt: 'Switch the machine to Mealy. Why does it need one state fewer than the Moore version?',
      choices: [
        {
          value: 'arrow',
          label:
            'Its output is on the arrow that completes the pattern, so it needs no separate "found it" state',
        },
        {
          value: 'shorter',
          label: 'It only detects shorter patterns',
          feedback: 'Both find exactly the same places on the tape. Compare their green cells.',
        },
        {
          value: 'overlap',
          label: 'It cannot detect overlapping matches',
          feedback: 'Turn overlap on and off in both modes. Mealy handles both.',
        },
      ],
      answer: 'arrow',
      explain:
        'A Moore machine keeps its output in a state, so it needs a state that means "just found it". A Mealy machine attaches the output to the transition, written as input/output such as 1/1, so the arrow that completes the pattern carries the 1 and can land straight back where the next match starts. It also answers on the same clock as the final bit, one step sooner.',
    },
    {
      id: 'ethernet',
      prompt: 'Where does a detector like this run inside an ordinary computer?',
      choices: [
        {
          value: 'nic',
          label: 'In the network card, finding where each Ethernet frame starts in the incoming bits',
        },
        {
          value: 'cpu',
          label: 'Only in the processor, when a program searches text',
          feedback:
            'Software does search text this way, but there is a hardware one much closer to the wire.',
        },
        {
          value: 'nowhere',
          label: 'Nowhere, it is a classroom exercise',
          feedback: 'Every network card you have used runs one on every frame it receives.',
        },
      ],
      answer: 'nic',
      explain:
        'Bits arrive on a cable with no gaps to mark where a frame begins. Every Ethernet frame opens with a long run of alternating 1s and 0s, and the first 11 marks the end of that run. A detector watching for that pair tells the card the frame itself starts on the very next bit.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'How soon can it fire again?',
      lead: 'The detector has just found its pattern. The highlight shows where it is now.',
      success: 'predict-overlap',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Feed it',
      lead: 'Feed 0s and 1s and follow the highlighted arrow. Make it fire twice.',
      controls: true,
      success: 'made-it-fire',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Where a wrong bit lands, and a machine with one state fewer',
      lead: 'Short arcs underneath keep part of what was seen. Then switch to Mealy and compare the two diagrams.',
      controls: true,
      success: 'mealy-why',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Your own pattern',
      lead: 'Change the pattern. The machine redraws itself. Feed it until it finds your pattern.',
      controls: true,
      success: 'own-pattern',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Where this runs',
      lead: 'You have designed one. There is one in every computer you have used.',
      controls: true,
      success: 'where-used',
    },
  ],
};

const clampPattern = (pattern: string): string => {
  const bits = pattern.replace(/[^01]/g, '').slice(0, 4);
  return bits.length >= 2 ? bits : '101';
};

export function SequenceDetectorLab({
  pattern: authoredPattern = '101',
  overlap: authoredOverlap = true,
  machine: authoredKind = 'moore',
  input: authoredInput,
  title,
  prompt,
}: SequenceDetectorProps = {}): ReactNode {
  const initialPattern = clampPattern(authoredPattern);
  const [pattern, setPattern] = useState(initialPattern);
  const [overlap, setOverlap] = useState(authoredOverlap);
  const [kind, setKind] = useState<MachineKind>(authoredKind);
  // With no authored input, open on exactly one match, so the figure shows the moment the
  // prediction asks about: the machine has just found its pattern.
  const [input, setInput] = useState((authoredInput ?? initialPattern).replace(/[^01]/g, ''));
  const activity = useMemo<AuthoredActivity>(
    () => ({
      ...DETECTOR_ACTIVITY_BASE,
      questions: [
        fireAgainQuestion(initialPattern, authoredOverlap),
        ...(DETECTOR_ACTIVITY_BASE.questions ?? []),
      ],
    }),
    [initialPattern, authoredOverlap],
  );

  const machine = useMemo(() => buildDetector(pattern, overlap, kind), [pattern, overlap, kind]);
  const run = useMemo(() => runDetector(machine, input), [machine, input]);
  const fallbacks = useMemo(() => partialFallbacks(machine), [machine]);

  const check = useCallback(
    (nextPattern: string, nextOverlap: boolean, nextInput: string, context: AuthoredActivityContext) => {
      const result = runDetector(buildDetector(nextPattern, nextOverlap, kind), nextInput);
      if (result.detections.length >= 2) context.complete('made-it-fire', 'fired');
      if (nextPattern !== initialPattern && result.detections.length >= 1)
        context.complete('own-pattern', 'own');
    },
    [initialPattern, kind],
  );

  const feed = useCallback(
    (bit: '0' | '1', context: AuthoredActivityContext) => {
      const next = input + bit;
      setInput(next);
      check(pattern, overlap, next, context);
    },
    [check, input, overlap, pattern],
  );

  const flipBit = useCallback(
    (index: number, context: AuthoredActivityContext) => {
      const next = pattern
        .split('')
        .map((bit, i) => (i === index ? (bit === '1' ? '0' : '1') : bit))
        .join('');
      setPattern(next);
      // A new machine starts reading from scratch; old input was fed to a different machine.
      setInput('');
      check(next, overlap, '', context);
    },
    [check, overlap, pattern],
  );

  const resize = useCallback(
    (length: number, context: AuthoredActivityContext) => {
      const next = (pattern + '0110').slice(0, length);
      setPattern(next);
      setInput('');
      check(next, overlap, '', context);
    },
    [check, overlap, pattern],
  );

  const state = machine.states[run.path[run.path.length - 1] ?? 0]!;
  // Mealy never sits in an output state, so 'just found it' is read from the last detection.
  const justFound = input.length > 0 && run.detections.at(-1) === input.length - 1;
  const headline = justFound
    ? kind === 'mealy'
      ? `Found ${pattern}. The arrow that completed it carried the 1, so the machine is already back where the next match can start.`
      : `Found ${pattern}. The last ${pattern.length} bits were the pattern, so the machine is in its output state.`
    : state.matched
      ? `The last ${state.matched.length} bit${state.matched.length === 1 ? '' : 's'} (${state.matched}) could still be the start of ${pattern}.`
      : `Nothing seen so far can start ${pattern}, so the machine is waiting at the start.`;

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="sequence-detector"
      eyebrow="State machines"
      title={title ?? 'A machine that finds a pattern'}
      description={
        prompt ??
        'Each state remembers how much of the pattern the latest bits match. Choose the pattern and the machine draws itself.'
      }
      status={
        <>
          <span>
            looking for <strong>{pattern}</strong>
          </span>
          <span>{overlap ? 'overlapping' : 'non-overlapping'}</span>
          <span data-delivered={run.detections.length > 0 || undefined}>found {run.detections.length}</span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Pattern</span>
              <strong>{pattern}</strong>
            </div>
            <span>tap a bit to flip it</span>
          </div>
          <div className="lab-activity-fields">
            {pattern.split('').map((bit, index) => (
              <Chip key={index} selected={bit === '1'} onClick={() => flipBit(index, context)}>
                {bit}
              </Chip>
            ))}
            {[2, 3, 4].map((length) => (
              <Chip
                key={`len-${length}`}
                selected={pattern.length === length}
                onClick={() => resize(length, context)}
              >
                {length} bits
              </Chip>
            ))}
          </div>
          <div className="lab-activity-fields">
            <ActionButton onClick={() => feed('0', context)}>Feed 0</ActionButton>
            <ActionButton onClick={() => feed('1', context)}>Feed 1</ActionButton>
            <ActionButton onClick={() => setInput('')} disabled={!input}>
              Clear input
            </ActionButton>
          </div>
          <div className="lab-activity-fields">
            <Chip
              selected={overlap}
              onClick={() => {
                setOverlap(!overlap);
                check(pattern, !overlap, input, context);
              }}
            >
              Matches may overlap: {overlap ? 'yes' : 'no'}
            </Chip>
            <Chip selected={kind === 'mealy'} onClick={() => setKind(kind === 'mealy' ? 'moore' : 'mealy')}>
              {kind === 'mealy' ? 'Mealy: output on the arrow' : 'Moore: output in the state'}
            </Chip>
          </div>
          <p className="lab-note">
            {fallbacks.length
              ? `${fallbacks.length} arc${fallbacks.length === 1 ? '' : 's'} underneath land${fallbacks.length === 1 ? 's' : ''} somewhere other than the start. Those are the ones a hand-drawn design usually gets wrong.`
              : 'Every broken match here goes back to the start, because no part of the pattern repeats at its own beginning.'}
          </p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      <DetectorScene
        machine={machine}
        input={input}
        path={run.path}
        detections={run.detections}
        label={`State diagram for a detector of ${pattern}. ${headline}`}
      />
    </AuthoredActivityRuntime>
  );
}

export default SequenceDetectorLab;
