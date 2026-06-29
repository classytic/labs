'use client';

/**
 * RegressionLab, least squares you can FEEL, and gradient descent you can WATCH.
 *
 * Drag the line's two handles: every data point grows a SQUARE whose area is its
 * squared error, and the loss (mean squared error) updates live, "least squares"
 * is literally "make the total square area smallest". Then press Descend and watch
 * the line crawl downhill on its own, squares shrinking, loss tumbling. The
 * learning-rate slider lets you make it overshoot and DIVERGE, the #1 gradient-
 * descent intuition. Reveal snaps to the closed-form optimum to check yourself.
 *
 * The litmus test for ML/data labs on the stage engine: scatter + draggable fit +
 * frame-loop optimisation + live loss, all from the shared primitives. Isometric
 * view (preserveAspect + equal spans) so a data-unit square reads as a real
 * on-screen square, and stays SSR-deterministic.
 */

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Dot, Segment, Polygon, Label, MovableDot, useFrameLoop, useInView, type Vec2 } from '@classytic/stage';
import { Slider, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint, useChallenge, ChallengeCard, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

export interface RegressionProps {
  data?: { x: number; y: number }[];
  showSquares?: boolean;
  learnRate?: number;
  m0?: number;
  b0?: number;
  span?: number;            // view is [0,span] in BOTH axes (kept square)
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
}

interface Line { m: number; b: number }

const DEFAULT_DATA = [
  { x: 1, y: 2.1 }, { x: 2, y: 2.4 }, { x: 3, y: 4.2 }, { x: 4, y: 3.9 }, { x: 5, y: 5.6 },
  { x: 6, y: 5.1 }, { x: 7, y: 7.2 }, { x: 8, y: 7.0 }, { x: 9, y: 8.3 },
];

// least-squares slope sign of the given points (so the prediction answer tracks the real data)
const slopeSign = (data: { x: number; y: number }[]): 'up' | 'down' => {
  const n = data.length;
  if (n === 0) return 'up';
  const xb = data.reduce((s, p) => s + p.x, 0) / n;
  const yb = data.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  for (const p of data) num += (p.x - xb) * (p.y - yb);
  return num >= 0 ? 'up' : 'down';
};

export function RegressionLab({
  data = DEFAULT_DATA,
  showSquares = true,
  learnRate = 0.006,
  m0 = 0.3, b0 = 3.2,
  span = 10,
  title = 'Least squares: drag the line, watch the error',
  prompt = 'Each point grows a square of its squared error. Make the total area smallest, then press Descend and watch gradient descent do it for you.',
  objectives,
  height = 380,
}: RegressionProps): ReactNode {
  const view = { xMin: 0, xMax: span, yMin: 0, yMax: span };
  const n = data.length;
  const mid = span / 2;

  const [line, setLine] = useState<Line>({ m: m0, b: b0 });
  const [lr, setLr] = useState(learnRate);
  const [running, setRunning] = useState(false);
  const [iter, setIter] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  // closed-form least-squares optimum (for the reveal + scoring)
  const opt = useMemo<Line>(() => {
    const xb = data.reduce((s, p) => s + p.x, 0) / n;
    const yb = data.reduce((s, p) => s + p.y, 0) / n;
    let num = 0, den = 0;
    for (const p of data) { num += (p.x - xb) * (p.y - yb); den += (p.x - xb) ** 2; }
    const m = den === 0 ? 0 : num / den;
    return { m, b: yb - m * xb };
  }, [data, n]);

  const mse = (ln: Line): number => data.reduce((s, p) => s + (ln.m * p.x + ln.b - p.y) ** 2, 0) / n;
  const grad = (ln: Line): { dm: number; db: number } => {
    let dm = 0, db = 0;
    for (const p of data) { const e = ln.m * p.x + ln.b - p.y; dm += e * p.x; db += e; }
    return { dm: (2 / n) * dm, db: (2 / n) * db };
  };

  const loss = mse(line);
  const optLoss = mse(opt);
  const loss0 = mse({ m: m0, b: b0 });
  const closeEnough = loss <= optLoss * 1.05 + 1e-6;
  useCheckpoint({ solved: closeEnough, activity: 'regression' });

  // predict-first gate: commit a hypothesis about the trend before fitting
  const predictQ = useMemo<ChallengeQuestion[]>(() => {
    const answer = slopeSign(data);
    return [{
      id: 'slope-sign',
      prompt: 'Before you fit the line — looking at the cloud of points, will the best-fit line slope UP or DOWN?',
      choices: [
        { value: 'up', label: 'slope up (positive)' },
        { value: 'down', label: 'slope down (negative)' },
      ],
      answer,
      explain: 'Least squares follows the overall trend of the cloud: as x increases the points drift the same way, so the best-fit slope picks up that direction — no dragging needed to call its sign.',
    }];
  }, [data]);
  const ch = useChallenge(predictQ);

  const lineRef = useRef(line); lineRef.current = line;
  const iterRef = useRef(0); iterRef.current = iter;

  useFrameLoop(
    () => {
      let nx = lineRef.current;
      for (let i = 0; i < 3; i++) { const g = grad(nx); nx = { m: nx.m - lr * g.dm, b: nx.b - lr * g.db }; }
      setLine(nx);
      setIter((i) => i + 3);
      setHistory((h) => [...h.slice(-119), mse(nx)]);
      const g = grad(nx);
      const gnorm = Math.hypot(g.dm, g.db);
      if (gnorm < 1e-3 || iterRef.current > 3000 || !Number.isFinite(nx.m)) setRunning(false);
    },
    { running: running && inView },
  );

  // two draggable handles define the line: endpoints at x=0 and x=span
  const yAt = (x: number): number => line.m * x + line.b;
  const handleL: Vec2 = { x: 0, y: yAt(0) };
  const handleR: Vec2 = { x: span, y: yAt(span) };
  const setFromHandles = (l: Vec2, r: Vec2): void => {
    const m = (r.y - l.y) / (r.x - l.x || 1);
    setLine({ m, b: l.y - m * l.x });
  };
  const dragL = (p: Vec2): void => { setRunning(false); setFromHandles({ x: 0, y: clamp(p.y, view.yMin, view.yMax) }, handleR); };
  const dragR = (p: Vec2): void => { setRunning(false); setFromHandles(handleL, { x: span, y: clamp(p.y, view.yMin, view.yMax) }); };

  const reset = (): void => { setLine({ m: m0, b: b0 }); setIter(0); setHistory([]); setRunning(false); };
  const reveal = (): void => { setRunning(false); setLine(opt); };

  // loss meter (fraction of the starting loss still remaining)
  const lossFrac = clamp(loss / (loss0 || 1), 0, 1);

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
    <Stage view={view} height={height} ariaLabel={`Scatter with a fitted line; mean squared error ${loss.toFixed(2)}`}>
      <Grid />
      <Axes />
      {showSquares && data.map((p, i) => {
        const yhat = line.m * p.x + line.b;
        const r = p.y - yhat;
        const dir = p.x < mid ? 1 : -1;          // draw the square toward open space
        const x2 = p.x + dir * Math.abs(r);
        const col = r >= 0 ? 'var(--stage-good)' : 'var(--stage-danger)';
        return <Polygon key={i} points={[{ x: p.x, y: p.y }, { x: p.x, y: yhat }, { x: x2, y: yhat }, { x: x2, y: p.y }]} color={col} fill={col} fillOpacity={0.16} weight={1} />;
      })}
      <Segment from={{ x: 0, y: yAt(0) }} to={{ x: span, y: yAt(span) }} color="var(--stage-accent)" weight={3} />
      {data.map((p, i) => <Dot key={i} x={p.x} y={p.y} r={5} color="var(--stage-accent-2)" />)}
      <MovableDot value={handleL} onMove={dragL} constrain="vertical" range={{ min: view.yMin, max: view.yMax }} color="var(--stage-accent)" ariaLabel="line left end" />
      <MovableDot value={handleR} onMove={dragR} constrain="vertical" range={{ min: view.yMin, max: view.yMax }} color="var(--stage-accent)" ariaLabel="line right end" />
      <Label x={span - 1.4} y={yAt(span - 1.4) + 0.6} text={`y = ${line.m.toFixed(2)}x + ${line.b.toFixed(2)}`} size={12} color="var(--stage-accent)" />
    </Stage>
    </div>
  );

  const aside = (
    <>
      {/* loss meter */}
      <Callout tone="result">
        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>MSE <b style={{ color: closeEnough ? 'var(--stage-good)' : 'var(--stage-fg)', fontSize: 18 }}>{loss.toFixed(3)}</b></span>
        <div style={{ minWidth: 120, height: 10, borderRadius: 999, background: 'color-mix(in oklab, var(--stage-fg) 10%, transparent)', overflow: 'hidden', margin: '6px 0' }}>
          <div style={{ width: `${lossFrac * 100}%`, height: '100%', background: closeEnough ? 'var(--stage-good)' : 'var(--stage-warn)', transition: 'width .12s, background .2s' }} />
        </div>
        <StatusPill ok={closeEnough}>{closeEnough ? 'best fit!' : `optimum ${optLoss.toFixed(3)}`}</StatusPill>
      </Callout>
      {/* loss-vs-step sparkline, the descent curve */}
      {history.length > 1 && (
        <svg viewBox="0 0 240 44" width="100%" height={44} role="img" aria-label="loss decreasing over steps" style={{ display: 'block', maxWidth: 360, marginTop: 4 }}>
          <polyline
            points={history.map((v, i) => `${(i / (history.length - 1)) * 240},${44 - clamp(v / (loss0 || 1), 0, 1) * 40 - 2}`).join(' ')}
            fill="none" stroke="var(--stage-accent)" strokeWidth={2} vectorEffect="non-scaling-stroke"
          />
          <text x={2} y={10} fill="var(--stage-muted)" fontSize={9}>loss ↓</text>
        </svg>
      )}
    </>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={() => { if (!Number.isFinite(line.m)) reset(); setRunning((r) => !r); }}>{running ? '⏸ Pause' : '▶ Descend'}</CheckButton>
      <button type="button" className="lab-chip" onClick={reveal}>Reveal best fit</button>
      <button type="button" className="lab-chip" onClick={reset}>Reset</button>
      <Field label="learning rate" value={<span style={{ fontVariantNumeric: 'tabular-nums', color: lr > 0.02 ? 'var(--stage-danger)' : 'var(--stage-muted)' }}>{lr.toFixed(3)}{lr > 0.02 ? ' ⚠' : ''}</span>}>
        <Slider value={lr} min={0.001} max={0.03} step={0.001} onChange={setLr} ariaLabel="learning rate" />
      </Field>
      <span style={{ marginLeft: 'auto', color: 'var(--stage-muted)', fontVariantNumeric: 'tabular-nums' }}>step {iter}</span>
    </ControlBar>
  );

  const footer = (
    <>
      <ChallengeCard questions={predictQ} state={ch} title="Predict first" />
      <LiveRegion>
        {`Line y = ${line.m.toFixed(2)}x + ${line.b.toFixed(2)}. Mean squared error ${loss.toFixed(2)}. ${closeEnough ? 'This is the best fit.' : ''}`}
      </LiveRegion>
    </>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>
      {figure}
    </LabFrame>
  );
}
