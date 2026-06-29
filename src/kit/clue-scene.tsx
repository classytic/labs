'use client';

/**
 * Clue scenes, the SWAPPABLE concrete representations of one linear equation, so a
 * creator can pose the SAME "find the unknowns from the clues" maths as a shop receipt,
 * a bucket balance, or bare algebra tiles, just by changing `scene`. This is the reuse
 * principle the lab layer is built on: the maths is data (coeffs over unknowns = total),
 * and each scene is a small pure renderer of that data. Add a new theme (coins, baskets,
 * a meter) = add one function here; every system lab gets it for free.
 *
 *   <ClueTiles>   2▲ + 1● = 12     (universal, algebra-flavoured)
 *   <ClueReceipt> a shop bill       (2 Pineapples / 1 Mango, total $12)
 *   <ClueBalance> a two-pan scale    (buckets vs a weight, "bucket of different types")
 */

import type { ReactNode } from 'react';

export interface Unknown {
  /** symbol shown on chips (an emoji like 🍍 or a letter like x). */
  sym: string;
  label?: string;
  /** token colour for chips / buckets (default accent). */
  color?: string;
  /** the hidden value the learner solves for. */
  answer: number;
}

export interface Clue {
  /** coefficient per unknown, aligned to the unknowns array (e.g. [2,1] → 2▲ + 1●). */
  coeffs: number[];
}

export type ClueSceneKind = 'tiles' | 'receipt' | 'balance';

/** Total a clue evaluates to, given the unknowns' answers (kept consistent by construction). */
export function clueTotal(clue: Clue, unknowns: Unknown[]): number {
  return clue.coeffs.reduce((s, c, i) => s + c * (unknowns[i]?.answer ?? 0), 0);
}

const chipColor = (u: Unknown): string => u.color ?? 'var(--stage-accent)';

/** A coloured token for an unknown (the reusable atom of every scene). */
export function UnknownChip({ u, size = 30, withLabel = false }: { u: Unknown; size?: number; withLabel?: boolean }): ReactNode {
  return (
    <span style={{ display: 'inline-grid', justifyItems: 'center', gap: 2, verticalAlign: 'middle' }}>
      <span
        aria-label={u.label ?? u.sym}
        style={{
          width: size, height: size, borderRadius: 8, display: 'grid', placeItems: 'center',
          fontSize: size * 0.6, lineHeight: 1,
          background: `color-mix(in oklab, ${chipColor(u)} 22%, transparent)`,
          border: `2px solid ${chipColor(u)}`,
        }}
      >
        {u.sym}
      </span>
      {withLabel && u.label && <span style={{ fontSize: 10, color: 'var(--stage-muted)' }}>{u.label}</span>}
    </span>
  );
}

interface SceneProps {
  clue: Clue;
  unknowns: Unknown[];
  currency?: string;
  unit?: string;
  store?: string;
}

const fmtTotal = (n: number, currency = '', unit = ''): string => `${currency}${Math.round(n * 100) / 100}${unit ? ' ' + unit : ''}`;

/** Tiles: "2▲ + 1● = 12". Universal, reads as the equation it is. */
export function ClueTiles({ clue, unknowns, currency, unit }: SceneProps): ReactNode {
  const terms = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 18, fontWeight: 700, padding: '8px 12px', borderRadius: 12, background: 'color-mix(in oklab, var(--stage-fg) 5%, transparent)' }}>
      {terms.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ color: 'var(--stage-muted)', margin: '0 2px' }}>+</span>}
          {t.c}<UnknownChip u={t.u} size={28} />
        </span>
      ))}
      <span style={{ color: 'var(--stage-muted)' }}>=</span>
      <strong>{fmtTotal(clueTotal(clue, unknowns), currency, unit)}</strong>
    </div>
  );
}

/** Receipt: a shop bill listing quantities and the total (unit prices unknown). */
export function ClueReceipt({ clue, unknowns, currency = '$', store = 'Receipt' }: SceneProps): ReactNode {
  const lines = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' };
  return (
    <div style={{ width: 210, padding: 14, borderRadius: 12, border: '2px solid color-mix(in oklab, var(--stage-fg) 18%, transparent)', background: 'color-mix(in oklab, var(--stage-fg) 4%, var(--stage-bg))', display: 'grid', gap: 8, fontVariantNumeric: 'tabular-nums' }}>
      <div style={{ fontWeight: 800 }}>{store}</div>
      {lines.map((t, i) => (
        <div key={i} style={{ ...row, color: 'var(--stage-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{t.c} <UnknownChip u={t.u} size={22} /> {t.u.label}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px dashed color-mix(in oklab, var(--stage-fg) 30%, transparent)' }} />
      <div style={{ ...row, fontWeight: 800 }}><span>Total</span><span style={{ color: 'var(--stage-good)' }}>{fmtTotal(clueTotal(clue, unknowns), currency)}</span></div>
    </div>
  );
}

/** Balance: buckets (one per coeff, coloured by type) on the left pan vs a weight on the right. */
export function ClueBalance({ clue, unknowns, unit = 'kg' }: SceneProps): ReactNode {
  const W = 240, H = 132;
  const beamY = 34, pivX = W / 2, panY = 70;
  const lpx = pivX - 70, rpx = pivX + 70;

  // buckets on the left pan (one per coefficient, per unknown), packed in a row
  const buckets: { color: string; sym: string }[] = [];
  clue.coeffs.forEach((c, i) => { for (let k = 0; k < c; k++) buckets.push({ color: unknowns[i]?.color ?? 'var(--stage-accent)', sym: unknowns[i]?.sym ?? '' }); });
  const bw = Math.min(26, (110) / Math.max(1, buckets.length));

  const Bucket = ({ x, color, sym }: { x: number; color: string; sym: string }): ReactNode => {
    const w = bw * 0.86, h = bw * 1.1, topY = panY - h;
    return (
      <g>
        <path d={`M ${x - w / 2} ${topY} L ${x - w / 2 + 2} ${panY - 2} L ${x + w / 2 - 2} ${panY - 2} L ${x + w / 2} ${topY} Z`}
          fill={`color-mix(in oklab, ${color} 30%, var(--stage-bg))`} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        <ellipse cx={x} cy={topY} rx={w / 2} ry={2.4} fill={color} fillOpacity={0.5} />
        <text x={x} y={topY + h * 0.62} fontSize={bw * 0.5} textAnchor="middle" dominantBaseline="middle">{sym}</text>
      </g>
    );
  };

  const total = clueTotal(clue, unknowns);
  const bx0 = lpx - ((buckets.length - 1) * bw) / 2;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`balance: ${buckets.length} buckets weigh ${total} ${unit}`}>
      {/* fulcrum + level beam */}
      <path d={`M ${pivX - 12} ${H - 10} L ${pivX + 12} ${H - 10} L ${pivX} ${beamY + 6} Z`} fill="var(--stage-metal, #8a8a8a)" />
      <rect x={pivX - 78} y={beamY - 3} width={156} height={6} rx={3} fill="var(--stage-metal, #8a8a8a)" />
      {/* pan hangers + pans */}
      {[lpx, rpx].map((px, i) => (
        <g key={i}>
          <line x1={px} y1={beamY} x2={px} y2={panY} stroke="color-mix(in oklab, var(--stage-fg) 40%, transparent)" strokeWidth={1.5} />
          <path d={`M ${px - 34} ${panY} Q ${px} ${panY + 14} ${px + 34} ${panY}`} fill="none" stroke="var(--stage-metal, #8a8a8a)" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
      {/* left: buckets */}
      {buckets.map((b, i) => <Bucket key={i} x={bx0 + i * bw} color={b.color} sym={b.sym} />)}
      {/* right: weight tag */}
      <g>
        <rect x={rpx - 26} y={panY - 34} width={52} height={30} rx={6} fill="var(--stage-bg)" stroke="color-mix(in oklab, var(--stage-fg) 35%, transparent)" strokeWidth={1.5} />
        <text x={rpx} y={panY - 18} fontSize={14} fontWeight={800} textAnchor="middle" dominantBaseline="middle" fill="var(--stage-fg)">{total}{unit ? ' ' + unit : ''}</text>
      </g>
    </svg>
  );
}

/** Bar model (tape diagram): each clue is one bar of unit cells grouped by unknown = total. */
export function ClueBar({ clue, unknowns, currency, unit }: SceneProps): ReactNode {
  const terms = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: 'color-mix(in oklab, var(--stage-fg) 5%, transparent)' }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {terms.map((t, ti) => (
          <div key={ti} style={{ display: 'flex' }}>
            {Array.from({ length: t.c }).map((_, k) => (
              <div key={k} style={{
                width: 30, height: 34, display: 'grid', placeItems: 'center', fontSize: 14,
                background: `color-mix(in oklab, ${chipColor(t.u)} 28%, transparent)`,
                border: `1.5px solid ${chipColor(t.u)}`,
                borderRadius: t.c === 1 ? 8 : k === 0 ? '8px 0 0 8px' : k === t.c - 1 ? '0 8px 8px 0' : 0,
                marginLeft: k > 0 ? -1.5 : 0,
              }}>{t.u.sym}</div>
            ))}
          </div>
        ))}
      </div>
      <span style={{ color: 'var(--stage-muted)', fontWeight: 700 }}>=</span>
      <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtTotal(clueTotal(clue, unknowns), currency, unit)}</strong>
    </div>
  );
}

/** Coin piles: each unknown is a stack of coins (coloured by type) = a money total. */
export function ClueCoins({ clue, unknowns, currency = '$' }: SceneProps): ReactNode {
  const terms = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: 'color-mix(in oklab, var(--stage-fg) 5%, transparent)' }}>
      {terms.map((t, ti) => (
        <span key={ti} style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 6 }}>
          {ti > 0 && <span style={{ color: 'var(--stage-muted)', fontWeight: 700, marginBottom: 8 }}>+</span>}
          <span style={{ position: 'relative', width: 30, height: 16 + t.c * 7 }}>
            {Array.from({ length: t.c }).map((_, k) => (
              <span key={k} style={{ position: 'absolute', bottom: k * 7, left: 0, width: 30, height: 16, borderRadius: '50%', border: `1.5px solid color-mix(in oklab, ${chipColor(t.u)} 65%, black)`, background: `radial-gradient(circle at 40% 35%, color-mix(in oklab, ${chipColor(t.u)} 70%, white), ${chipColor(t.u)})`, display: 'grid', placeItems: 'center', fontSize: 9 }}>{t.u.sym}</span>
            ))}
          </span>
        </span>
      ))}
      <span style={{ color: 'var(--stage-muted)', fontWeight: 700 }}>=</span>
      <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtTotal(clueTotal(clue, unknowns), currency)}</strong>
    </div>
  );
}

// ── open registry: a clue scene is a pluggable renderer; add your own with one call ──
export interface ClueSceneMeta { name: string; label: string; render: (q: SceneProps) => ReactNode }
const CLUE_REGISTRY = new Map<string, ClueSceneMeta>();
export function registerClueScene(meta: ClueSceneMeta): void { CLUE_REGISTRY.set(meta.name, meta); }
export function getClueScene(name: string): ClueSceneMeta | undefined { return CLUE_REGISTRY.get(name); }
export function listClueScenes(): ClueSceneMeta[] { return [...CLUE_REGISTRY.values()]; }

registerClueScene({ name: 'tiles', label: 'Algebra tiles', render: (q) => <ClueTiles {...q} /> });
registerClueScene({ name: 'receipt', label: 'Shop receipt', render: (q) => <ClueReceipt {...q} /> });
registerClueScene({ name: 'balance', label: 'Bucket balance', render: (q) => <ClueBalance {...q} /> });
registerClueScene({ name: 'bar', label: 'Bar model', render: (q) => <ClueBar {...q} /> });
registerClueScene({ name: 'coins', label: 'Coin piles', render: (q) => <ClueCoins {...q} /> });

/** Render one clue in the chosen scene (registry name). Creators extend via registerClueScene. */
export function ClueScene({ kind, ...rest }: SceneProps & { kind: string }): ReactNode {
  return getClueScene(kind)?.render(rest) ?? <ClueTiles {...rest} />;
}
