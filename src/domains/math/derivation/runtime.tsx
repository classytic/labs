'use client';

/**
 * Derivation runtime — adapter: coerce the steps (unwrap bare-string steps to {tex}).
 *
 * It forwards `answer`, `unit` and `showAll` as well, and that is not incidental. This adapter
 * once passed `steps` and `title` alone, so a lesson authoring `answer={{...}}` had it accepted by
 * the manifest schema, validated by the props checker, and then silently dropped here. The
 * component never saw it, the last line was never withheld, and the learner read the answer they
 * were supposed to produce. Every piece was individually correct; only the seam was wrong.
 *
 * Anything added to the manifest schema has to be forwarded here too, or it does nothing.
 */
import type { ReactNode } from 'react';
import { Derivation } from '../../../math/derivation.js';
import type { AnswerSpec } from '../../../kit/answer-check.js';
import { asSteps } from '../shared.js';

export default function DerivationRuntime(a: Record<string, unknown>): ReactNode {
  return (
    <Derivation
      steps={asSteps(a.steps)}
      title={(a.title as string) ?? 'Derivation'}
      showAll={a.showAll as boolean | undefined}
      answer={a.answer as AnswerSpec | undefined}
      unit={a.unit as string | undefined}
    />
  );
}
