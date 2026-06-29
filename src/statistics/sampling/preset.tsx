'use client';

/**
 * SamplingDistributionLab, the two ideas that turn a sample into an inference.
 *
 *  • sampling mode, draw sample after sample (size n) from the population and pile
 *    up their MEANS. The pile is far tighter than the population and matches
 *    Normal(μ, σ/√n): the Central Limit Theorem, and why bigger n ⇒ smaller error.
 *  • CI mode, from each sample build a confidence interval x̄ ± z*·(σ/√n) and stack
 *    them; colour green if it captures μ, red if it misses. About C% are green , 
 *    making concrete what "95% confident" actually means (it's the PROCEDURE, not
 *    one interval). Running coverage converges to the chosen level.
 *
 * Seeded Gaussian draws (replayable); animated on CanvasLayer so you watch it build.
 * SE/curve/z* come from the normal kernel + standard z-values.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, useFrameLoop, useControlSurface, useInView, type CoordinateSystem } from '@classytic/stage';
import { gaussian, mulberry32, type Rng } from '../../core/rng.js';
import { normalPdf } from '../core/normal.js';
import { Tex } from '../../core/tex.js';
import { Chip, Slider } from '../../kit/controls.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { useReducedMotion } from '../../kit/anim.js';

export type SamplingMode = 'sampling' | 'ci';
export interface SamplingProps {
  mu?: number;
  sigma?: number;
  n?: number;
  confidence?: 0.8 | 0.9 | 0.95 | 0.99;
  mode?: SamplingMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

const ZSTAR: Record<number, number> = { 0.8: 1.2816, 0.9: 1.6449, 0.95: 1.96, 0.99: 2.5758 };
const ROWS = 22;            // visible CI bars
const f2 = (x: number): string => x.toFixed(2);

export function SamplingDistributionLab({ mu = 50, sigma = 10, n = 30, confidence = 0.95, mode: mode0 = 'ci', title = 'Sampling & confidence', prompt, objectives, hints: hintList, controlId, height = 320 }: SamplingProps): ReactNode {
  const [m, setM] = useState(mu);
  const [sg, setSg] = useState(sigma);
  const [nn, setNn] = useState(n);
  const [conf, setConf] = useState<number>(confidence);
  const [mode, setMode] = useState<SamplingMode>(mode0);
  const speed = 3;                                 // samples drawn per frame
  const hints = useHints(hintList);
  const [running, setRunning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const rng = useRef<Rng>(mulberry32(2025));
  const means = useRef<number[]>([]);            // sample means (sampling mode)
  const bars = useRef<{ mean: number; covers: boolean }[]>([]); // recent CIs
  const cover = useRef({ total: 0, hit: 0 });

  const zStar = ZSTAR[conf]!;
  const se = sg / Math.sqrt(nn);
  const xMin = m - 3.4 * sg, xMax = m + 3.4 * sg;

  useEffect(() => { setMounted(true); }, []);

  const reset = useCallback(() => { rng.current = mulberry32(2025); means.current = []; bars.current = []; cover.current = { total: 0, hit: 0 }; setTick((t) => t + 1); setRunning(false); }, []);
  // re-seed/clear when the experiment's parameters change so stats stay consistent
  useEffect(() => { reset(); }, [m, sg, nn, conf, reset]);

  const drawSample = (): number => { let s = 0; for (let i = 0; i < nn; i++) s += gaussian(rng.current, m, sg); return s / nn; };

  useFrameLoop(() => {
    for (let k = 0; k < speed; k++) {
      const xbar = drawSample();
      if (mode === 'sampling') { means.current.push(xbar); if (means.current.length > 5000) means.current.shift(); }
      else {
        const lo = xbar - zStar * se, hi = xbar + zStar * se;
        const covers = lo <= m && m <= hi;
        bars.current.push({ mean: xbar, covers });
        if (bars.current.length > ROWS) bars.current.shift();
        cover.current.total++; if (covers) cover.current.hit++;
      }
    }
    setTick((t) => (t + 1) & 0xffffff);
  }, { running: running && mounted && !reduce && inView });

  const draw = useCallback((ctx: CanvasRenderingContext2D, _c: CoordinateSystem) => {
    const css = getComputedStyle(ctx.canvas);
    const tok = (k: string, fb: string): string => css.getPropertyValue(k).trim() || fb;
    const fg = tok('--stage-fg', '#222'), grid = tok('--stage-grid', 'rgba(125,125,125,.3)'), muted = tok('--stage-muted', '#888'), accent = tok('--stage-accent', '#1c7ed6'), good = tok('--stage-good', '#2f9e44'), bad = tok('--stage-danger', '#e03131');
    const W = ctx.canvas.clientWidth || 640, H = height, padL = 30, padR = 14, padT = 14, padB = 26;
    const X = (v: number): number => padL + ((v - xMin) / (xMax - xMin)) * (W - padL - padR);
    ctx.clearRect(0, 0, W, H);
    // x-axis ticks at μ ± kσ
    ctx.strokeStyle = grid; ctx.fillStyle = muted; ctx.font = '10px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
    for (let k = -3; k <= 3; k++) { const x = X(m + k * sg); ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.globalAlpha = k === 0 ? 0 : 0.5; ctx.stroke(); ctx.globalAlpha = 1; }
    // μ line (the truth)
    ctx.strokeStyle = fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(m), padT); ctx.lineTo(X(m), H - padB); ctx.stroke();
    ctx.fillStyle = fg; ctx.fillText(`μ=${m}`, X(m), H - 8);

    if (mode === 'sampling') {
      // population curve (faint) + sampling curve (bold), both scaled to peak height
      const plotH = H - padT - padB, peak = normalPdf(m, m, se);
      const curveY = (pdf: number): number => (H - padB) - (pdf / peak) * plotH * 0.92;
      ctx.strokeStyle = muted; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const v = xMin + (i / 120) * (xMax - xMin); const y = curveY(normalPdf(v, m, sg)); i ? ctx.lineTo(X(v), y) : ctx.moveTo(X(v), y); }
      ctx.stroke(); ctx.globalAlpha = 1;
      // histogram of sample means
      const B = 41, bw = (xMax - xMin) / B; const counts = new Array(B).fill(0);
      for (const mn of means.current) { const b = Math.floor((mn - xMin) / bw); if (b >= 0 && b < B) counts[b]++; }
      const maxC = Math.max(1, ...counts);
      ctx.fillStyle = accent; ctx.globalAlpha = 0.85;
      counts.forEach((c: number, i: number) => { if (!c) return; const h = (c / maxC) * plotH * 0.92; ctx.fillRect(X(xMin + i * bw) + 1, (H - padB) - h, (W - padL - padR) / B - 1, h); });
      ctx.globalAlpha = 1;
      // sampling-distribution curve (bold)
      ctx.strokeStyle = good; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 160; i++) { const v = xMin + (i / 160) * (xMax - xMin); const y = curveY(normalPdf(v, m, se)); i ? ctx.lineTo(X(v), y) : ctx.moveTo(X(v), y); }
      ctx.stroke();
    } else {
      // stacked confidence intervals
      const rowH = (H - padT - padB) / ROWS;
      bars.current.forEach((b, i) => {
        const y = padT + (i + 0.5) * rowH;
        const lo = b.mean - zStar * se, hi = b.mean + zStar * se;
        ctx.strokeStyle = b.covers ? good : bad; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(lo), y); ctx.lineTo(X(hi), y); ctx.stroke();
        // caps
        ctx.beginPath(); ctx.moveTo(X(lo), y - 3); ctx.lineTo(X(lo), y + 3); ctx.moveTo(X(hi), y - 3); ctx.lineTo(X(hi), y + 3); ctx.stroke();
        ctx.fillStyle = b.covers ? good : bad; ctx.beginPath(); ctx.arc(X(b.mean), y, 2.5, 0, Math.PI * 2); ctx.fill();
      });
    }
  }, [mode, m, sg, nn, conf, zStar, se, xMin, xMax, height, tick]);

  useControlSurface(controlId, {
    mode: { type: 'enum', label: 'mode', options: ['sampling', 'ci'], get: () => mode, set: (v) => setMode(v as SamplingMode) },
    run: { type: 'action', label: running ? 'pause' : 'run', invoke: () => setRunning((r) => !r) },
    reset: { type: 'action', label: 'reset', invoke: reset },
    n: { type: 'number', label: 'sample size n', min: 2, max: 200, step: 1, get: () => nn, set: setNn },
    confidence: { type: 'enum', label: 'confidence level', options: ['0.8', '0.9', '0.95', '0.99'], get: () => String(conf), set: (v) => setConf(Number(v)) },
  });

  const view = useMemo(() => ({ xMin: 0, xMax: 1, yMin: 0, yMax: 1 }), []);
  const coverage = cover.current.total ? cover.current.hit / cover.current.total : 0;
  const meansSD = means.current.length > 1 ? Math.sqrt(means.current.reduce((a, x) => a + (x - m) ** 2, 0) / means.current.length) : 0;

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
      <div className="lab-bar" style={{ gap: 8 }}>
        <Chip selected={mode === 'ci'} onClick={() => setMode('ci')}>confidence intervals</Chip>
        <Chip selected={mode === 'sampling'} onClick={() => setMode('sampling')}>sampling distribution</Chip>
      </div>

      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', marginTop: 6 }}>
        <CanvasLayer view={view} height={height} draw={draw} ariaLabel={`${mode}; SE ${f2(se)}`} />
      </div>

      <div className="lab-bar" style={{ flexWrap: 'wrap', gap: 16, marginTop: 6, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
        <span><Tex tex="\\mathrm{SE} = \\sigma/\\sqrt{n}" /> = <span style={{ color: 'var(--stage-good)' }}>{f2(se)}</span></span>
        {mode === 'ci'
          ? <><span>level: {(conf * 100).toFixed(0)}%</span><span style={{ color: 'var(--stage-accent)' }}>coverage: {(coverage * 100).toFixed(1)}% <span style={{ color: 'var(--stage-muted)', fontWeight: 500 }}>({cover.current.hit}/{cover.current.total})</span></span></>
          : <span style={{ color: 'var(--stage-accent)' }}>spread of means <Tex tex={`\\approx ${f2(meansSD)}`} /> <span style={{ color: 'var(--stage-muted)', fontWeight: 500 }}>(<Tex tex={`\\to \\mathrm{SE}\\ ${f2(se)}`} />)</span> · {means.current.length} samples</span>}
      </div>
    </div>
  );

  const controls = (
    <ControlBar>
      <Chip selected={running} onClick={() => setRunning((r) => !r)}>{running ? '⏸ pause' : '▶ run'}</Chip>
      <Chip selected={false} onClick={reset}>↺ reset</Chip>
      <Field label="n" value={nn}><Slider value={nn} min={2} max={200} step={1} onChange={setNn} ariaLabel="sample size" /></Field>
      {mode === 'ci' && <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>{([0.8, 0.9, 0.95, 0.99] as const).map((c) => <Chip key={c} selected={conf === c} onClick={() => setConf(c)}>{c * 100}%</Chip>)}</span>}
    </ControlBar>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={<HintLadder hints={hints} />}>
      {figure}
    </LabFrame>
  );
}
