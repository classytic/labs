'use client';

/**
 * VectorTypes — a labeled reference figure for the vectors chapter opener:
 * equal, negative, null, unit, parallel, position. These are DEFINITIONAL
 * (no manipulation builds intuition here), so per the engine's video-vs-
 * interactive rule it's a clean figure, not a puzzle. Data-driven: a creator
 * can pass their own panels; the default is the standard CAIE/IGCSE set.
 *
 * Reuses @classytic/stage `Vector`/`Dot`/`Label` — one mini <Stage> per panel.
 */

import { Fragment, type ReactNode } from 'react';
import { Stage, Vector, Dot, Label, type Vec2 } from '@classytic/stage';
import { LabFrame } from '../../kit/frame.js';

interface PanelVec { tail?: Vec2; comp: Vec2; color?: string; label?: string }
export interface TypePanel {
  name: string;
  caption: string;
  vectors?: PanelVec[];
  /** Show a dot at the origin (null vector / position origin O). */
  origin?: boolean;
}
export interface VectorTypesProps {
  types?: TypePanel[];
  title?: string;
}

const A = 'var(--stage-accent)';
const A2 = 'var(--stage-accent-2)';
const G = 'var(--stage-good)';

const DEFAULT_TYPES: TypePanel[] = [
  { name: 'Equal', caption: 'Same magnitude AND direction.', vectors: [{ tail: { x: -1.4, y: 0.7 }, comp: { x: 2, y: 0 }, color: A }, { tail: { x: -1.4, y: -0.8 }, comp: { x: 2, y: 0 }, color: A }] },
  { name: 'Negative (−a)', caption: 'Same magnitude, opposite direction.', vectors: [{ tail: { x: -1.2, y: 0.6 }, comp: { x: 2, y: 0 }, color: A, label: 'a' }, { tail: { x: 1.2, y: -0.7 }, comp: { x: -2, y: 0 }, color: A2, label: '−a' }] },
  { name: 'Null (0)', caption: 'Zero magnitude, no direction.', origin: true },
  { name: 'Unit (â)', caption: 'Magnitude 1 — direction only.', vectors: [{ comp: { x: 1, y: 0 }, color: G, label: 'â' }], origin: true },
  { name: 'Parallel', caption: 'Same direction, any magnitude.', vectors: [{ tail: { x: -1.4, y: 0.7 }, comp: { x: 1.2, y: 0 }, color: A }, { tail: { x: -1.4, y: -0.8 }, comp: { x: 2.6, y: 0 }, color: A }] },
  { name: 'Position (r)', caption: 'From a fixed origin O to a point.', vectors: [{ comp: { x: 1.5, y: 1.1 }, color: A2, label: 'r' }], origin: true },
];

function Panel({ p }: { p: TypePanel }): ReactNode {
  const view = { xMin: -2, xMax: 2, yMin: -1.6, yMax: 1.6 };
  return (
    <div className="lang-typecard">
      <Stage view={view} height={110} preserveAspect ariaLabel={`${p.name}: ${p.caption}`}>
        {p.origin && <Dot x={0} y={0} r={4} color="var(--stage-muted)" />}
        {(p.vectors ?? []).map((v, i) => (
          <Fragment key={i}>
            <Vector tail={v.tail ?? { x: 0, y: 0 }} tip={{ x: (v.tail?.x ?? 0) + v.comp.x, y: (v.tail?.y ?? 0) + v.comp.y }} color={v.color ?? A} weight={3} />
            {v.label && <Label x={(v.tail?.x ?? 0) + v.comp.x} y={(v.tail?.y ?? 0) + v.comp.y} text={v.label} color={v.color ?? A} dx={8} dy={-6} size={13} />}
          </Fragment>
        ))}
      </Stage>
      <p className="lang-typename">{p.name}</p>
      <p className="lang-typecap">{p.caption}</p>
    </div>
  );
}

export function VectorTypesLab({ types = DEFAULT_TYPES, title = 'Types of vectors' }: VectorTypesProps): ReactNode {
  return (
    <LabFrame title={title}>
      <div className="lang-typegrid">
        {types.map((p, i) => <Panel key={i} p={p} />)}
      </div>
    </LabFrame>
  );
}
