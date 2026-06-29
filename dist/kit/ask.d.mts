import { ChallengeChoice } from "./pedagogy.mjs";
import { AnswerSpec } from "./answer-check.mjs";
import { ReactNode } from "react";

//#region src/kit/ask.d.ts
/** A serializable question spec an author attaches to a lab. */
interface LabAskSpec {
  prompt: ReactNode;
  placeholder?: string;
  /** Typed mode: grade the typed answer (a number, or an algebraic expression). */
  answer?: AnswerSpec;
  /** Multiple-choice mode: the options (set `correct` to one option's value). */
  choices?: ChallengeChoice[];
  correct?: string;
  /** Shown when the right choice is picked. */
  explain?: ReactNode;
}
//#endregion
export { LabAskSpec };