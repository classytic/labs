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
import { Chip, Slider, Stepper } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, useCheckpoint } from '../../kit/pedagogy.js';
import { CATEGORICAL } from '../../kit/palette.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface EVOutcome { label?: string; value: number; prob: number }
export interface ExpectedValueProps {
  outcomes?: EVOutcome[];
  cost?: number;            // price to play (optional) → fair / house-edge framing
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 520, H = 210, ML = 30, MR = 20, AXIS = 138;
const PAL = CATEGORICAL;

export function ExpectedValueLab({
  outcomes = [{ label: 'lose', value: 0, prob: 0.7 }, { label: 'small', value: 5, prob: 0.25 }, { label: 'jackpot', value: 50, prob: 0.05 }],
  cost = 5, title = 'Expected value: is the game fair?', prompt, objectives, hints: hintList, controlId,
}: ExpectedValueProps): ReactNode {
  const [probs, setProbs] = useState<number[]>(outcomes.map((o) => o.prob));
  const [vals, setVals] = useState<number[]>(outcomes.map((o) => o.value));
  const [plays, setPlays] = useState(0);
  const [total, setTotal] = useState(0);
  const rng = useRef<Rng>(mulberry32(99));
  const hints = useHints(hintList);

  const sumP = probs.reduce((a, b) => a + b, 0) || 1;
  const pn = probs.map((p) => p / sumP);                    // normalised
  const ev = useMemo(() => expectedValue(vals.map((v, i) => ({ value: v, p: pn[i]! }))), [vals, probs]);
  const lo = Math.min(0, ...vals), hi = Math.max(...vals, cost) * 1.12 || 1;
  const xOf = (v: number): number => ML + ((v - lo) / (hi - lo)) * (W - ML - MR);
  const avg = plays ? total / plays : null;

  const tol = Math.max(0.5, Math.abs(ev) * 0.05);
  const solved = plays >= 30 && avg != null && Math.abs(avg - ev) <= tol;
  useCheckpoint({ solved, activity: `expected-value:${title}`, hintsUsed: hints?.count ?? 0 });

  const spin = (times: number): void => {
    let t = total, c = plays;
    for (let s = 0; s < times; s++) { let r = rng.current(), i = 0; while (i < pn.length - 1 && r > pn[i]!) { r -= pn[i]!; i++; } t += vals[i]!; c++; }
    setTotal(t); setPlays(c);
  };
  const reset = (): void => { setProbs(outcomes.map((o) => o.prob)); setVals(outcomes.map((o) => o.value)); setPlays(0); setTotal(0); rng.current = mulberry32(99); };

  useControlSurface(controlId, {
    ...Object.fromEntries(outcomes.map((o, i) => [`p_${o.label ?? i}`, { type: 'number' as const, label: `prob ${o.label ?? i}`, min: 0, max: 1, step: 0.05, get: () => probs[i] ?? 0, set: (v: number) => { setProbs((a) => a.map((x, j) => (j === i ? v : x))); } }])),
    spin: { type: 'action', label: 'spin 50', invoke: () => spin(50) },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const figure = (
    <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block' }} role="img" aria-label={`expected value ${ev.toFixed(2)}`}>
        {/* weights (outcomes) hanging at their values */}
        {vals.map((v, i) => {
          const r = 7 + 24 * pn[i]!;
          return (
            <g key={i}>
              <line x1={xOf(v)} y1={AXIS} x2={xOf(v)} y2={AXIS - 40 - r} stroke="var(--stage-grid)" strokeWidth={1} />
              <circle cx={xOf(v)} cy={AXIS - 40 - r} r={r} fill={PAL[i % PAL.length]} opacity={0.9} />
              <text x={xOf(v)} y={AXIS - 40 - r} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="white">{(pn[i]! * 100).toFixed(0)}%</text>
              <text x={xOf(v)} y={AXIS + 28} textAnchor="middle" fontSize={11} fill="var(--stage-fg)" fontWeight={600}>{outcomes[i]?.label ?? v}</text>
            </g>
          );
        })}
        {/* the balance beam + axis */}
        <line x1={ML} y1={AXIS} x2={W - MR} y2={AXIS} stroke="var(--stage-fg)" strokeWidth={2.5} />
        {vals.map((v, i) => <text key={i} x={xOf(v)} y={AXIS + 14} textAnchor="middle" fontSize={10} fill="var(--stage-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</text>)}
        {/* cost marker */}
        {cost != null && <><line x1={xOf(cost)} y1={AXIS - 70} x2={xOf(cost)} y2={AXIS} stroke="var(--stage-danger, #e03131)" strokeWidth={1.5} strokeDasharray="3 3" /><text x={xOf(cost)} y={AXIS - 74} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--stage-danger, #e03131)">cost {cost}</text></>}
        {/* expected-value fulcrum (the balance point) */}
        <g style={{ transition: 'transform .15s' }}>
          <path d={`M${xOf(ev)},${AXIS + 1} l-10,17 h20 Z`} fill="var(--stage-good)" />
          <text x={xOf(ev)} y={AXIS + 32} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--stage-good)">E[X]={ev.toFixed(2)}</text>
        </g>
        {/* running average from spins */}
        {avg != null && <><circle cx={xOf(avg)} cy={AXIS - 6} r={5} fill="var(--stage-accent)" /><text x={xOf(avg)} y={AXIS - 12} textAnchor="middle" fontSize={9} fill="var(--stage-accent)" fontWeight={700}>avg {avg.toFixed(2)}</text></>}
      </svg>
    </div>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ fontSize: 12, color: 'var(--stage-muted)', fontWeight: 600 }}>expected value</span>
        <span className="lab-callout-big">{ev.toFixed(2)}</span>
        {cost != null && <span style={{ fontSize: 12, fontWeight: 700, color: ev >= cost ? 'var(--stage-good)' : 'var(--stage-danger, #e03131)' }}>{ev >= cost ? 'fair / favours you' : `house edge ${(cost - ev).toFixed(2)}/play`}</span>}
      </Callout>
      <div style={{ fontSize: 13, display: 'grid', gap: 2 }}>
        <span style={{ color: 'var(--stage-muted)' }}><Tex tex={'E[X] = \\sum \\text{value} \\cdot \\text{prob}'} /></span>
        <span><Tex tex={'= ' + vals.map((v, i) => `${v} \\cdot ${(pn[i]! * 100).toFixed(0)}\\%`).join(' + ')} /></span>
        <span>= <b style={{ color: 'var(--stage-good)' }}>{ev.toFixed(2)}</b></span>
      </div>
      <div>
        <p className="lab-prompt" style={{ fontSize: 13 }}>Play it for real, the average payout homes in on E[X].</p>
        <ControlBar>
          <Chip selected={false} onClick={() => spin(1)}>spin 1</Chip>
          <Chip selected={false} onClick={() => spin(50)}>spin 50</Chip>
          <Chip selected={false} onClick={() => { setPlays(0); setTotal(0); rng.current = mulberry32(99); }}>clear</Chip>
          {plays > 0 && <span style={{ fontSize: 12, fontWeight: 700 }}>{plays} plays · avg {avg!.toFixed(2)}</span>}
        </ControlBar>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      {outcomes.map((o, i) => (
        <Field key={i} label={`${o.label ?? `out ${i}`} prob`} value={`${(pn[i]! * 100).toFixed(0)}%`}>
          <Slider value={probs[i] ?? 0} min={0} max={1} step={0.05} onChange={(v) => setProbs((a) => a.map((x, j) => (j === i ? v : x)))} ariaLabel={`prob ${o.label ?? i}`} />
        </Field>
      ))}
      <Field label="value (last)"><Stepper value={vals[vals.length - 1] ?? 0} onChange={(v) => setVals((a) => a.map((x, j) => (j === a.length - 1 ? v : x)))} min={0} max={100} /></Field>
      <Chip selected={false} onClick={reset}>reset</Chip>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<HintLadder hints={hints} />}>{figure}</LabFrame>;
}
