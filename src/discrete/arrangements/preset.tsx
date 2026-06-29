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

import { useMemo, useState, type ReactNode } from 'react';
import { factorial, multinomial } from '../core/combinatorics.js';
import { Stepper, CheckButton, StatusPill, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
import { CATEGORICAL } from '../../kit/palette.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface ArrangeItem { label: string; count: number; color?: string }
export interface ArrangementsProps {
  word?: string;            // convenience: "MISSISSIPPI" → letter counts
  items?: ArrangeItem[];    // or explicit coloured groups
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const PALETTE = CATEGORICAL;

function fromWord(w: string): ArrangeItem[] {
  const order: string[] = [], m = new Map<string, number>();
  for (const ch of w.toUpperCase()) { if (!/[A-Z]/.test(ch)) continue; if (!m.has(ch)) order.push(ch); m.set(ch, (m.get(ch) ?? 0) + 1); }
  return order.map((l) => ({ label: l, count: m.get(l)! }));
}

export function ArrangementsLab({ word, items, title = 'Arrange with repeats', prompt, objectives, hints: hintList, controlId }: ArrangementsProps): ReactNode {
  const base = useMemo(() => (items ?? (word ? fromWord(word) : fromWord('MISSISSIPPI'))), [items, word]);
  const [counts, setCounts] = useState<number[]>(base.map((g) => g.count));
  const [guess, setGuess] = useState(0);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);

  const groups = base.map((g, i) => ({ ...g, count: counts[i]!, color: g.color ?? PALETTE[i % PALETTE.length]! }));
  const live = groups.filter((g) => g.count > 0);
  const n = live.reduce((a, g) => a + g.count, 0);
  const nFact = factorial(n);
  const total = useMemo(() => (n > 0 ? multinomial(...live.map((g) => g.count)) : 1), [counts]);
  const repeats = live.filter((g) => g.count > 1);
  const tiles = live.flatMap((g) => Array.from({ length: g.count }, () => g));
  const swapGroup = repeats.slice().sort((a, b) => b.count - a.count)[0];

  const setI = (i: number, v: number): void => { setChecked(false); setCounts((c) => c.map((x, j) => (j === i ? Math.max(0, Math.min(8, v)) : x))); };
  const reset = (): void => { setChecked(false); setPeeked(false); setGuess(0); setCounts(base.map((g) => g.count)); };
  const solved = checked && guess === total && !peeked;
  useCheckpoint({ solved, activity: `arrangements:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    ...Object.fromEntries(base.map((g, i) => [`count_${g.label}`, { type: 'number' as const, label: `# of ${g.label}`, min: 0, max: 8, step: 1, get: () => counts[i] ?? 0, set: (v: number) => setI(i, v) }])),
    reveal: { type: 'action', label: 'reveal the count', invoke: () => { setPeeked(true); setGuess(total); setChecked(true); } },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const figure = (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <p className="lab-field-label">{n} items in a row, identical ones share a colour</p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tiles.map((g, i) => {
            const isSwap = swapGroup && g.label === swapGroup.label;
            const swapIdx = isSwap ? tiles.filter((t, j) => j < i && t.label === g.label).length : -1;
            const flag = isSwap && swapIdx < 2;
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, fontWeight: 800, fontSize: 15, color: 'white', background: g.color,
                boxShadow: flag ? '0 0 0 2px var(--stage-fg)' : 'none' }}>{g.label}</span>
            );
          })}
        </div>
      </div>

      {/* the overcount intuition */}
      {swapGroup && (
        <p className="lab-prompt">
          Swap the two ringed <b style={{ color: swapGroup.color }}>{swapGroup.label}</b>'s ⇄, it's the <b>same row</b>. So every arrangement is counted {swapGroup.count}! times over (once per ordering of the {swapGroup.count} {swapGroup.label}'s).
        </p>
      )}

      {/* derivation → formula */}
      <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--stage-grid)', fontSize: 15, fontVariantNumeric: 'tabular-nums', display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>📐 WHY THE FORMULA</span>
        <span>if all {n} were different: <b>{n}!</b> = {nFact.toLocaleString()} orders</span>
        {repeats.length > 0 && <span>but identical copies repeat: <Tex tex={`\\div\\ ${repeats.map((g) => `${g.count}!`).join(' \\cdot ')}`} /> <span style={{ color: 'var(--stage-muted)' }}>({repeats.map((g) => `the ${g.count} ${g.label}'s`).join(', ')})</span></span>}
        <span style={{ fontWeight: 800 }}><Tex tex={`${n}! / (${live.map((g) => `${g.count}!`).join(' \\cdot ')}) = ${nFact.toLocaleString().replace(/,/g, '{,}')} / ${live.reduce((a, g) => a * factorial(g.count), 1).toLocaleString().replace(/,/g, '{,}')} =`} /> <span style={{ color: 'var(--stage-good)' }}>{total.toLocaleString()}</span> distinct arrangements</span>
      </div>
    </div>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ fontSize: 12, color: 'var(--stage-muted)', fontWeight: 600 }}>distinct arrangements</span>
        <span className="lab-callout-big">{total.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}><Tex tex={`${n}! / ${live.map((g) => `${g.count}!`).join(' \\cdot ')}`} /></span>
      </Callout>
      <div>
        <p className="lab-prompt">🎯 How many distinct rows? Guess, then check.</p>
        <ControlBar>
          <Field label="your answer"><Stepper value={guess} onChange={(v) => { setGuess(v); setChecked(false); }} min={0} max={Math.max(100, total)} /></Field>
          <CheckButton onClick={() => setChecked(true)}>Check</CheckButton>
          {checked && <StatusPill ok={guess === total}>{guess === total ? '✓ right!' : 'not yet'}</StatusPill>}
        </ControlBar>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      {base.map((g, i) => (
        <Field key={g.label} label={`# ${g.label}`}><Stepper value={counts[i] ?? 0} onChange={(v) => setI(i, v)} min={0} max={8} /></Field>
      ))}
      <Chip selected={false} onClick={reset}>reset</Chip>
    </ControlBar>
  );

  const footer = (
    <>
      <RevealSolution available={!solved} buttonLabel="Show the count" solution={<><Tex tex={`${n}! / (${live.map((g) => `${g.count}!`).join(' \\cdot ')}) =`} /> <b>{total.toLocaleString()}</b> distinct arrangements.</>} onReveal={() => { setPeeked(true); setGuess(total); setChecked(true); }} />
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
