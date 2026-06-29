'use client';

/**
 * Small authoring-UI primitives for the circuit editor. They are deliberately styled
 * with the HOST shadcn design tokens (--background, --card, --border, --foreground,
 * --muted-foreground, --primary, --accent, --radius) so the editor adopts the
 * consumer's globals.css automatically — light/dark, brand colour, corner radius.
 * Literal fallbacks keep it usable standalone. No hardcoded brand colours.
 */

import type { ReactNode, CSSProperties } from 'react';

const R = 'var(--radius, 0.625rem)';
const BORDER = 'var(--border, oklch(0.92 0.004 286))';
const MUTED = 'var(--muted-foreground, oklch(0.55 0.01 286))';
const FG = 'var(--foreground, oklch(0.21 0.006 286))';

export function Panel({ title, children, style }: { title?: string; children: ReactNode; style?: CSSProperties }): ReactNode {
  return (
    <div style={{ background: 'var(--card, #fff)', color: FG, border: `1px solid ${BORDER}`, borderRadius: R, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED }}>{title}</div>}
      {children}
    </div>
  );
}

export function EBtn({ children, onClick, active, variant = 'default', title, disabled }: { children: ReactNode; onClick?: () => void; active?: boolean; variant?: 'default' | 'primary' | 'ghost' | 'danger'; title?: string; disabled?: boolean }): ReactNode {
  const bg = variant === 'primary' || active ? 'var(--primary, oklch(0.21 0.006 286))'
    : variant === 'danger' ? 'var(--destructive, oklch(0.58 0.22 27))'
    : variant === 'ghost' ? 'transparent' : 'var(--secondary, oklch(0.97 0.001 286))';
  const fg = variant === 'primary' || active ? 'var(--primary-foreground, oklch(0.98 0 0))'
    : variant === 'danger' ? 'var(--destructive-foreground, #fff)' : FG;
  return (
    <button
      type="button" onClick={onClick} title={title} disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '7px 11px', fontSize: 13, fontWeight: 600, lineHeight: 1,
        background: bg, color: fg, border: `1px solid ${variant === 'ghost' ? BORDER : 'transparent'}`,
        borderRadius: `calc(${R} - 2px)`, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'background 120ms, opacity 120ms', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8, fontSize: 13, color: FG }}>
      <span style={{ color: MUTED }}>{label}</span>
      {children}
    </label>
  );
}

export function NumInput({ value, onChange, step = 1, min, ariaLabel }: { value: number; onChange: (v: number) => void; step?: number; min?: number; ariaLabel?: string }): ReactNode {
  return (
    <input
      type="number" value={value} step={step} min={min} aria-label={ariaLabel}
      onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) onChange(v); }}
      style={{ width: 92, padding: '5px 8px', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: FG, background: 'var(--background, #fff)', border: `1px solid ${BORDER}`, borderRadius: `calc(${R} - 3px)` }}
    />
  );
}

export function TextInput({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel?: string }): ReactNode {
  return (
    <input
      type="text" value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}
      style={{ width: 120, padding: '5px 8px', fontSize: 13, color: FG, background: 'var(--background, #fff)', border: `1px solid ${BORDER}`, borderRadius: `calc(${R} - 3px)` }}
    />
  );
}
