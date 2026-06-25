'use client';

/**
 * area-model asset — a GENERAL "algebra tiles" area model for (x+a)(x+b),
 * built on the @classytic/stage engine. The resolver is the single source of
 * truth: from the symbolic side length `x` (a bound scalar) and the integer
 * constants a, b it computes the four regions of the partitioned rectangle —
 *     x²            (the square, area x·x)
 *     a·x  +  b·x   (the strips, area scales WITH x)
 *     a·b           (the constant block, fixed size)
 * — so the learner SEES the x-terms grow with x while the constant does not.
 * EXPAND (watch the pieces) and FACTOR (find a, b) share one asset.
 */

import type { ReactNode } from 'react';
import {
  useCoords, registerAsset, StageAssetDefs,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry, type ElementStyle,
} from '@classytic/stage';
import { num as n } from '../../core/util.js';

type Role = 'x2' | 'xterm' | 'const';
interface Region { x0: number; y0: number; x1: number; y1: number; role: Role; label: string }
interface SideLabel { at: Vec2; text: string }

const asVec = (v: unknown, d: Vec2): Vec2 => (v && typeof v === 'object' && 'x' in v ? (v as Vec2) : d);

function resolver({ params, bound }: AssetResolveArgs): AssetGeometry {
  const o = asVec(params.origin, { x: 0, y: 0 });
  const a = Math.max(0, Math.round(n(params.a, 3)));
  const b = Math.max(0, Math.round(n(params.b, 2)));
  const u = n(params.unit, 1); // math-units per constant "1"
  const factorMode = n(params.mode, 0) === 1;
  const xv = Math.max(0.4, n(bound.x, 2));
  const revealed = !factorMode || bound.revealed === true || bound.revealed === 1;
  const solved = bound.solved === true || bound.solved === 1;

  const regions: Region[] = [];
  regions.push({ x0: o.x, y0: o.y, x1: o.x + xv, y1: o.y + xv, role: 'x2', label: 'x²' });
  if (a > 0) regions.push({ x0: o.x + xv, y0: o.y, x1: o.x + xv + a * u, y1: o.y + xv, role: 'xterm', label: a === 1 ? 'x' : `${a}x` });
  if (b > 0) regions.push({ x0: o.x, y0: o.y + xv, x1: o.x + xv, y1: o.y + xv + b * u, role: 'xterm', label: b === 1 ? 'x' : `${b}x` });
  if (a > 0 && b > 0) regions.push({ x0: o.x + xv, y0: o.y + xv, x1: o.x + xv + a * u, y1: o.y + xv + b * u, role: 'const', label: String(a * b) });

  const grid: Array<[Vec2, Vec2]> = [];
  for (let k = 1; k < a; k++) grid.push([{ x: o.x + xv + k * u, y: o.y }, { x: o.x + xv + k * u, y: o.y + xv + b * u }]);
  for (let k = 1; k < b; k++) grid.push([{ x: o.x, y: o.y + xv + k * u }, { x: o.x + xv + a * u, y: o.y + xv + k * u }]);

  const w = xv + a * u;
  const h = xv + b * u;
  const sideBottom: SideLabel = { at: { x: o.x + w / 2, y: o.y }, text: revealed ? `x${a ? ` + ${a}` : ''}` : 'x + ?' };
  const sideLeft: SideLabel = { at: { x: o.x, y: o.y + h / 2 }, text: revealed ? `x${b ? ` + ${b}` : ''}` : 'x + ?' };

  return {
    kind: 'asset-geom',
    parts: {
      outline: [{ x: o.x, y: o.y }, { x: o.x + w, y: o.y }, { x: o.x + w, y: o.y + h }, { x: o.x, y: o.y + h }],
      split: [{ x: o.x + xv, y: o.y }, { x: o.x + xv, y: o.y + h }],
      split2: [{ x: o.x, y: o.y + xv }, { x: o.x + w, y: o.y + xv }],
    },
    meta: { regions, grid, sideBottom, sideLeft, solved, revealed, expanded: { sq: 1, lin: a + b, con: a * b } },
  };
}

const FILL: Record<Role, string> = {
  x2: 'url(#stage-grad-weight)',
  xterm: 'url(#stage-grad-weight-2)',
  const: 'url(#stage-grad-metal)',
};

function Component({ geom }: { geom: AssetGeometry; style?: ElementStyle; label?: string }): ReactNode {
  const c = useCoords();
  const p = geom.parts as Record<string, Vec2[]>;
  const m = (geom.meta ?? {}) as {
    regions: Region[]; grid: Array<[Vec2, Vec2]>; sideBottom: SideLabel; sideLeft: SideLabel; solved: boolean;
  };
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);
  const good = m.solved ? 'var(--stage-good)' : 'var(--stage-metal)';

  const renderRegion = (r: Region, i: number): ReactNode => {
    const [lx, ty] = P({ x: r.x0, y: r.y1 });
    const [rx, by] = P({ x: r.x1, y: r.y0 });
    const wpx = Math.abs(rx - lx);
    const hpx = Math.abs(by - ty);
    const fs = Math.max(11, Math.min(22, Math.min(wpx, hpx) * 0.4));
    return (
      <g key={`r${i}`}>
        <rect x={lx} y={ty} width={wpx} height={hpx} rx={Math.min(6, Math.min(wpx, hpx) * 0.12)} fill={FILL[r.role]} stroke="color-mix(in oklab, var(--stage-sheen) 32%, transparent)" strokeWidth={1} />
        <text x={lx + wpx / 2} y={ty + hpx / 2} fill="var(--stage-fg)" fontSize={fs} fontWeight={700} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{r.label}</text>
      </g>
    );
  };

  const outline = p.outline ?? [];
  const [ox0, oy0] = P((outline[0] ?? { x: 0, y: 0 }) as Vec2);
  const [ox2, oy2] = P((outline[2] ?? { x: 0, y: 0 }) as Vec2);
  const sb = m.sideBottom;
  const [sbx, sby] = P(sb.at);
  const [slx, sly] = P(m.sideLeft.at);

  return (
    <>
      <StageAssetDefs />
      <g>
        {(m.regions ?? []).map(renderRegion)}
        {(m.grid ?? []).map(([g0, g1], i) => {
          const [x1, y1] = P(g0);
          const [x2, y2] = P(g1);
          return <line key={`g${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="color-mix(in oklab, var(--stage-sheen) 16%, transparent)" strokeWidth={1} />;
        })}
        {(['split', 'split2'] as const).map((key) => {
          const seg = p[key];
          if (!seg) return null;
          const [x1, y1] = P(seg[0] as Vec2);
          const [x2, y2] = P(seg[1] as Vec2);
          return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="color-mix(in oklab, var(--stage-sheen) 50%, transparent)" strokeWidth={1.5} />;
        })}
        <rect x={Math.min(ox0, ox2)} y={Math.min(oy0, oy2)} width={Math.abs(ox2 - ox0)} height={Math.abs(oy2 - oy0)} rx={4} fill="none" stroke={good} strokeWidth={3} />
        {m.solved && <rect x={Math.min(ox0, ox2)} y={Math.min(oy0, oy2)} width={Math.abs(ox2 - ox0)} height={Math.abs(oy2 - oy0)} rx={4} fill="none" stroke="var(--stage-good)" strokeWidth={14} opacity={0.16} />}
        <text x={sbx} y={sby + 20} fill="var(--stage-fg)" fontSize={14} fontWeight={600} textAnchor="middle" dominantBaseline="hanging">{sb.text}</text>
        <text x={slx - 12} y={sly} fill="var(--stage-fg)" fontSize={14} fontWeight={600} textAnchor="end" dominantBaseline="central">{m.sideLeft.text}</text>
      </g>
    </>
  );
}

export const AREA_MODEL_ASSET: AssetSpec = { resolver, Component };
registerAsset('area-model', AREA_MODEL_ASSET);
