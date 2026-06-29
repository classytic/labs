'use client';

/**
 * IconRef, a durable visual-asset reference for language labs, replacing bare
 * emoji strings. An item's picture can be an emoji, a registered inline SVG
 * (themeable, reusable), or an uploaded/external image, each carrying alt text
 * for accessibility.
 *
 * BACK-COMPAT: a plain string is still accepted everywhere (shorthand for an
 * emoji, or, for a preposition landmark, a backdrop key like 'water'). So all
 * existing authored decks/scenes keep working; `IconRef` is the opt-in upgrade
 * for SVG/image assets and explicit alt text. Emoji + image render dependency-
 * free; `kind:'svg'` resolves an id through a small registry (consumers can
 * `registerLabIcon` their own set) and falls back to alt text if unknown.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface IconRef {
  kind: 'emoji' | 'svg' | 'image';
  /** emoji character (kind:'emoji') OR a registered svg id (kind:'svg'). */
  id?: string;
  /** image URL (kind:'image'); also accepted as the emoji char if `id` is unset. */
  src?: string;
  /** accessible label; '' marks the icon purely decorative. */
  alt: string;
}

/** A plain string is shorthand for an emoji (or a scene backdrop key). */
export type IconValue = string | IconRef;

const SVG_ICONS = new Map<string, (p: { size: number; title?: string }) => ReactNode>();

/** Register an inline-SVG icon so `{ kind:'svg', id }` resolves to it. */
export function registerLabIcon(id: string, render: (p: { size: number; title?: string }) => ReactNode): void {
  SVG_ICONS.set(id, render);
}

/** Normalise any accepted value to an `IconRef` (or null when empty). */
export function normalizeIcon(v: IconValue | undefined | null): IconRef | null {
  if (v == null || v === '') return null;
  return typeof v === 'string' ? { kind: 'emoji', id: v, alt: '' } : v;
}

export interface IconProps {
  icon?: IconValue;
  /** px size for image/svg (emoji is sized by CSS when `className` is set). */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Decorative → aria-hidden (a parent already labels it). */
  decorative?: boolean;
}

/** Render an `IconValue`: emoji span, inline SVG (registry), or <img>. */
export function Icon({ icon, size = 36, className, style, decorative }: IconProps): ReactNode {
  const ref = normalizeIcon(icon);
  if (!ref) return null;
  const labelled = !decorative && !!ref.alt;
  const a11y = labelled ? { role: 'img', 'aria-label': ref.alt } : { 'aria-hidden': true as const };

  if (ref.kind === 'image' && ref.src) {
    return <img src={ref.src} alt={labelled ? ref.alt : ''} className={className} width={size} height={size} loading="lazy" decoding="async" style={{ objectFit: 'contain', ...style }} />;
  }
  if (ref.kind === 'svg' && ref.id) {
    const render = SVG_ICONS.get(ref.id);
    if (render) return <span className={className} style={{ display: 'inline-flex', ...style }} {...a11y}>{render({ size, title: labelled ? ref.alt : undefined })}</span>;
    // unknown id → fall through to alt text so nothing renders blank
  }
  const char = ref.kind === 'emoji' ? (ref.id ?? ref.src ?? '') : ref.alt;
  // emoji: let `className` (e.g. .lang-cell-icon) drive size; otherwise use `size`
  return <span className={className} style={{ ...(className ? null : { fontSize: size, lineHeight: 1 }), ...style }} {...a11y}>{char}</span>;
}
