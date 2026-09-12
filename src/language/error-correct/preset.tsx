'use client';

/**
 * ErrorCorrectLab, "spot the mistake": a sentence with ONE error; the learner taps
 * the wrong word and sees it corrected. Proofreading / meta-grammar, the reverse of
 * the drill labs (recognise a rule by catching where it's broken). Perfect for the
 * classic Bangla-L1 slips, "He go", "a apple", "the childs", a missing copula.
 *
 * Tap the word you think is wrong: right → it flips to the fix (green) with a why;
 * wrong → it shakes. Data-driven; the fix is shown IN the sentence, so the correction
 * is seen in context, not just stated.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from '../../kit/activity.js';
import { LanguageActivity, LanguageAdvance } from '../activity.js';
import { HintLadder, useCheckpoint, useHints } from '../../kit/pedagogy.js';

export interface ErrorItem {
  /** The sentence containing exactly one mistake. */
  text: string;
  /** The wrong word, exactly as it appears in `text` (first match is flagged). */
  wrong: string;
  /** The correction that replaces it. */
  fix: string;
  /** Why, shown once the error is caught. */
  why?: string;
}

export interface ErrorCorrectProps {
  items: ErrorItem[];
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}

const bare = (s: string): string => s.replace(/[.,!?;:"']+$/g, '').toLowerCase();

export function ErrorCorrectLab({
  items,
  title = 'Find the mistake',
  prompt = 'One word is wrong. Tap it to fix it.',
  objectives,
  hints: hintList,
}: ErrorCorrectProps): ReactNode {
  const [round, setRound] = useState(0);
  const [found, setFound] = useState(false);
  const [wrongTap, setWrongTap] = useState<number | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  useEffect(() => {
    setRound(0);
    setFound(false);
    setWrongTap(null);
    setSolvedCount(0);
  }, [items]);

  const item = items[round];
  const total = items.length;
  const allDone = solvedCount >= total && total > 0;
  const hints = useHints(hintList);
  useCheckpoint({
    solved: allDone,
    activity: 'error-correct',
    score: { raw: total, max: total },
    hintsUsed: hints.count,
  });
  if (!item) return null;

  const tokens = item.text.split(/(\s+)/); // keep whitespace tokens to preserve spacing
  // index of the first token that IS the wrong word (compare bare forms)
  const badIdx = tokens.findIndex((t) => t.trim() && bare(t) === bare(item.wrong));
  const isLast = round === total - 1;

  const tap = (i: number): void => {
    if (found) return;
    if (i === badIdx) {
      setFound(true);
      setWrongTap(null);
      setSolvedCount((s) => Math.min(total, s + 1));
    } else {
      setWrongTap(i);
    }
  };
  const next = (): void => {
    setRound((r) => Math.min(total - 1, r + 1));
    setFound(false);
    setWrongTap(null);
  };

  const figure = (
    <div className="lang-lab">
      <div className="lang-errsentence" aria-label="sentence, tap the wrong word">
        {tokens.map((t, i) => {
          if (!t.trim()) return <span key={i}>{t}</span>; // whitespace
          if (i === badIdx) {
            return found ? (
              <span key={i} className="lang-fix">
                {item.fix}
              </span>
            ) : (
              <Button
                key={i}
                type="button"
                variant="ghost"
                size="sm"
                className="lang-word"
                data-state={i === wrongTap ? 'no' : 'idle'}
                onClick={() => tap(i)}
              >
                {t}
              </Button>
            );
          }
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="sm"
              className="lang-word"
              data-state={i === wrongTap ? 'no' : 'idle'}
              disabled={found}
              onClick={() => tap(i)}
            >
              {t}
            </Button>
          );
        })}
      </div>
      {found ? (
        <p className="lang-why" data-state="ok" aria-live="polite">
          ✓{' '}
          {item.why ?? (
            <>
              “{item.wrong}” → <b>{item.fix}</b>
            </>
          )}
        </p>
      ) : (
        <p
          className={wrongTap === null ? 'lang-hint' : 'lang-why'}
          data-state={wrongTap === null ? undefined : 'no'}
          aria-live="polite"
        >
          {wrongTap === null
            ? 'Tap the word that is wrong.'
            : 'That word works in this sentence. Compare the subject, verb, and ending, then try another word.'}
        </p>
      )}
    </div>
  );

  return (
    <LanguageActivity
      title={title}
      prompt={prompt}
      objectives={objectives}
      progress={<Activity.ItemProgress done={solvedCount} total={total} label="All correct" />}
      controls={
        found && !isLast ? <LanguageAdvance current={solvedCount} total={total} onNext={next} /> : undefined
      }
      footer={<HintLadder hints={hints} />}
    >
      {figure}
    </LanguageActivity>
  );
}
