'use client';

/**
 * MagnetismLab, a magnetic field you can SEE and probe (the "magnetism visualized"
 * gap). Drag a bar magnet (and its ends to rotate), or switch to a current-carrying
 * wire, and the FIELD LINES retrace live on the @classytic/stage `field` kernel ,
 * radial dipole lines N→S for the magnet, circular loops for the wire. Drag the
 * compass anywhere and its needle snaps to the field there. Interactive, not a
 * timed sim (no Play needed): the field is recomputed on every drag.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, MovableDot, useCoords, fmt, type Vec2 } from '@classytic/stage';
import { fieldAt, fieldLines, barMagnet, type FieldSource, type Bounds } from '@classytic/stage/field';
import { Field } from '../../kit/frame.js';
import { Segmented } from '../../kit/controls.js';
import { FieldActivity } from '../fields/activity.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

const VIEW: Bounds = { xMin: -6.5, xMax: 6.5, yMin: -4.2, yMax: 4.2 };

const RED = 'var(--stage-danger, #e03131)';
const BLUE = 'var(--stage-accent, #3b82f6)';
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const mag = (v: Vec2): number => Math.hypot(v.x, v.y);

export interface MagnetismProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

/** All the visuals (field lines + magnet/wire + compass needle), projected to px. */
function FieldFigure({
  sources,
  lines,
  mode,
  center,
  northOff,
  compass,
  current,
}: {
  sources: FieldSource[];
  lines: { points: Vec2[]; sign: number }[];
  mode: 'magnet' | 'wire';
  center: Vec2;
  northOff: Vec2;
  compass: Vec2;
  current: number;
}): ReactNode {
  const c = useCoords();
  const P = (v: Vec2): [number, number] => {
    const [x, y] = c.toPx(v.x, v.y);
    return [fmt(x), fmt(y)];
  };

  // a small arrowhead at point b, oriented along a→b
  const arrow = (a: Vec2, b: Vec2, key: string, color: string): ReactNode => {
    const [ax, ay] = P(a),
      [bx, by] = P(b);
    const ang = Math.atan2(by - ay, bx - ax);
    const s = 6;
    const p1 = [bx - s * Math.cos(ang - 0.5), by - s * Math.sin(ang - 0.5)];
    const p2 = [bx - s * Math.cos(ang + 0.5), by - s * Math.sin(ang + 0.5)];
    return (
      <polygon
        key={key}
        points={`${bx},${by} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`}
        fill={color}
        opacity={0.65}
      />
    );
  };

  const lineColor = 'color-mix(in oklab, var(--stage-accent) 70%, transparent)';
  const nPole = { x: center.x + northOff.x, y: center.y + northOff.y };
  const sPole = { x: center.x - northOff.x, y: center.y - northOff.y };
  const [cnx, cny] = P(nPole);
  const [csx, csy] = P(sPole);
  const [ccx, ccy] = P(center);

  // compass needle aligned to the field at the compass position
  const fv = fieldAt(sources, compass);
  const fm = mag(fv) || 1;
  const ndir = { x: fv.x / fm, y: fv.y / fm };
  const nTip = { x: compass.x + ndir.x * 0.85, y: compass.y + ndir.y * 0.85 };
  const nTail = { x: compass.x - ndir.x * 0.85, y: compass.y - ndir.y * 0.85 };

  return (
    <>
      {/* field lines */}
      {lines.map((ln, i) => (
        <g key={`l${i}`}>
          <polyline
            points={ln.points.map((pt) => P(pt).join(',')).join(' ')}
            fill="none"
            stroke={lineColor}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {ln.points.length > 24 &&
            (() => {
              const j = Math.floor(ln.points.length * 0.45);
              // wire loops run CCW for current out (⊙), CW for current in (⊗), flip the arrowhead
              const rev = mode === 'wire' && current < 0;
              return arrow(
                ln.points[rev ? j + 2 : j]!,
                ln.points[rev ? j : j + 2]!,
                `a${i}`,
                'var(--stage-accent)',
              );
            })()}
        </g>
      ))}

      {mode === 'magnet' ? (
        <g>
          {/* bar: S(blue)···center···N(red) */}
          <line x1={csx} y1={csy} x2={ccx} y2={ccy} stroke={BLUE} strokeWidth={16} strokeLinecap="round" />
          <line x1={ccx} y1={ccy} x2={cnx} y2={cny} stroke={RED} strokeWidth={16} strokeLinecap="round" />
          <text x={cnx} y={cny + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill="var(--stage-bg)">
            N
          </text>
          <text x={csx} y={csy + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill="var(--stage-bg)">
            S
          </text>
        </g>
      ) : (
        <g>
          {/* wire ⊥ to the plane: ⊙ = current out, ⊗ = current in */}
          <circle
            cx={ccx}
            cy={ccy}
            r={13}
            fill="var(--stage-bg)"
            stroke="var(--stage-metal)"
            strokeWidth={2.5}
          />
          {current >= 0 ? (
            <circle cx={ccx} cy={ccy} r={3.5} fill="var(--stage-metal)" />
          ) : (
            <g stroke="var(--stage-metal)" strokeWidth={2}>
              <line x1={ccx - 7} y1={ccy - 7} x2={ccx + 7} y2={ccy + 7} />
              <line x1={ccx - 7} y1={ccy + 7} x2={ccx + 7} y2={ccy - 7} />
            </g>
          )}
        </g>
      )}

      {/* compass needle */}
      <g className="physics-svg-passive">
        <circle
          cx={P(compass)[0]}
          cy={P(compass)[1]}
          r={22}
          fill="var(--stage-bg)"
          stroke="var(--stage-fg)"
          strokeWidth={1.5}
        />
        <circle
          cx={P(compass)[0]}
          cy={P(compass)[1]}
          r={18}
          fill="none"
          stroke="var(--stage-grid)"
          strokeWidth={1}
        />
        <text
          x={P(compass)[0]}
          y={P(compass)[1] - 26}
          textAnchor="middle"
          fontSize={9}
          fontWeight={800}
          fill="var(--stage-muted)"
        >
          COMPASS
        </text>
        <line
          x1={P(nTail)[0]}
          y1={P(nTail)[1]}
          x2={P(compass)[0]}
          y2={P(compass)[1]}
          stroke={BLUE}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <line
          x1={P(compass)[0]}
          y1={P(compass)[1]}
          x2={P(nTip)[0]}
          y2={P(nTip)[1]}
          stroke={RED}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle cx={P(compass)[0]} cy={P(compass)[1]} r={3} fill="var(--stage-fg)" />
        <text x={P(nTip)[0]} y={P(nTip)[1] - 5} textAnchor="middle" fontSize={9} fontWeight={800} fill={RED}>
          N
        </text>
      </g>
    </>
  );
}

export function MagnetismLab({
  title = 'Magnetism: field you can see',
  prompt = 'Drag the magnet (and its ends to turn it), or switch to a wire. The compass snaps to the field wherever you drop it.',
  objectives = [
    'Read a magnetic field as field lines',
    'Field lines run N → S; a compass aligns with them',
    'A current makes circular field loops',
  ],
  activity = 'magnetism',
}: MagnetismProps = {}): ReactNode {
  const [mode, setMode] = useState<'magnet' | 'wire'>('magnet');
  const [center, setCenter] = useState<Vec2>({ x: -0.5, y: 0 });
  const [northOff, setNorthOff] = useState<Vec2>({ x: 1.8, y: 0 });
  const [compass, setCompass] = useState<Vec2>({ x: 3.2, y: 1.6 });
  const [current, setCurrent] = useState(1);

  const sources = useMemo<FieldSource[]>(
    () =>
      mode === 'magnet'
        ? barMagnet(center, northOff, 1, 2 * mag(northOff))
        : [{ kind: 'wire', at: center, i: current }],
    [mode, center, northOff, current],
  );
  const lines = useMemo(
    () => fieldLines(sources, { perSource: 16, step: 0.07, maxSteps: 700, bounds: VIEW, seed: 0.35 }),
    [sources],
  );

  const nPole = { x: center.x + northOff.x, y: center.y + northOff.y };
  const compassField = fieldAt(sources, compass);
  const compassStrength = mag(compassField);
  const bearing = ((Math.atan2(compassField.y, compassField.x) * 180) / Math.PI + 360) % 360;
  const direction =
    bearing < 22.5 || bearing >= 337.5
      ? 'east'
      : bearing < 67.5
        ? 'north-east'
        : bearing < 112.5
          ? 'north'
          : bearing < 157.5
            ? 'north-west'
            : bearing < 202.5
              ? 'west'
              : bearing < 247.5
                ? 'south-west'
                : bearing < 292.5
                  ? 'south'
                  : 'south-east';

  const figure = (
    <div className="physics-magnetism-scene">
      <Stage view={VIEW} height={420} ariaLabel={`Magnetic field with compass pointing ${direction}`}>
        <FieldFigure
          sources={sources}
          lines={lines}
          mode={mode}
          center={center}
          northOff={northOff}
          compass={compass}
          current={current}
        />
        <MovableDot
          value={center}
          onMove={(p) => setCenter(p)}
          color="transparent"
          ariaLabel={mode === 'magnet' ? 'move bar magnet' : 'move current-carrying wire'}
          r={18}
        />
        {mode === 'magnet' && (
          <MovableDot
            value={nPole}
            onMove={(p) => setNorthOff(sub(p, center))}
            color="transparent"
            ariaLabel="rotate magnet using its north pole"
            r={15}
          />
        )}
        <MovableDot
          value={compass}
          onMove={(p) => setCompass(p)}
          color="transparent"
          ariaLabel={`move compass, currently pointing ${direction}`}
          r={22}
        />
      </Stage>
    </div>
  );

  const controls = (
    <div className="lab-activity-fields physics-controls">
      <Field label="source">
        <Segmented
          ariaLabel="source"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'magnet', label: 'bar magnet' },
            { value: 'wire', label: 'current wire' },
          ]}
        />
      </Field>
      {mode === 'wire' && (
        <Field label="current">
          <Segmented
            ariaLabel="current"
            value={current >= 0 ? 'out' : 'in'}
            onChange={(v) => setCurrent(v === 'out' ? 1 : -1)}
            options={[
              { value: 'out', label: '⊙ out of screen' },
              { value: 'in', label: '⊗ into screen' },
            ]}
          />
        </Field>
      )}
    </div>
  );

  return (
    <FieldActivity
      className="physics-magnetism"
      activity={activity}
      activityId="magnetism"
      title={title}
      prompt={prompt}
      status={
        <>
          <span>
            {mode === 'magnet'
              ? 'Bar magnet'
              : current >= 0
                ? 'Current out of screen'
                : 'Current into screen'}
          </span>
        </>
      }
      figure={figure}
      evidence={
        <div className="physics-probe">
          <span>Local compass</span>
          <strong>{direction}</strong>
          <small>
            {bearing.toFixed(0)}° · relative strength{' '}
            {compassStrength < 0.08 ? 'weak' : compassStrength < 0.35 ? 'medium' : 'strong'}
          </small>
        </div>
      }
      controls={controls}
      observation={
        mode === 'magnet'
          ? 'Outside the magnet, arrows run from N to S. Move the compass to sample the local direction.'
          : `Circular field arrows reverse when current changes direction. The compass now points ${direction}.`
      }
      objectives={objectives}
      transcript={
        <p>{`The ${mode === 'magnet' ? 'bar magnet' : 'current-carrying wire'} produces a local compass bearing of ${bearing.toFixed(0)} degrees, pointing ${direction}.`}</p>
      }
    />
  );
}
