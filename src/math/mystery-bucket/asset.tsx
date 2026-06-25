'use client';

/**
 * mystery-bucket asset — the ESSENTIALS opener for "Algebra You Can See": a
 * balance scale with a sealed BUCKET of hidden weight on the left and a row of
 * 1-unit weights on the right. The learner adds units until the beam is level —
 * then the bucket's weight is revealed. Teaches *unknown* + *balance* with zero
 * notation, before any letter or coefficient (Hands-On-Equations lineage).
 *
 * Reuses the shared balance vocabulary (flat beam + slim pedestal + hung trays
 * from balance-algebra) + the kit BucketGlyph / WeightGlyph — theme-aware, no
 * copy-pasted glyph drawing. The resolver owns the solve (tilt + balanced).
 */

import type { ReactNode } from 'react';
import {
  vec, useCoords, registerAsset, StageAssetDefs, BucketGlyph, WeightGlyph,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry, type ElementStyle,
} from '@classytic/stage';
import { ScaleFrame } from '../../kit/scale.js';
import { num as n, toRad } from '../../core/util.js';

// yBase = the math y of the tray surface the glyph RESTS on (it extends upward).
interface Coin { cx: number; yBase: number; wpx: number; hpx: number; label: string }
interface BucketBox { cx: number; yBase: number; wpx: number; hpx: number; label: string }

const TRAY_R = 0.95;
const HANG = 0.72;
const asVec = (v: unknown, d: Vec2): Vec2 => (v && typeof v === 'object' && 'x' in v ? (v as Vec2) : d);

function resolver({ params }: AssetResolveArgs): AssetGeometry {
  const pivot = asVec(params.pivot, { x: 0, y: 0.4 });
  const arm = n(params.arm, 3.3);
  const weight = Math.max(0, Math.round(n(params.bucketWeight, 5)));      // per-bucket weight
  const buckets = Math.max(1, Math.round(n(params.bucketCount, 1)));      // identical buckets on the left
  const total = weight * buckets;
  const count = Math.max(0, Math.round(n(params.count, 0)));
  const diff = total - count;
  const balanced = diff === 0;
  // bucket (left) heavier → left dips down → positive tilt (balance convention)
  const tiltDeg = Math.max(-13, Math.min(13, diff * 4.5));

  const rad = toRad(tiltDeg);
  const beamA = vec.rotateAbout({ x: pivot.x - arm, y: pivot.y }, pivot, rad);
  const beamB = vec.rotateAbout({ x: pivot.x + arm, y: pivot.y }, pivot, rad);

  const baseY = pivot.y - 1.05;
  const pedestal: Vec2[] = [
    { x: pivot.x - 0.12, y: pivot.y - 0.05 }, { x: pivot.x + 0.12, y: pivot.y - 0.05 },
    { x: pivot.x + 0.3, y: baseY }, { x: pivot.x - 0.3, y: baseY },
  ];
  const foot: Vec2[] = [{ x: pivot.x - 0.55, y: baseY }, { x: pivot.x + 0.55, y: baseY }];

  const trayLC = { x: beamA.x, y: beamA.y - HANG };
  const trayRC = { x: beamB.x, y: beamB.y - HANG };

  // left: the identical mystery buckets, resting in a row on the tray (each
  // reveals its per-bucket weight when level)
  const lUsable = TRAY_R * 2 * 0.86;
  const bw = Math.min(1.15, (lUsable / buckets) * 0.96);
  const bucketList: BucketBox[] = Array.from({ length: buckets }, (_, i) => ({
    cx: trayLC.x + (i - (buckets - 1) / 2) * (buckets > 1 ? lUsable / buckets : 0),
    yBase: trayLC.y,
    wpx: bw,
    hpx: bw,
    label: balanced ? String(weight) : '?',
  }));

  // right: a row of 1-unit coins (added by the learner), resting on the tray
  const usable = TRAY_R * 2 * 0.86;
  const cw = count > 0 ? Math.min(0.5, usable / count) : 0.5;
  const coins: Coin[] = Array.from({ length: count }, (_, i) => ({
    cx: trayRC.x + (i - (count - 1) / 2) * cw,
    yBase: trayRC.y,
    wpx: cw * 0.92,
    hpx: cw * 0.92,
    label: '1',
  }));

  return {
    kind: 'asset-geom',
    parts: { pivot, beamA, beamB, pedestal, foot, trayLC, trayRC },
    // buckets/coins carry their own math-unit sizes (scaled in the Component)
    meta: { buckets: bucketList, coins, balanced },
  };
}

function Component({ geom }: { geom: AssetGeometry; style?: ElementStyle; label?: string }): ReactNode {
  const c = useCoords();
  const p = geom.parts as Record<string, Vec2 | Vec2[]>;
  const m = (geom.meta ?? {}) as { buckets: BucketBox[]; coins: Coin[]; balanced: boolean };
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);
  const pivot = p.pivot as Vec2;

  // rest a glyph ON the pan rim: pixel top = rim pixel y − the glyph height
  // (so it extends UPWARD from the pan).
  const toGlyph = (b: BucketBox | Coin): { cx: number; top: number; wpx: number; hpx: number; label: string } => {
    const [gx, gy] = P({ x: b.cx, y: b.yBase });
    const hpx = c.sy(b.hpx);
    return { cx: gx, top: gy - hpx, wpx: c.sx(b.wpx), hpx, label: b.label };
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
      {/* the mystery buckets + the unit weights, resting on the pans */}
      {(m.buckets ?? []).map((b, i) => <BucketGlyph key={`b${i}`} {...toGlyph(b)} />)}
      {(m.coins ?? []).map((coin, i) => <WeightGlyph key={`c${i}`} {...toGlyph(coin)} />)}
    </>
  );
}

export const MYSTERY_BUCKET_ASSET: AssetSpec = { resolver, Component };
registerAsset('mystery-bucket', MYSTERY_BUCKET_ASSET);
