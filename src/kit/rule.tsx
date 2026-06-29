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
import { LabFrame } from './frame.js';
import type { CalcStep, Worked } from './calc.js';

export interface RuleInput {
  key: string;
  label: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface RuleDef<I extends Record<string, number> = Record<string, number>> {
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
export function WorkedSteps({ worked, accent = true }: { worked: Worked; accent?: boolean }): ReactNode {
  return <StepList steps={worked.steps} accent={accent} />;
}

function StepList({ steps, accent }: { steps: CalcStep[]; accent?: boolean }): ReactNode {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {steps.map((s, i) => (
        <li key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 14px', padding: '5px 10px', borderRadius: 8, background: accent && i === steps.length - 1 ? 'color-mix(in oklab, var(--stage-good) 14%, transparent)' : 'transparent' }}>
          <span style={{ fontSize: 15 }}><Tex tex={s.tex} /></span>
          {s.note && <span style={{ fontSize: 12.5, color: 'var(--stage-muted)' }}>{s.note}</span>}
        </li>
      ))}
    </ol>
  );
}

/** The card body (no frame) — embed in a lesson, a RuleLab, or beside a widget. */
export function RuleCard({ rule }: { rule: RuleDef }): ReactNode {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries((rule.inputs ?? []).map((f) => [f.key, f.default])));
  const [showProof, setShowProof] = useState(false);

  const worked = useMemo<Worked | null>(
    () => (rule.compute ? rule.compute(vals) : null),
    [rule, vals],
  );

  return (
    <div style={{ border: '1px solid var(--stage-grid)', borderRadius: 14, background: 'var(--stage-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'grid', gap: 12 }}>
        {/* name + analogy */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{rule.name}</div>
          {rule.analogy && (
            <div style={{ marginTop: 3, fontSize: 13.5, color: 'var(--stage-muted)' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--stage-accent)', marginRight: 8 }}>analogy</span>
              {rule.analogy}
            </div>
          )}
        </div>

        {/* formula */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 4px', fontSize: 18 }}>
          <Tex tex={rule.formula} block />
        </div>

        {/* the diagram: geometry beside the symbols (live with the inputs) */}
        {rule.figure != null && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {typeof rule.figure === 'function' ? rule.figure(vals) : rule.figure}
          </div>
        )}

        {/* live calculator: knobs + worked steps */}
        {rule.inputs && rule.inputs.length > 0 && worked && (
          <div style={{ display: 'grid', gap: 10, borderTop: '1px solid var(--stage-grid)', paddingTop: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {rule.inputs.map((f) => (
                <Stepper key={f.key} label={f.label} value={vals[f.key] ?? f.default} min={f.min ?? 0} max={f.max ?? 99} step={f.step ?? 1}
                  onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))} />
              ))}
            </div>
            <StepList steps={worked.steps} accent />
          </div>
        )}

        {/* derivation reveal */}
        {rule.derivation && rule.derivation.length > 0 && (
          <div style={{ borderTop: '1px solid var(--stage-grid)', paddingTop: 10 }}>
            <button type="button" className="lab-chip" onClick={() => setShowProof((p) => !p)} aria-expanded={showProof}>
              {showProof ? '▾ why it works' : '▸ why it works'}
            </button>
            {showProof && <div style={{ marginTop: 8 }}><StepList steps={rule.derivation} /></div>}
          </div>
        )}

        {/* tricks */}
        {rule.tricks && rule.tricks.length > 0 && (
          <div style={{ borderTop: '1px solid var(--stage-grid)', paddingTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--stage-muted)', marginBottom: 6 }}>tricks &amp; traps</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4, fontSize: 13.5 }}>
              {rule.tricks.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** A RuleCard wrapped in a LabFrame — the standalone lab / CMS-block form. */
export function RuleLab({ rule, title, prompt }: { rule: RuleDef; title?: string; prompt?: string }): ReactNode {
  return (
    <LabFrame title={title ?? rule.name} prompt={prompt ?? 'Plug in numbers to see the rule work, then reveal why it is true.'}>
      <RuleCard rule={rule} />
    </LabFrame>
  );
}
