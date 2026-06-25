'use client';

/**
 * Shared control-UI kit for the lab presets — polished, themed, self-contained.
 * <LabStyles/> injects the CSS once (so :hover/:focus/:active actually work —
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

export function Stepper({ value, onChange, min = 0, max = 99, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label?: string }): ReactNode {
  return (
    <span className="lab-stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`decrease${label ? ' ' + label : ''}`} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <b>{value}</b>
      <button type="button" aria-label={`increase${label ? ' ' + label : ''}`} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  );
}

export function CheckButton({ onClick, disabled, children = 'Check' }: { onClick: () => void; disabled?: boolean; children?: ReactNode }): ReactNode {
  return <button type="button" className="lab-btn" onClick={onClick} disabled={disabled}>{children}</button>;
}

export function StatusPill({ ok, children }: { ok: boolean; children: ReactNode }): ReactNode {
  return <span className="lab-pill" data-state={ok ? 'ok' : 'no'}>{children}</span>;
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }): ReactNode {
  return <button type="button" className="lab-chip" data-sel={selected} onClick={onClick}>{children}</button>;
}

export function Slider(props: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; ariaLabel: string; style?: React.CSSProperties }): ReactNode {
  return <input type="range" className="lab-slider" value={props.value} min={props.min} max={props.max} step={props.step} aria-label={props.ariaLabel} onChange={(e) => props.onChange(Number(e.currentTarget.value))} style={props.style} />;
}
