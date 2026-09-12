'use client';

/**
 * BayesLab, base-rate neglect, taught Brilliant-style: ONE idea at a time, big.
 *   THEORY (default): a 4-step walkthrough, (1) the rare population, (2) the test
 *   catches most sick people, (3) but also flags many healthy ones, (4) so a
 *   positive is usually a false alarm. Each step reveals one more layer of a large
 *   area model; the frequency tree + answer land on the last step.
 *   SAMPLE: draw real people with SamplerCore and watch the empirical posterior
 *   converge (capped so it stops; paused off-screen).
 * Both render through the shared ProportionModel + FrequencyTree.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useControlSurface, useFrameLoop, useInView } from '@classytic/stage';
import { SamplerCore, type SamplerState } from '@classytic/stage/sim';
import { bayes } from '../core/probability.js';
import { ActionButton, Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { Activity, RunTransport } from '../../kit/activity.js';
import {
  LearningSequenceNav,
  useLearningSequence,
  type LearningSequenceStep,
} from '../../kit/learning-sequence.js';
import { ProportionModel, type PropRow } from '../../kit/proportion.js';
import { FrequencyTree } from '../../kit/freq-tree.js';
import {
  useHints,
  HintLadder,
  RevealSolution,
  useChallenge,
  ChallengeCard,
  useCheckpoint,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';

export interface BayesProps {
  prior?: number;
  sensitivity?: number;
  falsePositive?: number;
  population?: number;
  conditionLabels?: [string, string];
  testLabels?: [string, string];
  predict?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const DISEASE = 'var(--stage-danger, #e03131)';
const FALSEPOS = 'var(--stage-warn, #e8a020)';
// The healthy population is the BACKGROUND of the picture, so it must recede in both themes.
// Alpha over muted cannot do that: the same value lands darker than the card in light mode and
// LIGHTER than it in dark, where a big pale slab then dominates the figure. Mixing toward the
// stage background recedes either way, so the coloured disease bands stay the subject.
const MUTED = 'color-mix(in oklab, var(--stage-muted) 13%, var(--stage-bg))';
const pct = (x: number): string => `${(x * 100).toFixed(x < 0.01 ? 2 : 1)}%`;
const r0 = (x: number): number => Math.round(x);
const WALKTHROUGH: LearningSequenceStep[] = [
  { id: 'base-rate', phase: 'predict', title: 'Start with the base rate' },
  { id: 'true-positive', phase: 'act', title: 'Count true positives' },
  { id: 'false-positive', phase: 'observe', title: 'Compare false positives' },
  {
    id: 'posterior',
    phase: 'transfer',
    title: 'Judge a positive result',
    gate: {
      kind: 'answer',
      id: 'bayes-prediction',
      pendingLabel: 'Commit a prediction to complete the investigation.',
    },
  },
];

export function BayesLab({
  prior = 0.01,
  sensitivity = 0.9,
  falsePositive = 0.09,
  population = 1000,
  conditionLabels = ['disease', 'healthy'],
  testLabels = ['test +', 'test −'],
  predict = false,
  title = 'Bayes: the base-rate trap',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: BayesProps): ReactNode {
  const [p, setP] = useState(prior);
  const [s, setS] = useState(sensitivity);
  const [f, setF] = useState(falsePositive);
  const [revealed, setRevealed] = useState(!predict);
  const [mode, setMode] = useState<'theory' | 'sample'>('theory');
  const [perStep, setPerStep] = useState(50);
  const [resetN, setResetN] = useState(0);
  const [paused, setPaused] = useState(false);
  const hints = useHints(hintList);
  const sequence = useLearningSequence(WALKTHROUGH);

  const posterior = bayes(s, p, f);
  const [has, not] = conditionLabels,
    [pos] = testLabels;
  const posShort = pos.replace('test ', '');

  // ── predict-first challenge: commit BEFORE the reveal (gates `revealed`) ──────
  const predictQ: ChallengeQuestion[] = [
    {
      id: 'bayes-posterior',
      prompt: `Of everyone who tests ${posShort}, roughly what fraction TRULY have the ${has}?`,
      choices: [
        { value: 'most', label: 'most of them' },
        { value: 'about-half', label: 'about half' },
        { value: 'small', label: 'only a small fraction' },
      ],
      answer: 'small',
      explain: `Base-rate neglect: the ${has} is rare (prior ${pct(p)}), so even an accurate test produces far more false alarms than true positives, the posterior stays small.`,
    },
  ];
  const ch = useChallenge(predictQ);
  const predictionCompleted = useRef(false);
  // a correct prediction (or sampling) lifts the reveal gate.
  useEffect(() => {
    if (ch.allCorrect && !predictionCompleted.current) {
      predictionCompleted.current = true;
      setRevealed(true);
      sequence.complete('bayes-prediction');
    }
  }, [ch.allCorrect, sequence]);
  useCheckpoint({ solved: ch.allCorrect, activity: 'bayes:predict', hintsUsed: hints.count });

  const N = population;
  const tp = N * p * s,
    fn = N * p * (1 - s),
    fp = N * (1 - p) * f,
    tn = N * (1 - p) * (1 - f);

  // ── live sampling (SAMPLE mode): capped + paused off-screen ──────────────────
  const sampling = mode === 'sample';
  const { ref: rootRef, inView } = useInView<HTMLDivElement>();
  const samp = useRef<SamplerState | null>(null);
  const key = `${p}:${s}:${f}:${resetN}:${mode}`;
  const keyRef = useRef(key);
  const [sdone, setSdone] = useState(false);
  const [, setTick] = useState(0);
  if (keyRef.current !== key) {
    keyRef.current = key;
    samp.current = null;
    if (sdone) setSdone(false);
    if (paused) setPaused(false);
  }
  useFrameLoop(
    (fr) => {
      if (!sampling) return;
      if (!samp.current) {
        samp.current = SamplerCore.reset({
          weights: [p * s, p * (1 - s), (1 - p) * f, (1 - p) * (1 - f)],
          perStep,
          seed: 1 + resetN,
          maxDraws: 200_000,
        });
      } else if (!samp.current.done) {
        samp.current = SamplerCore.step({ ...samp.current, perStep }, Math.min(0.05, fr.dtMs / 1000));
        if (samp.current.done) setSdone(true);
      }
      setTick((t) => (t + 1) % 1_000_000);
    },
    { running: sampling && inView && !sdone && !paused },
  );

  // display counts: empirical (sample) or exact (theory)
  const live = sampling && !!samp.current && samp.current.n > 0;
  const cc = live ? samp.current!.counts : [tp, fn, fp, tn];
  const nTot = live ? samp.current!.n : N;
  const dTP = cc[0]!,
    dFN = cc[1]!,
    dFP = cc[2]!,
    dTN = cc[3]!;
  const dDis = dTP + dFN,
    dHea = dFP + dTN,
    dPos = dTP + dFP;
  const dPost = dPos > 0 ? dTP / dPos : posterior;

  // reveal level: in theory mode the step controls how much shows; sample = all
  const level = sampling ? 3 : sequence.index;
  const showResult = level >= 3 && (revealed || sampling);

  useControlSurface(controlId, {
    prevalence: {
      type: 'number',
      label: 'prior P(A): prevalence',
      min: 0.001,
      max: 0.5,
      step: 0.001,
      get: () => p,
      set: setP,
    },
    sensitivity: {
      type: 'number',
      label: 'P(B|A): true-positive rate',
      min: 0.5,
      max: 1,
      step: 0.01,
      get: () => s,
      set: setS,
    },
    falsePositive: {
      type: 'number',
      label: 'P(B|¬A): false-positive rate',
      min: 0,
      max: 0.5,
      step: 0.01,
      get: () => f,
      set: setF,
    },
    reveal: { type: 'action', label: 'reveal the posterior', invoke: () => setRevealed(true) },
  });

  const diseaseRows: PropRow[] =
    level >= 1
      ? [
          { frac: dDis > 0 ? dTP / dDis : 0, color: DISEASE, lit: true, count: dTP },
          { frac: dDis > 0 ? dFN / dDis : 0, color: DISEASE, opacity: 0.22, count: dFN },
        ]
      : [{ frac: 1, color: DISEASE, opacity: 0.6, count: dDis }];
  const healthyRows: PropRow[] =
    level >= 2
      ? [
          { frac: dHea > 0 ? dFP / dHea : 0, color: FALSEPOS, lit: true, count: dFP },
          { frac: dHea > 0 ? dTN / dHea : 0, color: MUTED, count: dTN },
        ]
      : [{ frac: 1, color: MUTED, count: dHea }];

  const captions = [
    `Out of ${r0(N).toLocaleString()} people, only ${r0(tp + fn)} actually have the ${has}, it's rare (${pct(p)}).`,
    `The test is sensitive: of those ${r0(tp + fn)} sick people it catches ${r0(tp)} (and misses ${r0(fn)}).`,
    `But the same test also flags ${r0(fp)} of the ${r0(fp + tn)} healthy people, false alarms.`,
    `So ${r0(tp + fp)} test ${posShort}, yet only ${r0(tp)} are truly sick → a positive means just ${pct(posterior)}.`,
  ];
  const caption = sampling
    ? `Sampling real people… ${r0(nTot).toLocaleString()} drawn. Empirical P(${has}|${posShort}) = ${pct(dPost)} → true ${pct(posterior)}.`
    : captions[sequence.index];

  const figure = (
    <>
      <ProportionModel
        size={360}
        ariaLabel={`Bayes area model, step ${level + 1}`}
        columns={[
          { frac: dDis, label: has, rows: diseaseRows },
          { frac: dHea, label: not, rows: healthyRows },
        ]}
        caption={
          level >= 2
            ? `outlined bands = ${pos} (${r0(dPos)} of ${r0(nTot)}${live ? ' sampled' : ''})`
            : undefined
        }
      />
      {level >= 2 && <PositiveBar tp={dTP} fp={dFP} pos={pos} has={has} />}
    </>
  );

  const aside =
    level >= 3 ? (
      <>
        <FrequencyTree
          ariaLabel={`Of ${r0(nTot)} people, ${r0(dTP)} of ${r0(dPos)} positives truly have ${has}`}
          root={{
            label: live ? 'sampled' : 'people',
            count: nTot,
            children: [
              {
                label: has,
                count: dDis,
                color: DISEASE,
                children: [
                  { label: posShort, count: dTP, color: DISEASE, lit: true },
                  { label: 'miss', count: dFN },
                ],
              },
              {
                label: not,
                count: dHea,
                children: [
                  { label: `false ${posShort}`, count: dFP, color: FALSEPOS, lit: true },
                  { label: 'clear', count: dTN },
                ],
              },
            ],
          }}
        />
        {showResult ? (
          <>
            <div className="lab-result-stack">
              prior P({has}) = <b>{pct(p)}</b>
              <span className="lab-evidence-value">
                P({has} | {posShort}) = {pct(dPost)}
              </span>
              {live && (
                <span className="bayes-sample-status">
                  {r0(nTot).toLocaleString()} sampled → true {pct(posterior)}
                </span>
              )}
            </div>
            {predict && <ChallengeCard questions={predictQ} state={ch} title="Your prediction" />}
          </>
        ) : (
          <ChallengeCard questions={predictQ} state={ch} title="Predict first" />
        )}
      </>
    ) : undefined;

  const controls = (
    <>
      <Field label="mode">
        <Segmented
          ariaLabel="mode"
          value={sampling ? 'sample' : 'theory'}
          onChange={setMode}
          options={[
            { value: 'theory', label: 'walk through' },
            { value: 'sample', label: 'sample it' },
          ]}
        />
      </Field>
      {sampling && (
        <Field label="speed (people / frame)">
          <Segmented
            ariaLabel="speed (people / frame)"
            value={String(perStep)}
            onChange={(v) => setPerStep(Number(v))}
            options={[10, 50, 200].map((sp) => ({ value: String(sp), label: `${sp}×` }))}
          />
        </Field>
      )}
      {sampling && (
        <Field label="run">
          <span className="lab-field-row">
            {!sdone && (
              <ActionButton pressed={!paused} onClick={() => setPaused((v) => !v)}>
                {paused ? 'Resume sample' : 'Pause sample'}
              </ActionButton>
            )}
            <ActionButton
              onClick={() => {
                setResetN((n) => n + 1);
                setPaused(false);
              }}
            >
              New sample
            </ActionButton>
          </span>
        </Field>
      )}
      <Field label="prevalence" value={pct(p)}>
        <Slider value={p} min={0.001} max={0.5} step={0.001} onChange={setP} ariaLabel="prevalence" />
      </Field>
      <Field label="sensitivity" value={pct(s)}>
        <Slider value={s} min={0.5} max={1} step={0.01} onChange={setS} ariaLabel="sensitivity" />
      </Field>
      <Field label="false positive" value={pct(f)}>
        <Slider value={f} min={0} max={0.5} step={0.01} onChange={setF} ariaLabel="false positive rate" />
      </Field>
    </>
  );

  const support = (
    <>
      <RevealSolution
        available={!revealed && level >= 3 && !sampling}
        buttonLabel="Show the answer"
        solution={
          <>
            P({has} | {posShort}) = {pct(posterior)}, far below the test's accuracy, because the prior is only{' '}
            {pct(p)}.
          </>
        }
        onReveal={() => setRevealed(true)}
      />
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root ref={rootRef} className="discrete-bayes-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Conditional probability"
          title={title}
          description={
            prompt ??
            'Build the posterior from natural frequencies, then test whether accuracy alone tells you what a positive result means.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{sampling ? 'sample' : sequence.current.phase}</strong>
        <span>{sampling ? `${r0(nTot).toLocaleString()} people drawn` : sequence.current.title}</span>
        <span>
          P({has} | {posShort}) {pct(dPost)}
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Bayes area model and positive-result composition">{figure}</Activity.Canvas>
        <Activity.Inspector label="Evidence and model controls">
          {aside}
          <div className="lab-activity-fields">{controls}</div>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>{caption}</div>
      </Activity.Feedback>
      {objectives?.length || hintList?.length || (!revealed && level >= 3 && !sampling) ? (
        <Activity.Transcript label="Learning support">
          <>
            {objectives?.length ? (
              <ul>
                {objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            ) : null}
            {support}
          </>
        </Activity.Transcript>
      ) : null}
      <Activity.LiveRegion>
        {sampling
          ? `${r0(nTot).toLocaleString()} sampled; empirical probability ${pct(dPost)}, theoretical probability ${pct(posterior)}.`
          : `Walkthrough step ${sequence.index + 1} of ${sequence.total}. ${caption}`}
      </Activity.LiveRegion>
      <Activity.Transport>
        {sampling ? (
          <RunTransport
            running={!paused && !sdone}
            onReset={() => {
              setResetN((n) => n + 1);
              setPaused(false);
            }}
            onToggle={() => setPaused((value) => !value)}
            state={sdone ? 'Sample complete' : paused ? 'Sampling paused' : 'Sampling'}
            detail={`${r0(nTot).toLocaleString()} drawn`}
            resetLabel="Start a new sample"
            runLabel="Resume sample"
          />
        ) : (
          <LearningSequenceNav sequence={sequence} />
        )}
      </Activity.Transport>
    </Activity.Root>
  );
}

/** The answer as a picture: of everyone who tests +, what red share truly has it.
 *  A bar of JUST the positive region (true-positive red | false-positive orange) ,
 *  the posterior IS the red fraction, legible at any prior (unlike the 1%-wide
 *  column the area model degenerates to). minWidth keeps the red sliver visible. */
function PositiveBar({ tp, fp, pos, has }: { tp: number; fp: number; pos: string; has: string }): ReactNode {
  const total = tp + fp;
  const frac = total > 0 ? tp / total : 0;
  return (
    <div className="bayes-positive-result">
      <div className="bayes-positive-caption">
        of the {r0(total).toLocaleString()} who {pos}, only the red truly have it:
      </div>
      <div className="bayes-positive-bar">
        <div
          className="bayes-positive-segment"
          data-kind="true"
          data-visible={tp > 0}
          style={{ '--bayes-weight': tp } as CSSProperties}
        >
          {r0(tp).toLocaleString()}
        </div>
        <div
          className="bayes-positive-segment"
          data-kind="false"
          style={{ '--bayes-weight': fp } as CSSProperties}
        >
          {r0(fp).toLocaleString()}
        </div>
      </div>
      <div className="bayes-positive-verdict">
        {pct(frac)} truly {has}
      </div>
    </div>
  );
}
