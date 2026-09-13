'use client';

/** Shared field, readout, progress, and author-control primitives for Activity. */

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { Activity } from './activity.js';

/**
 * Cause→effect glue: bump a sequence number whenever a primitive (string/number)
 * value changes, so the value element can replay a short CSS flash (via `key`
 * remount). The number GLOWS while the learner drags and settles when they stop,
 * visually linking "I moved this" to "that changed". Non-primitive values never
 * flash (no cheap equality). 0 on mount = no flash on first paint.
 */
function useFlashSeq(v: ReactNode): number {
  const prev = useRef<unknown>(v);
  const seq = useRef(0);
  if ((typeof v === 'string' || typeof v === 'number') && !Object.is(prev.current, v)) {
    prev.current = v;
    seq.current++;
  }
  return seq.current;
}

/** Per-control creator overrides: two name-lists, ergonomic for authors + agents. */
export interface ControlConfig {
  /** Control names to remove entirely (learner can't see or change them). */
  hide?: string[];
  /** Control names to show read-only (frozen at the creator's initial value). */
  lock?: string[];
}

const ControlCtx = createContext<ControlConfig | undefined>(undefined);

/** Apply creator hide/lock policy to composed shells such as Activity. */
export function ControlPolicy({
  config,
  children,
}: {
  config?: ControlConfig;
  children: ReactNode;
}): ReactNode {
  return <ControlCtx.Provider value={config}>{children}</ControlCtx.Provider>;
}

/** Resolve a single control's state from the surrounding `controlConfig`. */
export function useControlOverride(name: string): { hide: boolean; lock: boolean } {
  const cfg = useContext(ControlCtx);
  return { hide: !!cfg?.hide?.includes(name), lock: !!cfg?.lock?.includes(name) };
}

// `inert` makes the wrapped subtree non-interactive AND unfocusable (mouse + keyboard).
const INERT = { inert: true } as const;

/**
 * Keep a primary visualization and its live concrete representations in one
 * perceptual workspace. Unlike inspector evidence, these views are not supporting
 * metadata: they are equal representations of the same value and therefore stay
 * adjacent until the narrow mobile breakpoint.
 */
export function LinkedViews({
  primary,
  representations,
  readout,
}: {
  primary: ReactNode;
  representations?: ReactNode;
  readout?: ReactNode;
}): ReactNode {
  return (
    <div className="lab-linked-stack">
      {representations ? (
        <div className="lab-reps">
          <div className="lab-reps-plot">{primary}</div>
          <div className="lab-reps-views">{representations}</div>
        </div>
      ) : (
        primary
      )}
      {readout}
    </div>
  );
}

/**
 * A stable responsive frame for interchangeable SVG, Canvas, or WebGL scenes.
 *
 * Authors may swap renderers without changing the activity's geometry. This is
 * intentionally a layout primitive—not a drawing surface—so domain renderers
 * retain their own semantics, camera, and interaction model.
 */
export function SceneViewport({
  children,
  size = 'standard',
  label,
  overflow = 'fit',
  className,
}: {
  children: ReactNode;
  size?: 'strip' | 'compact' | 'standard' | 'wide';
  label?: string;
  /** Keep dense apparatus readable on narrow screens instead of shrinking its labels. */
  overflow?: 'fit' | 'scroll';
  className?: string;
}): ReactNode {
  return (
    <div
      className={['lab-scene-viewport', className].filter(Boolean).join(' ')}
      data-size={size}
      data-overflow={overflow}
      aria-label={label}
      role={label ? 'region' : undefined}
      tabIndex={overflow === 'scroll' ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Group an inline expression (parens, steppers, "→ result", …) so it reads as ONE
 * unit. Activity field grids give each child its own responsive cell;
 * cell, which scatters a multi-piece expression across columns. Wrap those pieces
 * in `<ControlExpr>` and they stay together (one cell, tight gaps, baseline-aligned).
 */
export function ControlExpr({ children }: { children: ReactNode }): ReactNode {
  // span the FULL controls row so the expression stays on one line instead of
  // wrapping inside a single ~185px cell (see `.lab-control-expr`).
  return <span className="lab-control-expr">{children}</span>;
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
export function Field({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name?: string;
  value?: ReactNode;
  children: ReactNode;
}): ReactNode {
  const { hide, lock } = useControlOverride(name ?? label);
  if (hide) return null;
  return (
    <span className="lab-field" data-locked={lock ? 'true' : undefined}>
      <span className="lab-field-label">
        {label}
        {lock && <LockMark />}
      </span>
      <span className="lab-field-row">
        {lock ? (
          <span className="lab-locked-wrap" {...INERT}>
            {children}
          </span>
        ) : (
          children
        )}
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
  return (
    <span className="lab-locked-wrap" {...INERT}>
      {children}
    </span>
  );
}

/**
 * The standard aside stat-block: an optional eyebrow `label`, a bold headline
 * `value`, and a muted `sub` line on a standard evidence surface.
 */
export function Readout({
  label,
  value,
  sub,
  tone = 'result',
  accent,
}: {
  label?: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'info' | 'result';
  accent?: string;
}): ReactNode {
  const flash = useFlashSeq(value);
  return (
    <div className="lab-evidence-surface" data-tone={tone}>
      <span className="lab-readout">
        {label != null && <span className="lab-readout-label">{label}</span>}
        <span
          key={flash}
          className={flash ? 'lab-readout-val lab-val-flash' : 'lab-readout-val'}
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {sub != null && <span className="lab-readout-sub">{sub}</span>}
      </span>
    </div>
  );
}

/**
 * One "label … value" row in a readout. `tone` colours the value (good/warn/danger).
 * The label sits left (muted), the value right (bold, tabular) — aligned columns, so
 * a stack of stats reads like a clean instrument panel instead of ragged sentences.
 */
export function Stat({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'good' | 'warn' | 'danger';
}): ReactNode {
  const flash = useFlashSeq(value);
  return (
    <span className="lab-stat">
      <span className="lab-stat-label">{label}</span>
      <strong key={flash} className={flash ? 'lab-stat-val lab-val-flash' : 'lab-stat-val'} data-tone={tone}>
        {value}
      </strong>
    </span>
  );
}

/**
 * A readout of several `Stat` rows on one standard evidence surface.
 */
export function StatList({
  children,
  tone = 'result',
}: {
  children: ReactNode;
  tone?: 'info' | 'result';
}): ReactNode {
  return (
    <div className="lab-evidence-surface" data-tone={tone}>
      <span className="lab-statlist">{children}</span>
    </div>
  );
}

/** Visually-hidden polite live region for screen-reader narration of a changing value. */
export function LiveRegion({ children }: { children: ReactNode }): ReactNode {
  return <Activity.LiveRegion>{children}</Activity.LiveRegion>;
}

/**
 * Step progress for a multi-item lab (a deck of questions): a row of segments
 * (one per item, filled as they're solved) with a compact count, or a slim bar
 * when the deck is long. Reads as a deliberate "lesson progress" affordance —
 * the premium alternative to a "2 / 4" text pill marooned in a wide aside.
 *
 * Place it in an Activity header or status region.
 * On completion it flips to a "✓ {label}" success chip.
 */
export function Progress({
  done,
  total,
  label = 'Done',
  segmentedMax = 8,
}: {
  done: number;
  total: number;
  label?: string;
  segmentedMax?: number;
}): ReactNode {
  return <Activity.ItemProgress done={done} total={total} label={label} segmentedMax={segmentedMax} />;
}

/**
 * A labelled progress/energy bar: `frac` (0–1) fills it, `value` is the right-hand
 * readout. Styling lives in `.lab-meter*`; the fill colour is passed as a CSS var.
 */
export function MeterBar({
  label,
  frac,
  color,
  value,
}: {
  label: ReactNode;
  frac: number;
  color: string;
  value?: ReactNode;
}): ReactNode {
  const pct = Math.max(0, Math.min(1, frac)) * 100;
  return (
    <div className="lab-meter">
      <div className="lab-meter-head">
        <span>{label}</span>
        {value != null && <b>{value}</b>}
      </div>
      <div className="lab-meter-track">
        <div
          className="lab-meter-fill"
          style={{ width: `${pct}%`, ['--lab-meter-color' as string]: color }}
        />
      </div>
    </div>
  );
}
