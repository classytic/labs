/**
 * Worked-calculation core. A lab that just prints an answer teaches nothing; this
 * makes a calculation SHOW ITS WORKING — every substitution and simplification as
 * a rendered line — so an author can demonstrate HOW a rule computes, not just
 * what it returns. Pure + dependency-free: the engine produces data (a value plus
 * a list of LaTeX steps); a component renders it.
 *
 * Pair with kit/rule's <RuleCard> (formula + analogy + this calculation +
 * derivation + tricks) to turn a bare formula into a smart, authorable concept.
 */

/** One line of a worked calculation: a LaTeX expression + an optional plain note. */
export interface CalcStep {
  tex: string;
  /** Why this step follows ("substitute n = 5", "the falling product"). */
  note?: string;
}

/** The result of a worked calculation: the final value + the steps that got there. */
export interface Worked {
  value: number;
  steps: CalcStep[];
}

/** A tiny fluent builder: calc().step('…','…').step('…').done(value). */
export class Calc {
  private readonly _steps: CalcStep[] = [];
  step(tex: string, note?: string): this {
    this._steps.push(note === undefined ? { tex } : { tex, note });
    return this;
  }
  done(value: number): Worked {
    return { value, steps: this._steps };
  }
}

export const calc = (): Calc => new Calc();

/** Format a number for inline LaTeX (thin-space thousands so big counts read). */
export function texNum(n: number): string {
  if (!Number.isFinite(n)) return '\\text{?}';
  const s = Math.abs(n) >= 10000 ? n.toLocaleString('en-US').replace(/,/g, '{,}') : String(n);
  return s;
}
