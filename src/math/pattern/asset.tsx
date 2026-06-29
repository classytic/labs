'use client';

/**
 * pattern-figure asset, ONE figure in a growing visual pattern whose tile count
 * follows a linear rule count(n) = a·n + b, built on @classytic/stage. The `a·n`
 * "grow" tiles are stacked as n rows of a (each step adds a row), and the `b`
 * constant tiles sit in a fixed strip below in a distinct colour, making "a per
 * step, plus a fixed b" legible. Deterministic: cells are a pure function of
 * (n, a, b, cell, origin).
 */

import type { ReactNode } from 'react';
import {
  useCoords, registerAsset, StageAssetDefs,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry, type ElementStyle,
} from '@classytic/stage';
import { num as n } from '../../core/util.js';

interface Cell { x: number; y: number; s: number; role: 'grow' | 'const' }

const asVec = (v: unknown, d: Vec2): Vec2 => (v && typeof v === 'object' && 'x' in v ? (v as Vec2) : d);

function resolver({ params }: AssetResolveArgs): AssetGeometry {
  const o = asVec(params.origin, { x: 0, y: 0 });
  const step = Math.max(1, Math.round(n(params.n, 1)));
  const a = Math.max(0, Math.round(n(params.a, 2)));
  const b = Math.max(0, Math.round(n(params.b, 1)));
  const cell = n(params.cell, 0.5);
  const gap = cell * 0.08;
  const s = cell - gap;

  const cells: Cell[] = [];
  for (let r = 0; r < step; r++) {
    for (let col = 0; col < a; col++) cells.push({ x: o.x + col * cell, y: o.y + r * cell, s, role: 'grow' });
  }
  for (let col = 0; col < b; col++) cells.push({ x: o.x + col * cell, y: o.y - cell * 1.5, s, role: 'const' });

  const count = a * step + b;
  const widthCells = Math.max(a, b, 1);
  return {
    kind: 'asset-geom',
    parts: { captionAt: { x: o.x + (widthCells * cell) / 2, y: o.y - cell * 2.6 } },
    meta: { cells, n: step, count, a, b },
  };
}

function Component({ geom }: { geom: AssetGeometry; style?: ElementStyle; label?: string }): ReactNode {
  const c = useCoords();
  const p = geom.parts as Record<string, Vec2>;
  const m = (geom.meta ?? {}) as { cells: Cell[]; n: number; count: number };
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);

  const renderCell = (cell: Cell, i: number): ReactNode => {
    const [lx, ty] = P({ x: cell.x, y: cell.y + cell.s });
    const wpx = c.sx(cell.s);
    const hpx = c.sy(cell.s);
    return <rect key={i} x={lx} y={ty} width={wpx} height={hpx} rx={Math.min(4, wpx * 0.2)} fill={cell.role === 'grow' ? 'url(#stage-grad-weight)' : 'url(#stage-grad-weight-2)'} stroke="color-mix(in oklab, var(--stage-sheen) 32%, transparent)" strokeWidth={1} />;
  };

  const [cx, cy] = P(p.captionAt ?? { x: 0, y: 0 });
  return (
    <>
      <StageAssetDefs />
      <g>{(m.cells ?? []).map(renderCell)}</g>
      <text x={cx} y={cy} fill="var(--stage-fg)" fontSize={13} fontWeight={600} textAnchor="middle" dominantBaseline="hanging">n = {m.n} → {m.count}</text>
    </>
  );
}

export const PATTERN_FIGURE_ASSET: AssetSpec = { resolver, Component };
registerAsset('pattern-figure', PATTERN_FIGURE_ASSET);
