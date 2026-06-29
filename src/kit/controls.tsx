'use client';

/**
 * Shared control-UI kit for the lab presets, polished, themed, self-contained.
 * <LabStyles/> injects the CSS once (so :hover/:focus/:active actually work , 
 * inline styles can't do pseudo-states, which is what made the controls feel
 * like a cheap prototype). Components: Stepper, CheckButton, StatusPill, Chip,
 * Slider, ControlBar. All themed off the --stage-* tokens.
 */

import type { ReactNode } from 'react';

/**
 * The `.lab-*` control CSS now SHIPS in `@classytic/labs/styles.css` (imported by
 * the host), instead of being injected at runtime. `LabStyles` is a no-op kept
 * for back-compat with presets that still render `<LabStyles/>`.
 * @deprecated import `@classytic/labs/styles.css` once in your global CSS instead.
 */
export function LabStyles(): ReactNode {
  return null;
}

export function Stepper({ value, onChange, min = 0, max = 99, step = 1, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }): ReactNode {
  return (
    <span className="lab-stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`decrease${label ? ' ' + label : ''}`} onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <b>{value}</b>
      <button type="button" aria-label={`increase${label ? ' ' + label : ''}`} onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </span>
  );
}

export function CheckButton({ onClick, disabled, children = 'Check' }: { onClick: () => void; disabled?: boolean; children?: ReactNode }): ReactNode {
  return <button type="button" className="lab-btn" onClick={onClick} disabled={disabled}>{children}</button>;
}

export function StatusPill({ ok, children }: { ok: boolean; children: ReactNode }): ReactNode {
  return <span className="lab-pill" data-state={ok ? 'ok' : 'no'}>{children}</span>;
}

export function Chip({
  selected, onClick, children, ...a11y
}: { selected: boolean; onClick: () => void; children: ReactNode }
  & Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'tabIndex' | 'aria-pressed' | 'aria-label' | 'onKeyDown' | 'title' | 'disabled'>): ReactNode {
  // Chip IS a <button> (Tab + Enter/Space already work); forward optional a11y
  // attributes so callers can add aria-pressed/aria-label/keyboard handlers.
  return <button type="button" className="lab-chip" data-sel={selected} onClick={onClick} {...a11y}>{children}</button>;
}

export function Slider(props: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; ariaLabel: string; style?: React.CSSProperties }): ReactNode {
  // Filled track: accent up to the thumb, a visible rail after, so the line is
  // always visible AND you can read the value position at a glance (the default
  // `--muted` track was ~invisible against a light card).
  const pct = props.max > props.min ? Math.max(0, Math.min(100, ((props.value - props.min) / (props.max - props.min)) * 100)) : 0;
  const fill = `linear-gradient(to right, var(--primary, oklch(0.59 0.22 261)) 0 ${pct}%, color-mix(in oklab, currentColor 20%, transparent) ${pct}% 100%)`;
  return <input type="range" className="lab-slider" value={props.value} min={props.min} max={props.max} step={props.step} aria-label={props.ariaLabel} onChange={(e) => props.onChange(Number(e.currentTarget.value))} style={{ background: fill, ...props.style }} />;
}
