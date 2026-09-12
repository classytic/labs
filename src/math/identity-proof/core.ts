/**
 * Proving a trigonometric identity, where the difficulty is CHOOSING the move.
 *
 * Our whole library teaches derivations with `Derivation`, which shows the next line and explains
 * it. That is the right shape for a formula with one route. It is the wrong shape for proving an
 * identity, because an identity can be proved several ways and the examinable skill is not
 * executing a step, it is deciding which step to reach for. A learner who watches five worked
 * proofs still freezes at "prove that ...", and they freeze at line one.
 *
 * So here the next line is not shown. The learner picks a move from a menu, and the menu contains
 * moves that are perfectly legal algebra and simply do not get anywhere. Choosing one is not
 * punished with "wrong"; it is answered with the reason it leads nowhere, which is the thing nobody
 * writes down. That is the difference between knowing the identities and being able to use them.
 *
 * TWO RULES OF THE GAME, both examinable and both encoded here:
 *
 *   Work ONE SIDE ONLY. A proof that operates on both sides at once assumes the thing being proved.
 *   That is why `Proof` names a starting side and the chain has a single direction.
 *
 *   Start from the MESSIER side. There is more to cancel, and the target is a fixed thing to aim
 *   at. Starting from the simple side means inventing complexity with nothing to guide you.
 *
 * The author supplies the chain. This module's job is to serve the menu, judge a choice, and refuse
 * to ship a broken chain (see `proofProblems`).
 */

/** One move that can appear in the menu. */
export interface Move {
  id: string;
  /** How it reads in the menu, e.g. "Replace 1 + tan²θ with sec²θ". */
  label: string;
}

/** A move that is legal here but does not advance the proof, and why. */
export interface Detour {
  move: string;
  why: string;
}

export interface ProofStep {
  /** The expression before this step, as LaTeX. */
  from: string;
  /** Id of the move that advances the proof. */
  move: string;
  /** The expression after it. */
  to: string;
  /** Why this was the move to reach for. Shown only once it has been chosen. */
  why: string;
  /** Legal moves that go nowhere from here. The menu is built from these plus the real one. */
  detours?: Detour[];
}

export interface Proof {
  /** The identity being proved, as LaTeX. */
  claim: string;
  /** Which side the working starts from, and therefore which side is the target. */
  start: 'lhs' | 'rhs';
  /** The target the chain must arrive at. */
  target: string;
  steps: ProofStep[];
}

/**
 * A tiny deterministic shuffle.
 *
 * The menu order must not give the answer away by always listing the right move first, and it must
 * be IDENTICAL on the server and in the browser or React discards the markup and the lab flickers
 * on load. So no Math.random: the order is a pure function of the step index and the move ids.
 */
function stableOrder<T>(items: T[], keyOf: (item: T) => string, salt: number): T[] {
  const score = (key: string): number => {
    let h = salt * 2654435761;
    for (let i = 0; i < key.length; i++) h = (h ^ key.charCodeAt(i)) * 16777619;
    return h >>> 0;
  };
  return [...items].sort((a, b) => score(keyOf(a)) - score(keyOf(b)));
}

/** The choices to offer at one step: the move that works, plus the ones that do not. */
export function menuFor(step: ProofStep, index: number): string[] {
  const ids = [step.move, ...(step.detours ?? []).map((d) => d.move)];
  return stableOrder(ids, (id) => id, index + 1);
}

export type Verdict =
  { kind: 'advance'; to: string; why: string } | { kind: 'detour'; why: string } | { kind: 'unavailable' };

/** Judge one choice at one step. */
export function judge(step: ProofStep, moveId: string): Verdict {
  if (moveId === step.move) return { kind: 'advance', to: step.to, why: step.why };
  const detour = step.detours?.find((d) => d.move === moveId);
  // "Unavailable" is not the same as "wrong": it means the move was not even on this menu, which
  // only happens if a caller passes an id from another step.
  return detour ? { kind: 'detour', why: detour.why } : { kind: 'unavailable' };
}

/** The lines of working produced so far, starting from the opening expression. */
export function workingAfter(proof: Proof, completed: number): string[] {
  const lines = [proof.steps[0]?.from ?? proof.target];
  for (let i = 0; i < Math.min(completed, proof.steps.length); i++) lines.push(proof.steps[i]!.to);
  return lines;
}

export const isComplete = (proof: Proof, completed: number): boolean => completed >= proof.steps.length;

/**
 * Authoring mistakes that would ship a proof which does not prove anything.
 *
 * The connectedness check is the one that earns its keep. An author who improves the wording of one
 * line and forgets the next line's `from` produces a proof that silently jumps: every step still
 * looks reasonable on its own, the learner is graded correct throughout, and the chain proves
 * nothing. That failure is invisible in review and impossible to see in a screenshot.
 */
export function proofProblems(proof: Proof, moves: readonly Move[]): string[] {
  const problems: string[] = [];
  const known = new Set(moves.map((m) => m.id));
  if (!proof.steps.length) problems.push('a proof needs at least one step');

  for (const [i, step] of proof.steps.entries()) {
    if (!known.has(step.move)) problems.push(`step ${i + 1} uses the unknown move "${step.move}"`);
    for (const detour of step.detours ?? []) {
      if (!known.has(detour.move)) problems.push(`step ${i + 1} offers the unknown move "${detour.move}"`);
      if (detour.move === step.move) problems.push(`step ${i + 1} lists its own correct move as a detour`);
    }
    const next = proof.steps[i + 1];
    if (next && next.from !== step.to)
      problems.push(`step ${i + 1} ends at "${step.to}" but step ${i + 2} starts at "${next.from}"`);
  }

  const last = proof.steps.at(-1);
  if (last && last.to !== proof.target)
    problems.push(`the last step ends at "${last.to}", which is not the target "${proof.target}"`);

  // A menu of one is not a choice, and choosing the only option teaches nothing about choosing.
  const noChoice = proof.steps.filter((s) => !s.detours?.length).length;
  if (noChoice) problems.push(`${noChoice} step(s) offer no alternative move, so there is nothing to decide`);

  return problems;
}
