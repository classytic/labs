'use client';

/**
 * lln asset — the Law of Large Numbers, clean: the running frequency of the first
 * outcome (heads / a "1") plotted over draws, wiggling at first then settling onto
 * the dashed TRUE line. A big coin/die shows the latest flip; a one-line tally
 * gives every outcome's running %. One `sampler` sim drives it all (sim ≠ render).
 *
 * Authored in a fixed 720×300 DESIGN space = the SceneDoc view; P flips y so a
 * y-down layout maps to math-y-up. Rects use pxRect (no negative-height footgun).
 */

import type { ReactNode } from 'react';
import { useCoords, type AssetResolveArgs, type AssetSpec, type AssetGeometry } from '@classytic/stage';
import { CoinGlyph, DiceGlyph } from '../../kit/probability.js';
import { pxRect } from '../../kit/asset-util.js';

const H = 300;
const CH = { x0: 250, x1: 636, yTop: 250, yBot: 40 };  // chart box (design, y-down); right gutter (→720) leaves room for the "true %" label
const numOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const arr = (v: unknown): number[] => (Array.isArray(v) ? (v as number[]) : []);

interface LlnMeta { p: number[]; p0: number[]; samples: number[]; n: number; last: number; kind: number; done: boolean }

function resolver({ sim, params }: AssetResolveArgs): AssetGeometry {
  const meta: LlnMeta = {
    p: arr(sim?.p), p0: arr(sim?.p0), samples: arr(sim?.samples),
    n: numOr(sim?.n, 0), last: numOr(sim?.last, -1), kind: numOr(params?.kind, 0), done: sim?.done === true,
  };
  return { kind: 'asset-geom', parts: {}, meta: meta as unknown as Record<string, unknown> };
}

function Component({ geom }: { geom: AssetGeometry }): ReactNode {
  const c = useCoords();
  const m = (geom.meta ?? {}) as unknown as LlnMeta;
  const P = (x: number, y: number): [number, number] => c.toPx(x, H - y);
  const labels = m.kind === 1 ? ['1', '2', '3', '4', '5', '6'] : ['H', 'T'];
  const drew = m.n > 0;
  const headP = m.p[0] ?? 0;
  const trueP = m.p0[0] ?? 0;

  // chart mapping: value 0..1 → design y; 100% at the top edge, 0% at the bottom
  const sy = (v: number): number => CH.yTop - Math.max(0, Math.min(1, v)) * (CH.yTop - CH.yBot);
  const sx = (i: number, len: number): number => CH.x0 + (len <= 1 ? 0 : i / (len - 1)) * (CH.x1 - CH.x0);
  const frame = pxRect(P, CH.x0, CH.yBot, CH.x1, CH.yTop);
  const line = m.samples.map((v, i) => P(sx(i, m.samples.length), sy(v)).join(',')).join(' ');
  const [tx0, ty] = P(CH.x0, sy(trueP));
  const [tx1] = P(CH.x1, sy(trueP));

  return (
    <>
      {/* latest flip */}
      {(() => {
        const [gx, gy] = P(110, 200);
        return m.kind === 1
          ? <DiceGlyph x={gx - 36} y={gy - 36} size={72} value={Math.max(1, m.last + 1)} highlight={drew} />
          : <CoinGlyph cx={gx} cy={gy} r={42} face={m.last === 1 ? 'T' : 'H'} highlight={drew} />;
      })()}
      {(() => { const [x, y] = P(110, 128); return <text x={x} y={y} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--stage-fg)">{m.n.toLocaleString()} draws{m.done ? ' ✓' : ''}</text>; })()}
      {(() => { const [x, y] = P(110, 104); return <text x={x} y={y} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--stage-accent)" style={{ fontVariantNumeric: 'tabular-nums' }}>{labels[0]} {(headP * 100).toFixed(1)}%</text>; })()}

      {/* convergence chart */}
      <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx={8} fill="color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))" stroke="var(--stage-grid)" strokeWidth={1} />
      {/* y ticks */}
      {(() => { const [x, y] = P(CH.x0 - 6, sy(1)); return <text x={x} y={y + 3} textAnchor="end" fontSize={10} fill="var(--stage-muted)">100%</text>; })()}
      {(() => { const [x, y] = P(CH.x0 - 6, sy(0)); return <text x={x} y={y + 9} textAnchor="end" fontSize={10} fill="var(--stage-muted)">0%</text>; })()}
      {/* true-probability line */}
      <line x1={tx0} y1={ty} x2={tx1} y2={ty} stroke="var(--stage-good)" strokeWidth={1.5} strokeDasharray="6 5" />
      {(() => { const [x, y] = P(CH.x1 + 6, sy(trueP)); return <text x={x} y={y + 3} fontSize={11} fontWeight={700} fill="var(--stage-good)">true {(trueP * 100).toFixed(0)}%</text>; })()}
      {/* running estimate */}
      <polyline points={line} fill="none" stroke="var(--stage-accent)" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
      {(() => { const [x, y] = P((CH.x0 + CH.x1) / 2, CH.yBot - 16); return <text x={x} y={y} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">running P({labels[0]}) over {m.n.toLocaleString()} draws → settles on the dashed true line</text>; })()}

      {/* one-line tally of every outcome */}
      {(() => { const [x, y] = P(110, 250); return (
        <text x={x} y={y} textAnchor="middle" fontSize={12} fill="var(--stage-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {m.p.map((pi, i) => `${labels[i] ?? i} ${(pi * 100).toFixed(0)}%`).join('   ')}
        </text>
      ); })()}
    </>
  );
}

export const LLN_ASSET: AssetSpec = { resolver, Component };
