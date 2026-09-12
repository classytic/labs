'use client';

/**
 * LatchVsFlipFlopLab — the same D, the same clock, and two different answers.
 *
 * This is the timing-diagram question every first digital logic exam asks, turned into something
 * the learner can push on. The default waveform contains one pulse that rises and falls inside a
 * clock-high window without touching an edge. The prediction asks which circuit notices it, and
 * the Q rows stay hidden until that answer is committed, so the shading that appears afterwards is
 * a result rather than a hint.
 *
 * The challenge is the part that turns recognition into understanding: draw a D that makes the two
 * circuits agree everywhere. The only way to do it is to change D only while the clock is low,
 * which is the rule an engineer actually designs by. Finding it by hand is worth more than being
 * told it.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActionButton } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { TimingScene } from '../../../logic/TimingScene.js';
import {
  DEFAULT_D,
  DEFAULT_LENGTH,
  DEFAULT_PERIOD,
  clockWave,
  dFlipFlop,
  dLatch,
  disagreement,
  setupViolations,
  waveFrom,
  type Wave,
} from '../../../logic/timing.js';

export interface LatchVsFlipFlopProps {
  /** Starting D waveform, one entry per time slot (24 slots, clock period 8). */
  d?: boolean[];
  title?: string;
  prompt?: string;
}

const PRESETS: { label: string; d: () => Wave }[] = [
  { label: 'The exam waveform', d: () => [...DEFAULT_D] },
  { label: 'A pulse between edges', d: () => waveFrom(DEFAULT_LENGTH, [[13, 14]]) },
  { label: 'D moves on an edge', d: () => waveFrom(DEFAULT_LENGTH, [[12, 17]]) },
  { label: 'Clear', d: () => waveFrom(DEFAULT_LENGTH, []) },
];

const TIMING_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Find out when each circuit reads D',
  objectives: [
    'Draw Q for a D latch and for a positive-edge-triggered D flip-flop from the same D and clock',
    'Explain why a pulse inside a clock-high window reaches one output and not the other',
    'Design a D waveform for which the two circuits agree everywhere',
    'Explain why registers are built from flip-flops rather than latches',
  ],
  success: [
    {
      id: 'predict-pulse',
      source: 'answer',
      key: 'which-notices',
      pendingLabel: 'Predict which circuit notices the short pulse.',
    },
    {
      id: 'drew-d',
      source: 'metric',
      key: 'edited',
      pendingLabel: 'Change D in a few places and watch both outputs.',
    },
    {
      id: 'made-them-agree',
      source: 'metric',
      key: 'agree',
      pendingLabel: 'Draw a D with at least two changes that both circuits read the same way.',
    },
    {
      id: 'why-flip-flops',
      source: 'answer',
      key: 'why-registers',
      pendingLabel: 'Say why a processor’s registers use flip-flops.',
    },
  ],
  questions: [
    {
      id: 'which-notices',
      prompt:
        'D goes high at time 13 and back low at time 15. The clock rose at 12 and stays high until 16. Which output goes high during the pulse?',
      choices: [
        {
          value: 'both',
          label: 'Both, because D was high',
          feedback: 'One of them only reads D at a single instant, and that instant was at 12.',
        },
        { value: 'latch', label: 'Only the D latch' },
        {
          value: 'flip-flop',
          label: 'Only the flip-flop',
          feedback:
            'The flip-flop read D at 12, when it was still low, and does not look again until the next edge.',
        },
        {
          value: 'neither',
          label: 'Neither, because the pulse is too short',
          feedback: 'Length is not what decides it. Where the pulse sits relative to the edge is.',
        },
      ],
      answer: 'latch',
      explain:
        'A latch is transparent for the whole time the clock is high, so anything D does in that window passes straight to Q. A flip-flop reads D only at the rising edge. At 12, D was low, so the flip-flop stores a 0 and ignores the pulse entirely.',
    },
    {
      id: 'why-registers',
      prompt:
        'Why are the registers inside a processor built from edge-triggered flip-flops rather than latches?',
      choices: [
        {
          value: 'cheaper',
          label: 'Flip-flops use fewer transistors',
          feedback: 'The reverse: a flip-flop is usually built from two latches.',
        },
        {
          value: 'instant',
          label:
            'Their outputs change only at a known instant, so a glitch during the clock-high time cannot pass through',
        },
        {
          value: 'faster',
          label: 'Flip-flops respond to D faster',
          feedback: 'A latch responds sooner, because it is already open. That is exactly the problem.',
        },
      ],
      answer: 'instant',
      explain:
        'In a processor, one register feeds logic that feeds another register. With latches, a glitch can race through several stages in a single clock-high window. Flip-flops change only at the edge, so every stage moves one step per clock and the whole circuit can be timed against that one instant.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Which one notices?',
      lead: 'Same D, same clock, two circuits. The outputs are hidden until you commit.',
      success: 'predict-pulse',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Draw your own D',
      lead: 'Tap slots on the D row to raise or lower it. Put pulses in different places.',
      reveal: ['outputs'],
      controls: true,
      success: 'drew-d',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'The shaded slots',
      lead: 'Red columns are where the two outputs disagree. Look at where D is in each of them.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Make them agree',
      lead: 'Draw a D with at least two changes that both circuits turn into the same Q.',
      controls: true,
      success: 'made-them-agree',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Why processors choose edges',
      lead: 'You found the rule for making a latch safe. Now say why designers avoid needing it.',
      controls: true,
      success: 'why-flip-flops',
    },
  ],
};

const countChanges = (wave: Wave): number => wave.filter((level, t) => t > 0 && level !== wave[t - 1]).length;

export function LatchVsFlipFlopLab({ d: authored, title, prompt }: LatchVsFlipFlopProps = {}): ReactNode {
  const clock = useMemo(() => clockWave(DEFAULT_LENGTH, DEFAULT_PERIOD), []);
  const [d, setD] = useState<Wave>(() =>
    authored && authored.length
      ? waveFrom(DEFAULT_LENGTH, []).map((_, t) => authored[t] ?? false)
      : [...DEFAULT_D],
  );
  const [edits, setEdits] = useState(0);

  const latch = useMemo(() => dLatch(clock, d), [clock, d]);
  const flipFlop = useMemo(() => dFlipFlop(clock, d), [clock, d]);
  const disagree = useMemo(() => disagreement(latch, flipFlop), [latch, flipFlop]);
  const violations = useMemo(() => setupViolations(clock, d), [clock, d]);

  const settle = useCallback(
    (next: Wave, context: AuthoredActivityContext, edited: boolean) => {
      setD(next);
      const count = edited ? edits + 1 : edits;
      if (edited) setEdits(count);
      if (count >= 3) context.complete('drew-d', 'edited');
      const agree = disagreement(dLatch(clock, next), dFlipFlop(clock, next)).length === 0;
      if (agree && countChanges(next) >= 2 && setupViolations(clock, next).length === 0) {
        context.complete('made-them-agree', 'agree');
      }
    },
    [clock, edits],
  );

  const headline = disagree.length
    ? `The two outputs disagree in ${disagree.length} slot${disagree.length === 1 ? '' : 's'}. In every one, D changed while the clock was high and no edge was there to see it.`
    : countChanges(d) >= 2
      ? 'The two outputs agree everywhere. Every change in D happened while the clock was low, so both circuits saw the same value.'
      : 'Draw some changes into D to compare the two circuits.';

  return (
    <AuthoredActivityRuntime
      activity={TIMING_ACTIVITY}
      activityId="latch-vs-flip-flop"
      eyebrow="Sequential logic"
      title={title ?? 'When does it look at D?'}
      description={
        prompt ??
        'A latch watches D the whole time the clock is high. A flip-flop looks for one instant. Same inputs, different outputs, and the difference is always in the same places.'
      }
      status={(context) => (
        <>
          <span>
            <strong>{context.sequence.shows('outputs') ? disagree.length : '?'}</strong> slots disagree
          </span>
          <span>{countChanges(d)} changes in D</span>
          {violations.length > 0 && <span>{violations.length} setup warning</span>}
        </>
      )}
      inspector={(context) => (
        <>
          <div className="lab-activity-fields">
            {PRESETS.map((preset) => (
              <ActionButton key={preset.label} onClick={() => settle(preset.d(), context, false)}>
                {preset.label}
              </ActionButton>
            ))}
          </div>
          <p className="lab-note">
            The clock rises at 4, 12 and 20. Dots on the D row mark what the flip-flop reads at each edge. A
            change exactly on an edge is flagged, because real hardware cannot promise which value it
            captures.
          </p>
          <LiveRegion>
            {context.sequence.shows('outputs') ? headline : 'Predict first. The outputs are hidden.'}
          </LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <TimingScene
          clock={clock}
          d={d}
          latch={latch}
          flipFlop={flipFlop}
          disagree={disagree}
          violations={violations}
          revealed={context.sequence.shows('outputs')}
          onToggleD={(slot) =>
            settle(
              d.map((level, t) => (t === slot ? !level : level)),
              context,
              true,
            )
          }
          label={`Timing diagram over ${DEFAULT_LENGTH} time slots. ${context.sequence.shows('outputs') ? headline : 'Outputs hidden until you predict.'}`}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default LatchVsFlipFlopLab;
