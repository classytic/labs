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
import { Stage, MovableDot, useCoords, type Vec2 } from '@classytic/stage';
import { fieldAt, fieldLines, barMagnet, type FieldSource, type Bounds } from '@classytic/stage/field';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { Chip } from '../../kit/controls.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

const VIEW: Bounds = { xMin: -6.5, xMax: 6.5, yMin: -4.2, yMax: 4.2 };

const MAGNETISM_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'lines',
    prompt: 'Outside a bar magnet, the field lines point…',
    choices: [
      { value: 'ns', label: 'from N to S' },
      { value: 'sn', label: 'from S to N' },
    ],
    answer: 'ns',
    explain: 'Outside the magnet field lines run N → S (they close back through the magnet, S → N, inside).',
  },
  {
    id: 'compass',
    prompt: 'Drop the compass into the field. Its needle…',
    choices: [
      { value: 'along', label: 'lines up along the field there' },
      { value: 'perp', label: 'sits across the field' },
      { value: 'north', label: 'always points to true N' },
    ],
    answer: 'along',
    explain: 'A compass needle aligns to the LOCAL field, tracing the field line wherever you drop it.',
  },
];
const RED = 'var(--stage-danger, #e03131)';
const BLUE = 'var(--stage-accent, #3b82f6)';
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const mag = (v: Vec2): number => Math.hypot(v.x, v.y);

export interface MagnetismProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
}

/** All the visuals (field lines + magnet/wire + compass needle), projected to px. */
function FieldFigure({ sources, lines, mode, center, northOff, compass, current }: {
  sources: FieldSource[];
  lines: { points: Vec2[]; sign: number }[];
  mode: 'magnet' | 'wire';
  center: Vec2;
  northOff: Vec2;
  compass: Vec2;
  current: number;
}): ReactNode {
  const c = useCoords();
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);

  // a small arrowhead at point b, oriented along a→b
  const arrow = (a: Vec2, b: Vec2, key: string, color: string): ReactNode => {
    const [ax, ay] = P(a), [bx, by] = P(b);
    const ang = Math.atan2(by - ay, bx - ax);
    const s = 6;
    const p1 = [bx - s * Math.cos(ang - 0.5), by - s * Math.sin(ang - 0.5)];
    const p2 = [bx - s * Math.cos(ang + 0.5), by - s * Math.sin(ang + 0.5)];
    return <polygon key={key} points={`${bx},${by} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={color} opacity={0.65} />;
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
          <polyline points={ln.points.map((pt) => P(pt).join(',')).join(' ')} fill="none" stroke={lineColor} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
          {ln.points.length > 24 && (() => {
            const j = Math.floor(ln.points.length * 0.45);
            // wire loops run CCW for current out (⊙), CW for current in (⊗), flip the arrowhead
            const rev = mode === 'wire' && current < 0;
            return arrow(ln.points[rev ? j + 2 : j]!, ln.points[rev ? j : j + 2]!, `a${i}`, 'var(--stage-accent)');
          })()}
        </g>
      ))}

      {mode === 'magnet' ? (
        <g>
          {/* bar: S(blue)···center···N(red) */}
          <line x1={csx} y1={csy} x2={ccx} y2={ccy} stroke={BLUE} strokeWidth={16} strokeLinecap="round" />
          <line x1={ccx} y1={ccy} x2={cnx} y2={cny} stroke={RED} strokeWidth={16} strokeLinecap="round" />
          <text x={cnx} y={cny + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill="white">N</text>
          <text x={csx} y={csy + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill="white">S</text>
        </g>
      ) : (
        <g>
          {/* wire ⊥ to the plane: ⊙ = current out, ⊗ = current in */}
          <circle cx={ccx} cy={ccy} r={13} fill="var(--stage-bg)" stroke="var(--stage-metal)" strokeWidth={2.5} />
          {current >= 0
            ? <circle cx={ccx} cy={ccy} r={3.5} fill="var(--stage-metal)" />
            : <g stroke="var(--stage-metal)" strokeWidth={2}><line x1={ccx - 7} y1={ccy - 7} x2={ccx + 7} y2={ccy + 7} /><line x1={ccx - 7} y1={ccy + 7} x2={ccx + 7} y2={ccy - 7} /></g>}
        </g>
      )}

      {/* compass needle */}
      <g style={{ pointerEvents: 'none' }}>
        <line x1={P(nTail)[0]} y1={P(nTail)[1]} x2={P(nTip)[0]} y2={P(nTip)[1]} stroke="var(--stage-metal)" strokeWidth={3} strokeLinecap="round" />
        <line x1={ccx} y1={ccy} x2={P(nTip)[0]} y2={P(nTip)[1]} stroke={RED} strokeWidth={3} strokeLinecap="round" opacity={0} />
        {arrow(compass, nTip, 'compassN', RED)}
      </g>
    </>
  );
}

export function MagnetismLab({
  title = 'Magnetism: field you can see',
  prompt = 'Drag the magnet (and its ends to turn it), or switch to a wire. The compass snaps to the field wherever you drop it.',
  objectives = ['Read a magnetic field as field lines', 'Field lines run N → S; a compass aligns with them', 'A current makes circular field loops'],
}: MagnetismProps = {}): ReactNode {
  const [mode, setMode] = useState<'magnet' | 'wire'>('magnet');
  const [center, setCenter] = useState<Vec2>({ x: -0.5, y: 0 });
  const [northOff, setNorthOff] = useState<Vec2>({ x: 1.8, y: 0 });
  const [compass, setCompass] = useState<Vec2>({ x: 3.2, y: 1.6 });
  const [current, setCurrent] = useState(1);

  const challenge = useChallenge(MAGNETISM_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'magnetism' });

  const sources = useMemo<FieldSource[]>(
    () => (mode === 'magnet' ? barMagnet(center, northOff, 1, 2 * mag(northOff)) : [{ kind: 'wire', at: center, i: current }]),
    [mode, center, northOff, current],
  );
  const lines = useMemo(
    () => fieldLines(sources, { perSource: 16, step: 0.07, maxSteps: 700, bounds: VIEW, seed: 0.35 }),
    [sources],
  );

  const nPole = { x: center.x + northOff.x, y: center.y + northOff.y };

  const figure = (
    <Stage view={VIEW} height={420} ariaLabel="Magnetic field lines with a draggable magnet and compass">
      <FieldFigure sources={sources} lines={lines} mode={mode} center={center} northOff={northOff} compass={compass} current={current} />
      <MovableDot value={center} onMove={(p) => setCenter(p)} ariaLabel={mode === 'magnet' ? 'magnet position' : 'wire position'} r={9} />
      {mode === 'magnet' && <MovableDot value={nPole} onMove={(p) => setNorthOff(sub(p, center))} color={RED} ariaLabel="magnet orientation (north pole)" r={8} />}
      <MovableDot value={compass} onMove={(p) => setCompass(p)} color="var(--stage-good)" ariaLabel="compass" r={8} />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <Field label="source">
        <span className="lab-field-row">
          <Chip selected={mode === 'magnet'} onClick={() => setMode('magnet')}>bar magnet</Chip>
          <Chip selected={mode === 'wire'} onClick={() => setMode('wire')}>current wire</Chip>
        </span>
      </Field>
      {mode === 'wire' && (
        <Field label="current">
          <span className="lab-field-row">
            <Chip selected={current >= 0} onClick={() => setCurrent(1)}>⊙ out</Chip>
            <Chip selected={current < 0} onClick={() => setCurrent(-1)}>⊗ in</Chip>
          </span>
        </Field>
      )}
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={<ChallengeCard questions={MAGNETISM_CHALLENGE} state={challenge} title="Predict" />}>{figure}</LabFrame>;
}
