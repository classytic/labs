'use client';

/**
 * ReadingLab, a short passage + comprehension questions. Reading-in-context, the
 * skill isolated grammar/vocab drills never build: understanding a real text,
 * inferring meaning, reading vocabulary in situ. An optional glossary glosses
 * hard words in the learner's language (L1 support) without breaking the flow.
 *
 * The questions reuse the shared predict/answer engine (`useChallenge` +
 * `ChallengeCard`), so grading, per-question feedback, and the checkpoint report
 * behave exactly like every other lab's "predict first" card.
 */

import type { ReactNode } from 'react';
import { LanguageActivity } from '../activity.js';
import {
  useChallenge,
  ChallengeCard,
  useCheckpoint,
  useHints,
  HintLadder,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';

export interface ReadingQuestion {
  /** The question stem. */
  q: string;
  /** Answer options; one must equal `answer`. */
  options: string[];
  /** The correct option (its exact text). */
  answer: string;
  /** Why, shown once answered correctly. */
  explain?: string;
}

export interface GlossEntry {
  word: string;
  meaning: string;
}

export interface ReadingProps {
  /** The passage. Blank lines (\n\n) separate paragraphs. */
  passage: string;
  questions: ReadingQuestion[];
  /** Optional L1 glossary shown beside/under the passage. */
  gloss?: GlossEntry[];
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}

export function ReadingLab({
  passage,
  questions,
  gloss,
  title = 'Read and answer',
  prompt = 'Read the passage, then answer the questions.',
  objectives,
  hints: hintList,
}: ReadingProps): ReactNode {
  const cqs: ChallengeQuestion[] = questions.map((q, i) => ({
    id: `q${i}`,
    prompt: q.q,
    choices: q.options.map((o) => ({ value: o, label: o })),
    answer: q.answer,
    explain: q.explain,
  }));
  const ch = useChallenge(cqs);
  const hints = useHints(hintList);
  useCheckpoint({
    solved: ch.allCorrect,
    activity: 'reading',
    score: { raw: cqs.length, max: cqs.length },
    hintsUsed: hints.count,
  });

  const paragraphs = passage
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const figure = (
    <div className="lang-reading">
      <article className="lang-passage">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>
      {gloss && gloss.length > 0 ? (
        <aside className="lang-gloss" aria-label="glossary">
          {gloss.map((g, i) => (
            <span key={i} className="lang-gloss-row">
              <b>{g.word}</b> {g.meaning}
            </span>
          ))}
        </aside>
      ) : null}
    </div>
  );

  return (
    <LanguageActivity
      title={title}
      prompt={prompt}
      objectives={objectives}
      footer={
        <>
          <ChallengeCard questions={cqs} state={ch} title="Comprehension" />
          <HintLadder hints={hints} />
        </>
      }
    >
      {figure}
    </LanguageActivity>
  );
}
