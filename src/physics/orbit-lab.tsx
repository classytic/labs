'use client';

/**
 * OrbitLab, an orbit is just falling sideways fast enough to keep missing the
 * ground. Too slow → crash; too fast → escape; just right → a closed ellipse.
 *
 * A genuine high-element-count animation (a 260-point fading trail + starfield +
 * a sub-stepped N-body integrator mutating a ref every frame), so it renders on
 * the engine's zero-dependency `<CanvasLayer>` (raw Canvas2D) rather than one SVG
 * node per trail point, the same boundary GradientDescent uses.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, useFrameLoop, useInView, type CoordinateSystem } from '@classytic/stage';
import { Slider, CheckButton, StatusPill, Chip } from '../kit/controls.js';
import { LabFrame, ControlBar, Field } from '../kit/frame.js';

const GM = 9000;
const R0 = 120;

interface Sim { x: number; y: number; vx: number; vy: number; trail: number[][] }

const VIEW = { xMin: -1, xMax: 1, yMin: -1, yMax: 1 }; // CanvasLayer renders in pixel space here

export function OrbitLab(): ReactNode {
  const [speed, setSpeed] = useState(1.0);
  const [phase, setPhase] = useState<'idle' | 'running' | 'crashed' | 'escaped'>('idle');
  const [, setTick] = useState(0);
  const circular = Math.sqrt(GM / R0);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const sim = useRef<Sim>({ x: R0, y: 0, vx: 0, vy: -circular, trail: [] });
  const box = useRef({ w: 640, h: 340 });

  const resetSim = useCallback(() => { sim.current = { x: R0, y: 0, vx: 0, vy: -circular * speed, trail: [] }; }, [circular, speed]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, c: CoordinateSystem) => {
    box.current = { w: c.width, h: c.height };
    const cx = c.width / 2, cy = c.height / 2;
    ctx.clearRect(0, 0, c.width, c.height);

    // starfield, sparse + faint so it reads as background, not noise
    ctx.fillStyle = 'color-mix(in oklab, var(--stage-fg) 22%, transparent)';
    for (let i = 0; i < 22; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);
      const r = ((i * 53) % (Math.min(c.width, c.height) / 2 - 10)) + 30;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    const tr = sim.current.trail;
    // before launch: a dashed guide ring at the circular-orbit radius, shows the orbit you're aiming for
    if (tr.length === 0) {
      ctx.strokeStyle = 'color-mix(in oklab, var(--stage-accent) 35%, transparent)';
      ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    // the actual path, drawn as a continuous fading line (not loose dots)
    if (tr.length > 1) {
      ctx.strokeStyle = 'var(--stage-accent)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(cx + tr[0]![0]!, cy + tr[0]![1]!);
      for (let i = 1; i < tr.length; i++) ctx.lineTo(cx + tr[i]![0]!, cy + tr[i]![1]!);
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    // central planet, glow + body so it's an obvious focal point
    const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 40);
    glow.addColorStop(0, 'color-mix(in oklab, oklch(0.7 0.13 250) 45%, transparent)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
    const grd = ctx.createRadialGradient(cx - 4, cy - 4, 3, cx, cy, 20);
    grd.addColorStop(0, 'oklch(0.82 0.13 250)');
    grd.addColorStop(1, 'oklch(0.42 0.13 250)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    // satellite, bigger + halo so it's findable
    const sx = cx + sim.current.x, sy = cy + sim.current.y;
    ctx.fillStyle = 'color-mix(in oklab, oklch(0.92 0.12 90) 35%, transparent)';
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'oklch(0.92 0.12 90)';
    ctx.beginPath(); ctx.arc(sx, sy, 5.5, 0, Math.PI * 2); ctx.fill();
  }, []);

  // idle redraw on speed change
  useEffect(() => { if (phase !== 'running') { resetSim(); setTick((n) => n + 1); } }, [resetSim, phase]);

  useFrameLoop(
    () => {
      const s = sim.current;
      const { w, h } = box.current;
      const bound = Math.min(w, h) / 2;
      const sub = 4;
      const dt = 0.18 / sub;
      for (let k = 0; k < sub; k++) {
        const r2 = s.x * s.x + s.y * s.y;
        const r = Math.sqrt(r2);
        if (r < 16) { setPhase('crashed'); return; }
        const a = -GM / (r2 * r);
        s.vx += a * s.x * dt; s.vy += a * s.y * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
      }
      s.trail.push([s.x, s.y]);
      if (s.trail.length > 260) s.trail.shift();
      if (Math.hypot(s.x, s.y) > bound + 40) { setPhase('escaped'); return; }
      setTick((n) => n + 1);
    },
    { running: phase === 'running' && inView },
  );

  const launch = (): void => { resetSim(); setTick((n) => n + 1); setPhase('running'); };

  const verdict =
    phase === 'crashed' ? { text: '💥 Too slow, it fell back and crashed', ok: false }
      : phase === 'escaped' ? { text: '🚀 Too fast, it escaped into space', ok: false }
        : phase === 'running' ? { text: '…orbiting (watch the path close into an ellipse)', ok: true }
          : null;

  const figure = (
    <div ref={viewRef}>
      <CanvasLayer view={VIEW} height={340} draw={draw} ariaLabel={`Satellite orbiting a planet at ${speed.toFixed(2)}× circular speed`} />
      {phase === 'idle' && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--stage-muted)', margin: '6px 0 0' }}>
          The dashed ring is a stable circular orbit. Press <strong>Launch</strong>, too slow and it spirals in, too fast and it escapes.
        </p>
      )}
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="launch speed" value={`${speed.toFixed(2)}× v꜀`}>
        <Slider value={Number(speed.toFixed(2))} min={0.5} max={1.5} step={0.02} onChange={(v) => { setSpeed(v); setPhase('idle'); }} ariaLabel="launch speed (× circular)" style={{ width: 130 }} />
      </Field>
      <CheckButton onClick={launch}>Launch</CheckButton>
      <Chip selected={false} onClick={() => setPhase('idle')}>Reset</Chip>
    </ControlBar>
  );

  return (
    <LabFrame
      title="Orbit Lab"
      prompt="An orbit is just falling sideways fast enough to keep missing the ground."
      aside={verdict ? <StatusPill ok={verdict.ok}>{verdict.text}</StatusPill> : undefined}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
