'use client';

/**
 * Figure, the root of every hand-drawn scene.
 *
 * One `<svg class="lab-figure">` that carries the art-direction tokens (styles/figure.css),
 * the domain palette (`data-fig-domain`), a shared `<defs>` block (soft shadow, glow) and a
 * context so primitives can reference those defs without inventing ids. Labs compose the
 * primitives in this folder inside it and never set stroke widths, hex colours or font sizes
 * themselves.
 *
 *   <Figure viewBox={[720, 380]} domain="chem" label="Reaction vessel at 300 K">
 *     <Glass x={28} y={64} w={284} h={268} fill={0.6} />
 *     <Ball cx={100} cy={100} r={6} />
 *     <FigText x={170} y={52} size="title">reaction vessel</FigText>
 *   </Figure>
 */

import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';

export type FigDomain = 'chem' | 'physics' | 'biology' | 'math' | 'commerce';

interface FigureCtx {
  uid: string;
}

const Ctx = createContext<FigureCtx | null>(null);

/** Stable id prefix for defs inside the nearest <Figure>. */
export function useFigureId(): string {
  const ctx = useContext(Ctx);
  return ctx?.uid ?? 'fig';
}

/** `url(#…)` reference to a shared def (`shadow`, `glow`) or a caller-registered one. */
export const figUrl = (uid: string, name: string): string => `url(#${uid}-${name})`;

export interface FigureProps {
  /** `[width, height]` in user units, or a full viewBox string. */
  viewBox: readonly [number, number] | string;
  /** Domain palette (hue-1/2/3). Omit for the default stage accents. */
  domain?: FigDomain;
  /** Accessible description of what the figure shows right now. */
  label: string;
  className?: string;
  style?: CSSProperties;
  preserveAspectRatio?: string;
  /** Decorative figures (label still required for the text alternative in the transcript). */
  decorative?: boolean;
  children?: ReactNode;
}

export function Figure({
  viewBox,
  domain,
  label,
  className,
  style,
  preserveAspectRatio,
  decorative = false,
  children,
}: FigureProps): ReactNode {
  const uid = useId().replace(/:/g, '');
  const vb = typeof viewBox === 'string' ? viewBox : `0 0 ${viewBox[0]} ${viewBox[1]}`;
  return (
    <Ctx.Provider value={{ uid }}>
      <svg
        className={['lab-figure', className].filter(Boolean).join(' ')}
        data-fig-domain={domain}
        viewBox={vb}
        preserveAspectRatio={preserveAspectRatio}
        style={style}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        <defs>
          <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" style={{ floodColor: 'var(--fig-shadow)' }} />
          </filter>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {children}
      </svg>
    </Ctx.Provider>
  );
}

/** Stroke roles → user-unit widths (mirrors --fig-* in styles/figure.css). */
export type StrokeRole = 'hair' | 'line' | 'edge' | 'bold';
export const STROKE: Record<StrokeRole, number> = { hair: 1, line: 1.75, edge: 2.5, bold: 3.5 };

/** Colour roles a lab may use; anything else is a bug. */
export const HUE = {
  1: 'var(--fig-hue-1)',
  2: 'var(--fig-hue-2)',
  3: 'var(--fig-hue-3)',
  ink: 'var(--fig-ink)',
  soft: 'var(--fig-ink-soft)',
  paper: 'var(--fig-paper)',
  hot: 'var(--fig-hot)',
  cold: 'var(--fig-cold)',
  good: 'var(--fig-good)',
  warn: 'var(--fig-warn)',
  danger: 'var(--fig-danger)',
  metal: 'var(--fig-metal)',
  wood: 'var(--fig-wood)',
  glass: 'var(--fig-glass)',
  liquid: 'var(--fig-liquid)',
} as const;

/** A colour mixed toward the paper (for fills that must recede in both themes). */
export const tint = (color: string, pct: number): string =>
  `color-mix(in oklab, ${color} ${pct}%, var(--fig-paper))`;
/** A colour mixed toward the ink (for outlines of a filled shape). */
export const shade = (color: string, pct = 70): string =>
  `color-mix(in oklab, ${color} ${pct}%, var(--fig-ink))`;
/** A colour at reduced alpha (for glows and shaded areas). */
export const alpha = (color: string, pct: number): string =>
  `color-mix(in oklab, ${color} ${pct}%, transparent)`;

export const fmt = (n: number, digits = 1): string => Number(n.toFixed(digits)).toString();
