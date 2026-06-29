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
import { CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';

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
}

export interface AgreementProps {
  items: AgreementItem[];
  title?: string;
  prompt?: string;
}

export function AgreementLab({ items, title = 'Make them agree', prompt = 'Pick the verb form that matches the subject.' }: AgreementProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  useEffect(() => { setIdx(0); setPicked(null); setSolvedCount(0); }, [items]);

  const item = items[idx];
  const correct = picked !== null && item !== undefined && picked === item.correct;
  const total = items.length;
  const allDone = solvedCount >= total && total > 0;

  useCheckpoint({ solved: allDone, activity: 'agreement', score: { raw: total, max: total } });

  if (!item) return null;

  const pick = (v: string): void => {
    if (correct) return;
    setPicked(v);
    if (v === item.correct) setSolvedCount((s) => Math.min(total, s + 1));
  };
  const next = (): void => { setPicked(null); setIdx((i) => Math.min(total - 1, i + 1)); };
  const isLast = idx === total - 1;

  const figure = (
    <div className="lang-lab">
      <div className="lang-sentence" aria-label="sentence">
        <span className="lang-subject" data-ok={correct ? 'true' : undefined}>{item.subject}</span>
        {correct ? <span className="lang-link" aria-hidden>↔</span> : null}
        <span className="lang-blank" data-state={picked === null ? 'idle' : correct ? 'ok' : 'no'}>{picked ?? '▢'}</span>
        {item.tail ? <span>{item.tail}</span> : null}
      </div>

      <div className="lang-choices" role="group" aria-label="verb forms">
        {item.options.map((v) => (
          <button key={v} type="button" className="lang-choice" data-state={picked === v ? (correct ? 'ok' : 'no') : 'idle'} disabled={correct} onClick={() => pick(v)} aria-label={v}>
            {v}
          </button>
        ))}
      </div>

      {picked !== null && (
        <p className="lang-why" data-state={correct ? 'ok' : 'no'} aria-live="polite">
          {correct ? (item.note ?? `${item.subject} ${item.correct}${item.tail ? ' ' + item.tail : ''}.`) : 'Not quite, try another.'}
        </p>
      )}
    </div>
  );

  return (
    <LabFrame
      title={title}
      prompt={prompt}
      aside={<StatusPill ok={allDone}>{allDone ? '✓ All correct' : `${solvedCount} / ${total}`}</StatusPill>}
      controls={correct && !isLast ? <ControlBar><CheckButton onClick={next}>Next</CheckButton></ControlBar> : undefined}
    >
      {figure}
    </LabFrame>
  );
}
