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
import { Stage, StageAssetDefs, WeightGlyph, useCoords, type Vec2 } from '@classytic/stage';
import { ScaleFrame } from './scale.js';

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
export function UnknownChip({
  u,
  size = 30,
  withLabel = false,
}: {
  u: Unknown;
  size?: number;
  withLabel?: boolean;
}): ReactNode {
  return (
    <span className="inline-grid justify-items-center gap-0.5 align-middle">
      <span
        aria-label={u.label ?? u.sym}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
          fontSize: size * 0.6,
          lineHeight: 1,
          background: `color-mix(in oklab, ${chipColor(u)} 22%, transparent)`,
          border: `2px solid ${chipColor(u)}`,
        }}
      >
        {u.sym}
      </span>
      {withLabel && u.label && <span className="text-[10px] text-[var(--stage-muted)]">{u.label}</span>}
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

const fmtTotal = (n: number, currency = '', unit = ''): string =>
  `${currency}${Math.round(n * 100) / 100}${unit ? ' ' + unit : ''}`;

/** Tiles: "2▲ + 1● = 12". Universal, reads as the equation it is. */
export function ClueTiles({ clue, unknowns, currency, unit }: SceneProps): ReactNode {
  const terms = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[color-mix(in_oklab,var(--stage-fg)_5%,transparent)] px-3 py-2 text-lg font-bold">
      {terms.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <span className="mx-0.5 text-[var(--stage-muted)]">+</span>}
          {t.c}
          <UnknownChip u={t.u} size={28} />
        </span>
      ))}
      <span className="text-[var(--stage-muted)]">=</span>
      <strong>{fmtTotal(clueTotal(clue, unknowns), currency, unit)}</strong>
    </div>
  );
}

/** Receipt: a shop bill listing quantities and the total (unit prices unknown). */
export function ClueReceipt({ clue, unknowns, currency = '$', store = 'Receipt' }: SceneProps): ReactNode {
  const lines = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  return (
    <div className="grid w-[210px] gap-2 rounded-xl border-2 border-[color-mix(in_oklab,var(--stage-fg)_18%,transparent)] bg-[color-mix(in_oklab,var(--stage-fg)_4%,var(--stage-bg))] p-3.5 tabular-nums">
      <div className="font-extrabold">{store}</div>
      {lines.map((t, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-[var(--stage-muted)]">
          <span className="inline-flex items-center gap-1.5">
            {t.c} <UnknownChip u={t.u} size={22} /> {t.u.label}
          </span>
        </div>
      ))}
      <div className="border-t border-dashed border-[color-mix(in_oklab,var(--stage-fg)_30%,transparent)]" />
      <div className="flex items-center justify-between gap-4 font-extrabold">
        <span>Total</span>
        <span className="text-[var(--stage-good)]">{fmtTotal(clueTotal(clue, unknowns), currency)}</span>
      </div>
    </div>
  );
}

interface ClueBucket {
  color: string;
  sym: string;
}

function ClueBalanceContents({
  buckets,
  total,
  unit,
}: {
  buckets: ClueBucket[];
  total: number;
  unit: string;
}): ReactNode {
  const c = useCoords();
  const pivot: Vec2 = { x: 0, y: 0.48 };
  const beamA: Vec2 = { x: -2.55, y: 0.48 };
  const beamB: Vec2 = { x: 2.55, y: 0.48 };
  const trayLC: Vec2 = { x: -2.55, y: -0.22 };
  const trayRC: Vec2 = { x: 2.55, y: -0.22 };
  const [lx, ly] = c.toPx(trayLC.x, trayLC.y);
  const [rx, ry] = c.toPx(trayRC.x, trayRC.y);
  const slot = Math.min(26, c.sx(1.62) / Math.max(1, buckets.length));
  const first = lx - ((buckets.length - 1) * slot) / 2;

  return (
    <>
      <StageAssetDefs />
      <ScaleFrame
        pivot={pivot}
        beamA={beamA}
        beamB={beamB}
        trayLC={trayLC}
        trayRC={trayRC}
        baseY={-0.86}
        panR={0.78}
        balanced
      />
      {buckets.map((bucket, index) => {
        const x = first + index * slot;
        const w = slot * 0.78,
          h = slot * 0.92,
          top = ly - h;
        return (
          <g key={index}>
            <path
              d={`M ${x - w / 2} ${top} L ${x - w / 2 + 2} ${ly - 2} L ${x + w / 2 - 2} ${ly - 2} L ${x + w / 2} ${top} Z`}
              fill={`color-mix(in oklab, ${bucket.color} 28%, var(--stage-bg))`}
              stroke={bucket.color}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
            <ellipse cx={x} cy={top} rx={w / 2} ry={2.2} fill={bucket.color} fillOpacity={0.48} />
            <text
              x={x}
              y={top + h * 0.6}
              fontSize={slot * 0.45}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {bucket.sym}
            </text>
          </g>
        );
      })}
      <WeightGlyph cx={rx} top={ry - 34} wpx={34} hpx={34} label={String(total)} />
      {unit && (
        <text x={rx} y={ry - 40} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--stage-muted)">
          {unit}
        </text>
      )}
    </>
  );
}

/** Balance: the shared ScaleFrame apparatus, with clue-specific coloured buckets. */
export function ClueBalance({ clue, unknowns, unit = 'kg' }: SceneProps): ReactNode {
  const buckets: ClueBucket[] = [];
  clue.coeffs.forEach((count, index) => {
    for (let k = 0; k < count; k++)
      buckets.push({
        color: unknowns[index]?.color ?? 'var(--stage-accent)',
        sym: unknowns[index]?.sym ?? '',
      });
  });
  const total = clueTotal(clue, unknowns);
  return (
    <Stage
      view={{ xMin: -4, xMax: 4, yMin: -1.35, yMax: 1.35 }}
      height={132}
      pad={8}
      ariaLabel={`balance: ${buckets.length} buckets weigh ${total} ${unit}`}
    >
      <ClueBalanceContents buckets={buckets} total={total} unit={unit} />
    </Stage>
  );
}

/** Bar model (tape diagram): each clue is one bar of unit cells grouped by unknown = total. */
export function ClueBar({ clue, unknowns, currency, unit }: SceneProps): ReactNode {
  const terms = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[color-mix(in_oklab,var(--stage-fg)_5%,transparent)] px-3 py-2">
      <div className="flex gap-[5px]">
        {terms.map((t, ti) => (
          <div key={ti} className="flex">
            {Array.from({ length: t.c }).map((_, k) => (
              <div
                key={k}
                style={{
                  width: 30,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 14,
                  background: `color-mix(in oklab, ${chipColor(t.u)} 28%, transparent)`,
                  border: `1.5px solid ${chipColor(t.u)}`,
                  borderRadius: t.c === 1 ? 8 : k === 0 ? '8px 0 0 8px' : k === t.c - 1 ? '0 8px 8px 0' : 0,
                  marginLeft: k > 0 ? -1.5 : 0,
                }}
              >
                {t.u.sym}
              </div>
            ))}
          </div>
        ))}
      </div>
      <span className="font-bold text-[var(--stage-muted)]">=</span>
      <strong className="text-base tabular-nums">
        {fmtTotal(clueTotal(clue, unknowns), currency, unit)}
      </strong>
    </div>
  );
}

/** Coin piles: each unknown is a stack of coins (coloured by type) = a money total. */
export function ClueCoins({ clue, unknowns, currency = '$' }: SceneProps): ReactNode {
  const terms = clue.coeffs.map((c, i) => ({ c, u: unknowns[i]! })).filter((t) => t.c !== 0);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[color-mix(in_oklab,var(--stage-fg)_5%,transparent)] px-3 py-2">
      {terms.map((t, ti) => (
        <span key={ti} className="inline-flex items-end gap-1.5">
          {ti > 0 && <span className="mb-2 font-bold text-[var(--stage-muted)]">+</span>}
          <span style={{ position: 'relative', width: 30, height: 16 + t.c * 7 }}>
            {Array.from({ length: t.c }).map((_, k) => (
              <span
                key={k}
                style={{
                  position: 'absolute',
                  bottom: k * 7,
                  left: 0,
                  width: 30,
                  height: 16,
                  borderRadius: '50%',
                  border: `1.5px solid color-mix(in oklab, ${chipColor(t.u)} 65%, black)`,
                  background: `radial-gradient(circle at 40% 35%, color-mix(in oklab, ${chipColor(t.u)} 70%, white), ${chipColor(t.u)})`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 9,
                }}
              >
                {t.u.sym}
              </span>
            ))}
          </span>
        </span>
      ))}
      <span className="font-bold text-[var(--stage-muted)]">=</span>
      <strong className="text-base tabular-nums">{fmtTotal(clueTotal(clue, unknowns), currency)}</strong>
    </div>
  );
}

// ── open registry: a clue scene is a pluggable renderer; add your own with one call ──
export interface ClueSceneMeta {
  name: string;
  label: string;
  render: (q: SceneProps) => ReactNode;
}
const CLUE_REGISTRY = new Map<string, ClueSceneMeta>();
export function registerClueScene(meta: ClueSceneMeta): void {
  CLUE_REGISTRY.set(meta.name, meta);
}
export function getClueScene(name: string): ClueSceneMeta | undefined {
  return CLUE_REGISTRY.get(name);
}
export function listClueScenes(): ClueSceneMeta[] {
  return [...CLUE_REGISTRY.values()];
}

registerClueScene({ name: 'tiles', label: 'Algebra tiles', render: (q) => <ClueTiles {...q} /> });
registerClueScene({ name: 'receipt', label: 'Shop receipt', render: (q) => <ClueReceipt {...q} /> });
registerClueScene({ name: 'balance', label: 'Bucket balance', render: (q) => <ClueBalance {...q} /> });
registerClueScene({ name: 'bar', label: 'Bar model', render: (q) => <ClueBar {...q} /> });
registerClueScene({ name: 'coins', label: 'Coin piles', render: (q) => <ClueCoins {...q} /> });

/** Render one clue in the chosen scene (registry name). Creators extend via registerClueScene. */
export function ClueScene({ kind, ...rest }: SceneProps & { kind: string }): ReactNode {
  return getClueScene(kind)?.render(rest) ?? <ClueTiles {...rest} />;
}
