'use client';

/**
 * The concrete "outcome" glyphs for the Combination Studio. A counting outcome is
 * usually drawn as a bare label (HT, 1-2-3); here each outcome is a THING you can
 * point at, so the multiplication principle stops being symbols:
 *
 *   • CharacterFigure : a little person who WEARS the picks (shirt colour, trouser
 *     colour, a hat). Two outfits that differ are two visibly different people.
 *   • ComboCard       : a stacked card of the chosen emoji per category, for
 *     scenarios that aren't clothes (an ice-cream = cone × flavour × topping, a
 *     pizza, a travel route).
 *
 * Pure SVG, no deps. `dim` greys an undiscovered outcome on the wall.
 */

import { type ReactNode } from 'react';

export type CharSlot = 'top' | 'bottom' | 'hat' | 'hold' | 'none';

const SKIN = '#e8b98c';

export interface CharacterParts {
  top?: string;     // shirt colour
  bottom?: string;  // trouser colour
  hat?: string;     // hat colour (omit = no hat)
  hold?: string;    // a small emoji in the hand
}

/** A friendly stick-ish person who wears the chosen garments. */
export function CharacterFigure({ parts, size = 64, dim = false }: { parts: CharacterParts; size?: number; dim?: boolean }): ReactNode {
  const { top = '#9aa3b2', bottom = '#5b6472', hat, hold } = parts;
  const o = dim ? 0.28 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', opacity: o, transition: 'opacity .2s' }} aria-hidden>
      {/* legs / trousers */}
      <rect x="26" y="40" width="5" height="16" rx="2.5" fill={bottom} />
      <rect x="33" y="40" width="5" height="16" rx="2.5" fill={bottom} />
      {/* torso / shirt */}
      <rect x="22" y="24" width="20" height="20" rx="6" fill={top} />
      {/* arms */}
      <rect x="17" y="26" width="5" height="14" rx="2.5" fill={top} />
      <rect x="42" y="26" width="5" height="14" rx="2.5" fill={top} />
      {/* head */}
      <circle cx="32" cy="16" r="9" fill={SKIN} />
      {/* hat */}
      {hat && <path d="M20 13 Q32 -1 44 13 Z" fill={hat} />}
      {hat && <rect x="18" y="12" width="28" height="3.4" rx="1.7" fill={hat} />}
      {/* held item */}
      {hold && <text x="47" y="44" fontSize="13" textAnchor="middle">{hold}</text>}
    </svg>
  );
}

/** A stacked outcome card: one emoji (or colour swatch) per category. */
export function ComboCard({ cells, size = 60, dim = false }: { cells: { emoji?: string; color?: string; label?: string }[]; size?: number; dim?: boolean }): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: dim ? 0.3 : 1, transition: 'opacity .2s', width: size }} aria-hidden>
      {cells.map((c, i) => (
        c.emoji
          ? <span key={i} style={{ fontSize: size * 0.42, lineHeight: 1 }}>{c.emoji}</span>
          : <span key={i} style={{ width: size * 0.6, height: size * 0.26, borderRadius: 5, background: c.color ?? '#9aa3b2' }} />
      ))}
    </div>
  );
}

/** A pickable option in a rack: the swatch/emoji + its label, selected ring. */
export function OptionSwatch({ emoji, color, label, selected, onClick }: { emoji?: string; color?: string; label: string; selected: boolean; onClick: () => void }): ReactNode {
  return (
    <button
      type="button" onClick={onClick} aria-pressed={selected} aria-label={label}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer',
        padding: '6px 8px', borderRadius: 10, background: 'transparent',
        border: `2px solid ${selected ? 'var(--stage-accent)' : 'var(--stage-grid)'}`,
        boxShadow: selected ? '0 0 0 3px color-mix(in oklab, var(--stage-accent) 22%, transparent)' : 'none',
        transition: 'border-color .15s, box-shadow .15s',
      }}
    >
      {emoji
        ? <span style={{ fontSize: 24, lineHeight: 1 }}>{emoji}</span>
        : <span style={{ width: 28, height: 18, borderRadius: 5, background: color ?? '#9aa3b2' }} />}
      <span style={{ fontSize: 11, color: 'var(--stage-muted)', fontWeight: 600 }}>{label}</span>
    </button>
  );
}
