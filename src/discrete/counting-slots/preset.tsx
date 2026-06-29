'use client';

/**
 * CountingSlotsLab, counting made concrete, the FUN way (the tree drowns past ~8
 * leaves; this scales and reads friendly). The multiplication principle as filling
 * a row of POSITIONS: fill slot 1 from the whole pool, slot 2 from what's left, … , 
 * the pool shrinks, the product builds (4 × 3 × 2). It covers the whole family from
 * one model:
 *   • arrange (order matters)      → permutations nPr  (k = n ⇒ factorial n!)
 *   • arrange + repeats            → nᵏ  (PINs, with replacement)
 *   • choose (order doesn't)       → combinations nCr, and you WATCH the k! orderings
 *     of one selection collapse into a single group (the ÷k! correction, made literal)
 *
 * Predict-then-check; the kernel (nPr/nCr/factorial) is the source of truth.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { factorial, nPr, nCr } from '../core/combinatorics.js';
import { Chip, Stepper, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export type SlotMode = 'arrange' | 'choose';
export interface CountingSlotsProps {
  items?: string[];
  slots?: number;
  positions?: string[];        // labels above each slot (e.g. 🥇 🥈 🥉)
  mode?: SlotMode;
  replacement?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const allPerms = <T,>(a: T[]): T[][] => a.length <= 1 ? [a] : a.flatMap((x, i) => allPerms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));

export function CountingSlotsLab({
  items = ['A', 'B', 'C', 'D'], slots = 3, positions, mode: mode0 = 'arrange', replacement: repl0 = false,
  title = 'Counting by filling slots', prompt, objectives, hints: hintList, controlId,
}: CountingSlotsProps): ReactNode {
  const n = items.length;
  const [mode, setMode] = useState<SlotMode>(mode0);
  const [repl, setRepl] = useState(repl0);
  const [k, setK] = useState(Math.min(slots, repl0 ? slots : n));
  const [step, setStep] = useState(0);            // slots filled so far
  const [guess, setGuess] = useState(0);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);

  const choices = (i: number): number => (repl ? n : n - i);            // choices for slot i
  const arrangeTotal = useMemo(() => (repl ? n ** k : nPr(n, k)), [repl, n, k]);
  const total = mode === 'choose' ? nCr(n, k) : arrangeTotal;
  const sample = useMemo(() => Array.from({ length: k }, (_, i) => items[repl ? i % n : i]!), [items, k, repl, n]);
  const productSoFar = useMemo(() => { let p = 1; for (let i = 0; i < step; i++) p *= choices(i); return p; }, [step, repl, n]);

  const reset = (): void => { setStep(0); setGuess(0); setChecked(false); setPeeked(false); };
  const fillNext = (): void => setStep((s) => Math.min(k, s + 1));
  const solved = checked && guess === total && !peeked;
  useCheckpoint({ solved, activity: `counting-slots:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    mode: { type: 'enum', label: 'order matters?', options: ['arrange', 'choose'], get: () => mode, set: (v) => { setMode(v as SlotMode); reset(); } },
    replacement: { type: 'boolean', label: 'allow repeats', get: () => repl, set: (v) => { setRepl(v); reset(); } },
    slots: { type: 'number', label: 'positions k', min: 1, max: repl ? 6 : n, step: 1, get: () => k, set: (v) => { setK(Math.round(v)); reset(); } },
    fill: { type: 'action', label: 'fill the next slot', invoke: fillNext },
    reveal: { type: 'action', label: 'reveal the count', invoke: () => { setStep(k); setPeeked(true); setGuess(total); setChecked(true); } },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const used = new Set(repl ? [] : sample.slice(0, step));
  const filled = step >= k;
  const collapse = mode === 'choose' && filled;

  // figure: pool of items + a row of slots that fill one at a time
  const figure = (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <p className="lab-field-label">the pool, {n} to pick from{!repl && ', each used once'}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {items.map((it, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 34, height: 34, padding: '0 8px', borderRadius: 9, fontSize: 17, fontWeight: 700,
              border: '1.5px solid var(--stage-grid)', background: used.has(it) ? 'transparent' : 'color-mix(in oklab, var(--stage-accent) 12%, transparent)',
              opacity: used.has(it) ? 0.3 : 1, textDecoration: used.has(it) ? 'line-through' : 'none' }}>{it}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="lab-field-label">{k} position{k === 1 ? '' : 's'} to fill {mode === 'choose' ? '(a group, order won\'t matter)' : '(in order)'}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {Array.from({ length: k }, (_, i) => {
            const done = i < step, here = i === step;
            return (
              <div key={i} style={{ display: 'grid', justifyItems: 'center', gap: 3 }}>
                {positions?.[i] && <span style={{ fontSize: 15 }}>{positions[i]}</span>}
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 11, fontSize: 20, fontWeight: 800,
                  border: `2px ${done ? 'solid' : 'dashed'} ${here ? 'var(--stage-good)' : done ? 'var(--stage-accent)' : 'var(--stage-grid)'}`,
                  background: done ? 'color-mix(in oklab, var(--stage-accent) 16%, transparent)' : 'transparent', color: done ? 'var(--stage-fg)' : 'var(--stage-muted)' }}>
                  {done ? sample[i] : here ? '?' : ''}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: done ? 'var(--stage-accent)' : 'var(--stage-muted)' }}>
                  {done || here ? `${choices(i)}` : '·'}<span style={{ fontWeight: 500, fontSize: 10 }}> {done || here ? 'choices' : ''}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* the product builds as slots fill */}
      <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
        {step === 0 ? <span style={{ color: 'var(--stage-muted)', fontWeight: 500, fontSize: 14 }}>Fill the first slot, how many choices?</span> : (
          <>
            <Tex tex={Array.from({ length: step }, (_, i) => choices(i)).join(' \\times ')} />
            {step < k && <span style={{ color: 'var(--stage-muted)' }}> <Tex tex={'\\times \\ldots'} /></span>}
            {filled && <> = <span style={{ color: 'var(--stage-good)' }}>{arrangeTotal}</span> {mode === 'arrange' ? 'arrangements' : 'ordered'}</>}
            {!filled && <> = {productSoFar} so far</>}
          </>
        )}
      </div>

      {/* combination collapse: k! orderings of one group → 1 */}
      {collapse && (
        <div style={{ padding: '10px 12px', borderRadius: 10, background: 'color-mix(in oklab, var(--stage-warn) 10%, transparent)', border: '1px solid var(--stage-grid)' }}>
          <p className="lab-field-label">order doesn't matter, these are all the SAME group</p>
          {factorial(k) <= 8 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {allPerms(sample).map((p, i) => <span key={i} style={{ fontWeight: 700, fontSize: 13, padding: '2px 7px', borderRadius: 7, background: 'color-mix(in oklab, var(--stage-muted) 14%, transparent)' }}>{p.join('')}</span>)}
              <span style={{ margin: '0 4px', color: 'var(--stage-muted)' }}>→</span>
              <span style={{ fontWeight: 800, padding: '2px 9px', borderRadius: 7, background: 'color-mix(in oklab, var(--stage-good) 18%, transparent)', color: 'var(--stage-good)' }}>{`{${sample.join(', ')}}`} = 1</span>
            </div>
          ) : <p style={{ fontSize: 13 }}>Each group of {k} can be ordered in {k}! = {factorial(k)} ways, all the same selection.</p>}
          <p style={{ marginTop: 8, fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            <Tex tex={`${arrangeTotal} \\div ${k}! = ${arrangeTotal} \\div ${factorial(k)} =`} /> <span style={{ color: 'var(--stage-good)' }}>{total}</span> groups
          </p>
        </div>
      )}

      {/* the closed-form FORMULA, derived from what just happened (not stated cold) */}
      {filled && (
        <div style={{ padding: '8px 12px', borderRadius: 10, border: '1px dashed var(--stage-grid)', fontSize: 14.5, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.03em', color: 'var(--stage-muted)' }}>📐 SO THE FORMULA IS </span><br />
          {repl
            ? <span><Tex tex={`n^{k} = ${n}^{${k}} =`} /> <b style={{ color: 'var(--stage-good)' }}>{arrangeTotal}</b> <span style={{ color: 'var(--stage-muted)' }}>(each slot has all {n} again)</span></span>
            : mode === 'arrange'
              ? <span><Tex tex={k === n ? `n! = ${n}! =` : `P(${n},${k}) = ${n} \\times \\ldots \\times ${n - k + 1} = ${n}! / (${n}-${k})! =`} /> <b style={{ color: 'var(--stage-good)' }}>{arrangeTotal}</b> <span style={{ color: 'var(--stage-muted)' }}>(the {k === n ? '' : 'unfilled '}tail {k === n ? '' : `${n - k}!`} cancels)</span></span>
              : <span><Tex tex={`C(${n},${k}) = P(${n},${k}) / ${k}! = ${n}! / (${k}! \\cdot (${n}-${k})!) =`} /> <b style={{ color: 'var(--stage-good)' }}>{total}</b></span>}
        </div>
      )}
    </div>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ fontSize: 12, color: 'var(--stage-muted)', fontWeight: 600 }}>
          {mode === 'choose' ? `choose ${k} of ${n}` : repl ? `${k} from ${n} (repeats ok)` : k === n ? `arrange all ${n}` : `arrange ${k} of ${n}`}
        </span>
        <span className="lab-callout-big">{total.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>
          {mode === 'choose' ? `${n}C${k}` : repl ? `${n}^${k}` : k === n ? `${n}!` : `${n}P${k}`}
        </span>
      </Callout>
      <div>
        <p className="lab-prompt">🎯 How many ways? Guess, then fill the slots to check.</p>
        <ControlBar>
          <Field label="your answer"><Stepper value={guess} onChange={(v) => { setGuess(v); setChecked(false); }} min={0} max={Math.max(50, total * 2)} /></Field>
          <CheckButton onClick={() => setChecked(true)}>Check</CheckButton>
          {checked && <StatusPill ok={guess === total}>{guess === total ? '✓ right!' : 'not yet, fill the slots'}</StatusPill>}
        </ControlBar>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="order"><span style={{ display: 'flex', gap: 6 }}>
        <Chip selected={mode === 'arrange'} onClick={() => { setMode('arrange'); reset(); }}>matters (arrange)</Chip>
        <Chip selected={mode === 'choose'} onClick={() => { setMode('choose'); reset(); }}>doesn't (choose)</Chip>
      </span></Field>
      {mode === 'arrange' && <Field label="repeats"><Chip selected={repl} onClick={() => { setRepl((r) => !r); reset(); }}>{repl ? 'allowed (nᵏ)' : 'each once'}</Chip></Field>}
      <Field label="positions k"><Stepper value={k} onChange={(v) => { setK(Math.max(1, Math.min(repl ? 6 : n, v))); reset(); }} min={1} max={repl ? 6 : n} /></Field>
      <Chip selected={false} onClick={fillNext}>{filled ? '✓ filled' : '▶ fill next slot'}</Chip>
      <Chip selected={false} onClick={reset}>reset</Chip>
    </ControlBar>
  );

  const footer = (
    <>
      <RevealSolution available={!filled || (checked && !solved)} buttonLabel="Show the count" solution={<>{mode === 'choose' ? `${n}C${k}` : repl ? `${n}^${k}` : k === n ? `${n}!` : `${n}P${k}`} = <b>{total}</b>{mode === 'choose' && <> (={arrangeTotal} ÷ {k}!)</>}.</>} onReveal={() => { setStep(k); setPeeked(true); setGuess(total); setChecked(true); }} />
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
