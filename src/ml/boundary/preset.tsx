'use client';

/**
 * DecisionBoundaryLab, a linear classifier you can SEE think. Two classes of
 * points sit in the plane; a straight boundary splits it into two predicted
 * regions. Drag the boundary's two handles to separate the classes by hand
 * (misclassified points get a red ring, accuracy updates live), then hit "train"
 * and watch a PERCEPTRON nudge the same line into place on its own. The honest
 * twist: the XOR dataset can't be split by ANY straight line, accuracy stalls
 * below 100%, the door to "why we need more than a line."
 *
 * Pure stage primitives (Stage + Polygon shading + MovableDot handles + frame-loop
 * perceptron). Seeded points → replayable. The "manipulation IS the lesson" ML lab.
 */

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Dot, Circle, Segment, Polygon, useFrameLoop, type Vec2 } from '@classytic/stage';
import { MovableDot } from '@classytic/stage';
import { mulberry32, gaussian, type Rng } from '../../core/rng.js';
import { Chip } from '../../kit/controls.js';
import { useHints, HintLadder, useCheckpoint } from '../../kit/pedagogy.js';
import { LabFrame, ControlBar, Callout } from '../../kit/frame.js';
import { useControlSurface } from '@classytic/stage';
import { useInView } from '@classytic/stage';

export type BoundaryDataset = 'separable' | 'overlap' | 'xor';
export interface BoundaryProps {
  dataset?: BoundaryDataset;
  seed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

interface P { x: number; y: number; cls: 0 | 1 }
const R = 5;                                   // plane half-width
const A0 = '#1c7ed6', A1 = '#e8590c';          // class colours
const view = { xMin: -R, xMax: R, yMin: -R, yMax: R };

function makeData(kind: BoundaryDataset, seed: number): P[] {
  const rng = mulberry32(seed); const pts: P[] = [];
  const blob = (cx: number, cy: number, cls: 0 | 1, k: number): void => { for (let i = 0; i < k; i++) pts.push({ x: gaussian(rng, cx, 1), y: gaussian(rng, cy, 1), cls }); };
  if (kind === 'separable') { blob(-2, -1.5, 0, 14); blob(2, 1.5, 1, 14); }
  else if (kind === 'overlap') { blob(-1.1, -0.6, 0, 16); blob(1.1, 0.6, 1, 16); }
  else { blob(-2, 2, 0, 8); blob(2, -2, 0, 8); blob(2, 2, 1, 8); blob(-2, -2, 1, 8); } // XOR
  return pts;
}

const clampR = (v: number): number => Math.max(-R, Math.min(R, v));

export function DecisionBoundaryLab({ dataset = 'separable', seed = 11, title = 'Draw the decision boundary', prompt, objectives, hints: hintList, controlId }: BoundaryProps): ReactNode {
  const [kind, setKind] = useState<BoundaryDataset>(dataset);
  const [pts, setPts] = useState<P[]>(() => makeData(dataset, seed));
  const [a1, setA1] = useState<Vec2>({ x: 0, y: -R });
  const [a2, setA2] = useState<Vec2>({ x: 0, y: R });
  const [training, setTraining] = useState(false);
  const hints = useHints(hintList);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const w = useRef<[number, number, number]>([0, 1, 0]); // [w0,w1,w2] for the perceptron
  const iter = useRef(0);

  // weights from the two handles (boundary = line through a1,a2; normal ⟂ to it)
  const wOf = (p: Vec2, q: Vec2): [number, number, number] => {
    const dx = q.x - p.x, dy = q.y - p.y;
    const nx = -dy, ny = dx;                    // normal
    return [-(nx * p.x + ny * p.y), nx, ny];
  };
  const weights = useMemo(() => wOf(a1, a2), [a1, a2]);
  const raw = (W: [number, number, number], p: { x: number; y: number }): number => W[0] + W[1] * p.x + W[2] * p.y;

  // auto-orient: class 1 on whichever side gives the better accuracy
  const { sign, acc, wrong } = useMemo(() => {
    const score = (s: number): number => pts.reduce((a, p) => a + ((s * raw(weights, p) > 0 ? 1 : 0) === p.cls ? 1 : 0), 0);
    const sp = score(1), sn = score(-1);
    const s = sp >= sn ? 1 : -1;
    const wr = pts.filter((p) => (s * raw(weights, p) > 0 ? 1 : 0) !== p.cls);
    return { sign: s, acc: pts.length ? Math.max(sp, sn) / pts.length : 0, wrong: wr };
  }, [pts, weights]);

  // solved when the boundary perfectly separates the classes (XOR can't reach 100%
  // with any straight line, so this checkpoint only ever fires for separable data).
  const solved = acc === 1;
  useCheckpoint({ solved, activity: `boundary:${title}`, hintsUsed: hints.count });

  // split the plane square into the two predicted regions for shading
  const regions = useMemo(() => {
    const corners = [{ x: -R, y: -R }, { x: R, y: -R }, { x: R, y: R }, { x: -R, y: R }];
    const f = (p: { x: number; y: number }): number => sign * raw(weights, p);
    const pos: Vec2[] = [], neg: Vec2[] = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i]!, b = corners[(i + 1) % 4]!, fa = f(a), fb = f(b);
      (fa >= 0 ? pos : neg).push(a);
      if ((fa > 0) !== (fb > 0)) { const t = fa / (fa - fb); const m = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }; pos.push(m); neg.push(m); }
    }
    return { pos, neg };
  }, [weights, sign]);

  // perceptron: nudge w one pass per frame; sync the handles to the learned line
  useFrameLoop(() => {
    if (!training) return;
    const lr = 0.04; let changed = 0;
    for (const p of pts) { const pred = w.current[0] + w.current[1] * p.x + w.current[2] * p.y > 0 ? 1 : 0; const e = p.cls - pred; if (e) { changed++; w.current[0] += lr * e; w.current[1] += lr * e * p.x; w.current[2] += lr * e * p.y; } }
    iter.current++;
    // line from w: pick the better-conditioned axis to read two endpoints
    const [b, wx, wy] = w.current;
    if (Math.abs(wy) > Math.abs(wx)) { setA1({ x: -R, y: clampR(-(b + wx * -R) / (wy || 1e-6)) }); setA2({ x: R, y: clampR(-(b + wx * R) / (wy || 1e-6)) }); }
    else { setA1({ x: clampR(-(b + wy * -R) / (wx || 1e-6)), y: -R }); setA2({ x: clampR(-(b + wy * R) / (wx || 1e-6)), y: R }); }
    if (changed === 0 || iter.current > 400) setTraining(false);
  }, { running: training && inView });

  const train = useCallback(() => { w.current = [...weights]; iter.current = 0; setTraining(true); }, [weights]);
  const loadData = useCallback((k: BoundaryDataset) => { setKind(k); setPts(makeData(k, seed)); setTraining(false); setA1({ x: 0, y: -R }); setA2({ x: 0, y: R }); }, [seed]);
  const resetLine = useCallback(() => { setTraining(false); setA1({ x: 0, y: -R }); setA2({ x: 0, y: R }); }, []);

  useControlSurface(controlId, {
    dataset: { type: 'enum', label: 'dataset', options: ['separable', 'overlap', 'xor'], get: () => kind, set: (v) => loadData(v as BoundaryDataset) },
    train: { type: 'action', label: 'train (perceptron)', invoke: train },
    reset: { type: 'action', label: 'reset boundary', invoke: resetLine },
  });

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
    <Stage view={view} height={330} ariaLabel={`decision boundary, accuracy ${(acc * 100).toFixed(0)}%`}>
      <Grid step={1} />
      <Axes />
      {/* predicted-region shading */}
      <Polygon points={regions.neg} fill={A0} fillOpacity={0.12} weight={0} />
      <Polygon points={regions.pos} fill={A1} fillOpacity={0.12} weight={0} />
      {/* the boundary */}
      <Segment from={a1} to={a2} color="var(--stage-fg)" weight={2.5} />
      {/* points (misclassified get a ring) */}
      {pts.map((p, i) => (
        <Dot key={i} x={p.x} y={p.y} r={4.5} color={p.cls === 0 ? A0 : A1} />
      ))}
      {wrong.map((p, i) => <Circle key={`w${i}`} center={{ x: p.x, y: p.y }} r={0.32} fill="none" color="var(--stage-danger, #e03131)" weight={2} />)}
      {/* drag handles */}
      <MovableDot value={a1} onMove={(p) => { setTraining(false); setA1({ x: clampR(p.x), y: clampR(p.y) }); }} range={{ min: -R, max: R }} color="var(--stage-fg)" ariaLabel="boundary handle 1" />
      <MovableDot value={a2} onMove={(p) => { setTraining(false); setA2({ x: clampR(p.x), y: clampR(p.y) }); }} range={{ min: -R, max: R }} color="var(--stage-fg)" ariaLabel="boundary handle 2" />
    </Stage>
    </div>
  );

  const aside = (
    <Callout tone="result">
      <span style={{ color: A0 }}>● class A</span>{'  '}<span style={{ color: A1 }}>● class B</span>
      <span className="lab-callout-big" style={{ color: acc === 1 ? 'var(--stage-good)' : 'var(--stage-accent)' }}>accuracy {(acc * 100).toFixed(1)}%</span>
      <div style={{ color: 'var(--stage-muted)' }}>{wrong.length} misclassified</div>
      {kind === 'xor' && acc < 1 && <div style={{ color: 'var(--stage-danger, #e03131)', fontWeight: 600 }}>a single line can&apos;t split XOR</div>}
    </Callout>
  );

  const controls = (
    <ControlBar>
      <Chip selected={training} onClick={train}>{training ? '⏳ training…' : '⚙ train (perceptron)'}</Chip>
      <Chip selected={false} onClick={resetLine}>reset line</Chip>
      <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>data:</span>
      {(['separable', 'overlap', 'xor'] as const).map((k) => <Chip key={k} selected={kind === k} onClick={() => loadData(k)}>{k}</Chip>)}
      <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>· drag the two handles</span>
    </ControlBar>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<HintLadder hints={hints} />}>
      {figure}
    </LabFrame>
  );
}
