'use client';

/**
 * Derivation, a step-by-step algebra/equation derivation, revealed one line at a
 * time. Each step is a LaTeX expression (rendered with KaTeX) plus an optional
 * justification ("subtract yₚ", "cross-multiply"). The learner clicks through;
 * the latest line is emphasized. This is how you teach a *derivation*, the
 * two-point line form, the quadratic formula, a chord-length proof, as a guided
 * sequence rather than a wall of algebra.
 *
 * Pure presentation over the engine's `<Tex>` + the shared control kit (no canvas,
 * no equation solving implied, the author supplies the steps, optionally
 * generated/verified with the symbolic engine).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tex } from '../core/tex.js';
import { Activity } from '../kit/activity.js';
import { Chip } from '../kit/controls.js';
import { checkAnswer, type AnswerSpec } from '../kit/answer-check.js';

export interface DerivationStep {
  /** A LaTeX line, e.g. `\\frac{y - y_P}{x - x_P} = \\frac{y_Q - y_P}{x_Q - x_P}`. */
  tex: string;
  /** Why this step follows (shown beside the line). */
  note?: string;
}

export interface DerivationProps {
  steps?: (DerivationStep | string)[];
  title?: string;
  /** Reveal all steps at once instead of stepping (e.g. for print/review). */
  showAll?: boolean;
  /**
   * Withhold the LAST line and make the learner produce it.
   *
   * Without this the learner clicks Next until the answer appears, which is reading a solution,
   * not writing one. With it the stepping stops one line short and the final line is theirs to
   * find. That single difference is what a printed worked example cannot do, and it is the only
   * reason this block needs to know about answers at all: the problem statement, the given
   * quantities and any second method are prose, and belong in the MDX around it.
   */
  answer?: AnswerSpec;
  /** Unit shown beside the answer box. */
  unit?: string;
}

function normalize(steps: DerivationProps['steps']): DerivationStep[] {
  const arr = Array.isArray(steps) ? steps : [];
  const out = arr
    .map((s) => (typeof s === 'string' ? { tex: s } : s))
    .filter((s): s is DerivationStep => !!s && typeof s.tex === 'string');
  return out.length ? out : [{ tex: 'a^2 + b^2 = c^2', note: 'add your steps' }];
}

export function Derivation({
  steps,
  title = 'Derivation',
  showAll = false,
  answer,
  unit,
}: DerivationProps = {}): ReactNode {
  const all = normalize(steps);
  const [step, setStep] = useState(showAll ? all.length - 1 : 0);
  const [solved, setSolved] = useState(false);
  const [raw, setRaw] = useState('');
  const [missed, setMissed] = useState(0);
  useEffect(() => {
    setStep(showAll ? all.length - 1 : 0);
    setSolved(false);
  }, [showAll, all.length]);

  // A one-line derivation has nothing to withhold, and `showAll` is for print and review.
  const graded = !!answer && !showAll && all.length >= 2;
  const last = all.length - 1;
  const ceiling = graded && !solved ? last - 1 : last;
  const atCeiling = step >= ceiling;
  const shown = all.slice(0, Math.min(step, ceiling) + 1);
  const figure = (
    <ol className="math-derivation-list">
      {shown.map((s, i) => (
        <li key={i} className="math-derivation-step" data-current={(i === step && !showAll) || undefined}>
          <span className="math-derivation-index">{i + 1}</span>
          <span className="math-derivation-equation">
            <Tex tex={s.tex} />
          </span>
          {s.note && <span className="math-derivation-note">{s.note}</span>}
        </li>
      ))}
    </ol>
  );

  const controls = !showAll ? (
    <div className="lab-activity-fields">
      <Chip selected={false} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
        ← Back
      </Chip>
      <span className="math-derivation-progress">
        step {shown.length} / {all.length}
      </span>
      <Chip selected={false} onClick={() => setStep((s) => Math.min(ceiling, s + 1))} disabled={atCeiling}>
        Next →
      </Chip>
    </div>
  ) : undefined;

  return (
    <Activity.Root className="math-derivation-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Mathematical reasoning"
          title={title}
          description="Work through the derivation one line at a time."
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{showAll ? 'Complete derivation' : `Step ${shown.length}`}</strong>
        <span>{all.length} lines</span>
        {graded ? <span>{solved ? 'you finished it' : 'last line is yours'}</span> : null}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Derivation steps">{figure}</Activity.Canvas>
        {graded && !solved && atCeiling ? (
          <div className="math-derivation-finish">
            <p className="math-derivation-ask">
              {missed >= 2
                ? 'Still not it. Type the last line, or show it and study what you missed.'
                : 'The last line is yours. What does it come to?'}
            </p>
            <div className="lab-field-row">
              <Input
                value={raw}
                placeholder="last line"
                aria-label="Final line"
                onChange={(e) => setRaw(e.target.value)}
              />
              {unit ? <span className="math-derivation-unit">{unit}</span> : null}
              <Button
                type="button"
                size="sm"
                disabled={!raw.trim()}
                onClick={() => {
                  if (checkAnswer(answer!, raw)) {
                    setSolved(true);
                    setStep(last);
                  } else setMissed((n) => n + 1);
                }}
              >
                Check
              </Button>
              {missed >= 2 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSolved(true);
                    setStep(last);
                  }}
                >
                  Show me
                </Button>
              ) : null}
            </div>
            {missed > 0 ? (
              <p className="math-derivation-verdict">
                Not that. Read the line above again and carry it through.
              </p>
            ) : null}
          </div>
        ) : null}
      </Activity.Workspace>
      {/* The per-line reason already sits beside its line, where it can be compared with the one
          above it. Repeating the latest one down here said the same sentence twice on screen and
          made the panel look like new information. What belongs here is the standing instruction,
          which is true of every line and is not written anywhere else. */}
      <Activity.Feedback>
        <span>How to read this</span>
        <div>Compare each line with the one before it and name the step that got you there.</div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        Showing derivation step {shown.length} of {all.length}.
        {shown.at(-1)?.note ? ` ${shown.at(-1)?.note}` : ''}
      </Activity.LiveRegion>
      {!showAll && <Activity.Transport>{controls}</Activity.Transport>}
    </Activity.Root>
  );
}
