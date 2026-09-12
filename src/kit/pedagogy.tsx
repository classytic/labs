'use client';

/**
 * Pedagogy/assessment kit, the formative-feedback layer every lab shares.
 *
 * `LabMeta` (objectives, hints, misconceptions, successCriteria) was authored
 * but never rendered. This turns it into the Brilliant-style loop:
 *   • `useCheckpoint`, the ONE assessment seam: report once on first solve,
 *     with a hint penalty folded into the score. Kills the per-lab
 *     `if (x === answer) report(...)` + done-ref boilerplate.
 *   • `useHints` + `<HintLadder>`, progressive reveal; each hint taken docks
 *     the score (pass `hints.count` to useCheckpoint).
 *   • `<Objectives>`, the learner-visible goal banner.
 *   • `<Feedback>`, unifies success / try-again / misconception note (the
 *     misconception is a boolean the lab computes from resolved state).
 *   • `<RevealSolution>`, the shared "Show answer" escape hatch every lab gets:
 *     a button → a warned solution panel, firing `onReveal` once so the lab can
 *     dock the score (peeking ≠ solving). No more dead-end "wrong/right".
 *
 * Domain glue over stage's learner seam, stays in labs so stage is a pure
 * engine; imports only `useLearner` from @classytic/stage.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLearner } from '@classytic/stage';
import { Celebrate } from './celebrate.js';
import { AssessedChoiceGroup, choiceResponseLayout, StatusPill } from './controls.js';

export interface CheckpointArgs {
  /** The lab's correctness predicate over its resolved state. */
  solved: boolean;
  activity: string;
  /** Full-credit score; defaults to {raw:1,max:1}. Penalised by hints. */
  score?: { raw: number; max: number };
  /** Hints revealed so far (from useHints().count). */
  hintsUsed?: number;
  /** Score multiplier docked per hint (default 0.1, floored at 0.1). */
  hintPenalty?: number;
  /** The learner's answer to pass through to the report (e.g. the value they entered). */
  response?: string;
  /** Change this to begin a deliberately new attempt. Ordinary solved/unsolved motion does not report twice. */
  attemptKey?: string | number;
}

/** Report completion once, the first time `solved` becomes true. */
export function useCheckpoint({
  solved,
  activity,
  score,
  hintsUsed = 0,
  hintPenalty = 0.1,
  response,
  attemptKey = 0,
}: CheckpointArgs): { solved: boolean; reported: boolean } {
  const learner = useLearner();
  const done = useRef(false);
  const attempt = useRef(attemptKey);
  const [reported, setReported] = useState(false);
  useEffect(() => {
    if (attempt.current !== attemptKey) {
      attempt.current = attemptKey;
      done.current = false;
      setReported(false);
    }
    if (solved && !done.current) {
      done.current = true;
      setReported(true);
      const base = score ?? { raw: 1, max: 1 };
      const factor = Math.max(0.1, 1 - hintsUsed * hintPenalty);
      learner?.report({
        activity,
        correct: true,
        completion: true,
        response,
        score: {
          raw: Math.round(base.raw * factor * 100) / 100,
          max: base.max,
        },
      });
    }
  }, [solved, activity, hintsUsed, hintPenalty, score?.raw, score?.max, response, learner, attemptKey]);
  return { solved, reported };
}

export interface Hints {
  revealed: string[];
  count: number;
  hasMore: boolean;
  reveal: () => void;
  reset: () => void;
}

/** Progressive hint state, reveal one at a time. */
export function useHints(hints: string[] = []): Hints {
  const [n, setN] = useState(0);
  return {
    revealed: hints.slice(0, n),
    count: n,
    hasMore: n < hints.length,
    reveal: () => setN((v) => Math.min(hints.length, v + 1)),
    reset: () => setN(0),
  };
}

/** Learner-visible goal banner ("You'll be able to …"). */
export function Objectives({ items }: { items?: string[] }): ReactNode {
  if (!items?.length) return null;
  return (
    <div className="lab-objectives">
      <span className="lab-objectives-h">You'll be able to</span>
      <ul>
        {items.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
    </div>
  );
}

/** The hint ladder, revealed hints + a "need a hint?" button while more remain. */
export function HintLadder({ hints }: { hints: Hints }): ReactNode {
  if (hints.revealed.length === 0 && !hints.hasMore) return null;
  return (
    <div className="lab-hints">
      {hints.revealed.map((h, i) => (
        <p key={i} className="lab-hint">
          <span aria-hidden>💡</span> {h}
        </p>
      ))}
      {hints.hasMore && (
        <Button type="button" size="sm" variant="outline" className="lab-hint-btn" onClick={hints.reveal}>
          {hints.count === 0 ? 'Need a hint?' : 'Another hint'}
        </Button>
      )}
    </div>
  );
}

// ── Challenge: the shared predict / classify / explain activity ───────────────
// Turns a "pure simulation" into a lesson: the learner commits to an answer BEFORE
// the reveal, so every lab can clear the "fun activity" bar. Pair `useChallenge`
// (state) with `<ChallengeCard>` (UI) and feed `state.allCorrect` to `useCheckpoint`.

export interface ChallengeChoice {
  value: string;
  label: ReactNode;
  /** Misconception-specific coaching shown when this wrong choice is selected. */
  feedback?: ReactNode;
}
export interface ChallengeQuestion {
  id: string;
  /** predict / classify / explain prompt. */
  prompt: ReactNode;
  choices: ChallengeChoice[];
  /** the `value` of the correct choice. */
  answer: string;
  /** the "why", revealed once this question is answered correctly. */
  explain?: ReactNode;
  /** Fallback coaching for a wrong choice without its own feedback. */
  tryAgain?: ReactNode;
}

export interface ChallengeState {
  picks: Record<string, string | undefined>;
  attempts: Record<string, number>;
  pick: (id: string, value: string) => void;
  /** all questions answered correctly → the lab is solved. */
  allCorrect: boolean;
  /** every question has a pick (right or wrong). */
  answeredAll: boolean;
  solvedCount: number;
  total: number;
  reset: () => void;
}

/** State for a small set of predict/classify questions. */
export function useChallenge(questions: ChallengeQuestion[]): ChallengeState {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const total = questions.length;
  const solvedCount = questions.filter((q) => picks[q.id] === q.answer).length;
  return {
    picks,
    attempts,
    pick: (id, value) => {
      setPicks((p) => ({ ...p, [id]: value }));
      setAttempts((a) => ({ ...a, [id]: (a[id] ?? 0) + 1 }));
    },
    allCorrect: total > 0 && solvedCount === total,
    answeredAll: questions.every((q) => picks[q.id] != null),
    solvedCount,
    total,
    reset: () => {
      setPicks({});
      setAttempts({});
    },
  };
}

/** Renders the challenge questions as choice chips with per-question feedback. */
export function ChallengeCard({
  questions,
  state,
  title = 'Predict first',
}: {
  questions: ChallengeQuestion[];
  state: ChallengeState;
  title?: ReactNode;
}): ReactNode {
  return (
    <div className="lab-challenge">
      {title && (
        <span className="lab-challenge-h">
          {title}
          {state.total > 1 && (
            <span className="lab-challenge-count">
              {state.solvedCount}/{state.total}
            </span>
          )}
        </span>
      )}
      {questions.map((q, i) => {
        const picked = state.picks[q.id];
        const answered = picked != null;
        const correct = picked === q.answer;
        return (
          <div className="lab-challenge-q" data-response-layout={choiceResponseLayout(q.choices)} key={q.id}>
            <span className="lab-challenge-prompt">
              {questions.length > 1 && (
                <span className="lab-challenge-num" aria-hidden>
                  {i + 1}
                </span>
              )}
              <span>{q.prompt}</span>
            </span>
            <AssessedChoiceGroup
              value={picked}
              ariaLabel={typeof q.prompt === 'string' ? q.prompt : 'Answer choices'}
              onChange={(value) => state.pick(q.id, value)}
              options={q.choices.map((c) => {
                const isPicked = picked === c.value;
                // A wrong attempt must not reveal the answer. Mark only the
                // learner's selected option until they actually solve it.
                const tone = !answered
                  ? undefined
                  : correct && c.value === q.answer
                    ? 'correct'
                    : isPicked
                      ? 'wrong'
                      : undefined;
                return { value: c.value, label: c.label, tone };
              })}
            />
            {answered &&
              (correct ? (
                <span className="lab-celebrate w-full">
                  <span className="lab-explain lab-pop w-full" role="status">
                    <b>✓ Correct.</b> {q.explain}
                  </span>
                  <Celebrate play />
                </span>
              ) : (
                <span className="lab-explain" data-state="no" role="alert">
                  {q.choices.find((choice) => choice.value === picked)?.feedback ??
                    q.tryAgain ??
                    'Not yet. Revisit the evidence and try another choice.'}
                </span>
              ))}
          </div>
        );
      })}
    </div>
  );
}

// ── AskBox: the shared "type an answer → Check" seam ──────────────────────────
// Used by the interactive-problem ENGINE and every REPRESENTATION plug-in, so the
// answer-input + verdict + reporting behave identically everywhere. The caller
// supplies the `check` (typically `(raw) => checkAnswer(spec, raw)`), keeping this
// component free of any expr-engine dependency.

export function AskBox({
  prompt,
  placeholder = 'your answer',
  check,
  activity,
}: {
  prompt: ReactNode;
  placeholder?: string;
  check: (raw: string) => boolean;
  activity: string;
}): ReactNode {
  const [raw, setRaw] = useState('');
  const [verdict, setVerdict] = useState<null | boolean>(null);
  const [solved, setSolved] = useState(false);
  const feedbackId = `lab-answer-feedback-${activity}`;
  useCheckpoint({ solved, activity });
  const run = (): void => {
    const ok = check(raw);
    setVerdict(ok);
    if (ok) setSolved(true);
  };
  return (
    <form
      className="lab-challenge"
      data-invalid={verdict === false || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        run();
      }}
    >
      <label className="lab-challenge-prompt" htmlFor={`lab-answer-${activity}`}>
        {prompt}
      </label>
      <div className="lab-response-entry" data-invalid={verdict === false || undefined}>
        <Input
          id={`lab-answer-${activity}`}
          className="lab-input"
          value={raw}
          placeholder={placeholder}
          aria-invalid={verdict === false || undefined}
          aria-describedby={verdict !== null ? feedbackId : undefined}
          onChange={(event) => {
            setRaw(event.currentTarget.value);
            setVerdict(null);
          }}
        />
        <Button type="submit" className="lab-btn" disabled={!raw.trim()}>
          Check
        </Button>
        {verdict === true && (
          <span id={feedbackId} className="lab-celebrate">
            <span className="lab-explain lab-pop" role="status">
              <b>✓ Correct.</b>
            </span>
            <Celebrate play />
          </span>
        )}
        {verdict === false && (
          <span id={feedbackId} className="lab-explain" data-state="no" role="alert">
            Not yet. Revisit the evidence and try again.
          </span>
        )}
      </div>
    </form>
  );
}

/** Unified success / misconception / try-again feedback. */
export function Feedback({
  ok,
  misconception,
  okText = 'Correct',
  tryText = 'Not yet, keep going',
}: {
  ok: boolean;
  misconception?: string;
  okText?: string;
  tryText?: string;
}): ReactNode {
  if (ok) {
    return (
      <span className="lab-celebrate">
        <StatusPill ok className="lab-pop">
          ✓ {okText}
        </StatusPill>
        <Celebrate play />
      </span>
    );
  }
  if (misconception)
    return (
      <span className="lab-misconception" role="status">
        <span aria-hidden>⚠</span> {misconception}
      </span>
    );
  return <StatusPill ok={false}>{tryText}</StatusPill>;
}

export interface RevealSolutionProps {
  /** The answer to show when revealed (text or rich content). */
  solution: ReactNode;
  /** Gate the button (e.g. only after a wrong attempt). Default: always shown. */
  available?: boolean;
  /** Fired ONCE when the learner reveals, let the lab dock the score (peek ≠ solve). */
  onReveal?: () => void;
  buttonLabel?: string;
  /** The warning shown with the solution. */
  note?: string;
}

/**
 * The shared "Show answer" escape hatch, so no lab is a dead-end "wrong/right".
 * Manages its own shown/hidden; `key` it (e.g. per step/event) to reset between
 * questions. Revealing is a deliberate peek: it warns and reports via `onReveal`.
 */
export function RevealSolution({
  solution,
  available = true,
  onReveal,
  buttonLabel = 'Show answer',
  note = 'Peeking, this one won’t count as solved on your own.',
}: RevealSolutionProps): ReactNode {
  const [shown, setShown] = useState(false);
  if (shown) {
    return (
      <div className="lab-solution" role="status">
        <span className="lab-solution-h">
          <span aria-hidden>🔑</span> Solution
        </span>
        <div className="lab-solution-body">{solution}</div>
        {note && <p className="lab-solution-note">{note}</p>}
      </div>
    );
  }
  if (!available) return null;
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="lab-reveal-btn"
      onClick={() => {
        setShown(true);
        onReveal?.();
      }}
    >
      {buttonLabel}
    </Button>
  );
}
