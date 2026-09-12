'use client';

/**
 * KMeansLab, unsupervised clustering you can watch converge. Points sit in a few
 * blobs; you drag the k centroids to seed them, then Step (Lloyd's algorithm):
 * every point recolours to its nearest centroid, and each centroid jumps to the
 * mean of its cluster. Run animates it, centroids migrate into the blobs, the
 * within-cluster error (inertia) drops, and it stops when nothing moves. Seed the
 * centroids badly on purpose and you land in a worse local minimum, the key
 * k-means intuition that initialisation matters.
 *
 * Pure stage primitives: Dot (coloured by assignment) + MovableDot (centroids) +
 * useFrameLoop (throttled stepping). Isometric square view (SSR-safe).
 */

import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Stage,
  Grid,
  Dot,
  Segment,
  Circle,
  MovableDot,
  useFrameLoop,
  useInView,
  type Vec2,
} from '@classytic/stage';
import { Stat, StatList } from '../../../kit/frame.js';
import { useCheckpoint, useChallenge, ChallengeCard, type ChallengeQuestion } from '../../../kit/pedagogy.js';
import { MLActivity, MLRunTransport } from '../activity.js';

export interface KMeansProps {
  points?: { x: number; y: number }[];
  k?: number;
  seeds?: { x: number; y: number }[];
  span?: number;
  showLines?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
}

const COLORS = [
  'var(--stage-accent)',
  'var(--stage-good)',
  'var(--stage-danger)',
  'var(--stage-warn)',
  'var(--stage-accent-2)',
];

// deterministic blobs (no Math.random, SSR-stable)
const OFFS: [number, number][] = [
  [-0.8, 0.5],
  [0.6, 0.9],
  [-0.4, -0.7],
  [0.9, -0.3],
  [0.1, 0.6],
  [-0.9, -0.2],
  [0.5, -0.85],
];
const BLOBS: [number, number][] = [
  [2.6, 7.2],
  [7.4, 7.6],
  [5, 2.7],
];
const DEFAULT_POINTS = BLOBS.flatMap(([cx, cy]) => OFFS.map(([dx, dy]) => ({ x: cx + dx, y: cy + dy })));
// spread seeds → Run finds the three blobs (a satisfying default); drag them all
// into one corner to reproduce the "bad init → worse local minimum" lesson.
const DEFAULT_SEEDS = [
  { x: 3.5, y: 5.5 },
  { x: 6.5, y: 6 },
  { x: 5, y: 4 },
  { x: 2, y: 2 },
  { x: 8, y: 2 },
];
const TRANSFER: ChallengeQuestion[] = [
  {
    id: 'local-minimum',
    prompt: 'A run has converged but its inertia is higher than another run. What should you try?',
    choices: [
      { value: 'reseed', label: 'restart from different centroid seeds' },
      { value: 'accept', label: 'accept it because convergence guarantees the best answer' },
      { value: 'more', label: 'keep stepping the unchanged centroids' },
    ],
    answer: 'reseed',
    explain:
      'Convergence only means this run has reached a local minimum. Different seeds can lead Lloyd’s algorithm to a lower-inertia clustering.',
  },
];

const d2 = (a: Vec2, b: { x: number; y: number }): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function KMeansLab({
  points = DEFAULT_POINTS,
  k = 3,
  seeds,
  span = 10,
  showLines = true,
  title = 'k-means: watch the clusters form',
  prompt = 'Drag the centroids to seed them, then Step: points recolour to the nearest centroid, centroids jump to their cluster mean. Seed them badly and you get stuck in a worse answer.',
  objectives,
  height = 380,
}: KMeansProps): ReactNode {
  const view = { xMin: 0, xMax: span, yMin: 0, yMax: span };
  const init = (seeds ?? DEFAULT_SEEDS).slice(0, k);
  const [cents, setCents] = useState<Vec2[]>(init);
  const [running, setRunning] = useState(false);
  const [iter, setIter] = useState(0);
  const [converged, setConverged] = useState(false);
  const challenge = useChallenge(TRANSFER);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  useCheckpoint({ solved: converged && challenge.allCorrect, activity: 'kmeans' });

  const assign = (cs: Vec2[]): number[] =>
    points.map((p) => {
      let best = 0,
        bd = Infinity;
      cs.forEach((c, j) => {
        const dd = d2(c, p);
        if (dd < bd) {
          bd = dd;
          best = j;
        }
      });
      return best;
    });
  const labels = useMemo(() => assign(cents), [cents, points]);
  const inertia = useMemo(
    () => points.reduce((s, p, i) => s + d2(cents[labels[i]!]!, p), 0),
    [cents, labels, points],
  );

  const stepOnce = (cs: Vec2[]): Vec2[] => {
    const lab = assign(cs);
    return cs.map((c, j) => {
      const mine = points.filter((_, i) => lab[i] === j);
      if (!mine.length) return c;
      return {
        x: mine.reduce((s, p) => s + p.x, 0) / mine.length,
        y: mine.reduce((s, p) => s + p.y, 0) / mine.length,
      };
    });
  };
  const moved = (a: Vec2[], b: Vec2[]): number =>
    a.reduce((m, c, i) => Math.max(m, Math.hypot(c.x - b[i]!.x, c.y - b[i]!.y)), 0);

  const step = (): void => {
    setCents((cs) => {
      const nx = stepOnce(cs);
      if (moved(cs, nx) < 0.02) {
        setRunning(false);
        setConverged(true);
      }
      return nx;
    });
    setIter((i) => i + 1);
  };

  const acc = useRef(0);
  useFrameLoop(
    (f) => {
      acc.current += f.dtMs;
      if (acc.current >= 320) {
        acc.current = 0;
        step();
      }
    },
    { running: running && inView },
  );

  const reset = (): void => {
    setCents((seeds ?? DEFAULT_SEEDS).slice(0, k));
    setIter(0);
    setRunning(false);
    setConverged(false);
    challenge.reset();
  };
  const dragCent = (j: number, p: Vec2): void => {
    setRunning(false);
    setConverged(false);
    setCents((cs) => cs.map((c, i) => (i === j ? p : c)));
  };

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
      <Stage
        view={view}
        height={height}
        ariaLabel={`k-means with ${k} clusters; inertia ${inertia.toFixed(1)}`}
      >
        <Grid />
        {showLines &&
          points.map((p, i) => {
            const c = cents[labels[i]!]!;
            return (
              <Segment
                key={`l${i}`}
                from={{ x: p.x, y: p.y }}
                to={{ x: c.x, y: c.y }}
                color={COLORS[labels[i]! % COLORS.length]}
                weight={1}
                opacity={0.25}
              />
            );
          })}
        {points.map((p, i) => (
          <Dot key={i} x={p.x} y={p.y} r={5} color={COLORS[labels[i]! % COLORS.length]} />
        ))}
        {cents.map((c, j) => (
          <g key={`c${j}`}>
            <Circle
              center={{ x: c.x, y: c.y }}
              r={0.45}
              color={COLORS[j % COLORS.length]}
              fill="none"
              weight={2}
            />
            <MovableDot
              value={c}
              onMove={(p) => dragCent(j, p)}
              r={9}
              color={COLORS[j % COLORS.length]}
              ariaLabel={`centroid ${j + 1}`}
            />
          </g>
        ))}
      </Stage>
    </div>
  );

  const phase = converged
    ? 'Converged'
    : running
      ? 'Updating clusters'
      : iter > 0
        ? 'Paused'
        : 'Seed centroids';
  const feedback = converged
    ? 'The centroids stopped moving. Try a different seed: k-means can converge cleanly and still land in a different local minimum.'
    : iter > 0
      ? 'Each step first assigns every point to its nearest centroid, then moves each centroid to the mean of its assigned points.'
      : 'Initialization matters. Drag the centroid rings into deliberately different positions, then compare the final inertia.';

  return (
    <MLActivity
      className="ml-kmeans"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{phase}</strong>
          <span>iteration {iter}</span>
          <span>{k} clusters</span>
        </>
      }
      figure={figure}
      instruments={
        <StatList tone="info">
          <Stat
            label="Within-cluster inertia"
            value={inertia.toFixed(1)}
            tone={converged ? 'good' : undefined}
          />
          <Stat label="Lloyd iteration" value={iter} />
          <Stat label="Centroids" value={cents.length} />
        </StatList>
      }
      controls={
        <p>
          Drag a centroid ring to choose a new seed. The faint spokes show which centroid currently owns each
          point.
        </p>
      }
      feedback={feedback}
      challenge={<ChallengeCard questions={TRANSFER} state={challenge} title="Transfer the result" />}
      objectives={objectives}
      transport={
        <MLRunTransport
          running={running}
          onReset={reset}
          onStep={step}
          onToggle={() => setRunning((value) => !value)}
          state={phase}
          detail={`iteration ${iter} · inertia ${inertia.toFixed(1)}`}
          disabled={converged}
          runLabel="Run Lloyd’s algorithm"
        />
      }
      canvasLabel="K-means clustering scene with draggable centroids"
      inspectorLabel="Convergence evidence and seeding guidance"
    />
  );
}

export default KMeansLab;
