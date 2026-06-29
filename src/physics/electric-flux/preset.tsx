'use client';

/**
 * ElectricFluxLab, the concept of flux (Φ) made literal: flux is just HOW MANY
 * field lines thread through your area. A uniform field points to the right as a
 * set of evenly spaced lines (denser = stronger E). Drop a flat "area" into it and
 * the lines that actually pass through it light up green; that count IS the flux.
 *
 *   • rotate the area: edge-on to the field, nothing threads it (Φ = 0); face-on,
 *     the maximum threads it (Φ = E·A). In between, Φ = E·A·cosθ, where θ is the
 *     angle between the area's NORMAL and the field.
 *   • resize the area A: a bigger window catches more lines.
 *   • change the medium (permittivity εr): a dielectric weakens the field to
 *     E = E₀/εr, so there are fewer lines to thread, and Φ falls. This is the
 *     Gauss-law statement Φ = Q/(ε₀εr) seen as line-counting.
 *
 * Built from stage primitives; the analogy (lines through a hoop) is the point,
 * not a timed simulation. Authorable via props + an optional checked question.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Segment, Vector, Label, MovableDot, type Vec2 } from '@classytic/stage';
import { AngleArc } from '../../kit/diagram.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';

export interface ElectricFluxProps {
  /** Field strength in vacuum (arbitrary units). */
  field?: number;
  /** Area (length of the flat window, in scene units). */
  area?: number;
  /** Initial angle between the area's normal and the field, in degrees. */
  angleDeg?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string;
}

const VIEW = { xMin: -6, xMax: 6, yMin: -4, yMax: 4 };
const C_THREAD = 'var(--stage-good)';
const C_FAINT = 'color-mix(in oklab, var(--stage-accent) 35%, transparent)';
const C_AREA = 'var(--stage-accent-2)';
const C_NORMAL = 'var(--stage-fg)';

const MEDIA = [
  { name: 'vacuum', er: 1 },
  { name: 'glass', er: 5 },
  { name: 'water', er: 80 },
];

const fmt = (n: number): string => (Math.abs(n) < 0.05 ? '0' : n.toFixed(1));

export function ElectricFluxLab({
  field = 6, area = 3, angleDeg = 0,
  title = 'Electric flux: how many lines thread the area',
  prompt = 'Rotate the area and resize it. The lines that pass through light up: that count is the flux Φ = E·A·cosθ.',
  ask, height = 420, activity = 'electric-flux',
}: ElectricFluxProps = {}): ReactNode {
  const [E0, setE0] = useState(field);
  const [A, setA] = useState(area);
  const [theta, setTheta] = useState((angleDeg * Math.PI) / 180);
  const [er, setEr] = useState(1);

  const Eeff = E0 / er;                 // field in the medium
  const cos = Math.cos(theta);
  const phi = Eeff * A * cos;           // Φ = E·A·cosθ
  const deg = Math.round((theta * 180) / Math.PI);

  // the area is a flat window centred at C, perpendicular to its normal n(θ)
  const C: Vec2 = { x: 0, y: 0 };
  const n: Vec2 = { x: Math.cos(theta), y: Math.sin(theta) };       // normal
  const dir: Vec2 = { x: -Math.sin(theta), y: Math.cos(theta) };    // along the window
  const p1: Vec2 = { x: C.x + (dir.x * A) / 2, y: C.y + (dir.y * A) / 2 };
  const p2: Vec2 = { x: C.x - (dir.x * A) / 2, y: C.y - (dir.y * A) / 2 };
  const halfSpan = (A / 2) * Math.abs(cos);   // vertical half-extent the window covers

  // uniform field as horizontal lines; density grows with the field strength
  const nLines = Math.max(4, Math.min(40, Math.round(Eeff * 3)));
  const y0 = VIEW.yMin + 0.4, y1 = VIEW.yMax - 0.4;
  const ys = Array.from({ length: nLines }, (_, i) => y0 + ((y1 - y0) * i) / Math.max(1, nLines - 1));
  const threads = ys.filter((y) => Math.abs(y - C.y) <= halfSpan + 1e-6).length;

  const rotTip: Vec2 = { x: C.x + n.x * 2.2, y: C.y + n.y * 2.2 };

  const figure = (
    <Stage view={VIEW} height={height} ariaLabel={`Uniform field with a flat area at ${deg} degrees; ${threads} field lines thread it`}>
      {/* the uniform field: lines threading the area are green, the rest faint */}
      {ys.map((y, i) => {
        const on = Math.abs(y - C.y) <= halfSpan + 1e-6;
        return <Segment key={i} from={{ x: VIEW.xMin, y }} to={{ x: VIEW.xMax, y }} color={on ? C_THREAD : C_FAINT} weight={on ? 2.4 : 1.4} />;
      })}
      {/* a couple of direction arrows so "the field points right" reads */}
      <Vector tail={{ x: 3.6, y: y1 - 0.2 }} tip={{ x: 4.7, y: y1 - 0.2 }} color="var(--stage-accent)" />
      <Label x={4.9} y={y1 - 0.2} text="E" color="var(--stage-accent)" size={13} anchor="start" />

      {/* the area (a flat window seen edge-on), labelled, with its normal + the angle θ */}
      <Segment from={p1} to={p2} color={C_AREA} weight={7} />
      <Label x={p1.x} y={p1.y} text="area A" color={C_AREA} size={12} weight={700} dx={8} dy={-4} anchor="start" />
      <Vector tail={C} tip={{ x: C.x + n.x * 1.5, y: C.y + n.y * 1.5 }} color={C_NORMAL} />
      <AngleArc at={C} from={{ x: 1, y: 0 }} to={n} rPx={38} label={`θ=${Math.abs(deg)}°`} />

      {/* rotate handle, sits out at the normal's tip so it stays clear of the centre */}
      <MovableDot value={rotTip} onMove={(p) => setTheta(Math.atan2(p.y - C.y, p.x - C.x))} color="var(--stage-accent)" ariaLabel="rotate the area" r={7} />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <Field label="field E₀" value={fmt(E0)}>
        <Slider value={E0} min={1} max={12} step={1} onChange={setE0} ariaLabel="field strength" />
      </Field>
      <Field label="area A" value={fmt(A)}>
        <Slider value={A} min={1} max={6} step={0.5} onChange={setA} ariaLabel="area size" />
      </Field>
      <Field label="angle θ" value={`${Math.abs(deg)}°`}>
        <Slider value={deg} min={-90} max={90} step={5} onChange={(v) => setTheta((v * Math.PI) / 180)} ariaLabel="angle of the area" />
      </Field>
      <Field label="medium">
        <span className="lab-field-row">
          {MEDIA.map((m) => (
            <Chip key={m.name} selected={er === m.er} onClick={() => setEr(m.er)}>{m.name}</Chip>
          ))}
        </span>
      </Field>
    </ControlBar>
  );

  const aside = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        <span>lines threading the area: <strong style={{ color: C_THREAD }}>{threads}</strong></span>
        <span>E = E₀/εr = <strong>{fmt(Eeff)}</strong> {er > 1 ? `(÷${er} in ${MEDIA.find((m) => m.er === er)?.name})` : ''}</span>
        <span>Φ = E·A·cosθ = <strong>{fmt(phi)}</strong></span>
        <span style={{ color: 'var(--stage-muted)' }}>{Math.abs(deg) >= 88 ? 'edge-on: nothing threads it, Φ = 0' : Math.abs(deg) < 2 ? 'face-on: maximum flux, Φ = E·A' : 'tilted: Φ falls with cosθ'}</span>
      </div>
    </Callout>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{figure}</LabFrame>;
}
