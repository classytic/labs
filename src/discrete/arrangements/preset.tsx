'use client';

/**
 * ArrangementsLab, arranging things in a row when some are IDENTICAL (the multiset
 * permutation the slots/selection labs don't cover). The classic MISSISSIPPI, or a
 * row of coloured beads. The derivation, made concrete: if all n were distinct
 * there'd be n! orders; but swapping two identical letters gives the SAME word, so
 * each real arrangement is counted (count of that letter)! times, divide it out:
 *
 *   n! / (n₁! · n₂! · …)        (the multinomial coefficient)
 *
 * You watch two identical tiles swap into the same row (the overcount), then the
 * formula falls out. Predict-then-check. Kernel = factorial / multinomial.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { factorial, multinomial } from '../core/combinatorics.js';
import { Stepper, IconButton } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  RevealSolution,
  useCheckpoint,
  useChallenge,
  ChallengeCard,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { AuthoredResponse } from '../../kit/authored-response.js';
import { CATEGORICAL } from '../../kit/palette.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface ArrangeItem {
  label: string;
  count: number;
  color?: string;
}
export interface ArrangementsProps {
  word?: string; // convenience: "MISSISSIPPI" → letter counts
  items?: ArrangeItem[]; // or explicit coloured groups
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const PALETTE = CATEGORICAL;

function fromWord(w: string): ArrangeItem[] {
  const order: string[] = [],
    m = new Map<string, number>();
  for (const ch of w.toUpperCase()) {
    if (!/[A-Z]/.test(ch)) continue;
    if (!m.has(ch)) order.push(ch);
    m.set(ch, (m.get(ch) ?? 0) + 1);
  }
  return order.map((l) => ({ label: l, count: m.get(l)! }));
}

export function ArrangementsLab({
  word,
  items,
  title = 'Arrange with repeats',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: ArrangementsProps): ReactNode {
  const base = useMemo(() => items ?? (word ? fromWord(word) : fromWord('MISSISSIPPI')), [items, word]);
  const [counts, setCounts] = useState<number[]>(base.map((g) => g.count));
  const [guess, setGuess] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);
  const transferQuestions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'identical-overcount',
        prompt: 'Why do repeated-item arrangements divide by each repeated group’s factorial?',
        choices: [
          { value: 'same', label: 'swapping identical copies does not create a new arrangement' },
          { value: 'smaller', label: 'identical items are physically smaller' },
          { value: 'alphabetical', label: 'the items must stay in alphabetical order' },
        ],
        answer: 'same',
        explain:
          'The all-distinct count labels copies that are actually indistinguishable, so each visible row was counted once per internal swap.',
      },
    ],
    [],
  );
  const challenge = useChallenge(transferQuestions);

  const groups = base.map((g, i) => ({
    ...g,
    count: counts[i]!,
    color: g.color ?? PALETTE[i % PALETTE.length]!,
  }));
  const live = groups.filter((g) => g.count > 0);
  const n = live.reduce((a, g) => a + g.count, 0);
  const nFact = factorial(n);
  const total = useMemo(() => (n > 0 ? multinomial(...live.map((g) => g.count)) : 1), [counts]);
  const repeats = live.filter((g) => g.count > 1);
  const tiles = live.flatMap((g) => Array.from({ length: g.count }, () => g));
  const swapGroup = repeats.slice().sort((a, b) => b.count - a.count)[0];

  const setI = (i: number, v: number): void => {
    setChecked(false);
    setGuess(null);
    setCounts((c) => c.map((x, j) => (j === i ? Math.max(0, Math.min(8, v)) : x)));
  };
  const reset = (): void => {
    setChecked(false);
    setPeeked(false);
    setGuess(null);
    setCounts(base.map((g) => g.count));
    challenge.reset();
  };
  const solved = checked && guess === total && !peeked && challenge.allCorrect;
  useCheckpoint({ solved, activity: `arrangements:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    ...Object.fromEntries(
      base.map((g, i) => [
        `count_${g.label}`,
        {
          type: 'number' as const,
          label: `# of ${g.label}`,
          min: 0,
          max: 8,
          step: 1,
          get: () => counts[i] ?? 0,
          set: (v: number) => setI(i, v),
        },
      ]),
    ),
    reveal: {
      type: 'action',
      label: 'reveal the count',
      invoke: () => {
        setPeeked(true);
        setGuess(total);
        setChecked(true);
      },
    },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const figure = (
    <div className="discrete-counting-scene">
      <div>
        <p className="lab-field-label">{n} items in a row, identical ones share a colour</p>
        <div className="discrete-token-row">
          {tiles.map((g, i) => {
            const isSwap = swapGroup && g.label === swapGroup.label;
            const swapIdx = isSwap ? tiles.filter((t, j) => j < i && t.label === g.label).length : -1;
            const flag = isSwap && swapIdx < 2;
            return (
              <span
                key={i}
                className="arrangement-tile"
                data-ringed={flag}
                style={{ '--arrangement-color': g.color } as CSSProperties}
              >
                {g.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* the overcount intuition */}
      {swapGroup && (
        <p className="lab-prompt" style={{ '--arrangement-color': swapGroup.color } as CSSProperties}>
          Swap the two ringed <b className="arrangement-emphasis">{swapGroup.label}</b>'s ⇄, it's the{' '}
          <b>same row</b>. So every arrangement is counted {swapGroup.count}! times over (once per ordering of
          the {swapGroup.count} {swapGroup.label}'s).
        </p>
      )}

      {/* derivation → formula */}
      <div className="discrete-formula-panel arrangement-formula">
        <span className="discrete-formula-label">📐 WHY THE FORMULA</span>
        <span>
          if all {n} were different: <b>{n}!</b>
          {checked ? <> = {nFact.toLocaleString()} orders</> : <> possible labelled orders</>}
        </span>
        {repeats.length > 0 && (
          <span>
            but identical copies repeat:{' '}
            <Tex tex={`\\div\\ ${repeats.map((g) => `${g.count}!`).join(' \\cdot ')}`} />{' '}
            <span className="discrete-muted">
              ({repeats.map((g) => `the ${g.count} ${g.label}'s`).join(', ')})
            </span>
          </span>
        )}
        <span className="discrete-running-product">
          <Tex
            tex={`${n}! / (${live.map((g) => `${g.count}!`).join(' \\cdot ')})${
              checked
                ? ` = ${nFact.toLocaleString().replace(/,/g, '{,}')} / ${live
                    .reduce((a, g) => a * factorial(g.count), 1)
                    .toLocaleString()
                    .replace(/,/g, '{,}')} = ${total.toLocaleString().replace(/,/g, '{,}')}`
                : ''
            }`}
          />{' '}
          {checked && <>distinct arrangements</>}
        </span>
      </div>
    </div>
  );

  const aside = (
    <>
      <Readout
        label="distinct arrangements"
        value={checked ? total.toLocaleString() : 'Commit an estimate'}
        sub={<Tex tex={`${n}! / ${live.map((g) => `${g.count}!`).join(' \\cdot ')}`} />}
      />
      <AuthoredResponse
        key={counts.join(':')}
        question={{
          id: 'arrangement-count',
          kind: 'numeric',
          prompt: 'How many distinct rows are possible?',
          answer: total,
          tolerance: 0,
          explain: `Correct: ${total.toLocaleString()} distinct arrangements.`,
          tryAgain: 'Account for every swap among identical copies.',
        }}
        onRespond={(result) => {
          setGuess(typeof result.response === 'number' ? result.response : null);
          setChecked(true);
        }}
      />
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      {base.map((g, i) => (
        <Field key={g.label} label={`# ${g.label}`}>
          <Stepper value={counts[i] ?? 0} onChange={(v) => setI(i, v)} min={0} max={8} />
        </Field>
      ))}
    </div>
  );

  const footer = (
    <>
      <RevealSolution
        available={!solved}
        buttonLabel="Show the count"
        solution={
          <>
            <Tex tex={`${n}! / (${live.map((g) => `${g.count}!`).join(' \\cdot ')}) =`} />{' '}
            <b>{total.toLocaleString()}</b> distinct arrangements.
          </>
        }
        onReveal={() => {
          setPeeked(true);
          setGuess(total);
          setChecked(true);
        }}
      />
      <ChallengeCard questions={transferQuestions} state={challenge} title="Explain the overcount" />
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="discrete-arrangements-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Repeated arrangements"
          title={title}
          description={
            prompt ??
            'Arrange visible groups, predict the distinct count, and identify why identical copies create an overcount.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{checked ? `${total.toLocaleString()} distinct` : 'Predict first'}</strong>
        <span>{n} items</span>
        <span>{live.length} groups</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Repeated-item arrangement model">{figure}</Activity.Canvas>
        <Activity.Inspector label="Group counts and estimate">
          <div className="lab-activity-fields">
            {aside}
            {controls}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {checked
            ? `${n}! labelled orders collapse to ${total.toLocaleString()} visible arrangements after identical-copy swaps are removed.`
            : 'The ringed copies can swap without changing the visible row, revealing the source of the factorial divisor.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Arrangement explanation and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        {checked
          ? `The distinct arrangement count is ${total}. Your estimate was ${guess ?? 'blank'}.`
          : `There are ${n} items across ${live.length} repeated groups. Commit an estimate before revealing the count.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset arrangements" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{checked ? 'Estimate checked' : 'Awaiting prediction'}</strong>
          <span>
            {n} items · {live.length} groups
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
