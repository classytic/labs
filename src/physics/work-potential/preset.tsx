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
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Stage, Circle, Segment, Label, MovableDot, useCoords, type Vec2 } from '@classytic/stage';
import { potentialAt, type FieldSource } from '@classytic/stage/field';
import { Field } from '../../kit/frame.js';
import { Segmented } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { MechanicsActivity } from '../mechanics/activity.js';
import { ResetTransport, SceneSurface } from '../mechanics/presentation.js';

const VIEW = { xMin: -6, xMax: 6, yMin: -4, yMax: 4 };
const POS = 'var(--stage-danger, #e03131)';
const NEG = 'var(--stage-accent, #3b82f6)';
const RING = 'color-mix(in oklab, var(--stage-accent) 45%, transparent)';
const A_COL = 'var(--stage-good)';
const B_COL = 'var(--stage-accent-2)';
const RING_R = [1, 1.6, 2.5, 3.6];

export interface WorkPotentialProps {
  /** Source charge Q (sign + magnitude); rings + potentials scale with it. */
  charge?: number;
  /** The moving test charge q, so W = q·ΔV uses the author's value. */
  movingCharge?: number;
  /** Starting positions of the two draggable points and the source. */
  a?: Vec2;
  b?: Vec2;
  sourceAt?: Vec2;
  /** Equipotential ring radii (world units). */
  rings?: number[];
  /** Fix the source so the learner can only move A and B. */
  lockSource?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  ask?: LabAskSpec;
  height?: number;
  activity?: string | AuthoredActivity;
}

const fmt = (n: number): string => (Math.abs(n) < 0.005 ? '0' : n.toFixed(2));

/** The source-charge glyph (disc + ± symbol), drawn ON TOP so the handle never hides it. */
function SourceGlyph({ at, q }: { at: Vec2; q: number }): ReactNode {
  const c = useCoords();
  const [x, y] = c.toPx(at.x, at.y);
  return (
    <g className="physics-svg-passive">
      <circle cx={x} cy={y} r={13} fill={q > 0 ? POS : NEG} stroke="var(--stage-bg)" strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={17} fontWeight={800} fill="white">
        {q > 0 ? '+' : '−'}
      </text>
    </g>
  );
}

export function WorkPotentialLab({
  charge = 1,
  movingCharge = 1,
  a = { x: -3, y: 1.6 },
  b = { x: 2.6, y: -1 },
  sourceAt = { x: 0, y: 0 },
  rings = RING_R,
  lockSource = false,
  title = 'Potential & work: equipotentials and W = qΔV',
  prompt = 'Drag A and B. The work to move a charge from A to B is W = qΔV, the change in potential. Slide a point around a ring and the work is zero.',
  objectives,
  ask,
  height = 420,
  activity = 'work-potential',
}: WorkPotentialProps = {}): ReactNode {
  const [source, setSource] = useState<Vec2>(sourceAt);
  const Qmag = Math.abs(charge) || 1;
  const [Q, setQ] = useState(charge);
  const [A, setA] = useState<Vec2>(a);
  const [B, setB] = useState<Vec2>(b);
  const qMag = Math.abs(movingCharge) || 1;
  const [qSign, setQSign] = useState(movingCharge < 0 ? -1 : 1);

  // potential from the shared field core (V = Σ kq/r), not hand-rolled per lab
  const sources: FieldSource[] = [{ kind: 'point', at: source, q: Q }];
  const V = (p: Vec2): number => potentialAt(sources, p);

  const Va = V(A),
    Vb = V(B);
  const dV = Va - Vb;
  const W = qSign * qMag * dV; // work done BY the field on charge q, A → B
  const sameRing = Math.abs(dV) < 0.02;

  // 8 radial field lines (perpendicular to the rings)
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    return {
      from: { x: source.x + d.x * 0.4, y: source.y + d.y * 0.4 },
      to: { x: source.x + d.x * 5.5, y: source.y + d.y * 5.5 },
    };
  });

  const figure = (
    <SceneSurface className="physics-work-potential-scene" tone="grid">
      <Stage
        view={VIEW}
        height={height}
        preserveAspect
        ariaLabel="Equipotential rings around a charge, with two draggable points and the work between them"
      >
        {/* field lines: straight out, ⊥ to the rings */}
        {rays.map((r, i) => (
          <Segment
            key={`r${i}`}
            from={r.from}
            to={r.to}
            color="color-mix(in oklab, var(--stage-accent) 22%, transparent)"
            weight={1.2}
          />
        ))}
        {/* Values belong in the readout. Keeping the rings unlabelled preserves the
            contour-map idea without placing four pieces of copy over the model. */}
        {rings.map((r, i) => (
          <Circle key={`ring${i}`} center={source} r={r} color={RING} fill="none" weight={1.6} dashed />
        ))}
        <Label
          x={VIEW.xMin + 0.45}
          y={VIEW.yMax - 0.55}
          text="each ring = one potential"
          color="var(--stage-muted)"
          size={11}
          weight={650}
          anchor="start"
        />
        {/* the displacement A → B */}
        <Segment from={A} to={B} color="var(--stage-muted)" weight={1.6} dashed />
        {/* A and B labels */}
        <Label
          x={A.x}
          y={A.y}
          text="A"
          color={A_COL}
          size={12}
          weight={700}
          dx={10}
          dy={-8}
          anchor="start"
        />
        <Label
          x={B.x}
          y={B.y}
          text="B"
          color={B_COL}
          size={12}
          weight={700}
          dx={10}
          dy={-8}
          anchor="start"
        />
        {!lockSource && (
          <MovableDot
            value={source}
            onMove={setSource}
            color={Q > 0 ? POS : NEG}
            ariaLabel="source charge"
            r={8}
          />
        )}
        <MovableDot value={A} onMove={setA} color={A_COL} ariaLabel="point A, drag it" r={7} />
        <MovableDot value={B} onMove={setB} color={B_COL} ariaLabel="point B, drag it" r={7} />
        <SourceGlyph at={source} q={Q} />
      </Stage>
    </SceneSurface>
  );

  const controls = (
    <>
      <Field label="source charge" name="source">
        <Segmented
          ariaLabel="source charge"
          value={Q > 0 ? 'pos' : 'neg'}
          onChange={(next) => setQ(next === 'pos' ? Qmag : -Qmag)}
          options={[
            { value: 'pos', label: '+' },
            { value: 'neg', label: '−' },
          ]}
        />
      </Field>
      <Field label="moving charge q" name="moving">
        <Segmented
          ariaLabel="moving charge q"
          value={qSign > 0 ? 'pos' : 'neg'}
          onChange={(next) => setQSign(next === 'pos' ? 1 : -1)}
          options={[
            { value: 'pos', label: '+' },
            { value: 'neg', label: '−' },
          ]}
        />
      </Field>
    </>
  );

  const instruments = (
    <>
      <div className="physics-probe physics-work-potential-probe">
        <span>Endpoint potential</span>
        <strong>ΔV {fmt(dV)}</strong>
        <small>
          A {fmt(Va)} · B {fmt(Vb)}
        </small>
      </div>
      <div className="physics-probe">
        <span>Work by the field</span>
        <strong>W = {fmt(W)}</strong>
        <small>qΔV · endpoint dependent</small>
      </div>
      <p className="physics-explain">
        {sameRing
          ? 'A and B are on the same equipotential: ΔV is zero, so the field does no work.'
          : 'Move either endpoint. The imagined path can change, but work depends only on the two endpoint potentials.'}
      </p>
    </>
  );

  const footer = ask ? (
    <LabAsk ask={ask} activity={typeof activity === 'string' ? activity : 'work-potential'} />
  ) : undefined;
  const reset = (): void => {
    setSource(sourceAt);
    setQ(charge);
    setA(a);
    setB(b);
    setQSign(movingCharge < 0 ? -1 : 1);
  };

  return (
    <MechanicsActivity
      activity={activity}
      className="physics-work-potential"
      eyebrow="Fields and energy"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>
            {sameRing
              ? 'Same equipotential'
              : W > 0
                ? 'Field does positive work'
                : W < 0
                  ? 'Work against the field'
                  : 'Zero work'}
          </strong>
          <span>ΔV {fmt(dV)}</span>
          <span>W {fmt(W)}</span>
        </>
      }
      figure={figure}
      instruments={instruments}
      controls={controls}
      feedback={
        sameRing
          ? 'Sliding along an equipotential changes position without changing electric potential energy.'
          : 'The potential difference fixes the work; the route between A and B does not enter W = qΔV.'
      }
      objectives={objectives}
      transport={
        <ResetTransport
          onReset={reset}
          state="Drag A or B"
          detail={`q ${qSign > 0 ? '+' : '−'} · Q ${Q > 0 ? '+' : '−'}`}
          resetLabel="Reset potential experiment"
        />
      }
      footer={footer}
      canvasLabel="Equipotential rings with draggable endpoints"
      inspectorLabel="Potential difference, work, and charge controls"
    />
  );
}
