'use client';

/**
 * SentenceBuilder — order the words into a correct sentence.
 *
 * The flagship grammar lab: tiles are colour-coded by part of speech and carry
 * an optional L1 gloss, so a learner SEES the structure while building it. The
 * `prompt` shows the meaning (e.g. the learner's-language sentence) above —
 * which is exactly how a Bangla speaker meets English word order: same meaning,
 * different slot order (SOV → SVO).
 *
 * Tap a tile in the bank to place it; tap a placed tile to take it back. No
 * drag — buttons are touch- and keyboard-friendly. Validates by resulting text,
 * so duplicate/interchangeable words still pass.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckButton, StatusPill, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Tile } from '../ui.js';
import { seededShuffle, type Pos } from '../deck.js';

export interface SentenceTile {
  text: string;
  pos?: Pos;
  /** Optional L1 gloss shown under the tile. */
  gloss?: string;
}

export interface SentenceBuilderProps {
  /** Tiles in the CORRECT order. */
  tiles: SentenceTile[];
  /** The meaning / L1 sentence shown above (e.g. "আমি ভাত খাই"). */
  prompt?: string;
  /** Direction of the prompt text. */
  promptDir?: 'ltr' | 'rtl';
  /** Direction of the tiles' language (target). */
  targetDir?: 'ltr' | 'rtl';
  title?: string;
  hint?: string;
}

export function SentenceBuilderLab({
  tiles,
  prompt,
  promptDir = 'ltr',
  targetDir = 'ltr',
  title = 'Build the sentence',
  hint = 'Tap the words in the right order.',
}: SentenceBuilderProps): ReactNode {
  const target = useMemo(() => tiles.map((t) => t.text).join(' '), [tiles]);
  const initialBank = useMemo(() => {
    const idx = tiles.map((_, i) => i);
    let order = seededShuffle(idx, tiles.length * 7 + 3);
    // avoid handing back the already-correct order for a real sentence
    if (tiles.length > 1 && order.map((i) => tiles[i]!.text).join(' ') === target) order = order.slice().reverse();
    return order;
  }, [tiles, target]);

  const [bank, setBank] = useState<number[]>(initialBank);
  const [line, setLine] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => { setBank(initialBank); setLine([]); setChecked(false); }, [initialBank]);

  const attempt = line.map((i) => tiles[i]!.text).join(' ');
  const full = line.length === tiles.length;
  const correct = full && attempt === target;

  useCheckpoint({ solved: correct, activity: 'sentence-builder' });

  const place = (i: number): void => { setBank((b) => b.filter((x) => x !== i)); setLine((l) => [...l, i]); setChecked(false); };
  const take = (i: number): void => { setLine((l) => l.filter((x) => x !== i)); setBank((b) => [...b, i]); setChecked(false); };
  const reset = (): void => { setBank(initialBank); setLine([]); setChecked(false); };

  const figure = (
    <div className="lang-lab">
      {prompt ? <p className="lang-prompt" dir={promptDir}>{prompt}</p> : null}

      {/* the sentence line being built */}
      <div className="lang-line" data-state={checked ? (correct ? 'ok' : 'no') : 'idle'} aria-label="your sentence">
        {line.length === 0 ? (
          <span className="lang-line-empty">{hint}</span>
        ) : (
          line.map((i) => (
            <Tile key={i} pos={tiles[i]!.pos} text={tiles[i]!.text} gloss={tiles[i]!.gloss} dir={targetDir} onClick={() => take(i)} ariaLabel={`${tiles[i]!.text} — tap to remove`} />
          ))
        )}
      </div>

      {/* the word bank */}
      <div className="lang-bank" aria-label="word bank">
        {bank.map((i) => (
          <Tile key={i} pos={tiles[i]!.pos} text={tiles[i]!.text} gloss={tiles[i]!.gloss} dir={targetDir} onClick={() => place(i)} ariaLabel={`${tiles[i]!.text} — tap to place`} />
        ))}
      </div>

      <LiveRegion>
        {checked ? (correct ? 'Correct word order' : 'Not the right order yet') : ''}
      </LiveRegion>
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
      prompt={hint}
      aside={checked ? <StatusPill ok={correct}>{correct ? '✓ Correct word order' : 'Not the right order yet'}</StatusPill> : undefined}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
