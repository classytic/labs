import { CalcStep, Worked } from "./calc.mjs";
import { ReactNode } from "react";

//#region src/kit/rule.d.ts
interface RuleInput {
  key: string;
  label: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
}
interface RuleDef<I extends Record<string, number> = Record<string, number>> {
  id: string;
  name: string;
  /** Headline formula, LaTeX. */
  formula: string;
  /** One-line intuition / analogy. */
  analogy?: string;
  /** A diagram shown under the formula. Static, OR a function of the current
   *  inputs so the GEOMETRY moves with the calculator (e.g. a unit circle that
   *  turns as θ changes). This is the visual-proof primitive authors compose. */
  figure?: ReactNode | ((vals: I) => ReactNode);
  /** Live-calculator knobs (omit for a static formula card). */
  inputs?: RuleInput[];
  /** Compute the worked result from the current inputs (shows its working). */
  compute?: (vals: I) => Worked;
  /** Why it's true: ordered proof/derivation lines, revealed on demand. */
  derivation?: CalcStep[];
  /** Identities, shortcuts, common traps. */
  tricks?: string[];
}
/** Render a worked calculation's steps (LaTeX line + note, last one highlighted).
 *  The shared step view for both authored lessons and the dynamic solvers. */
declare function WorkedSteps({
  worked,
  accent
}: {
  worked: Worked;
  accent?: boolean;
}): ReactNode;
/** The card body (no frame) — embed in a lesson, a RuleLab, or beside a widget. */
declare function RuleCard({
  rule
}: {
  rule: RuleDef;
}): ReactNode;
/** A RuleCard wrapped in a LabFrame — the standalone lab / CMS-block form. */
declare function RuleLab({
  rule,
  title,
  prompt
}: {
  rule: RuleDef;
  title?: string;
  prompt?: string;
}): ReactNode;
//#endregion
export { RuleCard, RuleDef, RuleInput, RuleLab, WorkedSteps };