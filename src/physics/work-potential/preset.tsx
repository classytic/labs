'use client';

/**
 * WorkPotentialLab, electric potential and the work to move a charge, made
 * visible through EQUIPOTENTIALS. A source charge sets up a potential V = kQ/r;
 * the dashed rings join points at the SAME potential (like contour lines on a map).
 * Field lines run straight out, always at right angles to the rings.
 *
 * Drag the two points A and B. The work the field does on a test charge q moving
 * A → B is W = q(V_A − V_B), and it depends ONLY on the endpoints, never the path:
 *   • move B around a ring (same V): ΔV = 0, so W = 0, no work along an equipotential.
 *   • move B to a different ring: W = qΔV, whatever route you imagine taking.
 *
 * V is computed from the shared field model (V = Σ kq/r). Authorable via props +
 * an optional checked question.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Circle, Segment, Label, MovableDot, useCoords, type Vec2 } from '@classytic/stage';
import { potentialAt, type FieldSource } from '@classytic/stage/field';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';

const VIEW = { xMin: -6, xMax: 6, yMin: -4, yMax: 4 };
const POS = 'var(--stage-danger, #e03131)';
const NEG = 'var(--stage-accent, #3b82f6)';
const RING = 'color-mix(in oklab, var(--stage-accent) 45%, transparent)';
const A_COL = 'var(--stage-good)';
const B_COL = 'var(--stage-accent-2)';
const RING_R = [1, 1.6, 2.5, 3.6];

export interface WorkPotentialProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string;
}

const fmt = (n: number): string => (Math.abs(n) < 0.005 ? '0' : n.toFixed(2));

/** The source-charge glyph (disc + ± symbol), drawn ON TOP so the handle never hides it. */
function SourceGlyph({ at, q }: { at: Vec2; q: number }): ReactNode {
  const c = useCoords();
  const [x, y] = c.toPx(at.x, at.y);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={x} cy={y} r={13} fill={q > 0 ? POS : NEG} stroke="var(--stage-bg)" strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={17} fontWeight={800} fill="white">{q > 0 ? '+' : '−'}</text>
    </g>
  );
}

export function WorkPotentialLab({
  title = 'Potential & work: equipotentials and W = qΔV',
  prompt = 'Drag A and B. The work to move a charge from A to B is W = qΔV, the change in potential. Slide a point around a ring and the work is zero.',
  ask, height = 420, activity = 'work-potential',
}: WorkPotentialProps = {}): ReactNode {
  const [source, setSource] = useState<Vec2>({ x: 0, y: 0 });
  const [Q, setQ] = useState(1);
  const [A, setA] = useState<Vec2>({ x: -3, y: 1.6 });
  const [B, setB] = useState<Vec2>({ x: 2.6, y: -1 });
  const [qSign, setQSign] = useState(1);

  // potential from the shared field core (V = Σ kq/r), not hand-rolled per lab
  const sources: FieldSource[] = [{ kind: 'point', at: source, q: Q }];
  const V = (p: Vec2): number => potentialAt(sources, p);

  const Va = V(A), Vb = V(B);
  const dV = Va - Vb;
  const W = qSign * dV;                 // work done BY the field on charge q, A → B
  const sameRing = Math.abs(dV) < 0.02;

  // 8 radial field lines (perpendicular to the rings)
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    return { from: { x: source.x + d.x * 0.4, y: source.y + d.y * 0.4 }, to: { x: source.x + d.x * 5.5, y: source.y + d.y * 5.5 } };
  });

  const figure = (
    <Stage view={VIEW} height={height} preserveAspect ariaLabel="Equipotential rings around a charge, with two draggable points and the work between them">
      {/* field lines: straight out, ⊥ to the rings */}
      {rays.map((r, i) => <Segment key={`r${i}`} from={r.from} to={r.to} color="color-mix(in oklab, var(--stage-accent) 22%, transparent)" weight={1.2} />)}
      {/* equipotential rings, labels set on a clear diagonal (away from A, B and the axes) */}
      {RING_R.map((r, i) => (
        <g key={`ring${i}`}>
          <Circle center={source} r={r} color={RING} fill="none" weight={1.6} dashed />
          <Label x={source.x + r * 0.82} y={source.y + r * 0.57} text={`V=${fmt(Q / r)}`} color={RING} size={10} dx={2} />
        </g>
      ))}
      {/* the displacement A → B */}
      <Segment from={A} to={B} color="var(--stage-muted)" weight={1.6} dashed />
      {/* A and B labels */}
      <Label x={A.x} y={A.y} text={`A · V=${fmt(Va)}`} color={A_COL} size={12} weight={700} dx={10} dy={-8} anchor="start" />
      <Label x={B.x} y={B.y} text={`B · V=${fmt(Vb)}`} color={B_COL} size={12} weight={700} dx={10} dy={-8} anchor="start" />
      <MovableDot value={source} onMove={setSource} color={Q > 0 ? POS : NEG} ariaLabel="source charge" r={8} />
      <MovableDot value={A} onMove={setA} color={A_COL} ariaLabel="point A, drag it" r={7} />
      <MovableDot value={B} onMove={setB} color={B_COL} ariaLabel="point B, drag it" r={7} />
      <SourceGlyph at={source} q={Q} />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <Field label="source charge">
        <span className="lab-field-row">
          <Chip selected={Q > 0} onClick={() => setQ(1)}>+</Chip>
          <Chip selected={Q < 0} onClick={() => setQ(-1)}>−</Chip>
        </span>
      </Field>
      <Field label="moving charge q">
        <span className="lab-field-row">
          <Chip selected={qSign > 0} onClick={() => setQSign(1)}>+</Chip>
          <Chip selected={qSign < 0} onClick={() => setQSign(-1)}>−</Chip>
        </span>
      </Field>
    </ControlBar>
  );

  const aside = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        <span style={{ color: A_COL }}>V<sub>A</sub> = <strong>{fmt(Va)}</strong></span>
        <span style={{ color: B_COL }}>V<sub>B</sub> = <strong>{fmt(Vb)}</strong></span>
        <span>ΔV = V<sub>A</sub> − V<sub>B</sub> = <strong>{fmt(dV)}</strong></span>
        <span>W = q·ΔV = <strong>{fmt(W)}</strong></span>
        <span style={{ color: 'var(--stage-muted)' }}>{sameRing ? 'A and B on the same ring: ΔV = 0, so no work.' : 'W depends only on the endpoints, not the path.'}</span>
      </div>
    </Callout>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{figure}</LabFrame>;
}
