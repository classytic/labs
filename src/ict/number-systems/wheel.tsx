'use client';

/**
 * Shared building blocks for the number-system labs: base digit helpers + the
 * DigitWheel glyph (a mechanical odometer wheel). Tokenized SVG only, colours
 * are `--stage-*` so the wheels retheme with the host. The roll is DATA: the lab
 * passes a 0..1 `roll` phase its frame loop decays, so the digit visibly slides
 * into place (no fake "press play", the motion tracks the real value change).
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { useInView } from '@classytic/stage';
import { useFrameTick } from '../../kit/anim.js';

/** Seconds for a wheel to settle after a digit changes. */
export const ROLL_DUR = 0.32;

/** 0-9 then A-F… for bases up to 16. */
export function digitChar(d: number): string {
  return d < 10 ? String(d) : String.fromCharCode(65 + d - 10);
}

/** The `width` digits of `value` in `base`, most-significant first, zero-padded. */
export function toDigits(value: number, base: number, width: number): number[] {
  const out: number[] = [];
  let v = Math.max(0, Math.floor(value));
  for (let i = 0; i < width; i++) { out.unshift(v % base); v = Math.floor(v / base); }
  return out;
}

/** Largest value representable in `width` digits of `base`. */
export function maxValue(base: number, width: number): number {
  return Math.pow(base, width) - 1;
}

const CELL_W = 38;
const CELL_H = 50;
const ROW = 34; // vertical spacing between stacked digits

export interface DigitWheelProps {
  base: number;
  digit: number;
  /** 0 (settled) → 1 (just changed); slides the digit stack while it decays. */
  roll?: number;
  /** +1 counted up, −1 counted down, direction the wheel rolls. */
  dir?: number;
  /** Non-zero digits read as "active" (accent); a zero is muted. */
  active?: boolean;
  onTap?: () => void;
  ariaLabel?: string;
}

/**
 * One odometer wheel: the current digit large + the next/previous digits peeking
 * (clipped) at the top/bottom edges, so it unmistakably reads as a wheel mid-roll.
 */
export function DigitWheel({ base, digit, roll = 0, dir = 1, active, onTap, ariaLabel }: DigitWheelProps): ReactNode {
  const r = Math.max(0, Math.min(1, roll));
  const cy = CELL_H / 2;
  const cx = CELL_W / 2;
  const up = (digit + 1) % base;
  const down = (digit - 1 + base) % base;
  const offset = r * dir * ROW;            // slide the stack while rolling
  const col = active ? 'var(--stage-accent)' : 'var(--stage-muted)';
  const clipId = `wheel-clip-${CELL_W}-${CELL_H}`;
  return (
    <svg
      width={CELL_W} height={CELL_H} viewBox={`0 0 ${CELL_W} ${CELL_H}`}
      role={onTap ? 'button' : 'img'} aria-label={ariaLabel}
      onClick={onTap}
      style={{ cursor: onTap ? 'pointer' : 'default', flex: '0 0 auto' }}
    >
      <defs><clipPath id={clipId}><rect x={0} y={0} width={CELL_W} height={CELL_H} rx={7} /></clipPath></defs>
      <rect x={0.75} y={0.75} width={CELL_W - 1.5} height={CELL_H - 1.5} rx={7} fill="var(--stage-bg)" stroke="var(--stage-fg)" strokeOpacity={0.35} strokeWidth={1.5} />
      <g clipPath={`url(#${clipId})`} fontWeight={700} textAnchor="middle" style={{ pointerEvents: 'none' }}>
        <g transform={`translate(0 ${offset})`}>
          <text x={cx} y={cy - ROW} fill="var(--stage-muted)" fontSize={18} opacity={0.3} dominantBaseline="central">{digitChar(down)}</text>
          <text x={cx} y={cy} fill={col} fontSize={26} dominantBaseline="central">{digitChar(digit)}</text>
          <text x={cx} y={cy + ROW} fill="var(--stage-muted)" fontSize={18} opacity={0.3} dominantBaseline="central">{digitChar(up)}</text>
        </g>
      </g>
      {/* top/bottom shade so the peeking digits fade into the rim (mechanical look) */}
      <rect x={0.75} y={0.75} width={CELL_W - 1.5} height={CELL_H - 1.5} rx={7} fill="none" stroke="var(--stage-fg)" strokeOpacity={active ? 0.5 : 0.25} strokeWidth={1.5} />
    </svg>
  );
}

/** A binary ON/OFF cell, the "lightbulb worth 2^n" picture for base-2 mode. */
export function BitCell({ on, onTap, ariaLabel }: { on: boolean; onTap?: () => void; ariaLabel?: string }): ReactNode {
  return (
    <svg
      width={CELL_W} height={CELL_H} viewBox={`0 0 ${CELL_W} ${CELL_H}`}
      role={onTap ? 'button' : 'img'} aria-label={ariaLabel} onClick={onTap}
      style={{ cursor: onTap ? 'pointer' : 'default', flex: '0 0 auto' }}
    >
      {on && <rect x={2} y={2} width={CELL_W - 4} height={CELL_H - 4} rx={7} fill="var(--stage-good)" opacity={0.18} />}
      <rect x={0.75} y={0.75} width={CELL_W - 1.5} height={CELL_H - 1.5} rx={7}
        fill={on ? 'color-mix(in oklab, var(--stage-good) 26%, var(--stage-bg))' : 'var(--stage-bg)'}
        stroke={on ? 'var(--stage-good)' : 'var(--stage-fg)'} strokeOpacity={on ? 1 : 0.3} strokeWidth={1.5} />
      <text x={CELL_W / 2} y={CELL_H / 2} fill={on ? 'var(--stage-good)' : 'var(--stage-muted)'} fontSize={24} fontWeight={800} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{on ? '1' : '0'}</text>
    </svg>
  );
}

export const WHEEL_W = CELL_W;

export interface WheelRowProps {
  value: number;
  base: number;
  width: number;
  /** base-2 ON/OFF cells instead of rolling wheels (the "lightbulb" picture). */
  cells?: boolean;
  /** show the power-of-base weight column under each wheel (glows when non-zero). */
  showWeights?: boolean;
  /** tap a wheel/cell to cycle that one place. */
  onTapDigit?: (index: number) => void;
  ariaPrefix?: string;
}

/**
 * A row of odometer wheels (or bit cells) for `value` in `base`, with the
 * carry-ripple roll animation OWNED here, the single reusable place-value
 * primitive both PlaceValueDial and BaseOdometer compose, so the animation +
 * weight rendering live in exactly one spot.
 */
export function WheelRow({ value, base, width, cells, showWeights, onTapDigit, ariaPrefix = '' }: WheelRowProps): ReactNode {
  const digits = toDigits(value, base, width);
  const prev = useRef<number[]>(digits);
  const roll = useRef<number[]>(digits.map(() => 0));
  const dir = useRef<number[]>(digits.map(() => 1));
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  // when a wheel's digit changes, kick its roll phase; stagger the wheels left of
  // the first change so the carry visibly ripples (rightmost settles first).
  useEffect(() => {
    const p = prev.current;
    let rightmost = -1;
    digits.forEach((d, i) => { if (d !== (p[i] ?? d)) rightmost = i; });
    digits.forEach((d, i) => {
      const pp = p[i] ?? d;
      if (d !== pp) {
        const delay = rightmost - i;
        roll.current[i] = 1 + Math.max(0, delay) * 0.45;            // >1 = staggered start
        dir.current[i] = ((d - pp + base) % base) <= base / 2 ? 1 : -1;
      }
    });
    prev.current = digits;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, base, width]);

  const animating = roll.current.some((r) => r > 0);
  useFrameTick(animating && inView, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    roll.current = roll.current.map((r) => Math.max(0, r - dt / ROLL_DUR));
  });

  return (
    <div ref={viewRef} className="lab-playwrap" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      {digits.map((d, i) => {
        const place = width - 1 - i;
        const weight = Math.pow(base, place);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {cells
              ? <BitCell on={d === 1} onTap={onTapDigit ? () => onTapDigit(i) : undefined} ariaLabel={`${ariaPrefix}bit worth ${weight}, ${d ? 'on' : 'off'}`} />
              : <DigitWheel base={base} digit={d} roll={Math.min(1, roll.current[i] ?? 0)} dir={dir.current[i] ?? 1} active={d !== 0} onTap={onTapDigit ? () => onTapDigit(i) : undefined} ariaLabel={`${ariaPrefix}place ${place}, digit ${digitChar(d)}`} />}
            {showWeights && (
              <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                <div style={{ fontSize: 10, color: 'var(--stage-muted)', fontVariantNumeric: 'tabular-nums' }}>{base}<sup>{place}</sup></div>
                <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: d !== 0 ? 'var(--stage-good)' : 'var(--stage-muted)', opacity: d !== 0 ? 1 : 0.6 }}>{weight}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
