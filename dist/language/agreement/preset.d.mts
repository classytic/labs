import { ReactNode } from "react";

//#region src/language/agreement/preset.d.ts
interface AgreementItem {
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
interface AgreementProps {
  items: AgreementItem[];
  title?: string;
  prompt?: string;
}
declare function AgreementLab({
  items,
  title,
  prompt
}: AgreementProps): ReactNode;
//#endregion
export { AgreementItem, AgreementLab, AgreementProps };