'use client';

/**
 * Vertex-form parabola, drag the vertex (h,k); the curve y = a(x−h)²+k and its
 * equation update live. A direct composition of @classytic/stage primitives
 * (Plot + a draggable handle + KaTeX), no scene DAG needed, shows the
 * primitives are usable on their own, not only through <Scene>.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Plot, Tex, MovableDot, type Vec2 } from '@classytic/stage';
import { Tex as TexHtml } from '../../core/tex.js';
import { LabFrame } from '../../kit/frame.js';

export interface ParabolaProps {
  a?: number;
  height?: number;
}

function equationTex(a: number, h: number, k: number): string {
  const inner = h === 0 ? 'x' : `x ${h < 0 ? '+' : '-'} ${Math.abs(h)}`;
  const sq = `\\left(${inner}\\right)^2`;
  const lead = a === 1 ? sq : `${a}${sq}`;
  const tail = k === 0 ? '' : ` ${k < 0 ? '-' : '+'} ${Math.abs(k)}`;
  return `y = ${lead}${tail}`;
}

export function VertexParabolaLab({ a = 1, height = 380 }: ParabolaProps): ReactNode {
  const [vertex, setVertex] = useState<Vec2>({ x: -4, y: -3 });
  const h = vertex.x;
  const k = vertex.y;
  const y = (x: number): number => a * (x - h) * (x - h) + k;

  const figure = (
    <Stage view={{ xMin: -8, xMax: 8, yMin: -5, yMax: 7 }} height={height} ariaLabel="Drag the vertex to graph the parabola">
      <Grid />
      <Axes />
      <Plot.OfX y={y} color="var(--stage-accent)" weight={3} />
      <Tex x={3.5} y={6} tex={equationTex(a, h, k)} size={18} />
      <MovableDot value={vertex} onMove={(p) => setVertex({ x: Math.round(p.x), y: Math.round(p.y) })} snap={1} color="var(--stage-good)" ariaLabel="parabola vertex" />
    </Stage>
  );

  const footer = (
    <p className="lab-prompt">
      Drag the <strong>vertex</strong>, the curve and the equation update. Vertex form <TexHtml tex="y = a(x-h)^2 + k" />.
    </p>
  );

  return <LabFrame title="Vertex-form parabola" footer={footer}>{figure}</LabFrame>;
}
