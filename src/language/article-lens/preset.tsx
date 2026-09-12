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
import { Activity } from '../../kit/activity.js';
import { AssessedChoiceGroup } from '../../kit/controls.js';
import { LanguageActivity, LanguageAdvance } from '../activity.js';
import { useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';
import { Speaker } from '../ui.js';

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
  /** Targeted feedback per WRONG pick: `{ [option]: 'why that trap is tempting' }`.
   *  Turns a wrong tap into a teaching moment instead of a bare "not quite". */
  feedback?: Record<string, string>;
}

export interface ArticleLensProps {
  items: ArticleItem[];
  objectives?: string[];
  hints?: string[];
  /** BCP-47 of the sentence, e.g. 'en-US'. Set it to show a 🔊 that reads the
   *  completed sentence, so the learner HEARS the vowel sound that picks a/an. */
  lang?: string;
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

export function ArticleLensLab({
  items,
  objectives,
  hints: hintList,
  lang,
  title = 'Choose the article',
  prompt = 'Bangla has no a/an/the: pick what English needs.',
}: ArticleLensProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Article | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  useEffect(() => {
    setIdx(0);
    setPicked(null);
    setSolvedCount(0);
  }, [items]);

  const item = items[idx];
  const correct = picked !== null && item !== undefined && picked === item.answer;
  const total = items.length;
  const allDone = solvedCount >= total && total > 0;

  const hints = useHints(hintList);
  useCheckpoint({
    solved: allDone,
    activity: 'article-lens',
    score: { raw: total, max: total },
    hintsUsed: hints.count,
  });

  const blank = useMemo(() => (picked === null ? '▢' : picked === ', ' ? '∅' : picked), [picked]);

  if (!item) return null;

  const pick = (a: Article): void => {
    if (correct) return; // already solved this card
    setPicked(a);
    if (a === item.answer) setSolvedCount((s) => Math.min(total, s + 1));
  };
  const next = (): void => {
    setPicked(null);
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const isLast = idx === total - 1;

  const figure = (
    <div className="lang-lab">
      <div className="lang-sentence" aria-label="sentence">
        <span>{item.before}</span>
        <span className="lang-blank" data-state={picked === null ? 'idle' : correct ? 'ok' : 'no'}>
          {blank}
        </span>
        <span className="lang-noun">{item.noun}</span>
        {item.after ? <span>{item.after}</span> : null}
        {lang ? (
          <Speaker
            item={{
              term: `${item.before} ${item.answer === ', ' ? '' : item.answer} ${item.noun}${item.after ? ` ${item.after}` : ''}`
                .replace(/\s+/g, ' ')
                .trim(),
              translation: '',
            }}
            lang={lang}
          />
        ) : null}
      </div>

      <AssessedChoiceGroup
        value={picked ?? undefined}
        onChange={pick}
        ariaLabel="Choose the article that completes the sentence"
        options={CHOICES.map((value) => ({
          value,
          label: value === ', ' ? 'No article' : value,
          disabled: correct,
          tone:
            picked === value
              ? value === item.answer
                ? ('correct' as const)
                : ('wrong' as const)
              : undefined,
        }))}
      />

      {picked !== null &&
        (correct ? (
          <p className="lang-why" data-state="ok" aria-live="polite">
            {item.why ?? RULE[item.answer]}
          </p>
        ) : item.feedback?.[picked] ? (
          <p className="lab-misconception lang-feedback" role="status" aria-live="polite">
            <span aria-hidden>⚠</span> {item.feedback[picked]}
          </p>
        ) : (
          <p className="lang-why" data-state="no" aria-live="polite">
            Not quite, try another.
          </p>
        ))}
    </div>
  );

  return (
    <LanguageActivity
      title={title}
      prompt={prompt}
      objectives={objectives}
      progress={<Activity.ItemProgress done={solvedCount} total={total} label="All correct" />}
      controls={
        correct && !isLast ? <LanguageAdvance current={solvedCount} total={total} onNext={next} /> : undefined
      }
      footer={<HintLadder hints={hints} />}
    >
      {figure}
    </LanguageActivity>
  );
}
