'use client';

/**
 * GasBoxLab, gas in a box: pressure you can watch being MADE.
 *
 * Hundreds of molecules bounce in a box on <CanvasLayer>; drag the piston to set
 * volume, slide temperature (every molecule speeds up, cool→hot colour) and amount
 * n (dots appear/vanish). Pressure is NOT a control, it is MEASURED from how often
 * + how hard the molecules drum the walls (each wall strike flashes), so PV=nRT
 * emerges from the mechanism instead of being plugged in. A "hold constant" lock
 * yields Boyle (lock T), Gay-Lussac (lock V), Charles (lock P → piston floats).
 *
 * The kinetic-theory algebra (P = ⅓(N/V)m⟨v²⟩ → PV=nRT) lives in a PAIRED
 * MathDerivation block, not here, the sim makes it felt, the derivation proves it.
 * SVG gauge/readouts overlay the canvas; honours prefers-reduced-motion.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, fmt } from '@classytic/stage';
import { useFrameTick, useReducedMotionDeferred } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { clamp } from '../../core/util.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

export interface GasBoxProps {
  holdConstant?: 'none' | 'temperature' | 'volume' | 'pressure';
  particleCount?: number;
  temperature?: number;
  volume?: number;
  showGauge?: boolean;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const GASBOX_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'boyle',
    prompt: 'Hold the temperature fixed and HALVE the volume. The pressure…',
    choices: [
      { value: 'double', label: 'doubles' },
      { value: 'half', label: 'halves' },
      { value: 'same', label: 'is unchanged' },
    ],
    answer: 'double',
    explain: 'Same molecules strike half the space twice as often, Boyle’s law, P ∝ 1/V.',
  },
  {
    id: 'gaylussac',
    prompt: 'Hold the volume fixed and HEAT the gas. The pressure…',
    choices: [
      { value: 'rise', label: 'rises' },
      { value: 'fall', label: 'falls' },
      { value: 'same', label: 'is unchanged' },
    ],
    answer: 'rise',
    explain: 'Hotter molecules move faster and hit the walls harder and more often, Gay-Lussac, P ∝ T.',
  },
];

const H = 6, MAXV = 10, MINV = 2.5, R = 0.13, MAXN = 320;
const T0 = 300, SPEED0 = 5.5, TMIN = 80, TMAX = 600;
const PDISP = 1.5;        // measured-pressure → display scaling (cosmetic)

interface P { x: number; y: number; vx: number; vy: number }
interface Flash { along: number; side: 0 | 1 | 2 | 3; life: number }

export function GasBoxLab({
  holdConstant = 'none', particleCount = 180, temperature = 300, volume = 7,
  showGauge = true,
  title = 'Gas in a box: watch pressure being made',
  prompt = 'Drag the piston, heat it up, add molecules. Pressure is the drumbeat of hits on the walls.',
  height = 300, objectives,
}: GasBoxProps): ReactNode {
  const [mode, setMode] = useState(holdConstant);
  const [vol, setVol] = useState(clamp(volume, MINV, MAXV));
  const [temp, setTemp] = useState(clamp(temperature, TMIN, TMAX));
  const [n, setN] = useState(clamp(Math.round(particleCount), 10, MAXN));
  const challenge = useChallenge(GASBOX_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'gas-box' });

  const particles = useRef<P[]>([]);
  const impulse = useRef(0);
  const pressure = useRef(40);              // EMA of measured wall-impulse
  const flashes = useRef<Flash[]>([]);
  const pTarget = useRef(0);                // captured P when entering Charles mode
  // reduced-motion is read AFTER mount so the first client render matches the
  // server (where matchMedia is absent), no hydration divergence.
  const reduce = useReducedMotionDeferred();
  const gate = usePlayGate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // lazily seed the particle pool (deterministic-ish; no Math.random at module load)
  if (particles.current.length === 0) {
    const pool: P[] = [];
    for (let i = 0; i < MAXN; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);   // golden-angle spread of directions
      pool.push({ x: R + ((i * 0.211) % 1) * (MINV - 2 * R) + 0.5, y: R + ((i * 0.137) % 1) * (H - 2 * R), vx: Math.cos(a) * SPEED0, vy: Math.sin(a) * SPEED0 });
    }
    particles.current = pool;
  }

  const targetSpeed = SPEED0 * Math.sqrt(temp / T0);

  useFrameTick(gate.running && !reduce, (f) => {
    const dt = Math.min(0.032, f.dtMs / 1000);
    const right = vol;
    let imp = 0;
    const ps = particles.current;
    for (let i = 0; i < n; i++) {
      const p = ps[i]!;
      const sp = Math.hypot(p.vx, p.vy) || 1;          // thermostat: speed = targetSpeed
      const k = targetSpeed / sp; p.vx *= k; p.vy *= k;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx); imp += 2 * Math.abs(p.vx); flashes.current.push({ along: p.y / H, side: 0, life: 1 }); }
      else if (p.x > right - R) { p.x = right - R; p.vx = -Math.abs(p.vx); imp += 2 * Math.abs(p.vx); flashes.current.push({ along: p.y / H, side: 1, life: 1 }); }
      if (p.y < R) { p.y = R; p.vy = Math.abs(p.vy); imp += 2 * Math.abs(p.vy); flashes.current.push({ along: p.x / right, side: 2, life: 1 }); }
      else if (p.y > H - R) { p.y = H - R; p.vy = -Math.abs(p.vy); imp += 2 * Math.abs(p.vy); flashes.current.push({ along: p.x / right, side: 3, life: 1 }); }
    }
    // measured pressure = impulse per time per wall-length, smoothed
    const perim = 2 * (right + H);
    const pInst = imp / (dt * perim);
    pressure.current = pressure.current * 0.9 + pInst * 0.1;
    // Charles: piston floats to hold P at the captured target
    if (mode === 'pressure' && pTarget.current > 0) {
      setVol((v) => clamp(v + clamp((pressure.current - pTarget.current) * 0.04, -3, 3) * dt, MINV, MAXV));
    }
    if (flashes.current.length > 60) flashes.current.splice(0, flashes.current.length - 60);
    for (const fl of flashes.current) fl.life -= dt * 3.5;
    flashes.current = flashes.current.filter((fl) => fl.life > 0);
  });

  // measured (animating) vs analytic fallback (reduced-motion). Gated on `mounted`
  // so the first client render === server (both use the measured branch).
  const reduced = mounted && reduce;
  const pShow = reduced ? (0.0117 * n * temp) / vol : pressure.current * PDISP;

  // NOT memoized: useFrameTick re-renders each frame → fresh draw → CanvasLayer repaints (it only redraws on draw-identity change).
  const draw = (ctx: CanvasRenderingContext2D, c: { toPx: (x: number, y: number) => [number, number]; sx: (v: number) => number }): void => {
    const cs = getComputedStyle(document.documentElement);
    const tok = (name: string, fb: string): string => cs.getPropertyValue(name).trim() || fb;
    const fg = tok('--stage-fg', '#222'), grid = tok('--stage-grid', 'rgba(0,0,0,.1)'), warn = tok('--stage-warn', '#e0a020'), metal = tok('--stage-metal', '#8a8a8a');
    const right = vol;
    const [x0, y0] = c.toPx(0, H); const [x1, y1] = c.toPx(right, 0);
    const [bx] = c.toPx(MAXV, 0);
    ctx.clearRect(0, 0, bx + 40, y1 + 40);
    // gas region
    ctx.fillStyle = grid; ctx.globalAlpha = 0.35; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.globalAlpha = 1;
    // walls
    ctx.strokeStyle = fg; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    // molecules, colour encodes temperature (cold blue → hot orange)
    const tFrac = clamp((temp - TMIN) / (TMAX - TMIN), 0, 1);
    const hue = 232 - tFrac * 210;
    ctx.fillStyle = `hsl(${hue.toFixed(0)} 78% 55%)`;
    const rpx = Math.max(2.4, c.sx(R) * 1.4);
    for (let i = 0; i < n; i++) {
      const p = particles.current[i]!;
      const [px, py] = c.toPx(Math.min(p.x, right - R), p.y);
      ctx.beginPath(); ctx.arc(px, py, rpx, 0, Math.PI * 2); ctx.fill();
    }
    // wall-strike flashes (the visible pressure)
    ctx.strokeStyle = warn; ctx.lineWidth = 3;
    for (const fl of flashes.current) {
      ctx.globalAlpha = clamp(fl.life, 0, 1);
      ctx.beginPath();
      if (fl.side === 0) { const [fx, fy] = c.toPx(0, fl.along * H); ctx.moveTo(fx, fy); ctx.lineTo(fx + 9, fy); }
      else if (fl.side === 1) { const [fx, fy] = c.toPx(right, fl.along * H); ctx.moveTo(fx, fy); ctx.lineTo(fx - 9, fy); }
      else if (fl.side === 2) { const [fx, fy] = c.toPx(fl.along * right, 0); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 9); }
      else { const [fx, fy] = c.toPx(fl.along * right, H); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 9); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // piston (right wall) with a grab handle
    const [pxr, pyt] = c.toPx(right, H); const [, pyb] = c.toPx(right, 0);
    ctx.fillStyle = metal; ctx.fillRect(pxr - 4, pyt, 8, pyb - pyt);
    ctx.fillRect(pxr - 2, (pyt + pyb) / 2 - 14, 14, 28);
  };

  const onPiston = useMemo(() => (mode === 'none' || mode === 'temperature')
    ? (m: [number, number]) => setVol(clamp(m[0], MINV, MAXV))
    : undefined, [mode]);

  const pickMode = (next: GasBoxProps['holdConstant']): void => {
    if (next === 'pressure') pTarget.current = pShow / PDISP; // capture current measured P
    setMode(next!);
  };

  const view = useMemo(() => ({ xMin: -0.3, xMax: MAXV + 0.6, yMin: -0.4, yMax: H + 0.4 }), []);
  const pvnt = (pShow * vol) / (n * temp);

  const figure = (
    <PlayWrap gate={gate}>
    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <CanvasLayer view={view} height={height} draw={draw} onPointerMath={onPiston} ariaLabel={`gas box: ${n} molecules at ${Math.round(temp)} kelvin, pressure ${pShow.toFixed(0)}`} />
      {showGauge && (
        <div style={{ position: 'absolute', top: 10, right: 12, textAlign: 'center', background: 'color-mix(in oklab, var(--stage-bg) 80%, transparent)', borderRadius: 10, padding: '6px 10px', border: '1px solid var(--stage-grid)' }}>
          <svg width={84} height={50} viewBox="0 0 84 50" aria-hidden>
            <path d="M 8 46 A 34 34 0 0 1 76 46" fill="none" stroke="var(--stage-grid)" strokeWidth={6} strokeLinecap="round" />
            {(() => { const a = Math.PI - clamp(pShow / 220, 0, 1) * Math.PI; const nx = fmt(42 + Math.cos(a) * 30), ny = fmt(46 - Math.sin(a) * 30); return <line x1={42} y1={46} x2={nx} y2={ny} stroke="var(--stage-warn)" strokeWidth={3} strokeLinecap="round" />; })()}
            <circle cx={42} cy={46} r={3} fill="var(--stage-fg)" />
          </svg>
          <div style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>P {pShow.toFixed(0)}</div>
        </div>
      )}
      <LiveRegion>
        {`Pressure ${pShow.toFixed(0)}, volume ${vol.toFixed(1)}, temperature ${Math.round(temp)} kelvin, ${n} molecules.`}
      </LiveRegion>
    </div>
    </PlayWrap>
  );

  const controls = (
    <ControlBar>
      <Field label="hold constant">
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Chip selected={mode === 'none'} onClick={() => pickMode('none')}>free</Chip>
          <Chip selected={mode === 'temperature'} onClick={() => pickMode('temperature')}>T (Boyle)</Chip>
          <Chip selected={mode === 'volume'} onClick={() => pickMode('volume')}>V (Gay-Lussac)</Chip>
          <Chip selected={mode === 'pressure'} onClick={() => pickMode('pressure')}>P (Charles)</Chip>
        </span>
      </Field>
      <Field label="temperature" value={`${Math.round(temp)} K`}>
        <Slider value={temp} min={TMIN} max={TMAX} step={5} onChange={mode === 'temperature' ? () => {} : setTemp} ariaLabel="temperature (kelvin)" />
      </Field>
      <Field label="amount n" value={n}>
        <Slider value={n} min={10} max={MAXN} step={10} onChange={setN} ariaLabel="number of molecules" />
      </Field>
      <Field label="V" value={`${vol.toFixed(1)} L`}><span /></Field>
      <Field label="PV/nT" value={<span style={{ color: 'var(--stage-good)' }}>≈ {pvnt.toFixed(2)}</span>}><span /></Field>
    </ControlBar>
  );

  const footer = (
    <>
      <p className="lab-prompt">{mode === 'volume' ? 'piston locked' : mode === 'pressure' ? 'piston floats to hold P' : 'drag the piston to set V'}</p>
      <ChallengeCard questions={GASBOX_CHALLENGE} state={challenge} title="Predict the gas laws" />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
