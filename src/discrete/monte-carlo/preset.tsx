'use client';

/**
 * MonteCarloLab, the GENERAL "estimate a probability by running it many times"
 * engine. The whole of statistical ML rests on one idea this lab makes visible:
 * the empirical frequency of an event converges to its true probability as trials
 * pile up (the law of large numbers). You don't compute the answer, you SAMPLE
 * it, and watch the estimate settle onto the truth.
 *
 * It is general by construction: a creator supplies one or more SERIES, each just
 * a `run(rng) → didItHappen` (or `point(rng) → {x,y,hit}` for area/scatter
 * estimates like π). The lab runs seeded batches per frame, tracks hits/total,
 * and draws either a convergence run-chart (empirical line homing onto the dashed
 * theoretical) or a dart scatter. Randomness is a SEEDED PRNG (mulberry32), so a
 * run is replayable, an agent can pin a seed and reproduce a lesson exactly.
 *
 * Ships a small library of named experiments (`montyHall`, `piDarts`, `diceSum`,
 * `bernoulli`) that expand to series, the Monty Hall paradox (switch ⇒ ⅔, stay
 * ⇒ ⅓, two lines splitting apart) is the headline. Add an experiment by writing a
 * factory that returns series; the engine never changes.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CanvasLayer,
  useFrameLoop,
  useControlSurface,
  useInView,
  type CoordinateSystem,
} from '@classytic/stage';
import { mulberry32, randInt, type Rng } from '../core/rng.js';
import { Slider } from '../../kit/controls.js';
import { Field, Stat, StatList } from '../../kit/frame.js';
import { Activity, RunTransport } from '../../kit/activity.js';
import { useReducedMotionDeferred } from '../../kit/anim.js';
import {
  ChallengeCard,
  useChallenge,
  useHints,
  HintLadder,
  useCheckpoint,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { catToken } from '../../kit/palette.js';

export interface MCSeries {
  label: string;
  color?: string;
  /** One trial → did the event happen? (run-chart series) */
  run?: (rng: Rng) => boolean;
  /** One trial → a 2-D dart + whether it hit the region (scatter series, e.g. π) */
  point?: (rng: Rng) => { x: number; y: number; hit: boolean };
  /** Map the hit-fraction to the reported quantity (default: the fraction itself). */
  estimate?: (frac: number) => number;
  /** The value the estimate should converge to, drawn as a dashed guide. */
  theoretical?: number;
}

export type ExperimentSpec =
  | { kind: 'montyHall'; doors?: number }
  | { kind: 'piDarts' }
  | { kind: 'diceSum'; dice?: number; target: number }
  | { kind: 'bernoulli'; p: number; label?: string };

export interface MonteCarloProps {
  series?: MCSeries[];
  experiment?: ExperimentSpec;
  viz?: 'runchart' | 'scatter';
  seed?: number;
  batch?: number;
  maxTrials?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

// ── named experiment factories (expand to series + a default viz) ──
function montyTrial(rng: Rng, doSwitch: boolean, doors: number): boolean {
  const car = randInt(rng, 0, doors - 1);
  const pick = randInt(rng, 0, doors - 1);
  // 3-door classic: the host opens a goat; switching wins exactly when the first
  // pick was wrong. (Generalises: switching wins iff pick ≠ car.)
  return doSwitch ? pick !== car : pick === car;
}

function expand(exp: ExperimentSpec): { series: MCSeries[]; viz: 'runchart' | 'scatter' } {
  switch (exp.kind) {
    case 'montyHall': {
      const d = exp.doors ?? 3;
      return {
        viz: 'runchart',
        series: [
          { label: 'switch', run: (r) => montyTrial(r, true, d), theoretical: (d - 1) / d },
          { label: 'stay', run: (r) => montyTrial(r, false, d), theoretical: 1 / d },
        ],
      };
    }
    case 'piDarts':
      return {
        viz: 'scatter',
        series: [
          {
            label: 'π estimate',
            point: (r) => {
              const x = r() * 2 - 1,
                y = r() * 2 - 1;
              return { x, y, hit: x * x + y * y <= 1 };
            },
            estimate: (f) => 4 * f,
            theoretical: Math.PI,
          },
        ],
      };
    case 'diceSum': {
      const dice = exp.dice ?? 2;
      // theoretical = (#ways to roll the target) / 6^dice
      let ways = 0;
      const total = 6 ** dice;
      for (let m = 0; m < total; m++) {
        let s = 0,
          x = m;
        for (let i = 0; i < dice; i++) {
          s += (x % 6) + 1;
          x = Math.floor(x / 6);
        }
        if (s === exp.target) ways++;
      }
      return {
        viz: 'runchart',
        series: [
          {
            label: `sum = ${exp.target}`,
            run: (r) => {
              let s = 0;
              for (let i = 0; i < dice; i++) s += randInt(r, 1, 6);
              return s === exp.target;
            },
            theoretical: ways / total,
          },
        ],
      };
    }
    case 'bernoulli':
      return {
        viz: 'runchart',
        series: [{ label: exp.label ?? `p = ${exp.p}`, run: (r) => r() < exp.p, theoretical: exp.p }],
      };
  }
}

interface SeriesRT {
  hits: number;
  total: number;
  hist: [number, number][];
  nextRec: number;
  rng: Rng;
}
interface Pt {
  x: number;
  y: number;
  hit: boolean;
}

export function MonteCarloLab({
  series: seriesIn,
  experiment = { kind: 'piDarts' },
  viz: vizIn,
  seed = 12345,
  batch = 30,
  maxTrials,
  title = 'Monte Carlo',
  prompt = 'Estimate an unknown value by sampling. Compare the live estimate with its theoretical target and watch typical error shrink as evidence accumulates.',
  objectives,
  hints: hintList,
  controlId,
  height = 320,
}: MonteCarloProps): ReactNode {
  const { series, viz } = useMemo(() => {
    if (seriesIn?.length)
      return {
        series: seriesIn,
        viz: vizIn ?? ((seriesIn[0]!.point ? 'scatter' : 'runchart') as 'runchart' | 'scatter'),
      };
    if (experiment) {
      const e = expand(experiment);
      return { series: e.series, viz: vizIn ?? e.viz };
    }
    return { series: [] as MCSeries[], viz: 'runchart' as const };
  }, [seriesIn, experiment, vizIn]);

  const cap = maxTrials ?? (viz === 'scatter' ? 5000 : 20000);
  const hints = useHints(hintList);
  const [speed, setSpeed] = useState(batch);
  // start at REST, the point is to WATCH the samples pile up when you press run,
  // not to land on a finished result. (Also makes the speed control meaningful.)
  const [running, setRunning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotionDeferred();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const questions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'more-samples',
        prompt: 'As the number of independent trials grows, the estimate usually…',
        choices: [
          { value: 'settles', label: 'settles closer to the target' },
          { value: 'drifts', label: 'drifts farther away' },
          { value: 'freezes', label: 'becomes exact after 100 trials' },
        ],
        answer: 'settles',
        explain:
          'Larger samples reduce typical random error, although a finite estimate can still fluctuate.',
      },
      {
        id: 'encoding',
        prompt:
          viz === 'scatter'
            ? 'For π darts, why multiply the hit fraction by four?'
            : 'What does each dashed guide represent?',
        choices:
          viz === 'scatter'
            ? [
                { value: 'quarter', label: 'the circle is one quadrant of a full circle' },
                { value: 'square', label: 'the sampled square has four unit quadrants' },
                { value: 'speed', label: 'four makes sampling faster' },
              ]
            : [
                { value: 'target', label: 'the theoretical long-run value' },
                { value: 'first', label: 'the first observed result' },
                { value: 'maximum', label: 'the largest possible estimate' },
              ],
        answer: viz === 'scatter' ? 'square' : 'target',
        explain:
          viz === 'scatter'
            ? 'The unit circle has area π and the surrounding square has area 4, so hit fraction ≈ π/4.'
            : 'The dashed line is the probability calculated from the model; the empirical trace should settle around it.',
      },
    ],
    [viz],
  );
  const challenge = useChallenge(questions);

  const rt = useRef<SeriesRT[]>([]);
  const points = useRef<Pt[]>([]);
  const seedRef = useRef(seed);

  const initRT = useCallback(() => {
    rt.current = series.map((_, i) => ({
      hits: 0,
      total: 0,
      hist: [],
      nextRec: 1,
      rng: mulberry32((seedRef.current + i * 99991) >>> 0),
    }));
    points.current = [];
  }, [series]);

  if (rt.current.length !== series.length) initRT();

  useEffect(() => {
    setMounted(true);
  }, []);

  const reset = useCallback(() => {
    initRT();
    setTick((t) => t + 1);
    setRunning(false);
  }, [initRT]);
  const reseed = useCallback(
    (s: number) => {
      seedRef.current = s >>> 0;
      reset();
    },
    [reset],
  );
  const advance = useCallback(
    (requested = speed): void => {
      let anyLeft = false;
      series.forEach((s, i) => {
        const st = rt.current[i]!;
        if (st.total >= cap) return;
        anyLeft = true;
        // ramp the batch: a trickle at first (so the wild early swings are WATCHABLE),
        // accelerating as the law of large numbers kicks in.
        const ramp = Math.max(1, Math.floor(st.total / 12) + 1);
        const n = Math.min(requested, ramp, cap - st.total);
        for (let k = 0; k < n; k++) {
          if (viz === 'scatter' && s.point) {
            const p = s.point(st.rng);
            if (points.current.length < cap) points.current.push(p);
            if (p.hit) st.hits++;
            st.total++;
          } else if (s.run) {
            if (s.run(st.rng)) st.hits++;
            st.total++;
          }
          // record at geometric trial counts → log-spaced points (dense early, sparse late)
          if (viz !== 'scatter' && st.total >= st.nextRec) {
            const frac = st.hits / st.total;
            st.hist.push([st.total, s.estimate ? s.estimate(frac) : frac]);
            st.nextRec = Math.ceil(st.nextRec * 1.25) + 1;
          }
        }
      });
      if (!anyLeft) setRunning(false);
      setTick((t) => (t + 1) & 0xffffff);
    },
    [cap, series, speed, viz],
  );

  // Reduced-motion learners advance deterministic batches explicitly; animation
  // is never the only path to the evidence.
  const toggleRun = useCallback(() => {
    if (reduce) {
      if (rt.current.every((st) => st.total >= cap)) initRT();
      advance(speed);
      return;
    }
    setRunning((r) => {
      if (!r && rt.current.every((st) => st.total >= cap)) {
        initRT();
        setTick((t) => t + 1);
      }
      return !r;
    });
  }, [advance, cap, initRT, reduce, speed]);

  useFrameLoop(() => advance(), { running: running && mounted && !reduce && inView });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, c: CoordinateSystem) => {
      const css = getComputedStyle(ctx.canvas);
      const tok = (n: string, fb: string): string => css.getPropertyValue(n).trim() || fb;
      const fg = tok('--stage-fg', '#222'),
        grid = tok('--stage-grid', 'rgba(125,125,125,.25)'),
        muted = tok('--stage-muted', '#888'),
        good = tok('--stage-good', '#2f9e44');
      const seriesColor = (i: number): string =>
        series[i]!.color ?? tok(catToken(i), `hsl(${(i * 47) % 360} 70% 50%)`);
      const W = ctx.canvas.clientWidth || 640,
        Hh = height;
      ctx.clearRect(0, 0, W, Hh);

      if (viz === 'scatter') {
        const [cx, cy] = c.toPx(0, 0);
        const rpx = Math.abs(c.toPx(1, 0)[0] - cx);
        // square + inscribed circle
        const [sx0, sy0] = c.toPx(-1, 1),
          [sx1, sy1] = c.toPx(1, -1);
        // Square and circle are BOTH content here — the estimate is their area ratio — so the
        // square gets the same weight as the circle. In `grid` it vanished in dark mode, leaving
        // a lone circle and no sampling region to read the ratio against.
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rpx, 0, Math.PI * 2);
        ctx.stroke();
        for (const p of points.current) {
          const [px, py] = c.toPx(p.x, p.y);
          ctx.fillStyle = p.hit ? good : muted;
          ctx.globalAlpha = p.hit ? 0.7 : 0.4;
          ctx.beginPath();
          ctx.arc(px, py, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }

      // run-chart: x = trial number on a LOG scale (so the early wild swings get
      // room), y AUTO-RANGED to the data + theoretical so the line isn't a flat
      // sliver against an empty 0..1 box.
      const padL = 34,
        padR = 12,
        padT = 12,
        padB = 22;
      const logCap = Math.log10(Math.max(10, cap));
      const X = (n: number): number => padL + (Math.log10(Math.max(1, n)) / logCap) * (W - padL - padR);
      const allEst = series
        .flatMap((s, i) => (rt.current[i]?.hist ?? []).map((h) => h[1]))
        .concat(series.map((s) => s.theoretical).filter((t): t is number => t != null));
      let yLo = allEst.length ? Math.min(...allEst) : 0,
        yHi = allEst.length ? Math.max(...allEst) : 1;
      const span = Math.max(0.05, yHi - yLo);
      yLo = Math.max(0, yLo - span * 0.25);
      yHi = yHi + span * 0.25;
      const Y = (v: number): number => padT + (1 - (v - yLo) / (yHi - yLo)) * (Hh - padT - padB);
      // y gridlines + labels
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.fillStyle = muted;
      ctx.font = '10px ui-sans-serif, system-ui';
      for (let g = 0; g <= 4; g++) {
        const v = yLo + (g / 4) * (yHi - yLo);
        const yy = Y(v);
        ctx.beginPath();
        ctx.moveTo(padL, yy);
        ctx.lineTo(W - padR, yy);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(2), padL - 4, yy + 3);
      }
      // x ticks at powers of ten
      ctx.textAlign = 'center';
      for (let p = 1; Math.pow(10, p) <= cap; p++) {
        const n = Math.pow(10, p);
        ctx.fillText(n >= 1000 ? `${n / 1000}k` : String(n), X(n), Hh - 6);
      }
      // theoretical guides
      series.forEach((s, i) => {
        if (s.theoretical == null) return;
        ctx.strokeStyle = seriesColor(i);
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padL, Y(s.theoretical));
        ctx.lineTo(W - padR, Y(s.theoretical));
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      // empirical curves
      series.forEach((s, i) => {
        const hist = rt.current[i]?.hist ?? [];
        if (hist.length < 2) return;
        ctx.strokeStyle = seriesColor(i);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        hist.forEach(([n, v], j) => {
          const x = X(n),
            y = Y(v);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        const [ln, lv] = hist[hist.length - 1]!;
        ctx.fillStyle = seriesColor(i);
        ctx.beginPath();
        ctx.arc(X(ln), Y(lv), 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    [series, viz, height, cap, tick],
  );

  const view = useMemo(
    () =>
      viz === 'scatter'
        ? { xMin: -1.15, xMax: 1.15, yMin: -1.15, yMax: 1.15 }
        : { xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
    [viz],
  );

  const stats = series.map((s, i) => {
    const st = rt.current[i];
    const total = st?.total ?? 0;
    const frac = total ? st!.hits / total : 0;
    return { label: s.label, est: s.estimate ? s.estimate(frac) : frac, theoretical: s.theoretical, total };
  });
  const totalTrials = stats.reduce((a, b) => Math.max(a, b.total), 0);

  // The lesson is LANDED when enough trials have piled up that every estimate has
  // settled within tolerance of its theoretical value — the law of large numbers
  // made measurable, not just watched. (Trial floor stops a trivial t=0 "solve".)
  const converged =
    stats.length > 0 &&
    totalTrials >= 300 &&
    stats.every(
      (s) => s.theoretical == null || Math.abs(s.est - s.theoretical) <= (viz === 'scatter' ? 0.05 : 0.02),
    );
  useCheckpoint({
    solved: converged && challenge.allCorrect,
    activity: `monte-carlo:${title}`,
    hintsUsed: hints.count,
  });

  useControlSurface(controlId, {
    run: { type: 'action', label: running ? 'pause' : 'run', invoke: toggleRun },
    reset: { type: 'action', label: 'reset', invoke: reset },
    speed: {
      type: 'number',
      label: 'trials/frame',
      min: 10,
      max: 2000,
      step: 10,
      get: () => speed,
      set: setSpeed,
    },
    seed: {
      type: 'number',
      label: 'seed',
      min: 1,
      max: 999999,
      step: 1,
      get: () => seedRef.current,
      set: reseed,
    },
  });

  const figure = (
    <div ref={viewRef} className="lab-playwrap discrete-stage-scene">
      <CanvasLayer
        view={view}
        height={height}
        draw={draw}
        ariaLabel={`${title}: ${stats.map((s) => `${s.label} ${s.est.toFixed(3)}`).join(', ')} after ${totalTrials} trials`}
      />
    </div>
  );

  const aside = (
    <StatList tone="info">
      {stats.flatMap((s) => [
        <Stat
          key={`${s.label}-estimate`}
          label={`${s.label} estimate`}
          value={s.total ? s.est.toFixed(viz === 'scatter' ? 4 : 3) : '—'}
        />,
        ...(s.theoretical == null
          ? []
          : [
              <Stat
                key={`${s.label}-target`}
                label="theoretical target"
                value={s.theoretical.toFixed(viz === 'scatter' ? 4 : 3)}
              />,
              <Stat
                key={`${s.label}-error`}
                label="absolute error"
                value={s.total ? Math.abs(s.est - s.theoretical).toFixed(viz === 'scatter' ? 4 : 3) : '—'}
                tone={
                  s.total && Math.abs(s.est - s.theoretical) <= (viz === 'scatter' ? 0.05 : 0.02)
                    ? 'good'
                    : undefined
                }
              />,
            ]),
      ])}
      <Stat label="trials" value={totalTrials.toLocaleString()} />
    </StatList>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Field label="speed" value={`seed ${seedRef.current}`}>
        <Slider
          value={speed}
          min={10}
          max={2000}
          step={10}
          onChange={setSpeed}
          ariaLabel="trials per frame"
        />
      </Field>
    </div>
  );

  const state = running ? 'Sampling' : totalTrials >= cap ? 'Complete' : totalTrials > 0 ? 'Paused' : 'Ready';
  const leading = stats[0];

  return (
    <Activity.Root className="discrete-monte-carlo-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Probability simulation" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{state}</strong>
        <span>{totalTrials.toLocaleString()} trials</span>
        <span>{viz === 'scatter' ? 'area estimate' : `${stats.length} series`}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Monte Carlo samples and convergence plot">{figure}</Activity.Canvas>
        <Activity.Inspector label="Estimate evidence and simulation controls">
          {aside}
          {controls}
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {totalTrials === 0
            ? 'Take one trial to connect a random outcome to the estimate, then run a larger batch.'
            : converged
              ? 'The empirical estimate is now close to its theoretical target, although another seed would produce a different finite-sample path.'
              : leading?.theoretical == null
                ? 'As evidence accumulates, watch whether the estimate stabilizes rather than expecting every trial to move it smoothly.'
                : `Current absolute error is ${Math.abs(leading.est - leading.theoretical).toFixed(viz === 'scatter' ? 4 : 3)}; early trials have the greatest influence.`}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Predict and explain Monte Carlo convergence">
        <ChallengeCard questions={questions} state={challenge} title="Predict, then test" />
        <HintLadder hints={hints} />
      </section>
      <Activity.LiveRegion>
        {stats
          .map(
            (s) =>
              `${s.label} estimate ${s.est.toFixed(3)}${s.theoretical == null ? '' : `, target ${s.theoretical.toFixed(3)}, absolute error ${Math.abs(s.est - s.theoretical).toFixed(3)}`}`,
          )
          .join('; ')}{' '}
        after {totalTrials} trials.
      </Activity.LiveRegion>
      <Activity.Transport>
        <RunTransport
          running={running}
          onReset={() => {
            reset();
            challenge.reset();
          }}
          onToggle={toggleRun}
          onStep={() => advance(1)}
          state={state}
          detail={`${totalTrials.toLocaleString()} of ${cap.toLocaleString()} trials`}
          disabled={series.length === 0}
          resetLabel="Reset Monte Carlo experiment"
          stepLabel="Run one trial"
          runLabel={reduce ? 'Run batch' : 'Run simulation'}
        />
      </Activity.Transport>
    </Activity.Root>
  );
}
