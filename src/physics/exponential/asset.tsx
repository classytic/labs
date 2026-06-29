'use client';

/**
 * rate-process asset, one exponential-relaxation curve, two skins (sim ≠ render):
 *   DECAY: a grid of atoms vanishing as N falls, with the half-life called out.
 *   COOLING: a thermometer relaxing toward room temperature (the dashed asymptote).
 * Both are the SAME `rate` sim (dy/dt = (target−y)/τ); only the skin + labels differ.
 *
 * Fixed 720×320 DESIGN space = the SceneDoc view; pxRect for the y-flipped chart.
 */

import type { ReactNode } from 'react';
import { useCoords, type AssetResolveArgs, type AssetSpec, type AssetGeometry } from '@classytic/stage';
import { pxRect } from '../../kit/asset-util.js';

const H = 320;
const CH = { x0: 290, x1: 632, yTop: 278, yBot: 54 };
const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const numOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const arr = (v: unknown): number[] => (Array.isArray(v) ? (v as number[]) : []);

interface RateMeta { value: number; target: number; samples: number[]; tSec: number; done: boolean; kind: number; value0: number; tau: number }

function resolver({ sim, params }: AssetResolveArgs): AssetGeometry {
  const meta: RateMeta = {
    value: numOr(sim?.value, 0), target: numOr(sim?.target, 0), samples: arr(sim?.samples),
    tSec: numOr(sim?.tSec, 0), done: sim?.done === true,
    kind: numOr(params?.kind, 0), value0: numOr(params?.value0, 100), tau: numOr(params?.tau, 1),
  };
  return { kind: 'asset-geom', parts: {}, meta: meta as unknown as Record<string, unknown> };
}

function Component({ geom }: { geom: AssetGeometry }): ReactNode {
  const c = useCoords();
  const m = (geom.meta ?? {}) as unknown as RateMeta;
  const P = (x: number, y: number): [number, number] => c.toPx(x, H - y);
  const decay = m.kind === 0;
  const maxV = Math.max(m.value0, m.target, 1);
  const sy = (v: number): number => CH.yTop - clamp01(v / maxV) * (CH.yTop - CH.yBot);
  const sx = (i: number, len: number): number => CH.x0 + (len <= 1 ? 0 : i / (len - 1)) * (CH.x1 - CH.x0);
  const frame = pxRect(P, CH.x0, CH.yBot, CH.x1, CH.yTop);
  const curve = m.samples.map((v, i) => P(sx(i, m.samples.length), sy(v)).join(',')).join(' ');
  const [tx0, ty] = P(CH.x0, sy(m.target));
  const [tx1] = P(CH.x1, sy(m.target));
  const halfLife = m.tau * Math.LN2;
  const valStr = decay ? Math.round(m.value).toString() : `${m.value.toFixed(0)}°`;

  // ── skin (left) ──
  let skin: ReactNode;
  if (decay) {
    const N = Math.min(100, Math.round(m.value0));
    const lit = Math.round((m.value / (m.value0 || 1)) * N);
    const cols = 10, gap = 18, ox = 30, oy = 86;
    const dots: ReactNode[] = [];
    for (let i = 0; i < N; i++) {
      const [px, py] = P(ox + (i % cols) * gap, oy + Math.floor(i / cols) * gap);
      const on = i < lit;
      dots.push(<circle key={i} cx={px} cy={py} r={5} fill={on ? 'var(--stage-accent)' : 'none'} stroke={on ? 'none' : 'var(--stage-grid)'} strokeWidth={1.2} opacity={on ? 1 : 0.6} />);
    }
    skin = <g>{dots}</g>;
  } else {
    // thermometer: tube x≈110, fill ∝ (value-target)/(value0-target)
    const frac = clamp01((m.value - m.target) / ((m.value0 - m.target) || 1));
    const tubeX = 120, top = 80, bot = 250, w = 22;
    const [bx, byTop] = P(tubeX - w / 2, top);
    const [, byBot] = P(tubeX + w / 2, bot);
    const tube = pxRect(P, tubeX - w / 2, top, tubeX + w / 2, bot);
    const [fillBx, fillTop] = P(tubeX - w / 2 + 3, top + (1 - frac) * (bot - top));
    const fillRect = pxRect(P, tubeX - w / 2 + 3, top + (1 - frac) * (bot - top), tubeX + w / 2 - 3, bot);
    const [bulbX, bulbY] = P(tubeX, bot + 16);
    const hot = `color-mix(in oklab, var(--stage-warn) ${Math.round(frac * 100)}%, var(--stage-accent))`;
    return (
      <>
        {chart(P, m, decay, maxV, sy, sx, frame, curve, tx0, tx1, ty, halfLife, valStr)}
        <rect x={tube.x} y={tube.y} width={tube.width} height={tube.height} rx={11} fill="var(--stage-bg)" stroke="var(--stage-metal)" strokeWidth={2} />
        <rect x={fillRect.x} y={fillRect.y} width={fillRect.width} height={fillRect.height} rx={8} fill={hot} />
        <circle cx={bulbX} cy={bulbY} r={16} fill={hot} stroke="var(--stage-metal)" strokeWidth={2} />
        {(() => { void byTop; void byBot; void bx; void fillBx; void fillTop; return null; })()}
      </>
    );
  }

  return (
    <>
      {chart(P, m, decay, maxV, sy, sx, frame, curve, tx0, tx1, ty, halfLife, valStr)}
      {skin}
    </>
  );
}

/** the shared curve panel + readouts (both skins use it) */
function chart(
  P: (x: number, y: number) => [number, number], m: RateMeta, decay: boolean, maxV: number,
  sy: (v: number) => number, _sx: (i: number, l: number) => number, frame: { x: number; y: number; width: number; height: number },
  curve: string, tx0: number, tx1: number, ty: number, halfLife: number, valStr: string,
): ReactNode {
  return (
    <g>
      {/* big readout */}
      {(() => { const [x, y] = P(90, 290); return <text x={x} y={y} textAnchor="middle" fontSize={24} fontWeight={800} fill="var(--stage-accent)" style={{ fontVariantNumeric: 'tabular-nums' }}>{valStr}</text>; })()}
      {(() => { const [x, y] = P(90, 268); return <text x={x} y={y} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">{decay ? 'atoms left' : 'temperature'}{m.done ? '  ·  ✓' : ''}</text>; })()}
      {/* curve panel */}
      <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx={8} fill="color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))" stroke="var(--stage-grid)" strokeWidth={1} />
      {/* target asymptote */}
      <line x1={tx0} y1={ty} x2={tx1} y2={ty} stroke="var(--stage-good)" strokeWidth={1.5} strokeDasharray="6 5" />
      {(() => { const [x, y] = P(CH.x1 + 6, sy(m.target)); return <text x={x} y={y + 3} fontSize={11} fontWeight={700} fill="var(--stage-good)">{decay ? '0' : `${m.target.toFixed(0)}° room`}</text>; })()}
      {/* half-value guide (decay: N₀/2, the half-life mark) */}
      {decay && (() => { const [x, y] = P(CH.x0, sy(m.value0 / 2)); const [x1] = P(CH.x1, 0); return <><line x1={x} y1={y} x2={x1} y2={y} stroke="var(--stage-grid)" strokeWidth={1} strokeDasharray="3 4" /><text x={x + 4} y={y - 3} fontSize={9.5} fill="var(--stage-muted)">N₀/2</text></>; })()}
      <polyline points={curve} fill="none" stroke="var(--stage-accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {(() => { const [x, y] = P((CH.x0 + CH.x1) / 2, CH.yBot - 16); return <text x={x} y={y} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">{decay ? `half-life ≈ ${halfLife.toFixed(1)} s, each one halves what's left` : `cooling toward room temp · τ ≈ ${m.tau.toFixed(1)} s`} · t = {m.tSec.toFixed(1)} s</text>; })()}
    </g>
  );
}

export const RATE_PROCESS_ASSET: AssetSpec = { resolver, Component };
