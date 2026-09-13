'use client';

/**
 * GaussLab, Gauss's law as a thing you can see: the net number of field lines
 * crossing OUT of a closed surface depends only on the charge it ENCLOSES, not on
 * the surface's size or shape, and not at all on charges outside it.
 *
 * A Gaussian loop (drag its centre, drag the rim to resize) sits in the field of
 * two charges. Around the loop, short markers show which way the field crosses it:
 * GREEN points out (flux leaving), RED points in (flux entering).
 *   • enclose a + charge: every marker points out. Resize the loop: still all out,
 *     the net is unchanged, that is the whole point of Gauss's law.
 *   • a charge OUTSIDE: every line that enters one side leaves the other, so the
 *     greens and reds cancel and the net flux is zero.
 * The readout gives the enclosed charge Q and the net flux Φ = Q/ε₀.
 *
 * Built on the shared stage `field` kernel (same one that draws electric-field
 * and magnetism). Authorable via props + an optional checked question.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, MovableDot, useCoords, fmt, type Vec2 } from '@classytic/stage';
import { fieldAt, fieldLines, type FieldSource, type Bounds } from '@classytic/stage/field';
import { Field } from '../../kit/frame.js';
import { Segmented } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { SceneSurface } from '../mechanics/presentation.js';
import { FieldActivity } from '../fields/activity.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

const VIEW: Bounds = { xMin: -6.5, xMax: 6.5, yMin: -4.1, yMax: 4.1 };
const POS = 'var(--stage-danger, #e03131)';
const NEG = 'var(--stage-accent, #3b82f6)';
const OUT = 'var(--stage-good)';
const IN = 'var(--stage-danger, #e03131)';
const M = 20; // sample markers around the loop

/** The charge glyphs (coloured disc + ± symbol), drawn ON TOP so the handles never hide them. */
function ChargeGlyphs({ charges }: { charges: { at: Vec2; q: number }[] }): ReactNode {
  const c = useCoords();
  return (
    <g className="physics-svg-passive">
      {charges.map((ch, i) => {
        const [x, y] = c.toPx(ch.at.x, ch.at.y);
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={14}
              fill={ch.q > 0 ? POS : NEG}
              stroke="var(--stage-bg)"
              strokeWidth={2}
            />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={18} fontWeight={800} fill="white">
              {ch.q > 0 ? '+' : '−'}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export interface GaussProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string | AuthoredActivity;
  objectives?: string[];
}

function GaussFigure({
  sources,
  lines,
  center,
  radius,
}: {
  sources: FieldSource[];
  lines: { points: Vec2[]; sign: number }[];
  center: Vec2;
  radius: number;
}): ReactNode {
  const c = useCoords();
  // Round pixel coords (fmt → 3dp) so trig-derived marker/field coordinates
  // serialize identically on server + client (no SSR hydration mismatch).
  const P = (v: Vec2): [number, number] => {
    const [x, y] = c.toPx(v.x, v.y);
    return [fmt(x), fmt(y)];
  };
  const [cx, cy] = P(center);
  const rPx = fmt(Math.abs(c.toPx(center.x + radius, center.y)[0] - cx));

  // crossing markers: at each sample on the loop, does the field point out (green) or in (red)?
  const markers: ReactNode[] = [];
  for (let i = 0; i < M; i++) {
    const ang = (2 * Math.PI * i) / M;
    const nhat = { x: Math.cos(ang), y: Math.sin(ang) };
    const p = { x: center.x + radius * nhat.x, y: center.y + radius * nhat.y };
    const E = fieldAt(sources, p);
    const comp = E.x * nhat.x + E.y * nhat.y; // outward component
    const out = comp > 0;
    const L = 0.32; // fixed marker length
    const tip = out
      ? { x: p.x + nhat.x * L, y: p.y + nhat.y * L }
      : { x: p.x - nhat.x * L, y: p.y - nhat.y * L };
    const [px, py] = P(p),
      [tx, ty] = P(tip);
    markers.push(
      <line
        key={`m${i}`}
        x1={px}
        y1={py}
        x2={tx}
        y2={ty}
        stroke={out ? OUT : IN}
        strokeWidth={2.6}
        strokeLinecap="round"
      />,
    );
  }

  return (
    <>
      {/* faint field for context */}
      {lines.map((ln, i) => (
        <polyline
          key={`l${i}`}
          points={ln.points.map((pt) => P(pt).join(',')).join(' ')}
          fill="none"
          stroke="color-mix(in oklab, var(--stage-accent) 28%, transparent)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      ))}
      {/* the Gaussian surface */}
      <circle
        cx={cx}
        cy={cy}
        r={rPx}
        fill="color-mix(in oklab, var(--stage-good) 8%, transparent)"
        stroke="var(--stage-good)"
        strokeWidth={2}
        strokeDasharray="7 5"
      />
      {markers}
    </>
  );
}

export function GaussLab({
  title = 'Gauss’s law: flux depends only on the charge inside',
  prompt = 'Drag the loop and resize it. Green markers are field leaving, red are field entering. The net depends only on the charge enclosed, not the loop’s size.',
  ask,
  height = 380,
  activity = 'gauss-law',
  objectives,
}: GaussProps = {}): ReactNode {
  const [chA, setChA] = useState<Vec2>({ x: -1.3, y: 0 });
  const [chB, setChB] = useState<Vec2>({ x: 4.8, y: 0 });
  const [qa, setQa] = useState(1);
  const [qb, setQb] = useState(1);
  const [center, setCenter] = useState<Vec2>({ x: 0.4, y: 0 });
  const [rim, setRim] = useState<Vec2>({ x: 2.6, y: 0 });

  const radius = Math.max(0.6, Math.hypot(rim.x - center.x, rim.y - center.y));
  const charges = useMemo(
    () => [
      { at: chA, q: qa },
      { at: chB, q: qb },
    ],
    [chA, chB, qa, qb],
  );
  const sources = useMemo<FieldSource[]>(
    () => charges.map((ch) => ({ kind: 'point', at: ch.at, q: ch.q })),
    [charges],
  );
  const lines = useMemo(
    () => fieldLines(sources, { perSource: 12, step: 0.07, maxSteps: 600, bounds: VIEW, seed: 0.4 }),
    [sources],
  );

  const enclosed = charges.filter((ch) => Math.hypot(ch.at.x - center.x, ch.at.y - center.y) < radius);
  const Qenc = enclosed.reduce((s, ch) => s + ch.q, 0);
  const verdict = Qenc > 0 ? 'net flux OUT' : Qenc < 0 ? 'net flux IN' : 'net flux ZERO';

  const figure = (
    <SceneSurface className="physics-gauss-scene" tone="grid">
      <Stage view={VIEW} height={height} ariaLabel={`Gaussian loop enclosing charge ${Qenc}`}>
        <GaussFigure sources={sources} lines={lines} center={center} radius={radius} />
        <MovableDot value={chA} onMove={setChA} color={qa > 0 ? POS : NEG} ariaLabel="charge A" r={8} />
        <MovableDot value={chB} onMove={setChB} color={qb > 0 ? POS : NEG} ariaLabel="charge B" r={8} />
        <MovableDot
          value={center}
          onMove={(p) => {
            const d = { x: rim.x - center.x, y: rim.y - center.y };
            setCenter(p);
            setRim({ x: p.x + d.x, y: p.y + d.y });
          }}
          color="var(--stage-good)"
          ariaLabel="loop centre, drag to move it"
          r={7}
        />
        <MovableDot
          value={rim}
          onMove={setRim}
          color="var(--stage-good)"
          ariaLabel="loop edge, drag to resize"
          r={6}
        />
        <ChargeGlyphs charges={charges} />
      </Stage>
    </SceneSurface>
  );

  const controls = (
    <>
      <Field label="charge A">
        <Segmented
          ariaLabel="charge a"
          value={qa > 0 ? 'pos' : 'neg'}
          onChange={(v) => setQa(v === 'pos' ? 1 : -1)}
          options={[
            { value: 'pos', label: '+' },
            { value: 'neg', label: '−' },
          ]}
        />
      </Field>
      <Field label="charge B">
        <Segmented
          ariaLabel="charge b"
          value={qb > 0 ? 'pos' : 'neg'}
          onChange={(v) => setQb(v === 'pos' ? 1 : -1)}
          options={[
            { value: 'pos', label: '+' },
            { value: 'neg', label: '−' },
          ]}
        />
      </Field>
    </>
  );

  const aside = (
    <>
      <div className="physics-field-ledger">
        <div>
          <span>Charges enclosed</span>
          <strong>{enclosed.length}</strong>
        </div>
        <div>
          <span>Enclosed charge · Q</span>
          <strong>
            {Qenc > 0 ? '+' : ''}
            {Qenc}
          </strong>
        </div>
        <div data-highlight={Qenc !== 0}>
          <span>Flux · Q/ε₀</span>
          <strong className="physics-signed-field" data-sign={Qenc > 0 ? 'out' : Qenc < 0 ? 'in' : 'zero'}>
            {verdict}
          </strong>
        </div>
      </div>
      <p className="physics-explain">
        Resize the loop without crossing a charge: enclosed charge and net flux stay unchanged. An outside
        charge contributes zero net flux.
      </p>
    </>
  );

  const footer = ask ? (
    <LabAsk ask={ask} activity={typeof activity === 'string' ? activity : 'gauss-law'} />
  ) : undefined;

  const reset = (): void => {
    setChA({ x: -1.3, y: 0 });
    setChB({ x: 4.8, y: 0 });
    setQa(1);
    setQb(1);
    setCenter({ x: 0.4, y: 0 });
    setRim({ x: 2.6, y: 0 });
  };
  return (
    <FieldActivity
      className="physics-gauss-law"
      activity={activity}
      activityId="gauss-law"
      title={title}
      prompt={prompt}
      status={
        <>
          <span>{verdict}</span>
          <span>{enclosed.length} enclosed</span>
          <span>
            Q {Qenc > 0 ? '+' : ''}
            {Qenc}
          </span>
          <span>r {radius.toFixed(1)}</span>
        </>
      }
      figure={figure}
      evidence={aside}
      controls={controls}
      observation={
        Qenc === 0
          ? 'Any field entering the closed surface leaves again, so the signed flux cancels to zero.'
          : `The surface encloses net charge ${Qenc > 0 ? '+' : ''}${Qenc}; changing its size without crossing a charge leaves the net flux unchanged.`
      }
      objectives={objectives}
      onReset={reset}
      support={footer}
      transcript={
        <p>{`The Gaussian surface encloses ${enclosed.length} charges with net charge ${Qenc}; its radius is ${radius.toFixed(1)} and the verdict is ${verdict}.`}</p>
      }
    />
  );
}
