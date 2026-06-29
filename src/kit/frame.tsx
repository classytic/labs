'use client';

/**
 * LabFrame, the shared layout shell every lab composes into, so labs stop being
 * hand-rolled inline-styled one-offs and read as ONE product. Structure:
 *
 *   title + one-line prompt           (header, no walls of text)
 *   [▸ goals]                         (collapsed disclosure, reveal-on-action)
 *   ┌─ figure (dominant) ─┬─ aside ─┐ (one grid; aside optional + narrow)
 *   └─────────────────────┴─────────┘
 *   [ one controls bar ]             (ALL knobs in one place, never scattered)
 *   feedback / hints / reveal        (quiet footer)
 *
 * Everything styles off `.lab-*` in @classytic/labs/styles.css, no inline layout.
 * Pair with the existing pedagogy kit (HintLadder, RevealSolution, Feedback).
 *
 * CREATOR CONTROL, `controlConfig` lets the author decide, per knob, what a learner
 * may touch: `{ hide: ['mass'], lock: ['angle'] }`. Hidden knobs vanish; locked knobs
 * stay visible but read-only (their value is whatever the creator set as the initial
 * prop). LabFrame provides this as context; `Field` (keyed by its `name ?? label`) and
 * the `Control` wrapper consume it, so a lab opts in with ~2 lines and every knob,
 * existing or new, honours it. The mechanism is uniform: no per-knob boolean props.
 */

import { createContext, useContext, type Ref, type ReactNode } from 'react';

/** Per-control creator overrides: two name-lists, ergonomic for authors + agents. */
export interface ControlConfig {
  /** Control names to remove entirely (learner can't see or change them). */
  hide?: string[];
  /** Control names to show read-only (frozen at the creator's initial value). */
  lock?: string[];
}

const ControlCtx = createContext<ControlConfig | undefined>(undefined);

/** Resolve a single control's state from the surrounding `controlConfig`. */
export function useControlOverride(name: string): { hide: boolean; lock: boolean } {
  const cfg = useContext(ControlCtx);
  return { hide: !!cfg?.hide?.includes(name), lock: !!cfg?.lock?.includes(name) };
}

// `inert` makes the wrapped subtree non-interactive AND unfocusable (mouse + keyboard).
const INERT = { inert: true } as const;

export interface LabFrameProps {
  title?: string;
  prompt?: string;
  /** Collapsed "goals" disclosure (the old upfront Objectives wall, tamed). */
  objectives?: string[];
  /** The dominant visual. */
  children: ReactNode;
  /** Optional narrow side column (readouts, a guess, a result callout). */
  aside?: ReactNode;
  /** The single controls bar, pass <ControlBar>…</ControlBar>. */
  controls?: ReactNode;
  /** Quiet footer: feedback / hints / reveal / a note. */
  footer?: ReactNode;
  /** Ref on the outer container, e.g. for useInView() to pause a sim off-screen. */
  rootRef?: Ref<HTMLDivElement>;
  /** Creator's per-control hide/lock policy, flows to every Field/Control below. */
  controlConfig?: ControlConfig;
}

export function LabFrame({ title, prompt, objectives, children, aside, controls, footer, rootRef, controlConfig }: LabFrameProps): ReactNode {
  return (
    <ControlCtx.Provider value={controlConfig}>
      <div ref={rootRef} className="not-prose lab-frame">
        {(title || prompt) && (
          <div className="lab-frame-head">
            {title && <p className="lab-title">{title}</p>}
            {prompt && <p className="lab-prompt">{prompt}</p>}
          </div>
        )}
        {objectives && objectives.length > 0 && (
          <details className="lab-goals">
            <summary>What you'll learn</summary>
            <ul>{objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </details>
        )}
        <div className="lab-body" data-aside={aside ? 'true' : 'false'}>
          <div className="lab-figure">{children}</div>
          {aside && <div className="lab-aside">{aside}</div>}
        </div>
        {controls && <div className="lab-controls">{controls}</div>}
        {footer && <div className="lab-foot">{footer}</div>}
      </div>
    </ControlCtx.Provider>
  );
}

/** The single controls bar. Put `Field`s (or any control) inside. */
export function ControlBar({ children }: { children: ReactNode }): ReactNode {
  return <>{children}</>;
}

/**
 * Group an inline expression (parens, steppers, "→ result", …) so it reads as ONE
 * unit. `.lab-controls` is a grid that gives EACH ControlBar child its own ~185px
 * cell, which scatters a multi-piece expression across columns. Wrap those pieces
 * in `<ControlExpr>` and they stay together (one cell, tight gaps, baseline-aligned).
 */
export function ControlExpr({ children }: { children: ReactNode }): ReactNode {
  // span the FULL controls row (gridColumn 1/-1) so the expression has the whole
  // width and stays on one line, instead of wrapping inside a single ~185px cell.
  return <span style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontWeight: 600 }}>{children}</span>;
}

const LockMark = (): ReactNode => (
  <svg className="lab-field-lock" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/**
 * A labelled control: small-caps label + (control + value) on one row.
 * Participates in creator `controlConfig` via `name ?? label`.
 */
export function Field({ label, name, value, children }: { label: string; name?: string; value?: ReactNode; children: ReactNode }): ReactNode {
  const { hide, lock } = useControlOverride(name ?? label);
  if (hide) return null;
  return (
    <span className="lab-field" data-locked={lock ? 'true' : undefined}>
      <span className="lab-field-label">{label}{lock && <LockMark />}</span>
      <span className="lab-field-row">
        {lock ? <span className="lab-locked-wrap" {...INERT}>{children}</span> : children}
        {value != null && <span className="lab-field-val">{value}</span>}
      </span>
    </span>
  );
}

/**
 * Wrap any non-Field control (a toggle, an action button) so it honours the creator's
 * hide/lock policy too: `<Control name="components"><Chip…/></Control>`.
 */
export function Control({ name, children }: { name: string; children: ReactNode }): ReactNode {
  const { hide, lock } = useControlOverride(name);
  if (hide) return null;
  if (!lock) return <>{children}</>;
  return <span className="lab-locked-wrap" {...INERT}>{children}</span>;
}

/** A highlighted readout box. `tone="result"` for the headline answer. */
export function Callout({ tone, children }: { tone?: 'info' | 'result'; children: ReactNode }): ReactNode {
  return <div className="lab-callout" data-tone={tone ?? 'info'}>{children}</div>;
}

const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } as const;

/** Visually-hidden polite live region for screen-reader narration of a changing value. */
export function LiveRegion({ children }: { children: ReactNode }): ReactNode {
  return <div aria-live="polite" style={SR_ONLY}>{children}</div>;
}

/**
 * A labelled progress/energy bar: `frac` (0–1) fills it, `value` is the right-hand
 * readout. Replaces the hand-rolled bars in collision/energy/impulse/etc.
 */
export function MeterBar({ label, frac, color, value }: { label: ReactNode; frac: number; color: string; value?: ReactNode }): ReactNode {
  const pct = Math.max(0, Math.min(1, frac)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}><span>{label}</span>{value != null && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>}</div>
      <div style={{ height: 12, borderRadius: 6, background: 'color-mix(in oklab, var(--stage-muted) 18%, transparent)', overflow: 'hidden', marginTop: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.1s' }} />
      </div>
    </div>
  );
}
