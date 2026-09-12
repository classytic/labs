'use client';

/**
 * SentenceBuilder, order the words into a correct sentence.
 *
 * The flagship grammar lab: tiles are colour-coded by part of speech and carry
 * an optional L1 gloss, so a learner SEES the structure while building it. The
 * `prompt` shows the meaning (e.g. the learner's-language sentence) above ,
 * which is exactly how a Bangla speaker meets English word order: same meaning,
 * different slot order (SOV → SVO).
 *
 * Tap a tile in the bank to place it; tap a placed tile to take it back. No
 * drag, buttons are touch- and keyboard-friendly. Validates by resulting text,
 * so duplicate/interchangeable words still pass.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckButton, StatusPill, ActionButton } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import { LanguageActivity } from '../activity.js';
import { useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';
import { Tile, Speaker } from '../ui.js';
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
  /** BCP-47 of the tiles' language, e.g. 'en-US'. Set it to show a 🔊 that reads
   *  the target sentence (listen, then build). */
  lang?: string;
  title?: string;
  hint?: string;
  objectives?: string[];
  hints?: string[];
}

export function SentenceBuilderLab({
  tiles,
  prompt,
  promptDir = 'ltr',
  targetDir = 'ltr',
  lang,
  title = 'Build the sentence',
  hint = 'Tap the words in the right order.',
  objectives,
  hints: hintList,
}: SentenceBuilderProps): ReactNode {
  const target = useMemo(() => tiles.map((t) => t.text).join(' '), [tiles]);
  const initialBank = useMemo(() => {
    const idx = tiles.map((_, i) => i);
    let order = seededShuffle(idx, tiles.length * 7 + 3);
    // avoid handing back the already-correct order for a real sentence
    if (tiles.length > 1 && order.map((i) => tiles[i]!.text).join(' ') === target)
      order = order.slice().reverse();
    return order;
  }, [tiles, target]);

  const [bank, setBank] = useState<number[]>(initialBank);
  const [line, setLine] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    setBank(initialBank);
    setLine([]);
    setChecked(false);
  }, [initialBank]);

  const attempt = line.map((i) => tiles[i]!.text).join(' ');
  const full = line.length === tiles.length;
  const correct = full && attempt === target;

  const hints = useHints(hintList);
  useCheckpoint({ solved: correct, activity: 'sentence-builder', hintsUsed: hints.count, response: attempt });

  const place = (i: number): void => {
    setBank((b) => b.filter((x) => x !== i));
    setLine((l) => [...l, i]);
    setChecked(false);
  };
  const take = (i: number): void => {
    setLine((l) => l.filter((x) => x !== i));
    setBank((b) => [...b, i]);
    setChecked(false);
  };
  const reset = (): void => {
    setBank(initialBank);
    setLine([]);
    setChecked(false);
  };

  const figure = (
    <div className="lang-lab">
      {prompt || lang ? (
        <p className="lang-prompt" dir={promptDir}>
          {prompt}
          {lang ? <Speaker item={{ term: target, translation: '' }} lang={lang} /> : null}
        </p>
      ) : null}

      {/* the sentence line being built */}
      <div
        className="lang-line"
        data-state={checked ? (correct ? 'ok' : 'no') : 'idle'}
        aria-label="your sentence"
      >
        {line.length === 0 ? (
          <span className="lang-line-empty">{hint}</span>
        ) : (
          line.map((i) => (
            <Tile
              key={i}
              pos={tiles[i]!.pos}
              text={tiles[i]!.text}
              gloss={tiles[i]!.gloss}
              dir={targetDir}
              onClick={() => take(i)}
              ariaLabel={`${tiles[i]!.text}, tap to remove`}
            />
          ))
        )}
      </div>

      {/* the word bank */}
      <div className="lang-bank" aria-label="word bank">
        {bank.map((i) => (
          <Tile
            key={i}
            pos={tiles[i]!.pos}
            text={tiles[i]!.text}
            gloss={tiles[i]!.gloss}
            dir={targetDir}
            onClick={() => place(i)}
            ariaLabel={`${tiles[i]!.text}, tap to place`}
          />
        ))}
      </div>

      <Activity.LiveRegion>
        {checked ? (correct ? 'Correct word order' : 'Not the right order yet') : ''}
      </Activity.LiveRegion>
    </div>
  );

  const controls = (
    <>
      <CheckButton onClick={() => setChecked(true)} disabled={!full}>
        Check
      </CheckButton>
      <ActionButton className="lab-btn-ghost" onClick={reset}>
        Reset
      </ActionButton>
    </>
  );

  return (
    <LanguageActivity
      title={title}
      prompt={hint}
      objectives={objectives}
      aside={
        checked ? (
          <StatusPill ok={correct}>{correct ? '✓ Correct word order' : 'Not the right order yet'}</StatusPill>
        ) : undefined
      }
      footer={hintList?.length ? <HintLadder hints={hints} /> : undefined}
      controls={controls}
    >
      {figure}
    </LanguageActivity>
  );
}
