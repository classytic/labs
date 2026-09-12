'use client';

/**
 * ClozeLab, "fill the gap": a sentence with one or more blanks the learner
 * completes by tapping words from a bank. The single highest-value language
 * interaction, grammar and vocabulary in real sentence CONTEXT, not isolated
 * choices ("She ___ to school" → goes; "I want ___ apple" → an).
 *
 * Bank-mode (tap tiles) rather than free typing: mobile-first, forgiving of
 * spelling, and consistent with the other language labs. It reuses the tested
 * slot-fill engine (`useSlotFill` + `Blank` + `SlotTray`, tap a filled blank to
 * clear it), so grading, keyboard support, and the tile tray come for free.
 *
 * Data-driven: a creator declares `items` (sentence + answers + optional
 * distractor tiles + a "why" + an L1 gloss); pass `lang` to voice the completed
 * sentence via the shared Speaker (uploaded audio or the browser voice).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { LanguageActivity, LanguageAdvance } from '../activity.js';
import { useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';
import { useSlotFill, Blank, SlotTray, type FillSlot } from '../../kit/slot-fill.js';
import { Speaker } from '../ui.js';
import { seededShuffle } from '../deck.js';

export interface ClozeItem {
  /** Sentence with each blank written as `___` (three or more underscores). */
  text: string;
  /** The correct fill for each blank, in order. */
  answers: string[];
  /** Extra wrong tiles for the bank (the answers are always included). */
  distractors?: string[];
  /** One-line reason shown once the sentence is complete. */
  why?: string;
  /** Optional L1 gloss / translation of the sentence. */
  gloss?: string;
  /** Optional audio for the whole sentence (uploaded / external URL). */
  audioUrl?: string;
}

export interface ClozeProps {
  items: ClozeItem[];
  /** BCP-47 of the sentence, e.g. 'en-US', for the Speaker (browser voice). */
  lang?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}

const BLANK = /_{3,}/g;

/** One cloze card. Keyed by index in the parent so it remounts (fresh fill state). */
function ClozeCard({
  item,
  lang,
  onSolved,
}: {
  item: ClozeItem;
  lang?: string;
  onSolved: () => void;
}): ReactNode {
  const segments = item.text.split(BLANK);
  const nBlanks = segments.length - 1;
  const slots: FillSlot[] = Array.from({ length: nBlanks }, (_, i) => ({
    id: `b${i}`,
    answer: item.answers[i] ?? '',
  }));
  // bank = answers + distractors, de-duped, shuffled deterministically (SSR-safe)
  const tiles = seededShuffle([...new Set([...item.answers, ...(item.distractors ?? [])])], 7);
  const fill = useSlotFill(slots, tiles, 'cloze', onSolved);

  // the fully-filled sentence, for the Speaker to voice (a listen-then-check aid)
  let ai = 0;
  const spoken = item.text.replace(BLANK, () => item.answers[ai++] ?? '');

  return (
    <div className="lang-lab">
      <div className="lang-cloze" aria-label="sentence">
        {segments.map((s, i) => (
          <span key={i}>
            {s}
            {i < nBlanks ? <Blank fill={fill} id={`b${i}`} width={68} /> : null}
          </span>
        ))}
        {lang ? (
          <Speaker item={{ term: spoken, translation: '', audioUrl: item.audioUrl }} lang={lang} />
        ) : null}
      </div>
      {item.gloss ? <p className="lang-hint">{item.gloss}</p> : null}
      <SlotTray fill={fill} />
      {fill.solved ? (
        <p className="lang-why" data-state="ok" aria-live="polite">
          ✓ {item.why ?? 'Correct'}
        </p>
      ) : null}
    </div>
  );
}

export function ClozeLab({
  items,
  lang,
  title = 'Fill the gap',
  prompt = 'Tap the words to complete the sentence.',
  objectives,
  hints: hintList,
}: ClozeProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [cardSolved, setCardSolved] = useState(false);
  useEffect(() => {
    setIdx(0);
    setSolvedCount(0);
    setCardSolved(false);
  }, [items]);

  const total = items.length;
  const item = items[idx];
  const allDone = solvedCount >= total && total > 0;
  const hints = useHints(hintList);
  useCheckpoint({
    solved: allDone,
    activity: 'cloze',
    score: { raw: total, max: total },
    hintsUsed: hints.count,
  });

  if (!item) return null;

  const onSolved = (): void => {
    setCardSolved(true);
    setSolvedCount((s) => Math.min(total, s + 1));
  };
  const next = (): void => {
    setCardSolved(false);
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const isLast = idx === total - 1;

  return (
    <LanguageActivity
      title={title}
      prompt={prompt}
      objectives={objectives}
      progress={<Activity.ItemProgress done={solvedCount} total={total} label="All correct" />}
      controls={
        cardSolved && !isLast ? (
          <LanguageAdvance current={solvedCount} total={total} onNext={next} />
        ) : undefined
      }
      footer={<HintLadder hints={hints} />}
    >
      <ClozeCard key={idx} item={item} lang={lang} onSolved={onSolved} />
    </LanguageActivity>
  );
}
