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
import { Tex } from '../core/tex.js';
import { LabFrame, ControlBar } from '../kit/frame.js';

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
}

function normalize(steps: DerivationProps['steps']): DerivationStep[] {
  const arr = Array.isArray(steps) ? steps : [];
  const out = arr.map((s) => (typeof s === 'string' ? { tex: s } : s)).filter((s): s is DerivationStep => !!s && typeof s.tex === 'string');
  return out.length ? out : [{ tex: 'a^2 + b^2 = c^2', note: 'add your steps' }];
}

export function Derivation({ steps, title = 'Derivation', showAll = false }: DerivationProps = {}): ReactNode {
  const all = normalize(steps);
  const [step, setStep] = useState(showAll ? all.length - 1 : 0);
  useEffect(() => { setStep(showAll ? all.length - 1 : 0); }, [showAll, all.length]);

  const shown = all.slice(0, step + 1);
  const figure = (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {shown.map((s, i) => (
        <li
          key={i}
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 16px',
            borderRadius: 8, padding: '8px 12px', transition: 'background 120ms',
            background: i === step && !showAll ? 'color-mix(in oklab, var(--primary, var(--stage-accent)) 12%, transparent)' : 'transparent',
          }}
        >
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, opacity: 0.55 }}>{i + 1}</span>
          <span style={{ fontSize: 15 }}><Tex tex={s.tex} /></span>
          {s.note && <span style={{ fontSize: 13, opacity: 0.65 }}>,  {s.note}</span>}
        </li>
      ))}
    </ol>
  );

  const controls = !showAll ? (
    <ControlBar>
      <button type="button" className="lab-chip" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Back</button>
      <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.75 }}>step {step + 1} / {all.length}</span>
      <button type="button" className="lab-chip" onClick={() => setStep((s) => Math.min(all.length - 1, s + 1))} disabled={step >= all.length - 1}>Next →</button>
    </ControlBar>
  ) : undefined;

  return (
    <LabFrame title={title} prompt="Work through the derivation one line at a time." controls={controls}>
      {figure}
    </LabFrame>
  );
}
