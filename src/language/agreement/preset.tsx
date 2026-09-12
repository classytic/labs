'use client';

/**
 * AgreementLab, make the verb agree with its subject.
 *
 * Bangla drops the present copula ("He doctor") and has no 3rd-person -s
 * ("She go"), so subject–verb agreement is a core English error. The learner
 * picks the verb form that matches the subject; on a correct pick the pair links
 * up (color + connector) and the full sentence assembles, making concord visible.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { AssessedChoiceGroup } from '../../kit/controls.js';
import { LanguageActivity, LanguageAdvance } from '../activity.js';
import { useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';
import { Speaker } from '../ui.js';

export interface AgreementItem {
  /** The subject, e.g. "She" / "They" / "The boys". */
  subject: string;
  /** Verb-form choices, e.g. ["go", "goes"] or ["is", "are", "am"]. */
  options: string[];
  /** The correct form. */
  correct: string;
  /** Rest of the sentence after the verb, e.g. "to school". */
  tail?: string;
  /** One-line reason shown after a correct pick. */
  note?: string;
  /** Targeted feedback per WRONG pick: `{ [option]: 'why that trap is tempting' }`.
   *  Turns a wrong tap into a teaching moment instead of a bare "not quite". */
  feedback?: Record<string, string>;
}

export interface AgreementProps {
  items: AgreementItem[];
  objectives?: string[];
  hints?: string[];
  /** BCP-47 of the sentence, e.g. 'en-US'. Set it to show a 🔊 that reads the
   *  correct sentence once solved (hear the 3rd-sg -s / the copula). */
  lang?: string;
  title?: string;
  prompt?: string;
}

export function AgreementLab({
  items,
  objectives,
  hints: hintList,
  lang,
  title = 'Make them agree',
  prompt = 'Pick the verb form that matches the subject.',
}: AgreementProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  useEffect(() => {
    setIdx(0);
    setPicked(null);
    setSolvedCount(0);
  }, [items]);

  const item = items[idx];
  const correct = picked !== null && item !== undefined && picked === item.correct;
  const total = items.length;
  const allDone = solvedCount >= total && total > 0;

  const hints = useHints(hintList);
  useCheckpoint({
    solved: allDone,
    activity: 'agreement',
    score: { raw: total, max: total },
    hintsUsed: hints.count,
  });

  if (!item) return null;

  const pick = (v: string): void => {
    if (correct) return;
    setPicked(v);
    if (v === item.correct) setSolvedCount((s) => Math.min(total, s + 1));
  };
  const next = (): void => {
    setPicked(null);
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const isLast = idx === total - 1;

  const figure = (
    <div className="lang-lab">
      <div className="lang-sentence" aria-label="sentence">
        <span className="lang-subject" data-ok={correct ? 'true' : undefined}>
          {item.subject}
        </span>
        {correct ? (
          <span className="lang-link" aria-hidden>
            ↔
          </span>
        ) : null}
        <span className="lang-blank" data-state={picked === null ? 'idle' : correct ? 'ok' : 'no'}>
          {picked ?? '▢'}
        </span>
        {item.tail ? <span>{item.tail}</span> : null}
        {lang && correct ? (
          <Speaker
            item={{
              term: `${item.subject} ${item.correct}${item.tail ? ` ${item.tail}` : ''}`,
              translation: '',
            }}
            lang={lang}
          />
        ) : null}
      </div>

      <AssessedChoiceGroup
        value={picked ?? undefined}
        onChange={pick}
        ariaLabel="Choose the verb form that agrees with the subject"
        options={item.options.map((value) => ({
          value,
          label: value,
          disabled: correct,
          tone:
            picked === value
              ? value === item.correct
                ? ('correct' as const)
                : ('wrong' as const)
              : undefined,
        }))}
      />

      {picked !== null &&
        (correct ? (
          <p className="lang-why" data-state="ok" aria-live="polite">
            {item.note ?? `${item.subject} ${item.correct}${item.tail ? ' ' + item.tail : ''}.`}
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
