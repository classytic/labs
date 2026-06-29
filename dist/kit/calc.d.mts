//#region src/kit/calc.d.ts
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
interface CalcStep {
  tex: string;
  /** Why this step follows ("substitute n = 5", "the falling product"). */
  note?: string;
}
/** The result of a worked calculation: the final value + the steps that got there. */
interface Worked {
  value: number;
  steps: CalcStep[];
}
/** A tiny fluent builder: calc().step('…','…').step('…').done(value). */
declare class Calc {
  private readonly _steps;
  step(tex: string, note?: string): this;
  done(value: number): Worked;
}
declare const calc: () => Calc;
/** Format a number for inline LaTeX (thin-space thousands so big counts read). */
declare function texNum(n: number): string;
//#endregion
export { Calc, CalcStep, Worked, calc, texNum };