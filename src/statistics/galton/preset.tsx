'use client';

/**
 * GaltonBoardLab, the bean machine: balls rain down through a triangle of pegs,
 * bouncing left or right by pure chance, and pile up into a BELL CURVE. It is the
 * Central Limit Theorem you can watch happen, each ball is a sum of coin-flips
 * (a binomial), and a pile of them traces the normal distribution. The bridge from
 * "coin flips / law of large numbers" into the curve all of statistics & ML runs on.
 *
 * Animated on <CanvasLayer>: a few dozen balls fall at once (watchable), each path
 * a seeded sequence of L/R hops, landing in a bin whose count grows a bar. The
 * theoretical binomial/normal envelope overlays as a dashed curve the bars chase.
 * Seeded (mulberry32) so a run is replayable; honours prefers-reduced-motion.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, useFrameLoop, type CoordinateSystem } from '@classytic/stage';
import { mulberry32, type Rng } from '../../core/rng.js';
import { mean as meanOf, stddev } from '../core/descriptive.js';
import { Tex } from '../../core/tex.js';
import { Chip, Slider } from '../../kit/controls.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { useReducedMotion } from '../../kit/anim.js';
import { useControlSurface, useInView } from '@classytic/stage';

export interface GaltonBoardProps {
  rows?: number;
  seed?: number;
  showCurve?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

interface Ball { f: number; cum: number[]; bin: number }
const MAX_FLIGHT = 28;

export function GaltonBoardLab({ rows = 12, seed = 7, showCurve = true, title = 'Galton board', prompt, objectives, hints: hintList, controlId, height = 360 }: GaltonBoardProps): ReactNode {
  const R = Math.max(4, Math.min(16, rows));
  const hints = useHints(hintList);
  const rng = useRef<Rng>(mulberry32(seed));
  const counts = useRef<number[]>(new Array(R + 1).fill(0));
  const balls = useRef<Ball[]>([]);
  const target = useRef(0);
  const [curve, setCurve] = useState(showCurve);
  const [speed, setSpeed] = useState(40);
  const [running, setRunning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();
  const spawnAcc = useRef(0);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  useEffect(() => { setMounted(true); }, []);

  // binomial probabilities (Pascal row), the theoretical envelope
  const pmf = useMemo(() => {
    const row = [1];
    for (let i = 0; i < R; i++) { const next = [1]; for (let k = 0; k < row.length - 1; k++) next.push(row[k]! + row[k + 1]!); next.push(1); row.length = 0; row.push(...next); }
    const denom = 2 ** R;
    return row.map((c) => c / denom);
  }, [R]);

  const newBall = (): Ball => {
    const cum = [0];
    let rights = 0;
    for (let i = 0; i < R; i++) { if (rng.current() < 0.5) rights++; cum.push(rights); }
    return { f: 0, cum, bin: rights };
  };

  const reset = useCallback(() => {
    counts.current = new Array(R + 1).fill(0); balls.current = []; target.current = 0; rng.current = mulberry32(seed); setRunning(false); setTick((t) => t + 1);
  }, [R, seed]);

  const drop = useCallback((n: number) => { target.current = landed() + balls.current.length + n; setRunning(true); }, []);
  const landed = (): number => counts.current.reduce((a, b) => a + b, 0);

  useFrameLoop((frame) => {
    const dt = Math.min(0.05, frame.dtMs / 1000);
    const have = landed() + balls.current.length;
    // spawn toward the target, rate-limited so it's watchable
    spawnAcc.current += speed * dt;
    while (spawnAcc.current >= 1 && have + 0 < target.current && balls.current.length < MAX_FLIGHT && landed() + balls.current.length < target.current) {
      balls.current.push(newBall()); spawnAcc.current -= 1;
    }
    // advance falls
    const fall = (R / 0.75) * dt;             // ~0.75s top-to-bottom
    const next: Ball[] = [];
    for (const b of balls.current) {
      b.f += fall;
      if (b.f >= R) counts.current[b.bin]!++; else next.push(b);
    }
    balls.current = next;
    if (balls.current.length === 0 && landed() >= target.current) setRunning(false);
    setTick((t) => (t + 1) & 0xffffff);
  }, { running: running && mounted && !reduce && inView });

  const draw = useCallback((ctx: CanvasRenderingContext2D, _c: CoordinateSystem) => {
    const css = getComputedStyle(ctx.canvas);
    const tok = (n: string, fb: string): string => css.getPropertyValue(n).trim() || fb;
    const fg = tok('--stage-fg', '#222'), grid = tok('--stage-grid', 'rgba(125,125,125,.3)'), muted = tok('--stage-muted', '#888'), accent = tok('--stage-accent', '#1c7ed6'), good = tok('--stage-good', '#2f9e44'), gold = tok('--stage-warn', '#e8a020');
    const W = ctx.canvas.clientWidth || 640, H = height;
    ctx.clearRect(0, 0, W, H);

    const dx = Math.min((W - 48) / (R + 1), 28);
    const cxC = W / 2;
    const pegTop = 26, binsTop = pegTop + H * 0.42, binsBottom = H - 22;
    const slotX = (r: number, slot: number): number => cxC + (slot - r / 2) * dx;
    const yOf = (f: number): number => pegTop + (f / R) * (binsTop - pegTop);

    // pegs (triangle)
    ctx.fillStyle = muted;
    for (let r = 0; r < R; r++) for (let s = 0; s <= r; s++) { ctx.beginPath(); ctx.arc(slotX(r, s) + dx / 2 * 0, pegTop + ((r + 0.5) / R) * (binsTop - pegTop), 1.8, 0, Math.PI * 2); ctx.fill(); }

    const total = counts.current.reduce((a, b) => a + b, 0);
    const maxExpected = total * Math.max(...pmf);
    const maxCount = Math.max(1, ...counts.current, maxExpected);
    const binH = binsBottom - binsTop;
    const barW = Math.max(4, dx * 0.78);

    // bars
    for (let b = 0; b <= R; b++) {
      const h = (counts.current[b]! / maxCount) * binH;
      const x = slotX(R, b) - barW / 2;
      ctx.fillStyle = accent; ctx.globalAlpha = 0.85;
      ctx.fillRect(x, binsBottom - h, barW, h);
    }
    ctx.globalAlpha = 1;
    // baseline
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(slotX(R, 0) - barW, binsBottom + 0.5); ctx.lineTo(slotX(R, R) + barW, binsBottom + 0.5); ctx.stroke();

    // theoretical bell envelope
    if (curve && total > 0) {
      ctx.strokeStyle = good; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
      for (let b = 0; b <= R; b++) { const h = (total * pmf[b]! / maxCount) * binH; const x = slotX(R, b), y = binsBottom - h; if (b === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
    }

    // in-flight balls
    ctx.fillStyle = gold;
    for (const ball of balls.current) {
      const r = Math.min(R - 1, Math.floor(ball.f)); const frac = ball.f - Math.floor(ball.f);
      const x0 = slotX(r, ball.cum[r]!), x1 = slotX(r + 1, ball.cum[r + 1]!);
      const x = x0 + (x1 - x0) * frac, y = yOf(ball.f);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }, [R, height, curve, pmf, tick]);

  // readouts from the bin distribution (each bin value = its index)
  const samples = useMemo(() => counts.current.flatMap((c, b) => new Array(c).fill(b)), [counts.current.reduce((a, b) => a + b, 0)]);
  const total = counts.current.reduce((a, b) => a + b, 0);
  const mu = total ? meanOf(samples) : R / 2;
  const sd = total ? stddev(samples) : Math.sqrt(R) / 2;

  useControlSurface(controlId, {
    drop100: { type: 'action', label: 'drop 100 balls', invoke: () => drop(100) },
    drop1000: { type: 'action', label: 'drop 1000 balls', invoke: () => drop(1000) },
    reset: { type: 'action', label: 'reset', invoke: reset },
    speed: { type: 'number', label: 'balls/sec', min: 10, max: 200, step: 10, get: () => speed, set: setSpeed },
  });

  const view = useMemo(() => ({ xMin: 0, xMax: 1, yMin: 0, yMax: 1 }), []);

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <CanvasLayer view={view} height={height} draw={draw} ariaLabel={`Galton board, ${total} balls dropped, mean bin ${mu.toFixed(1)}`} />
      </div>

      <div className="lab-bar" style={{ flexWrap: 'wrap', gap: 16, fontVariantNumeric: 'tabular-nums', marginTop: 6 }}>
        <span style={{ fontWeight: 700 }}>balls: {total.toLocaleString()}</span>
        <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}>mean <Tex tex={`\\approx ${mu.toFixed(2)}`} /> <span style={{ color: 'var(--stage-muted)', fontWeight: 500 }}>(<Tex tex={`\\to ${(R / 2).toFixed(1)}`} />)</span></span>
        <span style={{ color: 'var(--stage-accent)', fontWeight: 700 }}><Tex tex={`\\sigma \\approx ${sd.toFixed(2)}`} /> <span style={{ color: 'var(--stage-muted)', fontWeight: 500 }}>(<Tex tex={`\\to ${(Math.sqrt(R) / 2).toFixed(2)}`} />)</span></span>
      </div>
    </div>
  );

  const controls = (
    <ControlBar>
      <Chip selected={false} onClick={() => drop(100)}>▼ drop 100</Chip>
      <Chip selected={false} onClick={() => drop(1000)}>▼ drop 1000</Chip>
      <Chip selected={false} onClick={reset}>↺ reset</Chip>
      <Chip selected={curve} onClick={() => setCurve((v) => !v)}>bell curve</Chip>
      <Field label="speed"><Slider value={speed} min={10} max={200} step={10} onChange={setSpeed} ariaLabel="balls per second" /></Field>
      {running && <span style={{ fontSize: 13, color: 'var(--stage-good)' }}>raining…</span>}
    </ControlBar>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={<HintLadder hints={hints} />}>
      {figure}
    </LabFrame>
  );
}
