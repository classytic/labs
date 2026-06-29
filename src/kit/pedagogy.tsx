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

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLearner } from '@classytic/stage';

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
}

/** Report completion once, the first time `solved` becomes true. */
export function useCheckpoint({ solved, activity, score, hintsUsed = 0, hintPenalty = 0.1, response }: CheckpointArgs): { solved: boolean; reported: boolean } {
  const learner = useLearner();
  const done = useRef(false);
  const [reported, setReported] = useState(false);
  useEffect(() => {
    if (solved && !done.current) {
      done.current = true;
      setReported(true);
      const base = score ?? { raw: 1, max: 1 };
      const factor = Math.max(0.1, 1 - hintsUsed * hintPenalty);
      learner?.report({ activity, correct: true, completion: true, response, score: { raw: Math.round(base.raw * factor * 100) / 100, max: base.max } });
    }
    if (!solved && done.current) { done.current = false; setReported(false); }
  }, [solved, activity, hintsUsed, hintPenalty, score?.raw, score?.max, response, learner]);
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
      <ul>{items.map((o, i) => <li key={i}>{o}</li>)}</ul>
    </div>
  );
}

/** The hint ladder, revealed hints + a "need a hint?" button while more remain. */
export function HintLadder({ hints }: { hints: Hints }): ReactNode {
  if (hints.revealed.length === 0 && !hints.hasMore) return null;
  return (
    <div className="lab-hints">
      {hints.revealed.map((h, i) => <p key={i} className="lab-hint"><span aria-hidden>💡</span> {h}</p>)}
      {hints.hasMore && (
        <button type="button" className="lab-hint-btn" onClick={hints.reveal}>
          {hints.count === 0 ? 'Need a hint?' : 'Another hint'}
        </button>
      )}
    </div>
  );
}

// ── Challenge: the shared predict / classify / explain activity ───────────────
// Turns a "pure simulation" into a lesson: the learner commits to an answer BEFORE
// the reveal, so every lab can clear the "fun activity" bar. Pair `useChallenge`
// (state) with `<ChallengeCard>` (UI) and feed `state.allCorrect` to `useCheckpoint`.

export interface ChallengeChoice { value: string; label: ReactNode }
export interface ChallengeQuestion {
  id: string;
  /** predict / classify / explain prompt. */
  prompt: ReactNode;
  choices: ChallengeChoice[];
  /** the `value` of the correct choice. */
  answer: string;
  /** the "why", revealed once this question is answered correctly. */
  explain?: ReactNode;
}

export interface ChallengeState {
  picks: Record<string, string | undefined>;
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
  const total = questions.length;
  const solvedCount = questions.filter((q) => picks[q.id] === q.answer).length;
  return {
    picks,
    pick: (id, value) => setPicks((p) => ({ ...p, [id]: value })),
    allCorrect: total > 0 && solvedCount === total,
    answeredAll: questions.every((q) => picks[q.id] != null),
    solvedCount,
    total,
    reset: () => setPicks({}),
  };
}

/** Renders the challenge questions as choice chips with per-question feedback. */
export function ChallengeCard({ questions, state, title = 'Predict first' }: { questions: ChallengeQuestion[]; state: ChallengeState; title?: ReactNode }): ReactNode {
  return (
    <div className="lab-challenge">
      {title && <span className="lab-challenge-h">{title}{state.total > 1 && <span className="lab-challenge-count"> · {state.solvedCount}/{state.total}</span>}</span>}
      {questions.map((q, i) => {
        const picked = state.picks[q.id];
        const answered = picked != null;
        const correct = picked === q.answer;
        return (
          <div className="lab-challenge-q" key={q.id}>
            <span className="lab-challenge-prompt">
              {questions.length > 1 && <span className="lab-challenge-num" aria-hidden>{i + 1}</span>}
              <span>{q.prompt}</span>
            </span>
            <div className="lab-choices" role="group" aria-label={typeof q.prompt === 'string' ? q.prompt : 'choices'}>
              {q.choices.map((c) => {
                const isPicked = picked === c.value;
                const tone = !answered ? undefined : c.value === q.answer ? 'correct' : isPicked ? 'wrong' : undefined;
                return (
                  <button key={c.value} type="button" className="lab-choice" data-picked={isPicked || undefined} data-tone={tone} aria-pressed={isPicked} onClick={() => state.pick(q.id, c.value)}>
                    {c.label}
                  </button>
                );
              })}
            </div>
            {answered && (correct
              ? <span className="lab-pill" data-state="ok" role="status">✓ {q.explain ?? 'Correct'}</span>
              : <span className="lab-pill" data-state="no" role="status">Not yet, try again</span>)}
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

export function AskBox({ prompt, placeholder = 'your answer', check, activity }: { prompt: ReactNode; placeholder?: string; check: (raw: string) => boolean; activity: string }): ReactNode {
  const [raw, setRaw] = useState('');
  const [verdict, setVerdict] = useState<null | boolean>(null);
  const [solved, setSolved] = useState(false);
  useCheckpoint({ solved, activity });
  const run = (): void => { const ok = check(raw); setVerdict(ok); if (ok) setSolved(true); };
  return (
    <div className="lab-challenge">
      <span className="lab-challenge-prompt">{prompt}</span>
      <div className="lab-ask-row">
        <input
          className="lab-input" value={raw} placeholder={placeholder} aria-label="answer"
          onChange={(e) => { setRaw(e.currentTarget.value); setVerdict(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
        />
        <button type="button" className="lab-btn" onClick={run}>Check</button>
        {verdict === true && <span className="lab-pill" data-state="ok" role="status">✓ Correct</span>}
        {verdict === false && <span className="lab-pill" data-state="no" role="status">Not yet, try again</span>}
      </div>
      <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
        {verdict === true ? 'Correct.' : verdict === false ? 'Not yet.' : ''}
      </div>
    </div>
  );
}

/** Unified success / misconception / try-again feedback. */
export function Feedback({ ok, misconception, okText = 'Correct', tryText = 'Not yet, keep going' }: { ok: boolean; misconception?: string; okText?: string; tryText?: string }): ReactNode {
  if (ok) return <span className="lab-pill" data-state="ok">✓ {okText}</span>;
  if (misconception) return <span className="lab-misconception" role="status"><span aria-hidden>⚠</span> {misconception}</span>;
  return <span className="lab-pill" data-state="no">{tryText}</span>;
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
export function RevealSolution({ solution, available = true, onReveal, buttonLabel = 'Show answer', note = 'Peeking, this one won’t count as solved on your own.' }: RevealSolutionProps): ReactNode {
  const [shown, setShown] = useState(false);
  if (shown) {
    return (
      <div className="lab-solution" role="status">
        <span className="lab-solution-h"><span aria-hidden>🔑</span> Solution</span>
        <div className="lab-solution-body">{solution}</div>
        {note && <p className="lab-solution-note">{note}</p>}
      </div>
    );
  }
  if (!available) return null;
  return (
    <button type="button" className="lab-reveal-btn" onClick={() => { setShown(true); onReveal?.(); }}>
      {buttonLabel}
    </button>
  );
}
