'use client';

/**
 * BayesLab — base-rate neglect, taught Brilliant-style: ONE idea at a time, big.
 *   THEORY (default): a 4-step walkthrough — (1) the rare population, (2) the test
 *   catches most sick people, (3) but also flags many healthy ones, (4) so a
 *   positive is usually a false alarm. Each step reveals one more layer of a large
 *   area model; the frequency tree + answer land on the last step.
 *   SAMPLE: draw real people with SamplerCore and watch the empirical posterior
 *   converge (capped so it stops; paused off-screen).
 * Both render through the shared ProportionModel + FrequencyTree.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useControlSurface, useFrameLoop, useInView } from '@classytic/stage';
import { SamplerCore, type SamplerState } from '@classytic/stage/sim';
import { bayes } from '../core/probability.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { ProportionModel, type PropRow } from '../../kit/proportion.js';
import { FrequencyTree } from '../../kit/freq-tree.js';
import { useSteps, StepNav } from '../../kit/steps.js';
import { useHints, HintLadder, RevealSolution } from '../../kit/pedagogy.js';

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
const MUTED = 'var(--stage-muted)';
const pct = (x: number): string => `${(x * 100).toFixed(x < 0.01 ? 2 : 1)}%`;
const r0 = (x: number): number => Math.round(x);

export function BayesLab({
  prior = 0.01, sensitivity = 0.9, falsePositive = 0.09, population = 1000,
  conditionLabels = ['disease', 'healthy'], testLabels = ['test +', 'test −'],
  predict = false, title = 'Bayes — the base-rate trap', prompt, objectives, hints: hintList, controlId,
}: BayesProps): ReactNode {
  const [p, setP] = useState(prior);
  const [s, setS] = useState(sensitivity);
  const [f, setF] = useState(falsePositive);
  const [guess, setGuess] = useState(0.5);
  const [revealed, setRevealed] = useState(!predict);
  const [mode, setMode] = useState<'theory' | 'sample'>('theory');
  const [perStep, setPerStep] = useState(50);
  const [resetN, setResetN] = useState(0);
  const [paused, setPaused] = useState(false);
  const hints = useHints(hintList);
  const steps = useSteps(4);

  const posterior = bayes(s, p, f);
  const [has, not] = conditionLabels, [pos] = testLabels;
  const posShort = pos.replace('test ', '');

  const N = population;
  const tp = N * p * s, fn = N * p * (1 - s), fp = N * (1 - p) * f, tn = N * (1 - p) * (1 - f);

  // ── live sampling (SAMPLE mode): capped + paused off-screen ──────────────────
  const sampling = mode === 'sample';
  const { ref: rootRef, inView } = useInView<HTMLDivElement>();
  const samp = useRef<SamplerState | null>(null);
  const key = `${p}:${s}:${f}:${resetN}:${mode}`;
  const keyRef = useRef(key);
  const [sdone, setSdone] = useState(false);
  const [, setTick] = useState(0);
  if (keyRef.current !== key) { keyRef.current = key; samp.current = null; if (sdone) setSdone(false); if (paused) setPaused(false); }
  useFrameLoop(
    (fr) => {
      if (!sampling) return;
      if (!samp.current) {
        samp.current = SamplerCore.reset({ weights: [p * s, p * (1 - s), (1 - p) * f, (1 - p) * (1 - f)], perStep, seed: 1 + resetN, maxDraws: 200_000 });
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
  const dTP = cc[0]!, dFN = cc[1]!, dFP = cc[2]!, dTN = cc[3]!;
  const dDis = dTP + dFN, dHea = dFP + dTN, dPos = dTP + dFP;
  const dPost = dPos > 0 ? dTP / dPos : posterior;

  // reveal level: in theory mode the step controls how much shows; sample = all
  const level = sampling ? 3 : steps.step;
  const showResult = level >= 3 && (revealed || sampling);

  useControlSurface(controlId, {
    prevalence: { type: 'number', label: 'prior P(A) — prevalence', min: 0.001, max: 0.5, step: 0.001, get: () => p, set: setP },
    sensitivity: { type: 'number', label: 'P(B|A) — true-positive rate', min: 0.5, max: 1, step: 0.01, get: () => s, set: setS },
    falsePositive: { type: 'number', label: 'P(B|¬A) — false-positive rate', min: 0, max: 0.5, step: 0.01, get: () => f, set: setF },
    reveal: { type: 'action', label: 'reveal the posterior', invoke: () => setRevealed(true) },
  });

  const diseaseRows: PropRow[] = level >= 1
    ? [{ frac: dDis > 0 ? dTP / dDis : 0, color: DISEASE, lit: true, count: dTP }, { frac: dDis > 0 ? dFN / dDis : 0, color: DISEASE, opacity: 0.22, count: dFN }]
    : [{ frac: 1, color: DISEASE, opacity: 0.6, count: dDis }];
  const healthyRows: PropRow[] = level >= 2
    ? [{ frac: dHea > 0 ? dFP / dHea : 0, color: FALSEPOS, lit: true, count: dFP }, { frac: dHea > 0 ? dTN / dHea : 0, color: MUTED, opacity: 0.18, count: dTN }]
    : [{ frac: 1, color: MUTED, opacity: 0.3, count: dHea }];

  const captions = [
    `Out of ${r0(N).toLocaleString()} people, only ${r0(tp + fn)} actually have the ${has} — it's rare (${pct(p)}).`,
    `The test is sensitive: of those ${r0(tp + fn)} sick people it catches ${r0(tp)} (and misses ${r0(fn)}).`,
    `But the same test also flags ${r0(fp)} of the ${r0(fp + tn)} healthy people — false alarms.`,
    `So ${r0(tp + fp)} test ${posShort}, yet only ${r0(tp)} are truly sick → a positive means just ${pct(posterior)}.`,
  ];
  const caption = sampling
    ? `Sampling real people… ${r0(nTot).toLocaleString()} drawn. Empirical P(${has}|${posShort}) = ${pct(dPost)} → true ${pct(posterior)}.`
    : captions[steps.step];

  const figure = (
    <>
      <p className="lab-step-caption">{caption}</p>
      <ProportionModel
        size={360}
        ariaLabel={`Bayes area model, step ${level + 1}`}
        columns={[{ frac: dDis, label: has, rows: diseaseRows }, { frac: dHea, label: not, rows: healthyRows }]}
        caption={level >= 2 ? `outlined bands = ${pos} (${r0(dPos)} of ${r0(nTot)}${live ? ' sampled' : ''})` : undefined}
      />
      {level >= 2 && <PositiveBar tp={dTP} fp={dFP} pos={pos} has={has} />}
    </>
  );

  const aside = level >= 3 ? (
    <>
      <FrequencyTree
        ariaLabel={`Of ${r0(nTot)} people, ${r0(dTP)} of ${r0(dPos)} positives truly have ${has}`}
        root={{
          label: live ? 'sampled' : 'people', count: nTot, children: [
            { label: has, count: dDis, color: DISEASE, children: [
              { label: posShort, count: dTP, color: DISEASE, lit: true },
              { label: 'miss', count: dFN },
            ] },
            { label: not, count: dHea, children: [
              { label: `false ${posShort}`, count: dFP, color: FALSEPOS, lit: true },
              { label: 'clear', count: dTN },
            ] },
          ],
        }}
      />
      {showResult ? (
        <Callout tone="result">
          prior P({has}) = <b>{pct(p)}</b>
          <span className="lab-callout-big">P({has} | {posShort}) = {pct(dPost)}</span>
          {live && <span style={{ fontSize: 12, color: MUTED }}>{r0(nTot).toLocaleString()} sampled → true {pct(posterior)}</span>}
        </Callout>
      ) : (
        <div>
          <p className="lab-prompt">🎯 Before the reveal — if you test {posShort}, what's the chance you actually have it?</p>
          <ControlBar>
            <Field label="your guess" value={pct(guess)}>
              <Slider value={guess} min={0} max={1} step={0.01} onChange={setGuess} ariaLabel="your guess" />
            </Field>
            <Chip selected={false} onClick={() => setRevealed(true)}>reveal</Chip>
          </ControlBar>
        </div>
      )}
    </>
  ) : undefined;

  const controls = (
    <ControlBar>
      <Field label="mode">
        <span className="lab-field-row">
          <Chip selected={mode === 'theory'} onClick={() => setMode('theory')}>walk through</Chip>
          <Chip selected={sampling} onClick={() => setMode('sample')}>sample it</Chip>
        </span>
      </Field>
      {sampling && <Field label="speed (people / frame)"><span className="lab-field-row">{[10, 50, 200].map((sp) => <Chip key={sp} selected={perStep === sp} onClick={() => setPerStep(sp)}>{sp}×</Chip>)}</span></Field>}
      {sampling && <Field label="run"><span className="lab-field-row">
        {!sdone && <Chip selected={!paused} onClick={() => setPaused((v) => !v)}>{paused ? '▶ resume' : '⏸ pause'}</Chip>}
        <Chip selected={false} onClick={() => { setResetN((n) => n + 1); setPaused(false); }}>↻ new sample</Chip>
      </span></Field>}
      <Field label="prevalence" value={pct(p)}><Slider value={p} min={0.001} max={0.5} step={0.001} onChange={setP} ariaLabel="prevalence" /></Field>
      <Field label="sensitivity" value={pct(s)}><Slider value={s} min={0.5} max={1} step={0.01} onChange={setS} ariaLabel="sensitivity" /></Field>
      <Field label="false positive" value={pct(f)}><Slider value={f} min={0} max={0.5} step={0.01} onChange={setF} ariaLabel="false positive rate" /></Field>
    </ControlBar>
  );

  const footer = (
    <>
      {!sampling && <StepNav steps={steps} nextLabel="Continue →" doneLabel="✓ that's the trap" />}
      <RevealSolution available={!revealed && level >= 3 && !sampling} buttonLabel="Show the answer" solution={<>P({has} | {posShort}) = {pct(posterior)} — far below the test's accuracy, because the prior is only {pct(p)}.</>} onReveal={() => setRevealed(true)} />
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer} rootRef={rootRef}>{figure}</LabFrame>;
}

/** The answer as a picture: of everyone who tests +, what red share truly has it.
 *  A bar of JUST the positive region (true-positive red | false-positive orange) —
 *  the posterior IS the red fraction, legible at any prior (unlike the 1%-wide
 *  column the area model degenerates to). minWidth keeps the red sliver visible. */
function PositiveBar({ tp, fp, pos, has }: { tp: number; fp: number; pos: string; has: string }): ReactNode {
  const total = tp + fp;
  const frac = total > 0 ? tp / total : 0;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 5 }}>of the {r0(total).toLocaleString()} who {pos}, only the red truly have it:</div>
      <div style={{ display: 'flex', height: 38, borderRadius: 9, overflow: 'hidden', border: '1px solid var(--stage-grid)' }}>
        <div style={{ flexGrow: tp, flexBasis: 0, minWidth: tp > 0 ? 26 : 0, background: DISEASE, color: 'var(--stage-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{r0(tp).toLocaleString()}</div>
        <div style={{ flexGrow: fp, flexBasis: 0, background: FALSEPOS, color: 'var(--stage-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{r0(fp).toLocaleString()}</div>
      </div>
      <div style={{ marginTop: 5, fontWeight: 800, color: DISEASE, fontSize: 15 }}>{pct(frac)} truly {has}</div>
    </div>
  );
}
