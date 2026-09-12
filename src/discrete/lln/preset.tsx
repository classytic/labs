'use client';

/**
 * LawOfLargeNumbersLab, the `sampler` core made tangible, the STANDARD data-driven
 * way: a SceneDoc with one `sampler` sim (meta.sims) + the `lln` asset reading it
 * live via simBind. Flip a coin / roll a die thousands of times and watch the
 * frequencies settle onto the true probability. Coin vs die is just `weights` ,
 * the general tool, not a one-off widget.
 *
 * Changing the experiment or hitting "new run" re-keys <Scene> so the sampler
 * re-seeds (fresh counts); "speed" (draws/frame) merges live without a restart.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Scene, registerAsset, type SceneDoc } from '@classytic/stage';
import { Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { Activity, RunTransport } from '../../kit/activity.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { LLN_ASSET } from './asset.js';

registerAsset('lln', LLN_ASSET);

export interface LlnProps {
  experiment?: 'coin' | 'die';
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const LLN_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'early-vs-late',
    prompt: 'Which part of a running-frequency trace usually swings more?',
    choices: [
      { value: 'early', label: 'the first few draws' },
      { value: 'late', label: 'the final few draws' },
      { value: 'same', label: 'both equally' },
    ],
    answer: 'early',
    explain:
      'One outcome is a large fraction of a tiny early sample, but only a small fraction of a large later sample.',
  },
  {
    id: 'meaning',
    prompt: 'The law of large numbers says the running frequency…',
    choices: [
      { value: 'settles', label: 'tends toward the true probability' },
      { value: 'locks', label: 'becomes exact after a fixed draw' },
      { value: 'alternates', label: 'must alternate outcomes' },
    ],
    answer: 'settles',
    explain:
      'Long-run frequency tends toward the true probability; it can still fluctuate and is not guaranteed to become exact.',
  },
];

export function LawOfLargeNumbersLab({
  experiment: exp0 = 'coin',
  title = 'The law of large numbers',
  prompt = 'Flip a coin (or roll a die) over and over, the running frequencies settle onto the true probability.',
  objectives,
}: LlnProps = {}): ReactNode {
  const [experiment, setExperiment] = useState<'coin' | 'die'>(exp0);
  const [perStep, setPerStep] = useState(1);
  const [resetN, setResetN] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const challenge = useChallenge(LLN_CHALLENGE);

  const doc = useMemo<SceneDoc>(() => {
    const weights = experiment === 'coin' ? [1, 1] : [1, 1, 1, 1, 1, 1];
    return {
      schemaVersion: 2,
      type: 'stage-scene',
      view: { xMin: 0, xMax: 720, yMin: 0, yMax: 300 },
      elements: [
        {
          id: 'fig',
          kind: 'asset',
          def: {
            op: 'asset',
            asset: 'lln',
            params: { kind: experiment === 'coin' ? 0 : 1 },
            bind: {},
            simBind: {
              p: { sim: 'mc', field: 'p' },
              p0: { sim: 'mc', field: 'p0' },
              samples: { sim: 'mc', field: 'samples' },
              n: { sim: 'mc', field: 'n' },
              last: { sim: 'mc', field: 'last' },
              done: { sim: 'mc', field: 'done' },
            },
          },
        },
      ],
      bindings: [],
      // cap the draws so it converges and STOPS (no infinite RAF); ↻ new run resets.
      meta: {
        sims: [
          {
            id: 'mc',
            core: 'sampler',
            params: { weights, perStep, seed: 1 + resetN, maxDraws: experiment === 'coin' ? 4000 : 12000 },
            drives: {},
          },
        ],
      },
    };
  }, [experiment, perStep, resetN]);

  // Empirical convergence read-out. The sampler runs inside <Scene> deterministically
  // (mulberry32, fixed seed) up to its draw cap, so we replay the SAME draws here to
  // recover the final per-outcome frequency estimates (estimates) and the true
  // probabilities (trueProbs) the asset compares against. `solved` mirrors the
  // monte-carlo sibling: enough samples AND every estimate within tolerance of truth.
  const { totalSamples, estimates, trueProbs } = useMemo(() => {
    const weights = experiment === 'coin' ? [1, 1] : [1, 1, 1, 1, 1, 1];
    const maxDraws = experiment === 'coin' ? 4000 : 12000;
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const trueP = weights.map((w) => w / total);
    const counts = new Array(weights.length).fill(0) as number[];
    let a = (1 + resetN) | 0;
    for (let n = 0; n < maxDraws; n++) {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      let x = r * total;
      let idx = weights.length - 1;
      for (let i = 0; i < weights.length - 1; i++) {
        const w = weights[i] ?? 0;
        if (x < w) {
          idx = i;
          break;
        }
        x -= w;
      }
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    return { totalSamples: maxDraws, estimates: counts.map((c) => c / maxDraws), trueProbs: trueP };
  }, [experiment, resetN]);

  const expectedConvergence =
    totalSamples >= 300 && estimates.every((est, i) => Math.abs(est - (trueProbs[i] ?? 0)) <= 0.02);
  useCheckpoint({
    solved: hasRun && expectedConvergence && challenge.allCorrect,
    activity: `lln:${title}`,
    response: experiment,
    attemptKey: resetN,
  });

  const controls = (
    <div className="lab-activity-fields">
      <Field label="experiment">
        <Segmented
          ariaLabel="experiment"
          value={experiment}
          onChange={(v) => {
            setPlaying(false);
            setExperiment(v);
            setResetN((n) => n + 1);
          }}
          options={[
            { value: 'coin', label: 'coin' },
            { value: 'die', label: 'die' },
          ]}
        />
      </Field>
      <Field label="speed (draws / frame)">
        <Segmented
          ariaLabel="speed (draws / frame)"
          value={String(perStep)}
          onChange={(v) => setPerStep(Number(v))}
          options={[1, 10, 100].map((sp) => ({ value: String(sp), label: `${sp}×` }))}
        />
      </Field>
    </div>
  );

  const reset = (): void => {
    setPlaying(false);
    setHasRun(false);
    setResetN((n) => n + 1);
    challenge.reset();
  };

  const toggle = (): void => {
    setHasRun(true);
    setPlaying((value) => !value);
  };

  return (
    <Activity.Root className="discrete-lln-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Probability simulation" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{playing ? 'sampling' : hasRun ? 'paused' : 'ready'}</strong>
        <span>{experiment}</span>
        <span>
          {perStep} draw{perStep === 1 ? '' : 's'} per frame
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Running frequency simulation">
          <Scene
            key={`${experiment}:${resetN}`}
            doc={doc}
            interactive={false}
            showGrid={false}
            showAxes={false}
            playing={playing}
            onPlayingChange={setPlaying}
            ariaLabel="Law of large numbers: a coin or die sampled repeatedly, frequencies converging onto the true probability"
          />
        </Activity.Canvas>
        <Activity.Inspector label="Experiment and sampling controls">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {hasRun
            ? 'Early outcomes can move the running frequency sharply; later outcomes have less influence as the sample grows.'
            : 'Predict the trace, then run repeated trials and compare the running frequency with the dashed theoretical probability.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Predict and explain long-run frequency">
        <ChallengeCard questions={LLN_CHALLENGE} state={challenge} title="Predict, then test" />
      </section>
      <Activity.LiveRegion>
        {hasRun
          ? `${experiment} experiment running; compare the running frequency with the dashed true probability.`
          : 'Experiment ready.'}
      </Activity.LiveRegion>
      <Activity.Transport>
        <RunTransport
          running={playing}
          onReset={reset}
          onToggle={toggle}
          state={playing ? 'Sampling' : hasRun ? 'Paused' : 'Ready'}
          detail={`${experiment} · ${perStep} draw${perStep === 1 ? '' : 's'} per frame`}
          resetLabel="Reset sampling experiment"
          runLabel="Run experiment"
        />
      </Activity.Transport>
    </Activity.Root>
  );
}
