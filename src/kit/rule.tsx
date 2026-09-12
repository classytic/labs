'use client';

/**
 * RuleCard, the authorable CONCEPT engine. A bare formula is inert; a Rule bundles
 * everything a learner needs to actually UNDERSTAND it, and an author supplies it
 * all as data, no bespoke code per concept:
 *
 *   • formula     , the headline identity (LaTeX).
 *   • analogy     , the one-line intuition ("a combination is a team: order
 *                   doesn't matter").
 *   • calculator  , live input knobs + a worked computation that SHOWS its working
 *                   (every substitution + simplification), via kit/calc's Worked.
 *   • derivation  , the proof / why-it's-true, revealed on demand.
 *   • tricks      , the identities, shortcuts and traps that make someone fluent.
 *
 * One reusable component renders all of it (Brilliant-style concept card). Domains
 * declare their rules as data (see discrete/rules.ts) and drop them in a lab or a
 * lesson. Pure presentation over <Tex> + kit controls.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Tex } from '../core/tex.js';
import { Stepper } from './controls.js';
import { Activity } from './activity.js';
import type { CalcStep, Worked } from './calc.js';
import type { ChallengeQuestion } from './pedagogy.js';
import { PredictGate } from './predict-gate.js';

export interface RuleInput {
  key: string;
  label: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

/** Standard boundary for authored rule visuals. Domain scenes remain ordinary
 * React components; this primitive supplies consistent sizing and captions. */
export function RuleFigure({
  children,
  caption,
  ariaLabel,
}: {
  children: ReactNode;
  caption?: ReactNode;
  ariaLabel: string;
}): ReactNode {
  return (
    <figure className="rule-figure" aria-label={ariaLabel}>
      <div className="rule-figure-scene">{children}</div>
      {caption != null && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export interface RuleDef<I extends Record<string, number> = Record<string, number>> {
  id: string;
  name: string;
  /** Optional activity instruction. RuleLab derives an accurate default when omitted. */
  prompt?: string;
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
  /**
   * Where the result came from: who needed it, and what problem forced it into existence.
   *
   * Separate from `analogy`, which says what the formula is LIKE, and from `derivation`, which
   * says why it is true. This says why anyone bothered. A learner who knows that the sine rule was
   * worked out by astronomers who could measure angles between stars but could not measure the
   * distance to one has a reason to expect a rule connecting sides to angles, and a hook to hang it
   * on a year later. Kept to a sentence or two: this is a hook, not a history lesson, and a
   * paragraph here would push the formula off the screen.
   */
  origin?: string;
  /** Optional predict-first checkpoint. Full RuleLab activities report its
   * completion through the shared learner seam; compact embeds omit it. */
  challenge?: ChallengeQuestion[];
}

/** Render a worked calculation's steps (LaTeX line + note, last one highlighted).
 *  The shared step view for both authored lessons and the dynamic solvers. */
export function WorkedSteps({ worked, accent = true }: { worked: Worked; accent?: boolean }): ReactNode {
  return <StepList steps={worked.steps} accent={accent} />;
}

function StepList({ steps, accent }: { steps: CalcStep[]; accent?: boolean }): ReactNode {
  return (
    <ol className="rule-step-list">
      {steps.map((s, i) => (
        <li key={i} data-result={accent && i === steps.length - 1 ? 'true' : undefined}>
          <span className="rule-step-expression">
            <Tex tex={s.tex} />
          </span>
          {s.note && <span className="rule-step-note">{s.note}</span>}
        </li>
      ))}
    </ol>
  );
}

/** The card body (no frame), embed in a lesson, a RuleLab, or beside a widget. */
export function RuleCard({
  rule,
  display = 'card',
  showHeading = true,
}: {
  rule: RuleDef;
  /** `card` embeds in prose; `activity` lets RuleLab provide the outer shell. */
  display?: 'card' | 'activity';
  showHeading?: boolean;
}): ReactNode {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries((rule.inputs ?? []).map((f) => [f.key, f.default])),
  );
  const [showProof, setShowProof] = useState(false);

  const worked = useMemo<Worked | null>(() => (rule.compute ? rule.compute(vals) : null), [rule, vals]);

  return (
    <div className="rule-card" data-display={display}>
      {showHeading && (
        <header className="rule-card-header">
          <div className="rule-card-title">{rule.name}</div>
          {rule.analogy && (
            <div className="rule-card-intuition">
              <span>Intuition</span>
              {rule.analogy}
            </div>
          )}
        </header>
      )}

      <div className="rule-card-workspace">
        <section className="rule-card-scene" aria-label={`${rule.name} visualization`}>
          <div className="rule-card-formula">
            <Tex tex={rule.formula} block />
          </div>
          {rule.figure != null && (
            <div className="rule-card-figure">
              {typeof rule.figure === 'function' ? rule.figure(vals) : rule.figure}
            </div>
          )}
        </section>

        {(worked || rule.analogy) && (
          <section className="rule-card-evidence" aria-label="Live explanation">
            {!showHeading && rule.analogy && (
              <p className="rule-card-intuition">
                <span>Intuition</span>
                {rule.analogy}
              </p>
            )}
            {worked && <StepList steps={worked.steps} accent />}
          </section>
        )}
      </div>

      {rule.inputs && rule.inputs.length > 0 && worked && (
        <div className="rule-card-controls" aria-label="Rule variables">
          {rule.inputs.map((f) => (
            <Stepper
              key={f.key}
              label={f.label}
              value={vals[f.key] ?? f.default}
              min={f.min ?? 0}
              max={f.max ?? 99}
              step={f.step ?? 1}
              onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))}
            />
          ))}
        </div>
      )}

      {/* The patterns are the page a student revises from: which type of question this rule
          answers, the special cases, the trap. A concept book prints them in the margin, not
          behind a fold, and hiding ours meant nobody scanning for "what are the types" ever
          found them. The DERIVATION stays folded, because "show me why" is asked once and the
          list is consulted every time. */}
      {rule.tricks && rule.tricks.length > 0 && (
        <section className="rule-card-patterns">
          <h4>Useful patterns</h4>
          <ul>
            {rule.tricks.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {rule.derivation && rule.derivation.length > 0 && (
        <details
          className="rule-card-support"
          open={showProof || undefined}
          onToggle={(event) => setShowProof(event.currentTarget.open)}
        >
          <summary>Why it works</summary>
          <div className="rule-card-support-body">
            <StepList steps={rule.derivation} />
          </div>
        </details>
      )}
    </div>
  );
}

/** A RuleCard composed as a canonical standalone Activity / CMS-block form. */
export function RuleLab({
  rule,
  title,
  prompt,
}: {
  rule: RuleDef;
  title?: string;
  prompt?: string;
}): ReactNode {
  const defaultPrompt = rule.inputs?.length
    ? 'Make a prediction, then change the variables and connect the visual model to each calculation step.'
    : rule.figure
      ? 'Make a prediction, then use the visual model as a proof and open the explanation when you need it.'
      : 'Make a prediction, follow the reasoning, and open the explanation when you need the derivation.';
  const activity = <RuleCard rule={rule} display="activity" showHeading={false} />;
  const description = prompt ?? rule.prompt ?? defaultPrompt;
  return (
    <Activity.Root className="lab-rule-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Concept model" title={title ?? rule.name} description={description} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Workspace>
        <Activity.Canvas label={`${rule.name} interactive rule`}>
          {rule.challenge && rule.challenge.length > 0 ? (
            <PredictGate
              questions={rule.challenge}
              activity={`rule.${rule.id}`}
              title="Predict before exploring"
              lockLabel="Commit to a prediction to unlock the model"
            >
              {activity}
            </PredictGate>
          ) : (
            activity
          )}
        </Activity.Canvas>
      </Activity.Workspace>
    </Activity.Root>
  );
}
