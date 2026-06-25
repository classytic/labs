'use client';

/**
 * TransformLab — change one sentence into another and SEE what changed.
 *
 * Shows the source sentence (read-only), an instruction ("Make it a question"),
 * and the learner rebuilds the target by tapping tiles. On success the words
 * that are NEW vs the source are ringed — so the rule (e.g. English injects
 * "Do" for a question; Bangla has no do-support) is visible, not just stated.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckButton, StatusPill, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Tile } from '../ui.js';
import { seededShuffle, type Pos } from '../deck.js';

export interface TransformTile { text: string; pos?: Pos; gloss?: string }

export interface TransformProps {
  /** Source sentence tiles (correct order) — shown read-only. */
  from: TransformTile[];
  /** Target sentence tiles (correct order) — the learner rebuilds these. */
  to: TransformTile[];
  /** What to do, e.g. "Make it a question". */
  instruction?: string;
  /** One-line explanation shown on success. */
  note?: string;
  title?: string;
  targetDir?: 'ltr' | 'rtl';
}

export function TransformLab({ from, to, instruction = 'Change the sentence.', note, title = 'Transform it', targetDir = 'ltr' }: TransformProps): ReactNode {
  const target = useMemo(() => to.map((t) => t.text).join(' '), [to]);
  const initialBank = useMemo(() => {
    const idx = to.map((_, i) => i);
    let order = seededShuffle(idx, to.length * 11 + 2);
    if (to.length > 1 && order.map((i) => to[i]!.text).join(' ') === target) order = order.slice().reverse();
    return order;
  }, [to, target]);

  const [bank, setBank] = useState<number[]>(initialBank);
  const [line, setLine] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => { setBank(initialBank); setLine([]); setChecked(false); }, [initialBank]);

  const attempt = line.map((i) => to[i]!.text).join(' ');
  const full = line.length === to.length;
  const correct = full && attempt === target;

  useCheckpoint({ solved: correct, activity: 'transform' });

  const fromWords = useMemo(() => new Set(from.map((t) => t.text.toLowerCase())), [from]);
  const isNew = (i: number): boolean => !fromWords.has(to[i]!.text.toLowerCase());

  const place = (i: number): void => { setBank((b) => b.filter((x) => x !== i)); setLine((l) => [...l, i]); setChecked(false); };
  const take = (i: number): void => { setLine((l) => l.filter((x) => x !== i)); setBank((b) => [...b, i]); setChecked(false); };
  const reset = (): void => { setBank(initialBank); setLine([]); setChecked(false); };

  const figure = (
    <div className="lang-lab">
      {/* source (read-only) */}
      <div className="lang-from" dir={targetDir} aria-label="given sentence">
        {from.map((t, i) => <Tile key={i} pos={t.pos} text={t.text} gloss={t.gloss} dir={targetDir} ariaLabel={`${t.text} (given)`} />)}
      </div>
      <div className="lang-arrow" aria-hidden>↓</div>

      {/* target (build) */}
      <div className="lang-line" data-state={checked ? (correct ? 'ok' : 'no') : 'idle'} aria-label="your sentence">
        {line.length === 0
          ? <span className="lang-line-empty">Tap the words to build it.</span>
          : line.map((i) => <Tile key={i} pos={to[i]!.pos} text={to[i]!.text} gloss={to[i]!.gloss} dir={targetDir} selected={checked && correct && isNew(i)} onClick={() => take(i)} ariaLabel={`${to[i]!.text} — tap to remove`} />)}
      </div>
      <div className="lang-bank" aria-label="word bank">
        {bank.map((i) => <Tile key={i} pos={to[i]!.pos} text={to[i]!.text} gloss={to[i]!.gloss} dir={targetDir} onClick={() => place(i)} ariaLabel={`${to[i]!.text} — tap to place`} />)}
      </div>
      {checked && correct && note ? <p className="lang-why" data-state="ok" aria-live="polite">{note}</p> : null}
    </div>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={() => setChecked(true)} disabled={!full}>Check</CheckButton>
      <Chip selected={false} onClick={reset}>Reset</Chip>
    </ControlBar>
  );

  return (
    <LabFrame
      title={title}
      prompt={instruction}
      aside={checked ? <StatusPill ok={correct}>{correct ? '✓ Done — see what changed' : 'Not the right order yet'}</StatusPill> : undefined}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
