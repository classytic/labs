'use client';

/**
 * optics-ray asset — traces a light ray from a source, reflecting off mirror
 * segments until it hits a target, exits the scene, or exhausts its bounce
 * budget. Built on @classytic/stage: the resolver reads the bound source/aim
 * points and mirror segments (draggable scene elements) and computes the
 * polyline + hit flag (single source of truth).
 */

import type { ReactNode } from 'react';
import {
  vec, useCoords, isLineVal, isVec2,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry, type ElementStyle, type ShapeLineVal,
  registerAsset,
} from '@classytic/stage';

const n = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const asVec = (v: unknown, d: Vec2): Vec2 => (isVec2(v as never) ? (v as Vec2) : d);

const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;

function rayHitsSegment(P: Vec2, d: Vec2, m: ShapeLineVal): number | null {
  const s = vec.sub(m.b, m.a);
  const denom = cross(d, s);
  if (Math.abs(denom) < 1e-9) return null;
  const qp = vec.sub(m.a, P);
  const t = cross(qp, s) / denom;
  const u = cross(qp, d) / denom;
  if (t > 1e-6 && u >= 0 && u <= 1) return t;
  return null;
}

function rayHitsTarget(P: Vec2, d: Vec2, target: Vec2, R: number, maxT: number): Vec2 | null {
  const tProj = Math.max(0, Math.min(maxT, vec.dot(vec.sub(target, P), d)));
  const cp = { x: P.x + d.x * tProj, y: P.y + d.y * tProj };
  return vec.dist(cp, target) <= R ? cp : null;
}

function resolver({ params, bound }: AssetResolveArgs): AssetGeometry {
  const source = asVec(bound.source, { x: -5, y: -2 });
  const aim = isVec2(bound.aim as never) ? (bound.aim as Vec2) : null;
  const target = isVec2(bound.target as never) ? (bound.target as Vec2) : null;
  const dir0 = aim ? vec.normalize(vec.sub(aim, source)) : vec.normalize(asVec(params.dir, { x: 1, y: 0 }));
  const maxBounces = n(params.maxBounces, 8);
  const targetR = n(params.targetR, 0.5);
  const far = n(params.far, 60);

  const mirrors = Object.keys(bound)
    .filter((k) => /^m\d+$/.test(k))
    .map((k) => bound[k])
    .filter(isLineVal) as ShapeLineVal[];

  const pts: Vec2[] = [source];
  let P = source;
  let d = dir0;
  let hit = false;
  let bounces = 0;

  for (let b = 0; b <= maxBounces; b++) {
    let bestT = Infinity;
    let bestMirror: ShapeLineVal | null = null;
    for (const m of mirrors) {
      const t = rayHitsSegment(P, d, m);
      if (t != null && t < bestT) { bestT = t; bestMirror = m; }
    }
    const maxT = bestMirror ? bestT : far;
    if (target) {
      const th = rayHitsTarget(P, d, target, targetR, maxT);
      if (th) { pts.push(th); hit = true; break; }
    }
    if (!bestMirror) {
      pts.push({ x: P.x + d.x * far, y: P.y + d.y * far });
      break;
    }
    const hp = { x: P.x + d.x * bestT, y: P.y + d.y * bestT };
    pts.push(hp);
    const along = vec.normalize(vec.sub(bestMirror.b, bestMirror.a));
    const nrm = { x: -along.y, y: along.x };
    d = vec.normalize(vec.sub(d, vec.scale(nrm, 2 * vec.dot(d, nrm))));
    P = { x: hp.x + d.x * 1e-4, y: hp.y + d.y * 1e-4 };
    bounces++;
  }

  return {
    kind: 'asset-geom',
    parts: { ray: pts, sourceAt: source, ...(target ? { targetAt: target } : {}) },
    meta: { hit, bounces, dir0, mirrors: mirrors.map((m) => ({ a: m.a, b: m.b })) },
  };
}

function Component({ geom }: { geom: AssetGeometry; style?: ElementStyle; label?: string }): ReactNode {
  const c = useCoords();
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);
  const ray = (geom.parts.ray as Vec2[]) ?? [];
  const sourceAt = geom.parts.sourceAt as Vec2 | undefined;
  const targetAt = geom.parts.targetAt as Vec2 | undefined;
  const meta = (geom.meta ?? {}) as { hit?: boolean; mirrors?: { a: Vec2; b: Vec2 }[] };
  const hit = meta.hit === true;
  const rayPx = ray.map(P);
  const rayStr = rayPx.map((p) => p.join(',')).join(' ');

  // Everything here is DECORATIVE: pointer-events:none so the draggable handles
  // (source / aim / mirror endpoints — real MovableDots in the scene) stay grabbable
  // underneath these richer glyphs.
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* mirrors: a bright reflective face + hatching on the back (the schematic mirror symbol) */}
      {(meta.mirrors ?? []).map((m, i) => {
        const a = P(m.a), b = P(m.b);
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len; // back-side normal (px)
        const ticks = Math.max(3, Math.floor(len / 16));
        const HL = 9;
        return (
          <g key={i}>
            {Array.from({ length: ticks }, (_, k) => {
              const s = (k + 0.5) / ticks;
              const px = a[0] + dx * s, py = a[1] + dy * s;
              return <line key={k} x1={px} y1={py} x2={px + nx * HL} y2={py + ny * HL} stroke="var(--stage-metal)" strokeWidth={1.5} opacity={0.7} />;
            })}
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--stage-sheen)" strokeWidth={3} strokeLinecap="round" opacity={0.92} />
          </g>
        );
      })}

      {/* light beam: a soft glow under a crisp core */}
      {rayPx.length > 1 && <polyline points={rayStr} fill="none" stroke="var(--stage-warn)" strokeWidth={7} opacity={0.18} strokeLinejoin="round" strokeLinecap="round" />}
      {rayPx.length > 1 && <polyline points={rayStr} fill="none" stroke="var(--stage-warn)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}

      {/* target: a bullseye that fills + glows when the beam lands */}
      {targetAt && (() => {
        const [tx, ty] = P(targetAt);
        const R = c.sx(0.6);
        return (
          <g>
            {hit && <circle cx={tx} cy={ty} r={R * 1.8} fill="var(--stage-good)" opacity={0.25} />}
            <circle cx={tx} cy={ty} r={R} fill="none" stroke={hit ? 'var(--stage-good)' : 'var(--stage-metal)'} strokeWidth={2} />
            <circle cx={tx} cy={ty} r={R * 0.45} fill={hit ? 'var(--stage-good)' : 'var(--stage-metal)'} opacity={hit ? 1 : 0.55} />
          </g>
        );
      })()}

      {/* source: a glowing lamp/emitter */}
      {sourceAt && (() => {
        const [sx, sy] = P(sourceAt);
        const r = c.sx(0.34);
        return (
          <g>
            <circle cx={sx} cy={sy} r={r * 2.4} fill="var(--stage-warn)" opacity={0.2} />
            <circle cx={sx} cy={sy} r={r} fill="var(--stage-warn)" stroke="var(--stage-metal)" strokeWidth={1.5} />
            <circle cx={sx} cy={sy} r={r * 0.45} fill="var(--stage-sheen)" opacity={0.95} />
          </g>
        );
      })()}
    </g>
  );
}

export const OPTICS_RAY_ASSET: AssetSpec = { resolver, Component };
registerAsset('optics-ray', OPTICS_RAY_ASSET);
