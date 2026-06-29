'use client';

/**
 * LorentzForceLab, the magnetic force on a moving charge, F = q·v×B, made visible.
 * A charge fired into a uniform field (into ⊗ or out ⊙ of the page) feels a force
 * ALWAYS PERPENDICULAR to its velocity, so it curves into a circle (cyclotron
 * motion). The lab draws the three perpendicular players live, v (green, tangent),
 * B (the field symbols), F (orange, toward the centre), and the right-hand rule
 * spelled out. Flip the charge sign OR the field direction and the curve reverses;
 * F⟂v means the speed never changes (no work). Radius r = mv/(qB); the period is
 * independent of speed, the trick behind the cyclotron, mass spectrometer, and the
 * aurora (solar particles spiralling in Earth's field).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Stage, Circle, Vector, Label, Dot, type Vec2 } from '@classytic/stage';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { Chip, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface LorentzProps {
  charge?: 1 | -1;
  fieldOut?: boolean;
  B?: number;
  speed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

const R = 5;
const view = { xMin: -R, xMax: R, yMin: -R, yMax: R };
const GREEN = 'var(--stage-good)', ORANGE = 'var(--stage-warn)', POS = '#e03131', NEG = '#1c7ed6';

const LORENTZ_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'speed',
    prompt: 'The magnetic force on a moving charge does what to its SPEED?',
    choices: [
      { value: 'none', label: 'nothing: speed stays constant' },
      { value: 'up', label: 'speeds it up' },
      { value: 'down', label: 'slows it down' },
    ],
    answer: 'none',
    explain: 'F = qv×B is always ⟂ to v, so it does no work, only the direction turns, the speed is constant.',
  },
  {
    id: 'radius',
    prompt: 'Crank up the field B (same charge and speed). The circle becomes…',
    choices: [
      { value: 'tighter', label: 'tighter (smaller radius)' },
      { value: 'wider', label: 'wider (larger radius)' },
      { value: 'same', label: 'the same size' },
    ],
    answer: 'tighter',
    explain: 'r = mv/(qB): a bigger B in the denominator shrinks the radius, so the charge curls tighter.',
  },
];

export function LorentzForceLab({ charge = 1, fieldOut = true, B: B0 = 1.4, speed: v0 = 2, title = 'Magnetic force on a moving charge', prompt, objectives, hints: hintList, controlId, height = 330 }: LorentzProps): ReactNode {
  const [q, setQ] = useState<1 | -1>(charge);
  const [out, setOut] = useState(fieldOut);
  const [B, setB] = useState(B0);
  const [v, setV] = useState(v0);
  const theta = useRef(-Math.PI / 2);
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const hints = useHints(hintList);
  const gate = usePlayGate();
  const challenge = useChallenge(LORENTZ_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'lorentz' });

  useEffect(() => { setMounted(true); }, []);
  // ω = qB/m (m=1); sense flips with charge AND field direction
  const sense = (q > 0 ? 1 : -1) * (out ? 1 : -1);
  useFrameTick(gate.running && mounted && !reduce, (f) => { theta.current += sense * B * (f.dtMs / 1000) * 0.9; });

  const r = Math.max(0.7, Math.min(4.2, v / B));   // r = mv/(qB)
  const pos: Vec2 = { x: r * Math.cos(theta.current), y: r * Math.sin(theta.current) };
  const vDir: Vec2 = { x: -Math.sin(theta.current) * sense, y: Math.cos(theta.current) * sense };
  const fDir: Vec2 = { x: -Math.cos(theta.current), y: -Math.sin(theta.current) }; // centripetal = q v×B
  const vTip: Vec2 = { x: pos.x + vDir.x * 1.5, y: pos.y + vDir.y * 1.5 };
  const fTip: Vec2 = { x: pos.x + fDir.x * 1.2, y: pos.y + fDir.y * 1.2 };

  // field symbols grid (⊗ in / ⊙ out)
  const grid: Vec2[] = [];
  for (let gx = -4; gx <= 4; gx += 2) for (let gy = -4; gy <= 4; gy += 2) grid.push({ x: gx, y: gy });

  useControlSurface(controlId, {
    charge: { type: 'enum', label: 'charge', options: ['+', '−'], get: () => (q > 0 ? '+' : '−'), set: (s) => setQ(s === '+' ? 1 : -1) },
    field: { type: 'enum', label: 'field', options: ['out', 'in'], get: () => (out ? 'out' : 'in'), set: (s) => setOut(s === 'out') },
    B: { type: 'number', label: 'field strength B', min: 0.6, max: 3, step: 0.1, get: () => B, set: setB },
    speed: { type: 'number', label: 'speed v', min: 0.6, max: 4, step: 0.1, get: () => v, set: setV },
  });

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <Stage view={view} height={height} ariaLabel={`charge ${q > 0 ? 'positive' : 'negative'} curving in a field ${out ? 'out of' : 'into'} the page`}>
          {grid.map((g, i) => <Label key={i} x={g.x} y={g.y} text={out ? '⊙' : '⊗'} color="var(--stage-muted)" size={15} />)}
          {/* the circular path */}
          <Circle center={{ x: 0, y: 0 }} r={r} fill="none" color="var(--stage-grid)" weight={1.5} dashed />
          {/* force then velocity then the charge on top */}
          <Vector tail={pos} tip={fTip} color={ORANGE} weight={3} />
          <Vector tail={pos} tip={vTip} color={GREEN} weight={3} />
          <Label x={(pos.x + vTip.x) / 2} y={(pos.y + vTip.y) / 2} text="v" color={GREEN} size={13} dy={-8} />
          <Label x={(pos.x + fTip.x) / 2} y={(pos.y + fTip.y) / 2} text="F" color={ORANGE} size={13} dx={8} />
          <Dot x={pos.x} y={pos.y} r={8} color={q > 0 ? POS : NEG} />
          <Label x={pos.x} y={pos.y} text={q > 0 ? '+' : '−'} color="white" size={12} />
        </Stage>
      </div>
    </PlayWrap>
  );

  const aside = (
    <>
      <Callout tone="result">
        <div style={{ fontSize: 16 }}><Tex tex="F = q\,v \times B" /></div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>curves {sense > 0 ? 'counter-clockwise' : 'clockwise'}</div>
        <div style={{ fontSize: 12, color: 'var(--stage-muted)' }}>radius <Tex tex="r = \tfrac{mv}{qB}" /> = {r.toFixed(2)}</div>
      </Callout>
      <p className="lab-prompt" style={{ fontSize: 13 }}>
        <b>Right-hand rule:</b> fingers point along <b style={{ color: GREEN }}>v</b>, curl toward <b>B</b> ({out ? 'out ⊙' : 'in ⊗'}), thumb = <b style={{ color: ORANGE }}>F</b> (for +q; reverse for −q). F always ⟂ v, so it only turns the charge, the speed never changes.
      </p>
      <p className="lab-prompt" style={{ fontSize: 12, color: 'var(--stage-muted)' }}>Same idea runs the cyclotron, the mass spectrometer, and the aurora, charged particles from the Sun spiralling in Earth's field.</p>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="charge"><span style={{ display: 'flex', gap: 6 }}>
        <Chip selected={q > 0} onClick={() => setQ(1)}>+ positive</Chip>
        <Chip selected={q < 0} onClick={() => setQ(-1)}>− negative</Chip>
      </span></Field>
      <Field label="field"><span style={{ display: 'flex', gap: 6 }}>
        <Chip selected={out} onClick={() => setOut(true)}>⊙ out</Chip>
        <Chip selected={!out} onClick={() => setOut(false)}>⊗ in</Chip>
      </span></Field>
      <Field label="B strength" value={B.toFixed(1)}><Slider value={B} min={0.6} max={3} step={0.1} onChange={setB} ariaLabel="field strength" /></Field>
      <Field label="speed v" value={v.toFixed(1)}><Slider value={v} min={0.6} max={4} step={0.1} onChange={setV} ariaLabel="speed" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<><HintLadder hints={hints} /><ChallengeCard questions={LORENTZ_CHALLENGE} state={challenge} title="Predict" /></>}>{figure}</LabFrame>;
}
