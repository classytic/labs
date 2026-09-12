'use client';

/**
 * diffusion asset, renders the `particles` sim as two gases in a glass box with a
 * live "mixed" readout. Two populations start apart (a partition, shown as the
 * faint dashed line where it stood); set them loose and they random-walk into a
 * uniform mix, diffusion / the arrow of entropy.
 * Reads px/py/group/box/mixed straight from the sim (sim ≠ render).
 *
 * Drawn with the figure kit. The asset lives inside the stage <Scene> svg, so it
 * cannot mount a <Figure> root of its own: a `g.lab-figure` group carries the
 * art-direction tokens (styles/figure.css) instead and the parts draw in px space.
 */

import type { ReactNode } from 'react';
import { useCoords, type AssetResolveArgs, type AssetSpec, type AssetGeometry } from '@classytic/stage';
import { FigText, Glass, Guide, Particle, HUE, alpha } from '../../kit/figure/index.js';

const numOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const arr = (v: unknown): number[] => (Array.isArray(v) ? (v as number[]) : []);

interface DiffMeta {
  px: number[];
  py: number[];
  group: number[];
  w: number;
  h: number;
  mixed: number;
}

function resolver({ sim, params }: AssetResolveArgs): AssetGeometry {
  const meta: DiffMeta = {
    px: arr(sim?.px),
    py: arr(sim?.py),
    group: arr(sim?.group),
    w: numOr(params?.w, 12),
    h: numOr(params?.h, 6),
    mixed: numOr(sim?.mixed, 0),
  };
  return { kind: 'asset-geom', parts: {}, meta: meta as unknown as Record<string, unknown> };
}

function Component({ geom }: { geom: AssetGeometry }): ReactNode {
  const c = useCoords();
  const m = (geom.meta ?? {}) as unknown as DiffMeta;
  const P = (x: number, y: number): [number, number] => c.toPx(x, y);
  const [bx0, by0] = P(0, 0);
  const [bx1, by1] = P(m.w, m.h);
  const x = Math.min(bx0, bx1),
    y = Math.min(by0, by1);
  const w = Math.abs(bx1 - bx0),
    h = Math.abs(by1 - by0);
  const pct = Math.round(m.mixed * 100);
  const legendY = y + h + 24;

  return (
    <g className="lab-figure" data-fig-domain="chem">
      <Glass x={x} y={y} w={w} h={h} shape="box" rim={false}>
        {/* where the partition stood */}
        <Guide x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} color={alpha(HUE.soft, 55)} />
        {m.px.map((_, i) => {
          const [cx, cy] = P(m.px[i]!, m.py[i]!);
          return <Particle key={i} x={cx} y={cy} r={4.5} color={m.group[i] === 0 ? HUE[1] : HUE[2]} />;
        })}
      </Glass>
      {/* legend under the drawing, left-aligned; the live readout on the right */}
      <Particle x={x + 8} y={legendY} r={5} color={HUE[1]} />
      <FigText x={x + 18} y={legendY} baseline="middle" size="note" tone="soft">
        gas A
      </FigText>
      <Particle x={x + 78} y={legendY} r={5} color={HUE[2]} />
      <FigText x={x + 88} y={legendY} baseline="middle" size="note" tone="soft">
        gas B
      </FigText>
      <FigText x={x + w} y={legendY} anchor="end" baseline="middle" size="measure">
        mixed {pct}%
      </FigText>
    </g>
  );
}

export const DIFFUSION_ASSET: AssetSpec = { resolver, Component };
