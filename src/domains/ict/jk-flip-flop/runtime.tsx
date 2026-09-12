'use client';

/**
 * JkFlipFlopLab — the forbidden input, put to work.
 *
 * Students meet the JK flip-flop as a four-row table to memorise. It reads better as the answer to
 * a question they have already asked: the SR latch could not be trusted with both inputs high, so
 * what SHOULD a flip-flop do then? Toggle. That single new row is what turns a memory cell into a
 * counter stage, and tying J to K gives the T flip-flop that every counter is built from.
 *
 * The diagram writes what the flip-flop did at each edge (set, hold, reset, toggle) under the
 * waves, so the characteristic table is read off the timing diagram instead of being learned
 * beside it. The transfer question is the excitation table, asked backwards the way a designer
 * uses it: to make Q go from 0 to 1, K does not matter. That "does not matter" is the don't-care
 * that makes JK counter designs smaller than D ones.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActionButton, Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { WaveScene } from '../../../logic/WaveScene.js';
import { clockWave, jkActions, jkFlipFlop, risingEdges, waveFrom, type Wave } from '../../../logic/timing.js';

export interface JkFlipFlopProps {
  /** Start with K tied to J, which makes it a T flip-flop. */
  tied?: boolean;
  title?: string;
  prompt?: string;
}

const LENGTH = 32;
const PERIOD = 8;

/** Edges at 4, 12, 20, 28: set, hold, reset, toggle, so every row of the table appears once. */
const DEFAULT_J = (): Wave =>
  waveFrom(LENGTH, [
    [2, 6],
    [26, 30],
  ]);
const DEFAULT_K = (): Wave =>
  waveFrom(LENGTH, [
    [18, 22],
    [26, 30],
  ]);

const JK_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Find out what a flip-flop should do with both inputs high',
  objectives: [
    'Read set, reset, hold and toggle off a JK timing diagram',
    'Explain how the JK flip-flop gives the SR latch’s forbidden input a use',
    'Make a flip-flop change state on every clock edge, and recognise it as a divide-by-two',
    'Use the excitation table to choose J and K for a required change',
  ],
  success: [
    {
      id: 'predict-toggle',
      source: 'answer',
      key: 'both-high',
      pendingLabel: 'Predict what Q does with J and K both high.',
    },
    { id: 'drew-inputs', source: 'metric', key: 'edited', pendingLabel: 'Change J and K in a few places.' },
    {
      id: 'every-edge',
      source: 'metric',
      key: 'every-edge',
      pendingLabel: 'Make Q change at every rising edge.',
    },
    {
      id: 'excitation',
      source: 'answer',
      key: 'zero-to-one',
      pendingLabel: 'Choose the inputs that take Q from 0 to 1.',
    },
  ],
  questions: [
    {
      id: 'both-high',
      prompt:
        'At a rising edge, J and K are both 1 and Q is 0. An SR latch in this position would misbehave. What does a JK flip-flop do?',
      choices: [
        {
          value: 'hold',
          label: 'Q stays 0',
          feedback: 'That is what it does with both inputs LOW.',
        },
        { value: 'toggle', label: 'Q becomes 1, because both high means toggle' },
        {
          value: 'undefined',
          label: 'Nothing can be predicted, as with the latch',
          feedback: 'The JK was designed precisely so this row is predictable.',
        },
      ],
      answer: 'toggle',
      explain:
        'The JK flip-flop gives the old forbidden input a job: both inputs high makes Q flip to the opposite value at the edge. Because it only happens at an edge, there is no race, just one clean change per clock.',
    },
    {
      id: 'zero-to-one',
      prompt: 'Q is 0 and must be 1 after the next rising edge. Which inputs will do it?',
      choices: [
        {
          value: 'j1k0',
          label: 'Only J = 1, K = 0',
          feedback: 'That works, but it is not the only choice. Try J = 1, K = 1 on the diagram.',
        },
        { value: 'j1kx', label: 'J = 1, and K can be either value' },
        { value: 'j0k1', label: 'J = 0, K = 1', feedback: 'That resets Q to 0.' },
      ],
      answer: 'j1kx',
      explain:
        'J = 1 with K = 0 sets Q to 1, and J = 1 with K = 1 toggles it from 0 to 1. Either way Q ends at 1, so K does not matter. Designers write that as K = X, a don’t-care, and it is why counters built from JK flip-flops need fewer gates.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Both inputs high',
      lead: 'The SR latch could not be trusted with both inputs high. A JK flip-flop can.',
      success: 'predict-toggle',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Draw J and K',
      lead: 'Tap slots on the J and K rows. The words under the diagram say what happened at each edge.',
      reveal: ['outputs'],
      controls: true,
      success: 'drew-inputs',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Four actions, one table',
      lead: 'Set, hold, reset and toggle are the four rows of the JK table. Find each one on the diagram.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Change at every edge',
      lead: 'Make Q change at every rising edge. Then compare Q with the clock.',
      controls: true,
      success: 'every-edge',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Working backwards',
      lead: 'Designers use the table in reverse: from the change they need to the inputs that cause it.',
      controls: true,
      success: 'excitation',
    },
  ],
};

export function JkFlipFlopLab({
  tied: authoredTied = false,
  title,
  prompt,
}: JkFlipFlopProps = {}): ReactNode {
  const clock = useMemo(() => clockWave(LENGTH, PERIOD), []);
  const edges = useMemo(() => risingEdges(clock), [clock]);
  const [tied, setTied] = useState(authoredTied);
  const [j, setJ] = useState<Wave>(DEFAULT_J);
  const [k, setK] = useState<Wave>(DEFAULT_K);
  const [edits, setEdits] = useState(0);

  const kUsed = tied ? j : k;
  const q = useMemo(() => jkFlipFlop(clock, j, kUsed), [clock, j, kUsed]);
  const actions = useMemo(() => jkActions(clock, j, kUsed), [clock, j, kUsed]);
  const changedAtEvery = edges.every((t) => q[t] !== (q[t - 1] ?? false));

  const judge = useCallback(
    (nextJ: Wave, nextK: Wave, nextTied: boolean, count: number, context: AuthoredActivityContext) => {
      if (count >= 3) context.complete('drew-inputs', 'edited');
      const out = jkFlipFlop(clock, nextJ, nextTied ? nextJ : nextK);
      if (edges.every((t) => out[t] !== (out[t - 1] ?? false))) context.complete('every-edge', 'every-edge');
    },
    [clock, edges],
  );

  const toggle = useCallback(
    (row: string, slot: number, context: AuthoredActivityContext) => {
      const flip = (wave: Wave) => wave.map((level, t) => (t === slot ? !level : level));
      const nextJ = row === 'j' ? flip(j) : j;
      const nextK = row === 'k' ? flip(k) : k;
      setJ(nextJ);
      setK(nextK);
      setEdits(edits + 1);
      judge(nextJ, nextK, tied, edits + 1, context);
    },
    [edits, j, judge, k, tied],
  );

  const headline = changedAtEvery
    ? 'Q changes at every rising edge, so it runs at exactly half the clock’s frequency. That is one stage of a counter.'
    : `At the edges: ${actions.map((item) => `${item.t} ${item.action}`).join(', ')}.`;

  return (
    <AuthoredActivityRuntime
      activity={JK_ACTIVITY}
      activityId="jk-flip-flop"
      eyebrow="Sequential logic"
      title={title ?? 'What to do with both inputs high'}
      description={
        prompt ??
        'J sets, K resets, both low holds, and both high toggles. The last row is the one an SR latch could never be trusted with.'
      }
      status={(context) => (
        <>
          <span>{tied ? 'T flip-flop (K tied to J)' : 'JK flip-flop'}</span>
          <span>
            {context.sequence.shows('outputs')
              ? `${actions.filter((a) => a.action === 'toggle').length} toggles`
              : '? toggles'}
          </span>
        </>
      )}
      inspector={(context) => (
        <>
          <div className="lab-activity-fields">
            <Chip
              selected={tied}
              onClick={() => {
                setTied(!tied);
                judge(j, k, !tied, edits, context);
              }}
            >
              Tie K to J (T flip-flop): {tied ? 'on' : 'off'}
            </Chip>
            <ActionButton
              onClick={() => {
                setJ(DEFAULT_J());
                setK(DEFAULT_K());
              }}
            >
              Start again
            </ActionButton>
          </div>
          <p className="lab-note">
            The clock rises at 4, 12, 20 and 28. Only the levels of J and K at those instants matter.
          </p>
          <LiveRegion>
            {context.sequence.shows('outputs') ? headline : 'Predict first. Q is hidden.'}
          </LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => {
        const shown = context.sequence.shows('outputs');
        return (
          <WaveScene
            rows={[
              { key: 'clock', label: 'Clock', wave: clock, role: 'clock' },
              {
                key: 'j',
                label: tied ? 'T' : 'J',
                rule: tied ? 'toggle while high' : 'sets',
                wave: j,
                role: 'input',
                editable: true,
              },
              ...(tied
                ? []
                : [
                    { key: 'k', label: 'K', rule: 'resets', wave: k, role: 'input' as const, editable: true },
                  ]),
              { key: 'q', label: 'Q', wave: q, role: 'output' as const, hidden: !shown },
            ]}
            edges={edges}
            sampled={tied ? ['j'] : ['j', 'k']}
            marks={
              shown
                ? actions.map((item) => ({
                    t: item.t,
                    text: item.action,
                    tone:
                      item.action === 'toggle'
                        ? ('hot' as const)
                        : item.action === 'hold'
                          ? ('soft' as const)
                          : ('ink' as const),
                  }))
                : []
            }
            emphasis={shown ? actions.filter((item) => item.action === 'toggle').map((item) => item.t) : []}
            onToggle={(row, slot) => toggle(row, slot, context)}
            label={`${tied ? 'T' : 'JK'} flip-flop timing diagram. ${shown ? headline : 'Q hidden until you predict.'}`}
          />
        );
      }}
    </AuthoredActivityRuntime>
  );
}

export default JkFlipFlopLab;
