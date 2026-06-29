'use client';

/**
 * SequencePredict, the flagship "watch it grow, then predict the next term" lab, the
 * joke-that-doubles lesson. A sequence is shown as a row of <DotCluster> dishes (you
 * SEE 3 → 6 → 12 get denser, the new dots lit up), and the learner fills the hidden
 * terms by tapping number tiles (<SlotFill>) instead of typing. It's the exponential/
 * geometric counterpart to <LinearModelLab>: discover the multiplicative (or additive)
 * rule from the picture, not from a formula handed to you.
 *
 * Authorable as one config: the start value, ×ratio or +difference, how many terms are
 * shown vs predicted, the story sentence, and the distractor tiles. Same engine covers
 * "doubles each day", "halves each hour", "+3 each step", compound interest, half-life.
 */

import { useState, type ReactNode } from 'react';
import { LabFrame } from '../../kit/frame.js';
import { SlotFill, type FillSlot } from '../../kit/slot-fill.js';
import { getScene } from '../../kit/scenes.js';

export type SequenceRule = 'geometric' | 'arithmetic';

export interface SequencePredictProps {
  /** First term (index 0). */
  start?: number;
  rule?: SequenceRule;
  /** ×ratio (geometric) or +difference (arithmetic). */
  factor?: number;
  /** How many leading terms show their value. */
  shown?: number;
  /** How many following terms the learner predicts. */
  predict?: number;
  /** Caption for each dish, e.g. "Day". */
  stepLabel?: string;
  /** Extra wrong-answer tiles in the tray. */
  distractors?: number[];
  /** Light up the items added at each step (the "it doubled" cue). */
  highlightNew?: boolean;
  /** Which COUNT scene represents each term: 'cluster' | 'grid' | 'coins' | 'blocks' | … */
  scene?: string;
  /** Tint for the items (default accent). */
  color?: string;
  /** Round dish values (keep integers for counts). */
  integer?: boolean;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

function buildTerms(start: number, rule: SequenceRule, factor: number, n: number, integer: boolean): number[] {
  const out = [start];
  for (let i = 1; i < n; i++) {
    const v = rule === 'geometric' ? out[i - 1]! * factor : out[i - 1]! + factor;
    out.push(integer ? Math.round(v) : v);
  }
  return out;
}

/** Plausible wrong tiles, the classic "added instead of multiplied" near-misses. */
function autoDistractors(answers: number[], terms: number[], factor: number): number[] {
  const real = new Set(terms);
  const cand = new Set<number>();
  for (const a of answers) {
    cand.add(a + factor);
    cand.add(a - factor);
    cand.add(Math.round(a * 1.5));
  }
  return [...cand].filter((v) => v > 0 && !real.has(v)).sort((x, y) => x - y).slice(0, 3);
}

export function SequencePredict(props: SequencePredictProps = {}): ReactNode {
  const {
    start = 3, rule = 'geometric', factor = 2, shown = 1, predict = 2,
    stepLabel = 'Day', distractors = [], highlightNew = true, scene = 'cluster', color, integer = true, height,
    title = 'How does it grow?',
    prompt = rule === 'geometric'
      ? `Each ${stepLabel.toLowerCase()} it multiplies by ${factor}. Fill in the hidden counts.`
      : `Each ${stepLabel.toLowerCase()} it changes by ${factor}. Fill in the hidden counts.`,
    activity = 'sequence-predict',
  } = props;

  const nTerms = shown + predict;
  const terms = buildTerms(start, rule, factor, nTerms, integer);
  const [revealed, setRevealed] = useState(false);

  // dish size shrinks a touch as the row gets longer so it fits on one line
  const dish = Math.max(96, Math.min(140, (height ?? 150) - (nTerms > 4 ? (nTerms - 4) * 8 : 0)));

  const slots: FillSlot[] = [];
  for (let i = shown; i < nTerms; i++) {
    slots.push({ id: `t${i}`, answer: terms[i]!, label: `${stepLabel} ${i}` });
  }

  // tray = the answers + distractors, de-duped, sorted for a tidy tray
  const answers = slots.map((s) => Number(s.answer));
  const extras = distractors.length ? distractors : autoDistractors(answers, terms, factor);
  const tilePool = Array.from(new Set([...answers, ...extras])).sort((a, b) => a - b);

  const sceneMeta = getScene(scene) ?? getScene('cluster')!;

  const figure = (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {terms.map((v, i) => {
        const isPredicted = i >= shown;
        const show = !isPredicted || revealed;
        const added = i === 0 ? 0 : Math.max(0, terms[i]! - terms[i - 1]!);
        const current = isPredicted && i === nTerms - 1;
        return (
          <div key={i} style={{ display: 'grid', justifyItems: 'center', gap: 4, padding: 6, borderRadius: 12, border: current ? '2px solid var(--stage-accent)' : '2px solid transparent' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--stage-fg)' }}>{stepLabel} {i}</span>
            {sceneMeta.render({ count: v, highlight: highlightNew ? added : 0, width: dish, height: dish, color })}
            <span style={{ minWidth: 32, padding: '2px 8px', borderRadius: 5, fontSize: 14, fontWeight: 800, textAlign: 'center', background: 'var(--stage-bg)', border: '1.5px solid color-mix(in oklab, var(--stage-fg) 30%, transparent)', fontVariantNumeric: 'tabular-nums' }}>{show ? v : '?'}</span>
          </div>
        );
      })}
    </div>
  );

  const footer = (
    <SlotFill
      slots={slots}
      tiles={tilePool}
      activity={activity}
      onSolved={() => setRevealed(true)}
    />
  );

  return <LabFrame title={title} prompt={prompt} footer={footer}>{figure}</LabFrame>;
}
