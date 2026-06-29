'use client';

/**
 * balance-lever asset, a GENERAL torque balance ("balance the mobile"), built
 * on @classytic/stage. Weights hang at chosen DISTANCES along an arm and
 * balance when net torque Σ(w·d) is equal each side. The resolver lays each
 * weight at its distance on the (tilted) beam and draws it via the SHARED kit
 * glyphs (XBlockGlyph for an unknown, WeightGlyph for a known mass), the same
 * vocabulary as balance-algebra, no copy-paste. Physics (torque, tilt,
 * balanced) is computed in the scene DAG and bound in.
 */

import type { ReactNode } from 'react';
import {
  vec, useCoords, registerAsset, StageAssetDefs, XBlockGlyph, WeightGlyph, HangerHook,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry, type ElementStyle,
} from '@classytic/stage';
import { num as n, toRad } from '../../core/util.js';

interface LeverItem { anchor: Vec2; cx: number; cy: number; w: number; h: number; kind: 'x' | 'const'; label: string }

const asVec = (v: unknown, d: Vec2): Vec2 => (v && typeof v === 'object' && 'x' in v ? (v as Vec2) : d);
const numOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'boolean' ? (v ? 1 : 0) : d);

function resolver({ params, bound }: AssetResolveArgs): AssetGeometry {
  const pivot = asVec(params.pivot, { x: 0, y: 1.2 });
  const arm = n(params.arm, 3.6);
  const unitGap = n(params.unitGap, 0.9);
  const count = Math.max(0, Math.round(n(params.count, 0)));
  const tiltDeg = n(bound.tilt, 0);
  const balanced = bound.balanced === true || bound.balanced === 1;
  const drop = 0.95;

  const rad = toRad(tiltDeg); // positive tilt dips left (BalanceScale convention)
  const beamA = vec.rotateAbout({ x: pivot.x - arm, y: pivot.y }, pivot, rad);
  const beamB = vec.rotateAbout({ x: pivot.x + arm, y: pivot.y }, pivot, rad);

  const baseY = pivot.y - 1.3;
  const pedestal: Vec2[] = [
    { x: pivot.x - 0.14, y: pivot.y - 0.05 }, { x: pivot.x + 0.14, y: pivot.y - 0.05 },
    { x: pivot.x + 0.34, y: baseY }, { x: pivot.x - 0.34, y: baseY },
  ];
  const foot: Vec2[] = [{ x: pivot.x - 0.62, y: baseY }, { x: pivot.x + 0.62, y: baseY }];

  const ticks: Vec2[][] = [];
  const maxSlots = Math.round(arm / unitGap);
  for (let k = 1; k <= maxSlots; k++) {
    for (const sgn of [-1, 1]) {
      const a = vec.rotateAbout({ x: pivot.x + sgn * k * unitGap, y: pivot.y }, pivot, rad);
      ticks.push([a, { x: a.x, y: a.y - 0.16 }]);
    }
  }

  const items: LeverItem[] = [];
  for (let i = 0; i < count; i++) {
    const side = n(params[`s${i}`], 1);
    const dist = n(params[`d${i}`], 1);
    const kind = n(params[`k${i}`], 0) === 1 ? 'x' : 'const';
    const wv = numOr(bound[`w${i}`], 0);
    const anchor = vec.rotateAbout({ x: pivot.x + side * dist * unitGap, y: pivot.y }, pivot, rad);
    items.push({ anchor, cx: anchor.x, cy: anchor.y - drop, w: kind === 'x' ? 0.6 : 0.72, h: kind === 'x' ? 0.66 : 0.78, kind, label: kind === 'x' ? 'x' : String(Math.round(wv)) });
  }

  return { kind: 'asset-geom', parts: { pivot, beamA, beamB, pedestal, foot }, meta: { items, ticks, balanced } };
}

function Component({ geom }: { geom: AssetGeometry; style?: ElementStyle; label?: string }): ReactNode {
  const c = useCoords();
  const p = geom.parts as Record<string, Vec2 | Vec2[]>;
  const m = (geom.meta ?? {}) as { items: LeverItem[]; ticks: Vec2[][]; balanced: boolean };
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);

  const [bax, bay] = P(p.beamA as Vec2);
  const [bbx, bby] = P(p.beamB as Vec2);
  const ped = (p.pedestal as Vec2[]).map(P);
  const [ft0x, ft0y] = P((p.foot as Vec2[])[0] as Vec2);
  const [ft1x] = P((p.foot as Vec2[])[1] as Vec2);
  const [pivx, pivy] = P(p.pivot as Vec2);
  const metal = 'var(--stage-metal)';
  const edge = 'color-mix(in oklab, var(--stage-metal) 72%, black)';
  const beamColor = m.balanced ? 'var(--stage-good)' : metal;

  const renderItem = (it: LeverItem, i: number): ReactNode => {
    const [ax, ay] = P(it.anchor);
    const [cx, cy] = P({ x: it.cx, y: it.cy });
    const wpx = c.sx(it.w);
    const hpx = c.sy(it.h);
    const top = cy - hpx / 2;
    const box = { cx, top, wpx, hpx, label: it.label };
    return (
      <g key={i}>
        <HangerHook topX={ax} topY={ay} botX={cx} botY={top} />
        {it.kind === 'x' ? <XBlockGlyph {...box} /> : <WeightGlyph {...box} />}
      </g>
    );
  };

  return (
    <>
      <StageAssetDefs />
      {/* foot + slim pedestal */}
      <rect x={Math.min(ft0x, ft1x)} y={ft0y - 2.5} width={Math.abs(ft1x - ft0x)} height={6} rx={3} fill={metal} stroke={edge} strokeWidth={0.75} />
      <polygon points={ped.map((q) => q.join(',')).join(' ')} fill="url(#stage-grad-metal)" stroke={edge} strokeWidth={0.75} strokeLinejoin="round" />
      {/* slot ticks along the arm */}
      {(m.ticks ?? []).map(([t0, t1], i) => {
        const [x1, y1] = P(t0 as Vec2);
        const [x2, y2] = P(t1 as Vec2);
        return <line key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={metal} strokeWidth={1.5} opacity={0.3} />;
      })}
      {/* hairline beam */}
      {m.balanced && <line x1={bax} y1={bay} x2={bbx} y2={bby} stroke="var(--stage-good)" strokeWidth={12} strokeLinecap="round" opacity={0.18} />}
      <line x1={bax} y1={bay} x2={bbx} y2={bby} stroke={beamColor} strokeWidth={4} strokeLinecap="round" />
      <line x1={bax} y1={bay} x2={bbx} y2={bby} stroke="color-mix(in oklab, var(--stage-sheen) 40%, transparent)" strokeWidth={1} strokeLinecap="round" transform="translate(0,-1)" />
      <circle cx={pivx} cy={pivy} r={4} fill={metal} stroke={edge} strokeWidth={0.75} />
      {(m.items ?? []).map(renderItem)}
    </>
  );
}

export const BALANCE_LEVER_ASSET: AssetSpec = { resolver, Component };
registerAsset('balance-lever', BALANCE_LEVER_ASSET);
