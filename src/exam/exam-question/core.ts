/**
 * Scoring for a structured exam question.
 *
 * Pure and React-free, so the marks a learner sees can be tested directly.
 *
 * The design answers one criticism of concept-first courses: a chapter that ends with a
 * multiple-choice question tests recognition, not production. Here the learner types the answer
 * with no options in front of them, marks are awarded per part the way a mark scheme awards them,
 * and a wrong answer that matches a KNOWN mistake is told which mistake it made rather than just
 * "no". That last part is where the teaching is: "you used the diameter as the radius" moves a
 * student on, and a red cross does not.
 */
import { checkAnswer, normalizeMathInput, type AnswerSpec } from '../../kit/answer-check.js';

/** One thing a mark scheme rewards, worth one mark unless the author says otherwise. */
export interface MarkPoint {
  /** What earns the mark, in the examiner's words. */
  text: string;
  /** Marks for this point. Defaults to 1. */
  marks?: number;
}

/** A wrong answer the author expects, and the misconception behind it. */
export interface CommonError {
  /** The wrong value or expression a student is likely to produce. */
  answer: string;
  /** Why they got it, phrased as the fix rather than the failure. */
  why: string;
  /**
   * This answer is mathematically EQUIVALENT to the correct one, but not in the form the
   * question demands.
   *
   * "Factorise completely" accepts only the complete factorisation; "give your answer in
   * standard form" accepts only standard form; "express as a product of prime factors" is not
   * satisfied by the number itself. An equivalence checker cannot see any of that: it says 84
   * and 2^2 x 3 x 7 are the same, because they are. Flagging the entry makes the lab check it
   * BEFORE the equivalence test, so the student gets told which form is wanted rather than
   * being marked right for the answer the question was trying to avoid.
   */
  equivalent?: boolean;
}

export interface ExamPart {
  /** The part label as the paper prints it: 'a', 'b', 'b(i)'. */
  label: string;
  prompt: string;
  /** Marks available. The sum across parts is the question total. */
  marks: number;
  /** The Cambridge command word, which decides what an answer must contain. */
  command?:
    | 'state'
    | 'describe'
    | 'explain'
    | 'calculate'
    | 'determine'
    | 'show that'
    | 'estimate'
    | 'suggest'
    | 'deduce'
    | 'evaluate';
  /** The graded answer. Omit for a part that is marked by the scheme alone, e.g. "explain". */
  answer?: AnswerSpec;
  /** Unit the answer is expected in, shown beside the input. */
  unit?: string;
  /** The marking points, in the order an examiner awards them. */
  markScheme: MarkPoint[];
  commonErrors?: CommonError[];
}

export interface ExamQuestion {
  /** Where this question comes from or what it imitates. */
  reference?: string;
  /** The scenario, shared by every part. */
  stem: string;
  parts: ExamPart[];
}

/** Total marks available, always derived from the parts so it cannot drift. */
export function totalMarks(parts: readonly ExamPart[]): number {
  return parts.reduce((sum, part) => sum + part.marks, 0);
}

/**
 * Marks a mark scheme accounts for, which should equal the part's marks.
 *
 * A scheme that does not add up to the marks on offer is an authoring error: the student is told
 * a part is worth 4 and then shown three things to earn. `examQuestionProblems` reports it.
 */
export function schemeMarks(part: ExamPart): number {
  return part.markScheme.reduce((sum, point) => sum + (point.marks ?? 1), 0);
}

/** Authoring mistakes worth failing a build over, rather than shipping to a student. */
export function examQuestionProblems(question: ExamQuestion): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const part of question.parts) {
    if (seen.has(part.label)) problems.push(`duplicate part label "${part.label}"`);
    seen.add(part.label);
    const scheme = schemeMarks(part);
    if (scheme !== part.marks)
      problems.push(`part ${part.label} offers ${part.marks} mark(s) but its scheme accounts for ${scheme}`);
    for (const slip of part.commonErrors ?? []) {
      if (!part.answer) continue;
      const equivalent = checkAnswer(part.answer, slip.answer);
      // A "common error" that is actually the right answer would tell a correct student they are
      // wrong, UNLESS the author flagged it as a wrong-FORM answer, which is exactly the case
      // where being equivalent is the point.
      if (equivalent && !slip.equivalent)
        problems.push(`part ${part.label} lists the CORRECT answer "${slip.answer}" as a common error`);
      // And the flag has to be true: marking a genuinely wrong answer as equivalent would put it
      // ahead of the correctness test and hide a real mistake behind a form complaint.
      if (slip.equivalent && !equivalent)
        problems.push(
          `part ${part.label} flags "${slip.answer}" as equivalent, but it is not equal to the answer`,
        );
    }
  }
  return problems;
}

export type PartVerdict =
  | { state: 'unanswered' }
  | { state: 'correct'; marks: number }
  | { state: 'known-error'; why: string }
  | { state: 'wrong' };

/** A normalised string that is a bare number, so `parseFloat` reads ALL of it and not a prefix. */
const NUMERIC = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/** Grade one typed response against a part. */
export function gradePart(part: ExamPart, raw: string): PartVerdict {
  const trimmed = raw.trim();
  if (!trimmed) return { state: 'unanswered' };
  const normalized = normalizeMathInput(trimmed).toLowerCase();
  const slips = part.commonErrors ?? [];

  // Wrong-form answers are checked FIRST, because they are equivalent to the right answer and
  // the equivalence test below would call them correct.
  for (const slip of slips)
    if (slip.equivalent && normalized === normalizeMathInput(slip.answer).toLowerCase())
      return { state: 'known-error', why: slip.why };

  if (part.answer && checkAnswer(part.answer, trimmed)) return { state: 'correct', marks: part.marks };

  // An exact match is the author naming this answer, so it wins outright.
  for (const slip of slips)
    if (normalized === normalizeMathInput(slip.answer).toLowerCase())
      return { state: 'known-error', why: slip.why };

  // Then the rounding allowance, so an author's 0.355 also catches a student who wrote 0.36.
  // Two rules keep it honest. Only bare numbers on both sides: `parseFloat` reads a prefix, so
  // without that guard every expression starting with the same digit collides ("2*3^2*7" and
  // "2*3*7" both parse as 2). And the NEAREST slip wins, not the first one written: when two
  // anticipated mistakes sit close together, showing the wrong diagnosis is worse than showing
  // none, because the student is told they made a mistake they did not make.
  let best: { slip: CommonError; distance: number } | null = null;
  if (NUMERIC.test(normalized)) {
    const a = Number.parseFloat(normalized);
    for (const slip of slips) {
      const target = normalizeMathInput(slip.answer).toLowerCase();
      if (!NUMERIC.test(target)) continue;
      const b = Number.parseFloat(target);
      if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) continue;
      const distance = Math.abs(a - b) / Math.abs(b);
      if (distance < 0.02 && (!best || distance < best.distance)) best = { slip, distance };
    }
  }
  if (best) return { state: 'known-error', why: best.slip.why };
  return { state: 'wrong' };
}

/** Marks earned so far, for the running total. */
export function earnedMarks(parts: readonly ExamPart[], verdicts: Record<string, PartVerdict>): number {
  let earned = 0;
  for (const part of parts) {
    const verdict = verdicts[part.label];
    if (verdict?.state === 'correct') earned += verdict.marks;
  }
  return earned;
}
