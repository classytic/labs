'use client';

/**
 * balance-algebra asset — a GENERAL balance-scale for any linear equation
 * a·x + b = c, built on @classytic/stage. The resolver is the single source of
 * truth (beam tilted by the bound `tilt`, pedestal, hung flat trays, items);
 * the Component is a dumb renderer.
 *
 * Visual language: FLAT, thin, precise (Brilliant-grade) — a hairline beam on a
 * small pedestal, two thin flat plates hung on cords, a labelled x-TILE +
 * (if b>0) a value COIN on the left, a single value coin on the right. The
 * unknown's value is NOT drawn as size — the beam tilt is the feedback.
 */

import type { ReactNode } from 'react';
import {
  vec, useCoords, registerAsset, StageAssetDefs, XBlockGlyph, WeightGlyph,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry, type ElementStyle,
} from '@classytic/stage';
import { ScaleFrame } from '../../kit/scale.js';
import { num as n, toRad } from '../../core/util.js';

interface PanItem { cx: number; yBase: number; w: number; h: number; kind: 'x' | 'const'; label: string }

const TRAY_R = 0.82;
const HANG = 0.72;

const asVec = (v: unknown, d: Vec2): Vec2 => (v && typeof v === 'object' && 'x' in v ? (v as Vec2) : d);

function layoutPan(center: Vec2, items: Array<{ kind: 'x' | 'const'; label: string }>): PanItem[] {
  const count = items.length || 1;
  const slot = count === 1 ? 0 : 0.78;
  return items.map((it, i) => ({
    cx: center.x + (i - (count - 1) / 2) * slot,
    yBase: center.y,
    w: 0.62,
    h: 0.62,
    kind: it.kind,
    label: it.label,
  }));
}

function resolver({ params, bound }: AssetResolveArgs): AssetGeometry {
  const pivot = asVec(params.pivot, { x: 0, y: 0.4 });
  const arm = n(params.arm, 3.3);
  const coef = Math.max(0, Math.round(n(params.coef, 2)));
  const addend = Math.max(0, Math.round(n(params.addend, 1)));
  const rhs = Math.max(0, Math.round(n(params.rhs, 7)));
  const tiltDeg = n(bound.tilt, 0);
  const balanced = bound.balanced === true || bound.balanced === 1;

  const rad = toRad(tiltDeg); // positive tilt dips the left side down
  const beamA = vec.rotateAbout({ x: pivot.x - arm, y: pivot.y }, pivot, rad);
  const beamB = vec.rotateAbout({ x: pivot.x + arm, y: pivot.y }, pivot, rad);

  const baseY = pivot.y - 1.05;
  // small, slim pedestal + a short foot
  const pedestal: Vec2[] = [
    { x: pivot.x - 0.12, y: pivot.y - 0.05 }, { x: pivot.x + 0.12, y: pivot.y - 0.05 },
    { x: pivot.x + 0.3, y: baseY }, { x: pivot.x - 0.3, y: baseY },
  ];
  const foot: Vec2[] = [{ x: pivot.x - 0.55, y: baseY }, { x: pivot.x + 0.55, y: baseY }];

  const trayLC = { x: beamA.x, y: beamA.y - HANG };
  const trayRC = { x: beamB.x, y: beamB.y - HANG };

  const leftItems: Array<{ kind: 'x' | 'const'; label: string }> = [
    ...(coef > 0 ? [{ kind: 'x' as const, label: coef === 1 ? 'x' : `${coef}x` }] : []),
    ...(addend > 0 ? [{ kind: 'const' as const, label: String(addend) }] : []),
  ];
  const rightItems = [{ kind: 'const' as const, label: String(rhs) }];

  return {
    kind: 'asset-geom',
    parts: { pivot, beamA, beamB, pedestal, foot, trayLC, trayRC },
    meta: { items: [...layoutPan(trayLC, leftItems), ...layoutPan(trayRC, rightItems)], balanced },
  };
}

function Component({ geom }: { geom: AssetGeometry; style?: ElementStyle; label?: string }): ReactNode {
  const c = useCoords();
  const p = geom.parts as Record<string, Vec2 | Vec2[]>;
  const m = (geom.meta ?? {}) as { items: PanItem[]; balanced: boolean };
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);

  const pivot = p.pivot as Vec2;

  const renderItem = (it: PanItem, i: number): ReactNode => {
    const [cx, baseY] = P({ x: it.cx, y: it.yBase });
    const wpx = c.sx(it.w);
    const hpx = c.sy(it.h);
    const top = baseY - hpx;
    const box = { cx, top, wpx, hpx, label: it.label };
    return <g key={i}>{it.kind === 'x' ? <XBlockGlyph {...box} /> : <WeightGlyph {...box} />}</g>;
  };

  return (
    <>
      <StageAssetDefs />
      <ScaleFrame
        pivot={pivot}
        beamA={p.beamA as Vec2}
        beamB={p.beamB as Vec2}
        trayLC={p.trayLC as Vec2}
        trayRC={p.trayRC as Vec2}
        baseY={pivot.y - 1.05}
        panR={TRAY_R}
        balanced={m.balanced}
      />
      {/* items resting on the pans */}
      <g>{(m.items ?? []).map(renderItem)}</g>
    </>
  );
}

export const BALANCE_ALGEBRA_ASSET: AssetSpec = { resolver, Component };
registerAsset('balance-algebra', BALANCE_ALGEBRA_ASSET);
