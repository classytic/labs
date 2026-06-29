'use client';

/**
 * ArticleLens, choose a / an / the /, (no article).
 *
 * Bangla has no articles, so this is the highest-novelty English error for
 * Bangla speakers. The "lens" framing: tap the article that fits, and on a
 * correct pick the rule surfaces (new → a/an, known/specific → the, general →
 * no article). Choice-based recall, distinct from the tile-building labs.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';

export type Article = 'a' | 'an' | 'the' | ', ';

export interface ArticleItem {
  /** Text before the blank. */
  before: string;
  /** The noun (shown after the blank). */
  noun: string;
  /** Text after the noun. */
  after?: string;
  answer: Article;
  /** One-line reason shown after a correct pick. */
  why?: string;
}

export interface ArticleLensProps {
  items: ArticleItem[];
  objectives?: string[];
  hints?: string[];
  title?: string;
  prompt?: string;
}

const CHOICES: Article[] = ['a', 'an', 'the', ', '];
const RULE: Record<Article, string> = {
  a: 'a → any one (new), before a consonant sound',
  an: 'an → any one (new), before a vowel sound',
  the: 'the → the specific one we both know',
  ', ': 'no article → general or uncountable',
};

export function ArticleLensLab({ items, objectives, hints: hintList, title = 'Choose the article', prompt = 'Bangla has no a/an/the: pick what English needs.' }: ArticleLensProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Article | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  useEffect(() => { setIdx(0); setPicked(null); setSolvedCount(0); }, [items]);

  const item = items[idx];
  const correct = picked !== null && item !== undefined && picked === item.answer;
  const total = items.length;
  const allDone = solvedCount >= total && total > 0;

  const hints = useHints(hintList);
  useCheckpoint({ solved: allDone, activity: 'article-lens', score: { raw: total, max: total }, hintsUsed: hints.count });

  const blank = useMemo(() => (picked === null ? '▢' : picked === ', ' ? '∅' : picked), [picked]);

  if (!item) return null;

  const pick = (a: Article): void => {
    if (correct) return; // already solved this card
    setPicked(a);
    if (a === item.answer) setSolvedCount((s) => Math.min(total, s + 1));
  };
  const next = (): void => { setPicked(null); setIdx((i) => Math.min(total - 1, i + 1)); };
  const isLast = idx === total - 1;

  const figure = (
    <div className="lang-lab">
      <div className="lang-sentence" aria-label="sentence">
        <span>{item.before}</span>
        <span className="lang-blank" data-state={picked === null ? 'idle' : correct ? 'ok' : 'no'}>{blank}</span>
        <span className="lang-noun">{item.noun}</span>
        {item.after ? <span>{item.after}</span> : null}
      </div>

      <div className="lang-choices" role="group" aria-label="articles">
        {CHOICES.map((a) => (
          <button
            key={a}
            type="button"
            className="lang-choice"
            data-state={picked === a ? (correct ? 'ok' : 'no') : 'idle'}
            disabled={correct}
            onClick={() => pick(a)}
            aria-label={a === ', ' ? 'no article' : a}
          >
            {a === ', ' ? 'no article' : a}
          </button>
        ))}
      </div>

      {picked !== null && (
        <p className="lang-why" data-state={correct ? 'ok' : 'no'} aria-live="polite">
          {correct ? (item.why ?? RULE[item.answer]) : 'Not quite, try another.'}
        </p>
      )}
    </div>
  );

  return (
    <LabFrame
      title={title}
      prompt={prompt}
      objectives={objectives}
      aside={<StatusPill ok={allDone}>{allDone ? '✓ All correct' : `${solvedCount} / ${total}`}</StatusPill>}
      controls={correct && !isLast ? <ControlBar><CheckButton onClick={next}>Next</CheckButton></ControlBar> : undefined}
      footer={<HintLadder hints={hints} />}
    >
      {figure}
    </LabFrame>
  );
}
