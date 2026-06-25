'use client';

/**
 * OutcomeBuilderLab — "where do the possibilities come from?" Build a sample space
 * one stage at a time: add a coin or a die and watch the list of ALL outcomes
 * fan out, with the counting principle spelled out (2 × 2 × 6 = 24). Each outcome
 * is drawn with the real coin/dice glyphs, so the abstract "sample space" is a
 * concrete board you can point at. Click outcomes to mark an EVENT and read its
 * probability as favourable ÷ total — the definition, built by hand.
 *
 * Pure enumeration (cartesian product of the per-stage option lists); P uses the
 * gcd from the discrete kernel for a reduced fraction.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { CoinGlyph, DiceGlyph } from '../../kit/probability.js';
import { gcd } from '../core/combinatorics.js';
import { Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, useCheckpoint } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

type StageKind = 'coin' | 'die';
export interface OutcomeBuilderProps {
  stages?: StageKind[];
  maxOutcomes?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

interface Item { kind: StageKind; val: string | number }
const OPTIONS: Record<StageKind, (string | number)[]> = { coin: ['H', 'T'], die: [1, 2, 3, 4, 5, 6] };

const ItemGlyph = ({ it, size = 26 }: { it: Item; size?: number }): ReactNode => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }} aria-hidden>
    {it.kind === 'coin'
      ? <CoinGlyph cx={size / 2} cy={size / 2} r={size * 0.42} face={String(it.val)} />
      : <DiceGlyph x={size * 0.1} y={size * 0.1} size={size * 0.8} value={Number(it.val)} />}
  </svg>
);

export function OutcomeBuilderLab({ stages: stages0 = ['coin', 'coin'], maxOutcomes = 72, title = 'Build the sample space', prompt, objectives, hints: hintList, controlId }: OutcomeBuilderProps): ReactNode {
  const [stages, setStages] = useState<StageKind[]>(stages0);
  const [fav, setFav] = useState<Set<string>>(new Set());
  const hints = useHints(hintList);

  const outcomes = useMemo(() => {
    let acc: Item[][] = [[]];
    for (const s of stages) acc = acc.flatMap((row) => OPTIONS[s].map((v) => [...row, { kind: s, val: v }]));
    return acc;
  }, [stages]);

  const total = stages.reduce((a, s) => a * OPTIONS[s].length, 1);
  const tooMany = total > maxOutcomes;
  const key = (o: Item[]): string => o.map((it) => `${it.kind[0]}${it.val}`).join('');

  const add = (k: StageKind): void => { if (total * OPTIONS[k].length <= maxOutcomes * 4) { setStages((s) => [...s, k]); setFav(new Set()); } };
  const removeStage = (): void => { setStages((s) => s.slice(0, -1)); setFav(new Set()); };
  const reset = (): void => { setStages(stages0); setFav(new Set()); };
  const toggle = (k: string): void => setFav((f) => { const n = new Set(f); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const favCount = fav.size;
  const g = favCount > 0 ? gcd(favCount, total) : 1;
  useCheckpoint({ solved: favCount > 0, activity: `outcome-builder:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    addCoin: { type: 'action', label: 'add a coin', invoke: () => add('coin') },
    addDie: { type: 'action', label: 'add a die', invoke: () => add('die') },
    remove: { type: 'action', label: 'remove last stage', invoke: removeStage },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const figure = (
    <>
      {/* counting principle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 16, fontWeight: 700, margin: '6px 0' }}>
        {stages.map((s, i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ color: 'var(--stage-muted)' }}>×</span>}
          <span style={{ color: 'var(--stage-accent)' }}>{OPTIONS[s].length}</span>
          <span style={{ fontSize: 11, color: 'var(--stage-muted)', fontWeight: 500 }}>({s})</span>
        </span>)}
        {stages.length > 0 && <><span style={{ color: 'var(--stage-muted)' }}>=</span><span style={{ color: 'var(--stage-good)' }}>{total}</span><span style={{ fontSize: 13, color: 'var(--stage-muted)', fontWeight: 500 }}>outcomes</span></>}
      </div>

      {/* the sample space */}
      {tooMany ? (
        <p style={{ margin: '12px 0', padding: 12, borderRadius: 10, border: '1px dashed var(--stage-grid)', color: 'var(--stage-muted)' }}>
          That's <b>{total}</b> equally-likely outcomes — too many to draw. The counting principle still gives the count without listing them all.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0', padding: 10, borderRadius: 12, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
          {outcomes.map((o) => {
            const k = key(o); const on = fav.has(k);
            return (
              <button key={k} type="button" onClick={() => toggle(k)} aria-pressed={on}
                style={{ display: 'inline-flex', gap: 2, padding: '4px 6px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${on ? 'var(--stage-good)' : 'var(--stage-grid)'}`,
                  background: on ? 'color-mix(in oklab, var(--stage-good) 16%, transparent)' : 'transparent' }}>
                {o.map((it, i) => <ItemGlyph key={i} it={it} size={24} />)}
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  const controls = (
    <ControlBar>
      <Chip selected={false} onClick={() => add('coin')}>+ coin</Chip>
      <Chip selected={false} onClick={() => add('die')}>+ die</Chip>
      <Chip selected={false} onClick={removeStage}>− stage</Chip>
      <Chip selected={false} onClick={reset}>reset</Chip>
      <Chip selected={false} onClick={() => setFav(new Set())}>clear event</Chip>
    </ControlBar>
  );

  const aside = (
    <Callout tone={favCount > 0 ? 'result' : 'info'}>
      {favCount > 0 ? (
        <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}>
          <Tex tex={`P(\\text{event}) = ${favCount}/${total}`} />{g > 1 && <span style={{ color: 'var(--stage-muted)' }}> <Tex tex={`= ${favCount / g}/${total / g}`} /></span>} <Tex tex={`= ${(favCount / total).toFixed(3)}`} />
        </span>
      ) : (
        <span style={{ color: 'var(--stage-muted)' }}>Click outcomes to mark an event → its probability is favourable ÷ {total}.</span>
      )}
    </Callout>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<HintLadder hints={hints} />}>{figure}</LabFrame>;
}
