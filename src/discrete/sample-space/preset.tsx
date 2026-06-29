'use client';

/**
 * SampleSpaceBoard, the GENERAL equally-likely-outcomes tool. Probability =
 * count the favourable slice of all equally-likely outcomes; this makes that
 * literal: every outcome is a cell, the learner SELECTS an event, and reads
 * favourable / total → P. The two-dice 6×6 grid is the star (you SEE P(sum=7)
 * as a diagonal of 6 cells = 1/6).
 *
 * Two authoring forms:
 *   • `dims`, a 1- or 2-D product space (one die [6], two dice [6,6], cards
 *     [4,13]); cells are coordinate pairs, events are reduce-based (sum/diff/
 *     max/min/product/doubles) so they stay DATA, not code.
 *   • `outcomes`, an explicit 1-D list (coins HHT…, custom); event = a named
 *     favourable set.
 * Counts/P come from `@classytic/labs/discrete/core`; an agent narrates them.
 */

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { useControlSurface, useLearner } from '@classytic/stage';
import { DiceGlyph } from '../../kit/probability.js';
import { CheckButton, StatusPill, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
import { gcd } from '../core/combinatorics.js';

export type Reduce = 'sum' | 'diff' | 'max' | 'min' | 'product' | 'same';
export type Cmp = 'eq' | 'ge' | 'le' | 'gt' | 'lt';

export interface SampleEvent { reduce?: Reduce; cmp?: Cmp; value?: number; favorable?: string[]; label?: string }
export interface SampleSpaceProps {
  dims?: [number] | [number, number];
  faces?: number[][];
  dice?: boolean;            // render 1–6 as die pips
  outcomes?: string[];       // explicit 1-D space
  event?: SampleEvent;
  mode?: 'explore' | 'target';
  showValue?: boolean;       // show the reduce value in each 2-D cell
  title?: string; prompt?: string; objectives?: string[]; hints?: string[]; controlId?: string;
}

const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/** A small inline die using the proper pip glyph (replaces the ⚀ emoji). */
function Die({ value, size = 24 }: { value: number; size?: number }): ReactNode {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }} aria-hidden>
      <DiceGlyph x={size * 0.1} y={size * 0.1} size={size * 0.8} value={value} />
    </svg>
  );
}
const DiceRow = ({ faces, size }: { faces: number[]; size?: number }): ReactNode => (
  <span style={{ display: 'inline-flex', gap: 3 }}>{faces.map((f, i) => <Die key={i} value={f} size={size} />)}</span>
);
const reduceVal = (a: number, b: number, r: Reduce): number => {
  switch (r) { case 'sum': return a + b; case 'diff': return Math.abs(a - b); case 'max': return Math.max(a, b); case 'min': return Math.min(a, b); case 'product': return a * b; default: return a === b ? 1 : 0; }
};
const cmpFn = (x: number, c: Cmp, v: number): boolean => {
  switch (c) { case 'eq': return x === v; case 'ge': return x >= v; case 'le': return x <= v; case 'gt': return x > v; case 'lt': return x < v; }
};
function fracStr(num: number, den: number): string {
  if (den === 0) return '0';
  const g = gcd(num, den) || 1;
  const r = `${num / g}/${den / g}`;
  return num / g === den / g ? '1' : num === 0 ? '0' : r;
}

interface Cell { key: string; label: string; favorable: boolean; dice?: number[] }

export function SampleSpaceBoardLab({
  dims, faces, dice, outcomes, event, mode: mode0, showValue, title = 'Sample space', prompt, objectives, hints: hintList, controlId,
}: SampleSpaceProps): ReactNode {
  const isTarget = (mode0 ?? (event ? 'target' : 'explore')) === 'target';
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);
  const learner = useLearner();

  const { cells, cols, total, rowFaces, colFaces, is2d } = useMemo(() => {
    const face = (d: number, i: number): number => faces?.[d]?.[i] ?? i + 1;
    if (dims && dims.length === 2) {
      const [a, b] = dims;
      const rf = Array.from({ length: a }, (_, i) => face(0, i));
      const cf = Array.from({ length: b }, (_, j) => face(1, j));
      const cs: Cell[] = [];
      for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) {
        const fi = rf[i]!, fj = cf[j]!;
        let fav = false;
        if (event) {
          if (event.reduce === 'same') fav = fi === fj;
          else if (event.reduce && event.cmp && event.value != null) fav = cmpFn(reduceVal(fi, fj, event.reduce), event.cmp, event.value);
        }
        const showsValue = showValue && event?.reduce && event.reduce !== 'same';
        const label = showsValue ? String(reduceVal(fi, fj, event.reduce!)) : dice ? `${DIE[fi] ?? fi}${DIE[fj] ?? fj}` : `${fi},${fj}`;
        cs.push({ key: `${i},${j}`, label, favorable: fav, dice: dice && !showsValue ? [fi, fj] : undefined });
      }
      return { cells: cs, cols: b, total: a * b, rowFaces: rf, colFaces: cf, is2d: true };
    }
    if (outcomes) {
      const favset = new Set(event?.favorable ?? []);
      const cs: Cell[] = outcomes.map((o) => ({ key: o, label: o, favorable: favset.has(o) }));
      return { cells: cs, cols: Math.min(outcomes.length, 8), total: outcomes.length, rowFaces: [], colFaces: [], is2d: false };
    }
    const a = dims?.[0] ?? 6;
    const cs: Cell[] = Array.from({ length: a }, (_, i) => { const fi = face(0, i); return { key: `${i}`, label: dice ? (DIE[fi] ?? String(fi)) : String(fi), favorable: !!event?.favorable?.includes(String(fi)), dice: dice ? [fi] : undefined }; });
    return { cells: cs, cols: Math.min(a, 8), total: a, rowFaces: [], colFaces: [], is2d: false };
  }, [dims, faces, dice, outcomes, event, showValue]);

  const targetKeys = useMemo(() => new Set(cells.filter((c) => c.favorable).map((c) => c.key)), [cells]);
  const favorableCount = isTarget ? targetKeys.size : sel.size;
  const correct = useMemo(() => sel.size === targetKeys.size && [...sel].every((k) => targetKeys.has(k)), [sel, targetKeys]);
  const solved = isTarget && checked && correct && !peeked;
  useCheckpoint({ solved, activity: `sample-space:${title}`, hintsUsed: hints.count });

  const toggle = (k: string): void => { setChecked(false); setSel((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; }); };
  const check = (): void => setChecked(true);
  const reset = (): void => { setSel(new Set()); setChecked(false); };
  const reveal = (): void => { setPeeked(true); setSel(new Set(targetKeys)); setChecked(true); learner?.report({ activity: `sample-space:${title}`, correct: false, completion: true, score: { raw: 0, max: 1 } }); };

  useControlSurface(controlId, {
    reveal: { type: 'action', label: 'select the event', invoke: reveal },
    check: { type: 'action', label: 'grade the selection', invoke: check },
    reset: { type: 'action', label: 'clear', invoke: reset },
  });

  const cellStyle = (c: Cell): React.CSSProperties => {
    const on = sel.has(c.key);
    const isFav = targetKeys.has(c.key);
    let bg = 'transparent', bd = 'var(--stage-grid)', col = 'var(--stage-fg)';
    if (isTarget && checked) {
      if (on && isFav) { bg = 'color-mix(in oklab, var(--stage-good) 20%, transparent)'; bd = 'var(--stage-good)'; }
      else if (on && !isFav) { bg = 'color-mix(in oklab, var(--stage-danger) 16%, transparent)'; bd = 'var(--stage-danger)'; }
      else if (!on && isFav) { bd = 'var(--stage-good)'; col = 'var(--stage-good)'; } // missed
    } else if (on) { bg = 'color-mix(in oklab, var(--stage-accent) 18%, transparent)'; bd = 'var(--stage-accent)'; }
    return { aspectRatio: '1', minWidth: 34, padding: '4px', borderRadius: 8, border: `1.5px solid ${bd}`, background: bg, color: col, fontWeight: 700, fontSize: dice ? 18 : 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  };

  const figure = (
    <div style={{ display: 'inline-block', borderRadius: 12, border: '1px solid var(--stage-grid)', background: 'var(--stage-bg)', padding: 12, margin: '8px 0', overflowX: 'auto' }}>
        {is2d ? (
          <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${cols}, 1fr)`, gap: 4 }}>
            <span />
            {colFaces.map((f, j) => <span key={j} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, color: 'var(--stage-accent-2)', fontSize: 13 }}>{dice ? <Die value={f} size={24} /> : f}</span>)}
            {rowFaces.map((rf, i) => (
              <Fragment key={i}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 800, color: 'var(--stage-accent)', fontSize: 13, paddingRight: 4 }}>{dice ? <Die value={rf} size={24} /> : rf}</span>
                {colFaces.map((_, j) => { const c = cells[i * cols + j]!; return <button key={j} type="button" onClick={() => toggle(c.key)} style={cellStyle(c)} aria-label={`outcome ${c.label}`}>{c.dice ? <DiceRow faces={c.dice} size={18} /> : c.label}</button>; })}
              </Fragment>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
            {cells.map((c) => <button key={c.key} type="button" onClick={() => toggle(c.key)} style={cellStyle(c)} aria-label={`outcome ${c.label}`}>{c.dice ? <DiceRow faces={c.dice} size={18} /> : c.label}</button>)}
          </div>
        )}
    </div>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        P{event?.label ? `(${event.label})` : ''} = {favorableCount}/{total} = <span style={{ color: 'var(--stage-accent)' }}>{fracStr(favorableCount, total)}</span> ≈ {(total ? favorableCount / total : 0).toFixed(3)}
      </span>
      {isTarget && (
        <>
          <CheckButton onClick={check} disabled={sel.size === 0}>Check</CheckButton>
          {checked && <StatusPill ok={correct}>{correct ? '✓ Exactly the event' : 'Not quite, green outlines are the ones you missed'}</StatusPill>}
        </>
      )}
      {!isTarget && sel.size > 0 && <Chip selected onClick={reset}>clear</Chip>}
    </ControlBar>
  );

  const footer = (
    <>
      {isTarget && (
        <RevealSolution available={checked && !correct} solution={<>{targetKeys.size} of {total} outcomes match{event?.label ? <> ({event.label})</> : ''} → P = <b>{fracStr(targetKeys.size, total)}</b>.</>} onReveal={reveal} />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
