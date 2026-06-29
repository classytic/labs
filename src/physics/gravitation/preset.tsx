'use client';

/**
 * GravitationLab, "Inverse-square", how gravity fades with distance.
 *
 * Newton's law of universal gravitation: F = G·M·m / r². Drag the satellite and
 * the pull on it tracks 1/r², DOUBLE the distance and the force drops to a
 * QUARTER (not a half), the defining surprise of an inverse-square law. The same
 * rule is why weight shrinks with altitude (g = GM/r²). A live F-vs-r curve marks
 * where you are on the steep 1/r² fall-off.
 *
 * Interactive (drag the satellite), no timed loop. Tokenized SVG.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Circle, Dot, Segment, Vector, Label, MovableDot, Polyline, type Vec2 } from '@classytic/stage';
import { EarthGlyph, SatelliteGlyph } from '../../kit/space.js';
import { Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

const GRAVITATION_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'double-r',
    prompt: 'Double the distance between two masses, the gravitational force becomes…',
    choices: [
      { value: 'quarter', label: 'one-quarter' },
      { value: 'half', label: 'one-half' },
      { value: 'double', label: 'twice as strong' },
    ],
    answer: 'quarter',
    explain: 'Force goes as 1/r², so doubling r divides the pull by 2² = 4.',
  },
  {
    id: 'altitude',
    prompt: 'Why does your weight shrink as you climb higher above the Earth?',
    choices: [
      { value: 'farther', label: 'you are farther from the centre, so g = GM/r² falls' },
      { value: 'lighter-air', label: 'the air is thinner up there' },
      { value: 'mass', label: 'your mass decreases' },
    ],
    answer: 'farther',
    explain: 'The same inverse-square law: g = GM/r² weakens as r grows; your mass is unchanged.',
  },
];

export interface GravitationProps {
  /** Planet mass (relative units). */
  planetMass?: number;
  satMass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['planet mass M'] }`. */
  controlConfig?: ControlConfig;
}

const R_MIN = 2.4, R_MAX = 9;
const K_BASE = 60;     // G in drawn units (F = K·M·m / r²)

export function GravitationLab({
  planetMass = 5, satMass = 1,
  title = 'Inverse-square gravity: double the distance, quarter the pull',
  prompt = 'Newton’s law: F = G·M·m / r². Drag the satellite in and out, the pull follows 1/r², so moving twice as far drops the force to a quarter, not a half. It’s the same law that thins your weight with altitude (g = GM/r²).',
  objectives,
  controlConfig,
}: GravitationProps): ReactNode {
  const [M, setM] = useState(planetMass);
  const [m, setm] = useState(satMass);
  const [sat, setSat] = useState<Vec2>({ x: 4, y: 2.2 });

  const challenge = useChallenge(GRAVITATION_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'gravitation' });

  const r = Math.hypot(sat.x, sat.y);
  const K = K_BASE * M * m;
  const F = K / (r * r);
  const dirToStar = { x: -sat.x / r, y: -sat.y / r };

  const onMove = (p: Vec2): void => {
    const rr = clamp(Math.hypot(p.x, p.y), R_MIN, R_MAX);
    const ang = Math.atan2(p.y, p.x);
    setSat({ x: rr * Math.cos(ang), y: rr * Math.sin(ang) });
  };

  // force arrow length: gentle scaling so it stays readable across the range
  const arrowLen = clamp(F * 0.02, 0.5, 4.5);
  const view = { xMin: -R_MAX - 1, xMax: R_MAX + 1, yMin: -R_MAX - 1, yMax: R_MAX + 1 };

  // F-vs-r curve
  const curve: Vec2[] = [];
  for (let i = 0; i <= 80; i++) { const rr = R_MIN + (i / 80) * (R_MAX - R_MIN); curve.push({ x: rr, y: K / (rr * rr) }); }
  const Fmax = K / (R_MIN * R_MIN);

  const figure = (
    <div className="lab-playwrap">
      <Stage view={view} height={300} preserveAspect ariaLabel={`Satellite at distance ${r.toFixed(1)}, gravitational pull ${F.toFixed(1)}`}>
        {/* distance rings (powers of the radius) */}
        {[3, 6, 9].map((rr) => <Circle key={rr} center={{ x: 0, y: 0 }} r={rr} color="var(--stage-fg)" opacity={0.12} weight={1} fill="none" />)}
        {/* line of sight */}
        <Segment from={{ x: 0, y: 0 }} to={sat} color="var(--stage-fg)" opacity={0.35} weight={1} dashed />
        <Label x={sat.x / 2} y={sat.y / 2} text={`r = ${r.toFixed(1)}`} color="var(--stage-fg)" size={11} dy={-4} />
        {/* planet (Earth) */}
        <EarthGlyph center={{ x: 0, y: 0 }} r={0.6 + M * 0.12} />
        {/* gravitational pull on the satellite (toward the planet) */}
        <Vector tail={sat} tip={{ x: sat.x + dirToStar.x * arrowLen, y: sat.y + dirToStar.y * arrowLen }} color="var(--stage-warn)" weight={3} />
        <Label x={sat.x + dirToStar.x * arrowLen} y={sat.y + dirToStar.y * arrowLen} text="F" color="var(--stage-warn)" size={12} dy={-4} />
        {/* the satellite + its drag handle */}
        <SatelliteGlyph center={sat} size={0.5} />
        <MovableDot value={sat} onMove={onMove} color="var(--stage-accent)" ariaLabel="satellite, drag to change distance" />
      </Stage>
    </div>
  );

  const graph = (
    <Stage view={{ xMin: 0, xMax: R_MAX, yMin: 0, yMax: Fmax }} height={120} preserveAspect={false} ariaLabel="Force versus distance, an inverse-square curve">
      <Segment from={{ x: 0, y: 0 }} to={{ x: R_MAX, y: 0 }} color="var(--stage-fg)" opacity={0.5} weight={1.2} />
      <Segment from={{ x: 0, y: 0 }} to={{ x: 0, y: Fmax }} color="var(--stage-fg)" opacity={0.5} weight={1.2} />
      <Label x={0} y={Fmax} text="F" color="var(--stage-fg)" size={10} anchor="start" dy={-2} />
      <Label x={R_MAX} y={0} text="r →" color="var(--stage-fg)" size={10} anchor="end" dy={14} />
      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      <Segment from={{ x: clamp(r, R_MIN, R_MAX), y: 0 }} to={{ x: clamp(r, R_MIN, R_MAX), y: F }} color="var(--stage-warn)" opacity={0.6} weight={1} dashed />
      <Dot x={clamp(r, R_MIN, R_MAX)} y={F} r={4} color="var(--stage-warn)" />
    </Stage>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>distance r = <strong>{r.toFixed(1)}</strong></span>
          <span>pull F = GMm/r² = <strong>{F.toFixed(1)}</strong></span>
          <span>at 2r the pull would be <strong>{(F / 4).toFixed(1)}</strong> (¼)</span>
        </span>
      </Callout>
      {graph}
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        The curve falls as 1/r², steeply near the planet, then a long faint tail. Same maths gives orbital
        speed v = √(GM/r) and ties straight into the Kepler lab.
      </p>
      <LiveRegion>{`Distance ${r.toFixed(1)}, pull ${F.toFixed(1)}. Doubling the distance quarters the force.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="planet mass M" value={`${M}`}><Slider value={M} min={1} max={9} step={1} onChange={setM} ariaLabel="planet mass" /></Field>
      <Field label="satellite mass m" value={`${m}`}><Slider value={m} min={1} max={5} step={1} onChange={setm} ariaLabel="satellite mass" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig} footer={<ChallengeCard questions={GRAVITATION_CHALLENGE} state={challenge} title="Predict" />}>{figure}</LabFrame>;
}
