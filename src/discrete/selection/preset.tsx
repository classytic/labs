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

import { useMemo, useState, type ReactNode } from 'react';
import { nCr } from '../core/combinatorics.js';
import { Chip, Stepper, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
import { CATEGORICAL } from '../../kit/palette.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface SelectionGroup { label: string; count: number; color?: string }
export type SelectionMode = 'count' | 'probability';
export interface SelectionProps {
  groups?: SelectionGroup[];
  draw?: number;
  want?: number[];                 // initial wanted-per-group (parallel to groups)
  mode?: SelectionMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const PALETTE = CATEGORICAL;
const NAMED: Record<string, string> = { red: '#e03131', blue: '#1c7ed6', green: '#2f9e44', yellow: '#f59f00', purple: '#9c36b5', teal: '#0ca678', black: '#343a40', orange: '#e8590c' };
const colorOf = (g: SelectionGroup, i: number): string => g.color ?? NAMED[g.label.toLowerCase()] ?? PALETTE[i % PALETTE.length]!;
const frac = (w: number): string => { for (let d = 2; d <= 200; d++) { const x = w * d; if (Math.abs(x - Math.round(x)) < 1e-9) return `${Math.round(x)}/${d}`; } return w.toFixed(4); };

export function SelectionLab({
  groups = [{ label: 'red', count: 5 }, { label: 'blue', count: 3 }, { label: 'green', count: 2 }],
  draw = 3, want, mode: mode0 = 'probability', title = 'Draw from the bag', prompt, objectives, hints: hintList, controlId,
}: SelectionProps): ReactNode {
  const N = useMemo(() => groups.reduce((a, g) => a + g.count, 0), [groups]);
  const [k, setK] = useState(draw);
  const [pick, setPick] = useState<number[]>(want ?? groups.map((_, i) => (i === 0 ? Math.min(2, groups[0]!.count) : i === 1 ? 1 : 0)));
  const [mode, setMode] = useState<SelectionMode>(mode0);
  const [guess, setGuess] = useState(0);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);

  const sumPick = pick.reduce((a, b) => a + b, 0);
  const valid = sumPick === k && pick.every((w, i) => w <= groups[i]!.count && w >= 0);
  const ways = useMemo(() => (valid ? pick.reduce((a, w, i) => a * nCr(groups[i]!.count, w), 1) : 0), [pick, groups, valid]);
  const total = useMemo(() => nCr(N, k), [N, k]);
  const prob = total ? ways / total : 0;

  const setPickI = (i: number, v: number): void => { setChecked(false); setPick((p) => p.map((w, j) => (j === i ? Math.max(0, Math.min(groups[i]!.count, v)) : w))); };
  const reset = (): void => { setChecked(false); setPeeked(false); setGuess(0); };
  const solved = checked && valid && guess === ways && !peeked;
  useCheckpoint({ solved, activity: `selection:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    draw: { type: 'number', label: 'how many drawn (k)', min: 1, max: N, step: 1, get: () => k, set: (v) => setK(Math.round(v)) },
    mode: { type: 'enum', label: 'count or probability', options: ['count', 'probability'], get: () => mode, set: (v) => setMode(v as SelectionMode) },
    ...Object.fromEntries(groups.map((g, i) => [`want_${g.label}`, { type: 'number' as const, label: `want ${g.label}`, min: 0, max: g.count, step: 1, get: () => pick[i] ?? 0, set: (v: number) => setPickI(i, v) }])),
    reveal: { type: 'action', label: 'reveal the count', invoke: () => { setPeeked(true); setGuess(ways); setChecked(true); } },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  // a bag of balls (cap the drawn circles; show counts for big groups like cards)
  const renderBalls = N <= 40;
  const figure = (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <p className="lab-field-label">the bag, {N} total</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {groups.map((g, i) => (
            <div key={g.label} style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: colorOf(g, i) }}>{g.count} {g.label}</span>
              {renderBalls ? (
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 150 }}>
                  {Array.from({ length: g.count }, (_, j) => <span key={j} style={{ width: 16, height: 16, borderRadius: '50%', background: colorOf(g, i), opacity: j < (pick[i] ?? 0) ? 1 : 0.32, boxShadow: j < (pick[i] ?? 0) ? '0 0 0 2px var(--stage-fg)' : 'none' }} />)}
                </div>
              ) : <span style={{ width: 40, height: 16, borderRadius: 8, background: colorOf(g, i) }} />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="lab-field-label">draw {k}, you want: {groups.map((g, i) => `${pick[i] ?? 0} ${g.label}`).join(' + ')}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', minHeight: 26 }}>
          {groups.flatMap((g, i) => Array.from({ length: pick[i] ?? 0 }, (_, j) => <span key={`${i}-${j}`} style={{ width: 22, height: 22, borderRadius: '50%', background: colorOf(g, i) }} />))}
          {!valid && <span style={{ fontSize: 13, color: 'var(--stage-danger, #e03131)', fontWeight: 600 }}>← must total exactly {k} (now {sumPick})</span>}
        </div>
      </div>

      {/* the counting breakdown */}
      <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {valid ? (
          <>
            <div><Tex tex={`\\text{ways} = ${groups.map((g, i) => `C(${g.count},${pick[i]})`).join(' \\cdot ')} = ${groups.map((g, i) => nCr(g.count, pick[i]!)).join(' \\cdot ')} =`} /> <span style={{ color: 'var(--stage-good)' }}>{ways}</span></div>
            {mode === 'probability' && <div style={{ marginTop: 4 }}><Tex tex={`P = ${ways} / C(${N},${k}) = ${ways}/${total} =`} /> <span style={{ color: 'var(--stage-good)' }}>{frac(prob)}</span> <Tex tex={`\\approx ${prob.toFixed(3)}`} /></div>}
          </>
        ) : <span style={{ color: 'var(--stage-muted)', fontWeight: 500, fontSize: 14 }}>Set how many of each colour to draw, they must add up to {k}.</span>}
      </div>
    </div>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ fontSize: 12, color: 'var(--stage-muted)', fontWeight: 600 }}>{mode === 'probability' ? 'probability' : 'favourable ways'}</span>
        <span className="lab-callout-big">{mode === 'probability' ? (valid ? frac(prob) : ', ') : ways.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>of C({N},{k}) = {total.toLocaleString()} total draws</span>
      </Callout>
      <div>
        <p className="lab-prompt">🎯 How many of the {total.toLocaleString()} possible draws match? Guess, then check.</p>
        <ControlBar>
          <Field label="favourable ways"><Stepper value={guess} onChange={(v) => { setGuess(v); setChecked(false); }} min={0} max={Math.max(50, total)} /></Field>
          <CheckButton onClick={() => setChecked(true)} disabled={!valid}>Check</CheckButton>
          {checked && <StatusPill ok={guess === ways}>{guess === ways ? '✓ right!' : 'not yet'}</StatusPill>}
        </ControlBar>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      {groups.map((g, i) => (
        <Field key={g.label} label={`draw ${g.label}`}><Stepper value={pick[i] ?? 0} onChange={(v) => setPickI(i, v)} min={0} max={g.count} /></Field>
      ))}
      <Field label="total drawn k"><Stepper value={k} onChange={(v) => { setK(Math.max(1, Math.min(N, v))); setChecked(false); }} min={1} max={N} /></Field>
      <Field label="show"><span style={{ display: 'flex', gap: 6 }}>
        <Chip selected={mode === 'count'} onClick={() => setMode('count')}>count</Chip>
        <Chip selected={mode === 'probability'} onClick={() => setMode('probability')}>probability</Chip>
      </span></Field>
      <Chip selected={false} onClick={reset}>reset</Chip>
    </ControlBar>
  );

  const footer = (
    <>
      <RevealSolution available={!solved} buttonLabel="Show the count" solution={<><Tex tex={`${groups.map((g, i) => `C(${g.count},${pick[i]})`).join(' \\cdot ')} =`} /> <b>{ways}</b>{mode === 'probability' && <> favourable, so P = {frac(prob)}</>}.</>} onReveal={() => { setPeeked(true); setGuess(ways); setChecked(true); }} />
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
