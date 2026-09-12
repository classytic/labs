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
import { Activity } from '../../kit/activity.js';

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
    <Stage
      view={{ xMin: -8, xMax: 8, yMin: -5, yMax: 7 }}
      height={height}
      ariaLabel="Drag the vertex to graph the parabola"
    >
      <Grid />
      <Axes labels />
      <Plot.OfX y={y} color="var(--stage-accent)" weight={3} />
      <Tex x={3.5} y={6} tex={equationTex(a, h, k)} size={18} />
      <MovableDot
        value={vertex}
        onMove={(p) => setVertex({ x: Math.round(p.x), y: Math.round(p.y) })}
        snap={1}
        color="var(--stage-good)"
        ariaLabel="parabola vertex"
      />
    </Stage>
  );

  const guidance = (
    <p className="lab-prompt">
      Drag the <strong>vertex</strong>, the curve and the equation update. Vertex form{' '}
      <TexHtml tex="y = a(x-h)^2 + k" />.
    </p>
  );

  const equation = equationTex(a, h, k);
  return (
    <Activity.Root>
      <Activity.Header>
        <Activity.Heading
          eyebrow="Coordinate geometry"
          title="Vertex-form parabola"
          description="Drag the vertex to translate the curve and connect its position to vertex form."
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          Vertex ({h}, {k})
        </strong>
        <span>{equation}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive parabola graph">{figure}</Activity.Canvas>
        <Activity.Inspector label="Vertex-form guidance">{guidance}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>The vertex is (h, k); changing it translates the graph without changing its shape.</div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        The parabola vertex is {h}, {k}. Equation {equation}.
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>Explore vertex form</strong>
          <span>
            vertex ({h}, {k})
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
