'use client';

/**
 * SelectionLab, "draw from the bag": counting (and probability) when you SELECT a
 * handful from groups, the pattern behind colored-ball urns and card hands. Pick how
 * many of each colour you want in the draw; the lab counts the favourable selections
 * as a product of per-group choices and divides by the total selections:
 *
 *   ways = ∏ C(groupᵢ, wantᵢ)            P = ways / C(N, k)
 *
 * One model spans urn problems (5 red 3 blue, draw 3 → P(2 red 1 blue)) and card
 * hands (13 hearts of 52, draw 5 → P(2 hearts)). Concrete: the bag is drawn as real
 * balls. Predict the count, then check. Kernel = nCr (the combination is the engine).
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { nCr } from '../core/combinatorics.js';
import { Chip, Stepper, IconButton } from '../../kit/controls.js';
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

export interface SelectionGroup {
  label: string;
  count: number;
  color?: string;
}
export type SelectionMode = 'count' | 'probability';
export interface SelectionProps {
  groups?: SelectionGroup[];
  draw?: number;
  want?: number[]; // initial wanted-per-group (parallel to groups)
  mode?: SelectionMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const PALETTE = CATEGORICAL;
const NAMED: Record<string, string> = {
  red: '#e03131',
  blue: '#1c7ed6',
  green: '#2f9e44',
  yellow: '#f59f00',
  purple: '#9c36b5',
  teal: '#0ca678',
  black: '#343a40',
  orange: '#e8590c',
};
const colorOf = (g: SelectionGroup, i: number): string =>
  g.color ?? NAMED[g.label.toLowerCase()] ?? PALETTE[i % PALETTE.length]!;
const frac = (w: number): string => {
  for (let d = 2; d <= 200; d++) {
    const x = w * d;
    if (Math.abs(x - Math.round(x)) < 1e-9) return `${Math.round(x)}/${d}`;
  }
  return w.toFixed(4);
};

export function SelectionLab({
  groups = [
    { label: 'red', count: 5 },
    { label: 'blue', count: 3 },
    { label: 'green', count: 2 },
  ],
  draw = 3,
  want,
  mode: mode0 = 'probability',
  title = 'Draw from the bag',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: SelectionProps): ReactNode {
  const N = useMemo(() => groups.reduce((a, g) => a + g.count, 0), [groups]);
  const initialPick = useMemo(
    () => want ?? groups.map((_, i) => (i === 0 ? Math.min(2, groups[0]!.count) : i === 1 ? 1 : 0)),
    [want, groups],
  );
  const [k, setK] = useState(draw);
  const [pick, setPick] = useState<number[]>(initialPick);
  const [mode, setMode] = useState<SelectionMode>(mode0);
  const [guess, setGuess] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);
  const transferQuestions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'selection-denominator',
        prompt: 'For an unordered draw of k objects from N, what belongs in the probability denominator?',
        choices: [
          { value: 'ncr', label: 'all C(N, k) possible selections' },
          { value: 'n', label: 'only the N objects in the bag' },
          { value: 'favourable', label: 'only the favourable selections' },
        ],
        answer: 'ncr',
        explain:
          'Every unordered k-object selection is one equally likely outcome, so the whole sample space has C(N, k) outcomes.',
      },
    ],
    [],
  );
  const challenge = useChallenge(transferQuestions);

  const sumPick = pick.reduce((a, b) => a + b, 0);
  const valid = sumPick === k && pick.every((w, i) => w <= groups[i]!.count && w >= 0);
  const ways = useMemo(
    () => (valid ? pick.reduce((a, w, i) => a * nCr(groups[i]!.count, w), 1) : 0),
    [pick, groups, valid],
  );
  const total = useMemo(() => nCr(N, k), [N, k]);
  const prob = total ? ways / total : 0;

  const setPickI = (i: number, v: number): void => {
    setChecked(false);
    setGuess(null);
    setPick((p) => p.map((w, j) => (j === i ? Math.max(0, Math.min(groups[i]!.count, v)) : w)));
  };
  const reset = (): void => {
    setK(draw);
    setPick(initialPick);
    setMode(mode0);
    setChecked(false);
    setPeeked(false);
    setGuess(null);
    challenge.reset();
  };
  const solved = checked && valid && guess === ways && !peeked && challenge.allCorrect;
  useCheckpoint({ solved, activity: `selection:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    draw: {
      type: 'number',
      label: 'how many drawn (k)',
      min: 1,
      max: N,
      step: 1,
      get: () => k,
      set: (v) => {
        setK(Math.round(v));
        setChecked(false);
        setGuess(null);
      },
    },
    mode: {
      type: 'enum',
      label: 'count or probability',
      options: ['count', 'probability'],
      get: () => mode,
      set: (v) => setMode(v as SelectionMode),
    },
    ...Object.fromEntries(
      groups.map((g, i) => [
        `want_${g.label}`,
        {
          type: 'number' as const,
          label: `want ${g.label}`,
          min: 0,
          max: g.count,
          step: 1,
          get: () => pick[i] ?? 0,
          set: (v: number) => setPickI(i, v),
        },
      ]),
    ),
    reveal: {
      type: 'action',
      label: 'reveal the count',
      invoke: () => {
        setPeeked(true);
        setGuess(ways);
        setChecked(true);
      },
    },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  // a bag of balls (cap the drawn circles; show counts for big groups like cards)
  const renderBalls = N <= 40;
  const figure = (
    <div className="selection-scene">
      <div>
        <p className="lab-field-label">the bag, {N} total</p>
        <div className="selection-group-rack">
          {groups.map((g, i) => (
            <div
              key={g.label}
              className="selection-group"
              style={{ '--selection-color': colorOf(g, i) } as CSSProperties}
            >
              <span className="selection-group-label">
                {g.count} {g.label}
              </span>
              {renderBalls ? (
                <div className="selection-ball-rack">
                  {Array.from({ length: g.count }, (_, j) => (
                    <span key={j} className="selection-ball" data-selected={j < (pick[i] ?? 0)} />
                  ))}
                </div>
              ) : (
                <span className="selection-group-swatch" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="lab-field-label">
          draw {k}, you want: {groups.map((g, i) => `${pick[i] ?? 0} ${g.label}`).join(' + ')}
        </p>
        <div className="selection-draw-rack">
          {groups.flatMap((g, i) =>
            Array.from({ length: pick[i] ?? 0 }, (_, j) => (
              <span
                key={`${i}-${j}`}
                className="selection-drawn-ball"
                style={{ '--selection-color': colorOf(g, i) } as CSSProperties}
              />
            )),
          )}
          {!valid && (
            <span className="selection-validation">
              must total exactly {k} (now {sumPick})
            </span>
          )}
        </div>
      </div>

      {/* the counting breakdown */}
      <div className="selection-breakdown">
        {valid ? (
          <>
            <div>
              <Tex
                tex={`\\text{ways} = ${groups.map((g, i) => `C(${g.count},${pick[i]})`).join(' \\cdot ')}${checked ? ` = ${groups.map((g, i) => nCr(g.count, pick[i]!)).join(' \\cdot ')} = ${ways}` : ''}`}
              />
            </div>
            {mode === 'probability' && (
              <div className="selection-probability">
                <Tex
                  tex={`P = \\text{favourable ways} / C(${N},${k})${checked ? ` = ${ways}/${total} = ${frac(prob)} \\approx ${prob.toFixed(3)}` : ''}`}
                />
              </div>
            )}
          </>
        ) : (
          <span className="discrete-prompt-muted">
            Set how many of each colour to draw; they must add up to {k}.
          </span>
        )}
      </div>
    </div>
  );

  const aside = (
    <>
      <Readout
        label={mode === 'probability' ? 'probability' : 'favourable ways'}
        value={
          !valid
            ? 'Complete the draw'
            : checked
              ? mode === 'probability'
                ? frac(prob)
                : ways.toLocaleString()
              : 'Commit an estimate'
        }
        sub={`of C(${N},${k}) = ${total.toLocaleString()} total draws`}
      />
      {valid && (
        <AuthoredResponse
          key={`${k}:${pick.join(':')}`}
          question={{
            id: 'favourable-ways',
            kind: 'numeric',
            prompt: `How many of the ${total.toLocaleString()} possible draws match?`,
            answer: ways,
            tolerance: 0,
            explain: `Correct: ${ways.toLocaleString()} favourable selections.`,
            tryAgain: 'Choose within each group, then multiply those independent counts.',
          }}
          onRespond={(result) => {
            setGuess(typeof result.response === 'number' ? result.response : null);
            setChecked(true);
          }}
        />
      )}
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      {groups.map((g, i) => (
        <Field key={g.label} label={`draw ${g.label}`}>
          <Stepper value={pick[i] ?? 0} onChange={(v) => setPickI(i, v)} min={0} max={g.count} />
        </Field>
      ))}
      <Field label="total drawn k">
        <Stepper
          value={k}
          onChange={(v) => {
            setK(Math.max(1, Math.min(N, v)));
            setChecked(false);
            setGuess(null);
          }}
          min={1}
          max={N}
          label="total draw size"
        />
      </Field>
      <Field label="show">
        <span className="selection-mode-switch">
          <Chip selected={mode === 'count'} onClick={() => setMode('count')}>
            count
          </Chip>
          <Chip selected={mode === 'probability'} onClick={() => setMode('probability')}>
            probability
          </Chip>
        </span>
      </Field>
    </div>
  );

  const footer = (
    <>
      <RevealSolution
        available={!solved}
        buttonLabel="Show the count"
        solution={
          <>
            <Tex tex={`${groups.map((g, i) => `C(${g.count},${pick[i]})`).join(' \\cdot ')} =`} />{' '}
            <b>{ways}</b>
            {mode === 'probability' && <> favourable, so P = {frac(prob)}</>}.
          </>
        }
        onReveal={() => {
          setPeeked(true);
          setGuess(ways);
          setChecked(true);
        }}
      />
      <ChallengeCard questions={transferQuestions} state={challenge} title="Connect count to probability" />
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="discrete-selection-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Grouped selection"
          title={title}
          description={
            prompt ??
            'Build a requested draw from visible groups, predict its count, and connect favourable selections to the whole sample space.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{valid ? (checked ? `${ways} favourable` : 'Predict first') : `Choose ${k}`}</strong>
        <span>
          {sumPick}/{k} requested
        </span>
        <span>{total.toLocaleString()} total draws</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Grouped selection model">{figure}</Activity.Canvas>
        <Activity.Inspector label="Draw composition and estimate">
          <div className="lab-activity-fields">
            {aside}
            {controls}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {!valid
            ? `Adjust the group counts until all ${k} draw positions are represented.`
            : checked
              ? `${ways} favourable selections occupy ${frac(prob)} of the ${total.toLocaleString()} equally likely draws.`
              : 'Choose within each group, multiply the independent group counts, then compare with every possible draw.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Selection explanation and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        {valid
          ? checked
            ? `${ways} favourable selections out of ${total}; probability ${frac(prob)}.`
            : `The requested groups total ${k}. Commit an estimate before revealing the count.`
          : `The requested groups total ${sumPick}, but the draw size is ${k}.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>
            {valid ? (checked ? 'Estimate checked' : 'Composition ready') : 'Complete the draw'}
          </strong>
          <span>
            {sumPick} of {k} selected
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
