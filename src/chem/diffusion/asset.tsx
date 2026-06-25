'use client';

/**
 * diffusion asset — renders the `particles` sim as two coloured gases in a box and
 * a live "mixed" readout. Two populations start apart (a partition); set them
 * loose and they random-walk into a uniform mix — diffusion / the arrow of entropy.
 * Reads px/py/group/box/mixed straight from the sim (sim ≠ render).
 */

import type { ReactNode } from 'react';
import { useCoords, type AssetResolveArgs, type AssetSpec, type AssetGeometry } from '@classytic/stage';

const numOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const arr = (v: unknown): number[] => (Array.isArray(v) ? (v as number[]) : []);
const A = 'var(--stage-accent)';   // group 0
const B = 'var(--stage-danger, #e03131)'; // group 1

interface DiffMeta { px: number[]; py: number[]; group: number[]; w: number; h: number; mixed: number }

function resolver({ sim, params }: AssetResolveArgs): AssetGeometry {
  const meta: DiffMeta = {
    px: arr(sim?.px), py: arr(sim?.py), group: arr(sim?.group),
    w: numOr(params?.w, 12), h: numOr(params?.h, 6), mixed: numOr(sim?.mixed, 0),
  };
  return { kind: 'asset-geom', parts: {}, meta: meta as unknown as Record<string, unknown> };
}

function Component({ geom }: { geom: AssetGeometry }): ReactNode {
  const c = useCoords();
  const m = (geom.meta ?? {}) as unknown as DiffMeta;
  const P = (x: number, y: number): [number, number] => c.toPx(x, y);
  const [bx0, by0] = P(0, 0);
  const [bx1, by1] = P(m.w, m.h);
  const x = Math.min(bx0, bx1), y = Math.min(by0, by1);
  const w = Math.abs(bx1 - bx0), h = Math.abs(by1 - by0);
  const pct = Math.round(m.mixed * 100);

  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="color-mix(in oklab, var(--stage-accent) 4%, var(--stage-bg))" stroke="var(--stage-grid)" strokeWidth={1.5} />
      {m.px.map((_, i) => {
        const [cx, cy] = P(m.px[i]!, m.py[i]!);
        return <circle key={i} cx={cx} cy={cy} r={4.5} fill={m.group[i] === 0 ? A : B} opacity={0.92} />;
      })}
      <text x={x + 12} y={y + 20} fontSize={13} fontWeight={700} fill="var(--stage-fg)" style={{ fontVariantNumeric: 'tabular-nums' }}>mixed: {pct}%</text>
    </>
  );
}

export const DIFFUSION_ASSET: AssetSpec = { resolver, Component };
