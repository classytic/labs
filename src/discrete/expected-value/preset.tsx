'use client';

/**
 * ExpectedValueLab, E[X] = Σ value·prob, made physical: each outcome is a WEIGHT
 * (heavier = more likely) sitting at its value on a number line, and the expected
 * value is exactly where they BALANCE (the long-run average payout). Framed as "is
 * this game worth it?": a cost marker shows the house edge when E[X] < cost. Then
 * SPIN it many times and watch the running average settle onto E[X] (the law of
 * large numbers, the average is the expectation, earned).
 *
 * Drag the probabilities/values; the fulcrum slides. Kernel = expectedValue; seeded
 * rng for replayable spins.
 */

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { expectedValue } from '../core/probability.js';
import { mulberry32, type Rng } from '../../core/rng.js';
import { RotateCcw } from 'lucide-react';
import { ActionButton, IconButton, Slider, Stepper } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  useChallenge,
  ChallengeCard,
  useCheckpoint,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { CATEGORICAL } from '../../kit/palette.js';
import { ProbabilityContributionBoard } from '../../kit/probability.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface EVOutcome {
  label?: string;
  value: number;
  prob: number;
}
export interface ExpectedValueProps {
  outcomes?: EVOutcome[];
  cost?: number; // price to play (optional) → fair / house-edge framing
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const PAL = CATEGORICAL;

export function ExpectedValueLab({
  outcomes = [
    { label: 'lose', value: 0, prob: 0.7 },
    { label: 'small', value: 5, prob: 0.25 },
    { label: 'jackpot', value: 50, prob: 0.05 },
  ],
  cost = 5,
  title = 'Expected value: is the game fair?',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: ExpectedValueProps): ReactNode {
  const [probs, setProbs] = useState<number[]>(outcomes.map((o) => o.prob));
  const [vals, setVals] = useState<number[]>(outcomes.map((o) => o.value));
  const [plays, setPlays] = useState(0);
  const [total, setTotal] = useState(0);
  const rng = useRef<Rng>(mulberry32(99));
  const hints = useHints(hintList);

  const sumP = probs.reduce((a, b) => a + b, 0) || 1;
  const pn = probs.map((p) => p / sumP); // normalised
  const ev = useMemo(() => expectedValue(vals.map((v, i) => ({ value: v, p: pn[i]! }))), [vals, probs]);
  const initialEv = useMemo(() => {
    const initialTotal = outcomes.reduce((sum, outcome) => sum + outcome.prob, 0);
    return expectedValue(
      outcomes.map((outcome) => ({ value: outcome.value, p: outcome.prob / initialTotal })),
    );
  }, [outcomes]);
  const avg = plays ? total / plays : null;
  const prediction = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'fair-game',
        prompt: `Before simulating: with a cost of ${cost}, does this game's expected payout favour the player?`,
        choices: [
          { value: 'player', label: 'yes, expected payout covers the cost' },
          { value: 'house', label: 'no, the house has an edge' },
        ],
        answer: initialEv >= cost ? 'player' : 'house',
        explain: `The normalized expected payout is ${initialEv.toFixed(2)}. Compared with cost ${cost}, the expected net is ${(initialEv - cost).toFixed(2)} per play.`,
      },
    ],
    [cost, initialEv],
  );
  const challenge = useChallenge(prediction);

  const tol = Math.max(0.5, Math.abs(ev) * 0.05);
  const solved = challenge.allCorrect && plays >= 30 && avg != null && Math.abs(avg - ev) <= tol;
  useCheckpoint({ solved, activity: `expected-value:${title}`, hintsUsed: hints?.count ?? 0 });

  const spin = (times: number): void => {
    let t = total,
      c = plays;
    for (let s = 0; s < times; s++) {
      let r = rng.current(),
        i = 0;
      while (i < pn.length - 1 && r > pn[i]!) {
        r -= pn[i]!;
        i++;
      }
      t += vals[i]!;
      c++;
    }
    setTotal(t);
    setPlays(c);
  };
  const reset = (): void => {
    setProbs(outcomes.map((o) => o.prob));
    setVals(outcomes.map((o) => o.value));
    setPlays(0);
    setTotal(0);
    rng.current = mulberry32(99);
  };

  useControlSurface(controlId, {
    ...Object.fromEntries(
      outcomes.map((o, i) => [
        `p_${o.label ?? i}`,
        {
          type: 'number' as const,
          label: `prob ${o.label ?? i}`,
          min: 0,
          max: 1,
          step: 0.05,
          get: () => probs[i] ?? 0,
          set: (v: number) => {
            setProbs((a) => a.map((x, j) => (j === i ? v : x)));
          },
        },
      ]),
    ),
    spin: { type: 'action', label: 'spin 50', invoke: () => spin(50) },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const figure = (
    <ProbabilityContributionBoard
      outcomes={outcomes.map((outcome, index) => ({
        label: outcome.label ?? `outcome ${index + 1}`,
        probability: pn[index]!,
        value: vals[index]!,
        color: PAL[index % PAL.length],
      }))}
      expectation={ev}
      cost={cost}
      average={avg}
    />
  );

  const aside = (
    <>
      <Readout
        label="expected value"
        value={ev.toFixed(2)}
        sub={
          cost != null ? (
            <span className="expected-value-verdict" data-fair={ev >= cost}>
              {ev >= cost ? 'fair / favours you' : `house edge ${(cost - ev).toFixed(2)}/play`}
            </span>
          ) : undefined
        }
      />
      <div className="expected-value-equation">
        <span className="discrete-muted">
          <Tex tex={'E[X] = \\sum \\text{value} \\cdot \\text{prob}'} />
        </span>
        <span>
          <Tex tex={'= ' + vals.map((v, i) => `${v} \\cdot ${(pn[i]! * 100).toFixed(0)}\\%`).join(' + ')} />
        </span>
        <span>
          = <b className="discrete-answer">{ev.toFixed(2)}</b>
        </span>
      </div>
      <div>
        <p className="lab-prompt expected-value-prompt">
          Play it for real, the average payout homes in on E[X].
        </p>
        {plays > 0 && (
          <span className="expected-value-run">
            {plays} plays · avg {avg!.toFixed(2)}
          </span>
        )}
      </div>
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      {outcomes.map((o, i) => (
        <Field key={i} label={`${o.label ?? `out ${i}`} prob`} value={`${(pn[i]! * 100).toFixed(0)}%`}>
          <Slider
            value={probs[i] ?? 0}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setProbs((a) => a.map((x, j) => (j === i ? v : x)))}
            ariaLabel={`prob ${o.label ?? i}`}
          />
        </Field>
      ))}
      <Field label="value (last)">
        <Stepper
          value={vals[vals.length - 1] ?? 0}
          onChange={(v) => setVals((a) => a.map((x, j) => (j === a.length - 1 ? v : x)))}
          min={0}
          max={100}
          label="last outcome value"
        />
      </Field>
    </div>
  );

  return (
    <Activity.Root className="discrete-expected-value-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Expected value"
          title={title}
          description={
            prompt ??
            'Balance each outcome’s value against its probability, then test the predicted long-run payout by simulation.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{ev >= cost ? 'player-favouring' : 'house edge'}</strong>
        <span>E[X] {ev.toFixed(2)}</span>
        <span>cost {cost.toFixed(2)}</span>
        <span>{plays} plays</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Expected-value balance and running average">{figure}</Activity.Canvas>
        <Activity.Inspector label="Expected-value evidence and game controls">
          {aside}
          {controls}
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {avg == null
            ? `The probability-weighted balance point is ${ev.toFixed(2)}, so the expected net per play is ${(ev - cost).toFixed(2)}.`
            : `After ${plays} plays the average payout is ${avg.toFixed(2)}; compare its remaining distance from E[X] = ${ev.toFixed(2)}.`}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Predict whether the game is fair">
        <ChallengeCard questions={prediction} state={challenge} title="Predict first" />
        <HintLadder hints={hints} />
      </section>
      <Activity.LiveRegion>
        Expected payout {ev.toFixed(2)} against cost {cost.toFixed(2)}.{' '}
        {ev >= cost ? 'The game favours the player.' : `House edge ${(cost - ev).toFixed(2)} per play.`}
        {avg != null ? ` After ${plays} plays, the running average is ${avg.toFixed(2)}.` : ''}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="reset game" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>
            {solved ? 'Prediction confirmed' : plays ? 'Building a long-run average' : 'Ready to simulate'}
          </strong>
          <span>{plays ? `${plays} plays · avg ${avg!.toFixed(2)}` : `E[X] ${ev.toFixed(2)}`}</span>
        </div>
        <ActionButton className="lab-primary-action" onClick={() => spin(50)}>
          Simulate 50 plays
        </ActionButton>
        <ActionButton onClick={() => spin(1)}>Play once</ActionButton>
      </Activity.Transport>
    </Activity.Root>
  );
}
