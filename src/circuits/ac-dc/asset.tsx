'use client';

/**
 * ac-dc asset, the whole "AC or DC?" visual as ONE data-driven scene asset on the
 * @classytic/stage engine (the standard way, like circuit-network). It reads the
 * live `wave` sim state via `simBind` (v / charge / samples / mode / volts) and the
 * resolver owns the entire layout + derived quantities; the Component just projects
 * and draws with the shared glyph kit. One sim → three synced skins:
 *   • REAL circuit: a glowing lamp + electrons marching the wire (position = ∫v dt),
 *   • ANALOGY: water in a pipe (same charge),
 *   • INSTRUMENT: the live scope (the samples ring buffer).
 *
 * Layout is authored in a fixed 720×540 DESIGN space which is also the SceneDoc
 * `view`, so positions project responsively while glyph sizes stay fixed-px crisp
 * (P(x,y) flips y because math-y is up). brightness is instantaneous v²/V² here
 * (the hand lab's spring-lagged "thermal inertia" is a render nicety we trade for a
 * pure, data-defined scene).
 */

import type { ReactNode } from 'react';
import {
  useCoords, registerAsset, StageAssetDefs,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry,
} from '@classytic/stage';
import { LampGlyph, AcDcSourceGlyph } from '../../kit/electronics.js';

const SRC = { x: 96, y: 96 };
const LAMP = { x: 624, y: 96 };
const PIPE = { x0: 96, x1: 624, y: 252 };
const SCOPE = { x0: 60, x1: 660, yTop: 320, yBot: 500 };

// the wire loop electrons march along (design coords), sampled as a polyline
const LOOP: Array<[number, number]> = [
  [SRC.x, 64], [SRC.x, 28], [LAMP.x, 28], [LAMP.x, 64],
  [LAMP.x, 128], [LAMP.x, 164], [SRC.x, 164], [SRC.x, 128], [SRC.x, 64],
];
const LOOP_SEGS = (() => {
  const segs: { x: number; y: number; dx: number; dy: number; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < LOOP.length - 1; i++) {
    const a = LOOP[i]!;
    const b = LOOP[i + 1]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    segs.push({ x: a[0], y: a[1], dx, dy, len });
    total += len;
  }
  return { segs, total };
})();
function loopPoint(d: number): Vec2 {
  const { segs, total } = LOOP_SEGS;
  let dist = ((d % total) + total) % total;
  for (const s of segs) {
    if (dist <= s.len) { const t = s.len > 0 ? dist / s.len : 0; return { x: s.x + s.dx * t, y: s.y + s.dy * t }; }
    dist -= s.len;
  }
  const last = segs[segs.length - 1]!;
  return { x: last.x + last.dx, y: last.y + last.dy };
}

const numOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

interface AcDcMeta {
  mode: string; volts: number; level: number; brightness: number; lastV: number;
  electrons: Vec2[]; drops: Vec2[]; trace: Vec2[];
}

function resolver({ sim }: AssetResolveArgs): AssetGeometry {
  const v = numOr(sim?.v, 0);
  const charge = numOr(sim?.charge, 0);
  const volts = Math.max(1, numOr(sim?.volts, 9));
  const mode = typeof sim?.mode === 'string' ? sim.mode : 'dc';
  const samples = Array.isArray(sim?.samples) ? (sim.samples as number[]) : [];

  const level = v / volts;
  const brightness = Math.min(1, (v * v) / (volts * volts));
  const flow = charge * 26; // electron / water displacement

  const N = 16;
  const spacing = LOOP_SEGS.total / N;
  const electrons: Vec2[] = [];
  for (let i = 0; i < N; i++) electrons.push(loopPoint(flow + i * spacing));

  const D = 13;
  const span = PIPE.x1 - PIPE.x0;
  const gap = span / D;
  const drops: Vec2[] = [];
  for (let i = 0; i < D; i++) {
    const px = PIPE.x0 + ((((flow * 0.6 + i * gap) % span) + span) % span);
    drops.push({ x: px, y: PIPE.y });
  }

  const mid = (SCOPE.yTop + SCOPE.yBot) / 2;
  const halfH = (SCOPE.yBot - SCOPE.yTop) / 2 - 8;
  const w = SCOPE.x1 - SCOPE.x0;
  const cap = Math.max(1, samples.length - 1);
  const trace: Vec2[] = samples.map((s, i) => ({ x: SCOPE.x0 + (i / cap) * w, y: mid - (s / volts) * halfH }));

  const meta: AcDcMeta = { mode, volts, level, brightness, lastV: samples.length ? samples[samples.length - 1]! : v, electrons, drops, trace };
  return { kind: 'asset-geom', parts: { src: SRC, lamp: LAMP }, meta: meta as unknown as Record<string, unknown> };
}

function Component({ geom }: { geom: AssetGeometry }): ReactNode {
  const c = useCoords();
  const m = (geom.meta ?? {}) as unknown as AcDcMeta;
  const P = (p: Vec2): [number, number] => c.toPx(p.x, 540 - p.y); // design→math (y up) → px
  const loopPath = 'M ' + LOOP.map((d) => P({ x: d[0], y: d[1] }).join(',')).join(' L ');
  const mid = (SCOPE.yTop + SCOPE.yBot) / 2;
  // y is flipped (P uses 540 - y), so project both edges then take min + |Δ|, an
  // SVG <rect> needs a top-left corner and a POSITIVE height.
  const [scX0, scYa] = P({ x: SCOPE.x0, y: SCOPE.yTop });
  const [scX1, scYb] = P({ x: SCOPE.x1, y: SCOPE.yBot });
  const scTop = Math.min(scYa, scYb);
  const scH = Math.abs(scYb - scYa);
  const [, scMid] = P({ x: 0, y: mid });
  const lit = Math.abs(m.level) > 0.02;

  return (
    <>
      <StageAssetDefs />
      {/* wire + electrons */}
      <path d={loopPath} fill="none" stroke="var(--stage-metal)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {m.electrons.map((e, i) => { const [x, y] = P(e); return <circle key={`e${i}`} cx={x} cy={y} r={3} fill="var(--stage-charge)" opacity={lit ? 0.9 : 0.25} />; })}
      {/* source + lamp (glyphs at projected anchors, fixed px size) */}
      {(() => { const [x, y] = P(geom.parts.src as Vec2); return <AcDcSourceGlyph cx={x} cy={y} mode={m.mode === 'ac' ? 'ac' : 'dc'} level={m.level} />; })()}
      {(() => { const [x, y] = P(geom.parts.lamp as Vec2); return <LampGlyph cx={x} cy={y} brightness={m.brightness} />; })()}
      {/* water-pipe analogy */}
      {(() => {
        const [px0, py] = P({ x: PIPE.x0, y: PIPE.y });
        const [px1] = P({ x: PIPE.x1, y: PIPE.y });
        return (
          <g>
            <rect x={px0 - 14} y={py - 16} width={px1 - px0 + 28} height={32} rx={16} fill="color-mix(in oklab, var(--stage-accent) 10%, var(--stage-bg))" stroke="var(--stage-grid)" strokeWidth={2} />
            {m.drops.map((d, i) => { const [x, y] = P(d); return <circle key={`d${i}`} cx={x} cy={y} r={5} fill="var(--stage-accent)" opacity={0.85} />; })}
            <text x={px0 - 6} y={py + 38} fontSize={12} fill="var(--stage-metal)">water analogy, {m.mode === 'dc' ? 'steady one-way flow' : 'back-and-forth slosh'} (same signal)</text>
          </g>
        );
      })()}
      {/* live scope */}
      <g>
        <rect x={scX0} y={scTop} width={scX1 - scX0} height={scH} rx={10} fill="color-mix(in oklab, var(--stage-accent) 6%, var(--stage-bg))" stroke="var(--stage-grid)" strokeWidth={1.5} />
        <line x1={scX0} y1={scMid} x2={scX1} y2={scMid} stroke="var(--stage-grid)" strokeWidth={1} strokeDasharray="4 5" />
        <polyline points={m.trace.map((p) => P(p).join(',')).join(' ')} fill="none" stroke="var(--stage-live)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" filter="url(#stage-glow)" />
        <text x={scX0 + 10} y={scTop + 20} fontSize={13} fontWeight={700} fill="var(--stage-live)">voltage vs time</text>
        <text x={scX1 - 10} y={scTop + 20} textAnchor="end" fontSize={13} fill="var(--stage-metal)">{m.lastV >= 0 ? '+' : ''}{m.lastV.toFixed(1)} V</text>
      </g>
    </>
  );
}

export const AC_DC_ASSET: AssetSpec = { resolver, Component };
registerAsset('ac-dc', AC_DC_ASSET);
