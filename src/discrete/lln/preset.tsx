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
import { Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { LLN_ASSET } from './asset.js';

registerAsset('lln', LLN_ASSET);

export interface LlnProps {
  experiment?: 'coin' | 'die';
  title?: string;
  prompt?: string;
  objectives?: string[];
}

export function LawOfLargeNumbersLab({
  experiment: exp0 = 'coin',
  title = 'The law of large numbers',
  prompt = 'Flip a coin (or roll a die) over and over, the running frequencies settle onto the true probability.',
  objectives,
}: LlnProps = {}): ReactNode {
  const [experiment, setExperiment] = useState<'coin' | 'die'>(exp0);
  const [perStep, setPerStep] = useState(1);
  const [resetN, setResetN] = useState(0);

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
      meta: { sims: [{ id: 'mc', core: 'sampler', params: { weights, perStep, seed: 1 + resetN, maxDraws: experiment === 'coin' ? 4000 : 12000 }, drives: {} }] },
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
      for (let i = 0; i < weights.length - 1; i++) { const w = weights[i] ?? 0; if (x < w) { idx = i; break; } x -= w; }
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    return { totalSamples: maxDraws, estimates: counts.map((c) => c / maxDraws), trueProbs: trueP };
  }, [experiment, resetN]);

  const converged = totalSamples >= 300
    && estimates.every((est, i) => Math.abs(est - (trueProbs[i] ?? 0)) <= 0.02);
  useCheckpoint({ solved: converged, activity: `lln:${title}` });

  const controls = (
    <ControlBar>
      <Field label="experiment">
        <span className="lab-field-row">
          <Chip selected={experiment === 'coin'} onClick={() => setExperiment('coin')}>coin</Chip>
          <Chip selected={experiment === 'die'} onClick={() => setExperiment('die')}>die</Chip>
        </span>
      </Field>
      <Field label="speed (draws / frame)">
        <span className="lab-field-row">
          {[1, 10, 100].map((sp) => <Chip key={sp} selected={perStep === sp} onClick={() => setPerStep(sp)}>{sp}×</Chip>)}
        </span>
      </Field>
      <Field label="reset">
        <Chip selected={false} onClick={() => setResetN((n) => n + 1)}>↻ new run</Chip>
      </Field>
    </ControlBar>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls}>
      <Scene key={`${experiment}:${resetN}`} doc={doc} interactive={false} showGrid={false} showAxes={false} ariaLabel="Law of large numbers: a coin or die sampled repeatedly, frequencies converging onto the true probability" />
    </LabFrame>
  );
}
