'use client';

/**
 * The tiger and the deer: interception, and relative velocity doing real work.
 *
 * The lab opens with the tiger pointed straight at the deer, which is what everyone tries first,
 * and it misses: by the time the tiger arrives, the deer has run on. The fix is to run for where
 * the deer will be. The figure draws the idea that finds it: the tiger's velocity as the deer
 * sees it, v_tiger − v_deer, built tip to tail from the two real velocities. When that black
 * arrow lies along the line of sight, the tiger is on a collision course.
 *
 * Switch to the deer's view and the deer stands still: the tiger then moves in a straight line,
 * and the question becomes whether that line passes through the deer. Switch the strategy to
 * "keep turning" and the tiger always faces the deer, which also catches it, but on a curve that
 * is longer than the straight intercept. With a 4.5-second sprint, that length is the difference
 * between a meal and a rest. Arithmetic in ./core.ts.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useFrameLoop, useInView } from '@classytic/stage';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity, RunTransport } from '../../kit/activity.js';
import { Arrow, Ball, FigText, Figure, HUE, STROKE, Track, tint } from '../../kit/figure/index.js';
import {
  chaseRun,
  headingOf,
  headingVector,
  intercept,
  offCourse,
  relativeVelocity,
  straightRun,
  type Chase,
  type Vec,
} from './core.js';
import { DeerGlyph, TigerGlyph } from './animals.js';

type Strategy = 'straight' | 'chase';
type View = 'above' | 'quarry';

export interface InterceptProps {
  /** Where the tiger starts, m. */
  chaser?: Vec;
  /** Where the deer starts, m. */
  quarry?: Vec;
  /** The tiger's running speed, m/s. */
  chaserSpeed?: number;
  /** The deer's velocity, m/s. */
  quarryVelocity?: Vec;
  /** How long the tiger can sprint, s. */
  stamina?: number;
  /** The tiger's starting heading, degrees from east. */
  heading?: number;
  /** straight: run on a fixed heading. chase: always turn towards the deer. */
  strategy?: Strategy;
  /** Open frozen this many seconds after the start. */
  at?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const W = 640;
const H = 400;
/** World metres drawn per m/s of velocity, for the arrows at the start. */
const V_SCALE = 0.9;

export function InterceptLab({
  chaser = { x: 0, y: 0 },
  quarry = { x: 0, y: 40 },
  chaserSpeed: initialSpeed = 18,
  quarryVelocity = { x: 14, y: 0 },
  stamina = 4.5,
  heading: initialHeading = 90,
  strategy: initialStrategy = 'straight',
  at = 0,
  title,
  prompt,
  activity = 'intercept',
}: InterceptProps = {}): ReactNode {
  const [heading, setHeading] = useState(initialHeading);
  const [speed, setSpeed] = useState(initialSpeed);
  const [strategy, setStrategy] = useState<Strategy>(initialStrategy);
  const [view, setView] = useState<View>('above');
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(at);
  const [won, setWon] = useState(false);
  const startRef = useRef<number | null>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const c: Chase = { chaser, chaserSpeed: speed, quarry, quarryVelocity, catchRadius: 1.5, stamina };
  const run = strategy === 'straight' ? straightRun(c, heading) : chaseRun(c);
  const endTime = run.time;
  const done = t >= endTime - 1e-9;
  const tt = Math.min(t, endTime);
  const best = intercept(c);

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs - t * 1000;
      const now = Math.min(endTime, (f.timeMs - startRef.current) / 1000);
      setT(now);
      if (now >= endTime) {
        setRunning(false);
        if (run.caught && strategy === 'straight') setWon(true);
      }
    },
    { running: running && inView },
  );

  const reset = (): void => {
    startRef.current = null;
    setRunning(false);
    setT(0);
  };
  const go = (): void => {
    if (running) {
      setRunning(false);
      startRef.current = null;
      return;
    }
    if (done) setT(0);
    startRef.current = null;
    setRunning(true);
  };
  const change = (apply: () => void): void => {
    apply();
    reset();
  };

  useCheckpoint({ solved: won, activity, response: `${heading}°` });

  // Positions at the current moment. The chase has no formula, so it is re-run to this time.
  const deerAt = (s: number): Vec => ({
    x: quarry.x + quarryVelocity.x * s,
    y: quarry.y + quarryVelocity.y * s,
  });
  const tigerAt = (s: number): Vec => {
    if (strategy === 'straight') {
      const u = headingVector(heading);
      return { x: chaser.x + u.x * speed * s, y: chaser.y + u.y * speed * s };
    }
    const partial = chaseRun({ ...c, stamina: Math.max(s, 1e-6) });
    return partial.path.at(-1) ?? chaser;
  };
  const tigerNow = tigerAt(tt),
    deerNow = deerAt(tt);
  // Each animal faces the way it runs. The chasing tiger faces the deer, which is its rule.
  const deerHeading = headingOf(quarryVelocity);
  const tigerHeading =
    strategy === 'straight'
      ? view === 'quarry'
        ? headingOf(relativeVelocity(c, heading))
        : heading
      : headingOf({ x: deerNow.x - tigerNow.x, y: deerNow.y - tigerNow.y });

  // In the deer's view the deer stays at its start and everything else is shifted by its motion.
  const frameShift = (s: number): Vec =>
    view === 'quarry' ? { x: -quarryVelocity.x * s, y: -quarryVelocity.y * s } : { x: 0, y: 0 };
  const show = (p: Vec, s: number): Vec => {
    const d = frameShift(s);
    return { x: p.x + d.x, y: p.y + d.y };
  };

  // The velocity construction at the start: v_tiger, then −v_deer from its tip, and the result.
  const vT = { x: headingVector(heading).x * speed, y: headingVector(heading).y * speed };
  const rel = relativeVelocity(c, heading);
  const tip = { x: chaser.x + vT.x * V_SCALE, y: chaser.y + vT.y * V_SCALE };
  const relTip = { x: chaser.x + rel.x * V_SCALE, y: chaser.y + rel.y * V_SCALE };
  // ── scale ────────────────────────────────────────────────────────────────────────
  const far = deerAt(stamina);
  // The arrows drawn at the start count too: a relative velocity pointing backwards once ran off
  // the left edge and took its label with it.
  const xs = [chaser.x, quarry.x, far.x, best?.point.x ?? quarry.x, tip.x, relTip.x];
  const ys = [chaser.y, quarry.y, far.y, best?.point.y ?? quarry.y, tip.y, relTip.y];
  const xMin = Math.min(...xs) - 10,
    xMax = Math.max(...xs) + 8,
    yMin = Math.min(...ys) - 8,
    yMax = Math.max(...ys) + 10;
  const k = Math.min((W - 30) / (xMax - xMin), (H - 30) / (yMax - yMin));
  const X = (x: number): number => 15 + (x - xMin) * k;
  const Y = (y: number): number => H - 15 - (y - yMin) * k;
  const P = (p: Vec): [number, number] => [X(p.x), Y(p.y)];

  const samples = 40;
  const tigerTrail: [number, number][] = [],
    deerTrail: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const s = (tt * i) / samples;
    tigerTrail.push(P(show(tigerAt(s), s)));
    deerTrail.push(P(show(deerAt(s), s)));
  }

  const sightEnd = quarry;
  const course = strategy === 'straight' ? offCourse(c, heading) : 0;
  const onCourse = Math.abs(course) < 1;
  const fresh = t === 0 && !running;

  const figure = (
    <div ref={viewRef}>
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`A tiger chasing a deer seen ${view === 'above' ? 'from above' : 'from the deer'}. ${done ? (run.caught ? 'Caught.' : 'Not caught.') : ''}`}
      >
        {/* the line of sight at the start, which the relative velocity must follow */}
        <Track points={[P(chaser), P(sightEnd)]} color={HUE.soft} weight="hair" />
        {view === 'above' && <Track points={[P(quarry), P(far)]} color={tint(HUE[1], 45)} weight="hair" />}
        {best && view === 'above' && done && !run.caught && strategy === 'straight' && (
          <Ball cx={X(best.point.x)} cy={Y(best.point.y)} r={4} color={tint(HUE.good, 60)} />
        )}
        {tt > 0 && <Track points={deerTrail} color={HUE[1]} weight="line" dashed={false} />}
        {tt > 0 && <Track points={tigerTrail} color={HUE[2]} weight="edge" dashed={false} />}
        {fresh && strategy === 'straight' && (
          <>
            <Arrow
              x1={X(chaser.x)}
              y1={Y(chaser.y)}
              x2={X(tip.x)}
              y2={Y(tip.y)}
              color={HUE[2]}
              weight="line"
              head={8}
            />
            <Arrow
              x1={X(tip.x)}
              y1={Y(tip.y)}
              x2={X(relTip.x)}
              y2={Y(relTip.y)}
              color={HUE[1]}
              weight="line"
              head={8}
              dashed
            />
            <Arrow
              x1={X(chaser.x)}
              y1={Y(chaser.y)}
              x2={X(relTip.x)}
              y2={Y(relTip.y)}
              color={HUE.ink}
              weight="bold"
              head={10}
            />
            <FigText x={X(tip.x) + 8} y={Y(tip.y)} size="note" tone="hue-2">
              tiger
            </FigText>
            <FigText
              x={(X(tip.x) + X(relTip.x)) / 2 + 8}
              y={(Y(tip.y) + Y(relTip.y)) / 2 + 14}
              size="note"
              tone="hue-1"
            >
              − deer
            </FigText>
            <FigText x={X(relTip.x)} y={Y(relTip.y) - 12} anchor="middle" size="note">
              {onCourse ? 'as the deer sees it: on course' : 'as the deer sees it'}
            </FigText>
          </>
        )}
        <Arrow
          x1={X(quarry.x)}
          y1={Y(quarry.y)}
          x2={X(quarry.x + quarryVelocity.x * V_SCALE)}
          y2={Y(quarry.y + quarryVelocity.y * V_SCALE)}
          color={HUE[1]}
          weight="line"
          head={8}
          opacity={fresh && view === 'above' ? 1 : 0}
        />
        {(() => {
          const d = show(deerNow, tt),
            g = show(tigerNow, tt);
          return (
            <>
              {done && run.caught && (
                <circle
                  cx={X(d.x)}
                  cy={Y(d.y)}
                  r={32}
                  fill="none"
                  stroke={HUE.good}
                  strokeWidth={STROKE.edge}
                />
              )}
              <DeerGlyph x={X(d.x)} y={Y(d.y)} heading={deerHeading} />
              <FigText x={X(d.x)} y={Y(d.y) - 26} anchor="middle" size="note" tone="hue-1">
                deer
              </FigText>
              <TigerGlyph x={X(g.x)} y={Y(g.y)} heading={tigerHeading} />
              <FigText x={X(g.x)} y={Y(g.y) + 46} anchor="middle" size="note" tone="hue-2">
                tiger
              </FigText>
            </>
          );
        })()}
        <FigText x={16} y={24} size="note" tone="soft">
          {view === 'above' ? 'seen from above' : 'seen by the deer: the deer stands still'}
        </FigText>
      </Figure>
    </div>
  );

  const gap = Math.hypot(deerNow.x - tigerNow.x, deerNow.y - tigerNow.y);
  const readout = fresh ? (
    <Readout value="Catch the deer" sub={`${stamina} s of sprint`} />
  ) : !done ? (
    <Readout value={`${tt.toFixed(1)} s`} sub={`${gap.toFixed(0)} m apart`} />
  ) : run.caught ? (
    <Readout
      value={`Caught after ${run.time.toFixed(1)} s`}
      sub={strategy === 'straight' ? 'a straight run' : 'by turning all the way'}
    />
  ) : run.reason === 'stamina' ? (
    <Readout value="Out of breath" sub={`still ${gap.toFixed(0)} m short`} />
  ) : (
    <Readout value={`Missed by ${run.closest.toFixed(0)} m`} sub="the deer was never on its path" />
  );

  const metrics =
    strategy === 'straight' ? (
      <div className="lab-metric-list">
        <div>
          <span>off the line of sight</span>
          <strong>{Math.abs(course).toFixed(1)}°</strong>
        </div>
        <div>
          <span>tiger runs</span>
          <strong>{(speed * run.time).toFixed(0)} m</strong>
        </div>
      </div>
    ) : null;

  const observation = fresh
    ? strategy === 'straight'
      ? 'The black arrow is the tiger’s velocity as the deer sees it. Where must it point for a catch?'
      : 'This tiger always runs at where the deer is right now. Predict whether it catches the deer in time.'
    : !done
      ? view === 'quarry'
        ? 'In the deer’s view the deer is still, and a straight run is a straight line. Does it pass through the deer?'
        : 'Watch the gap close, or not.'
      : run.caught && strategy === 'straight'
        ? 'Seen from the deer, the tiger came straight at it: the relative velocity lay along the line of sight.'
        : strategy === 'chase'
          ? run.caught
            ? 'Turning always towards the deer works, but the curved path is longer than the straight intercept.'
            : 'Always turning towards the deer bends the path, and the extra distance used up the sprint.'
          : 'Running at where the deer was is running at the past. Lead it until the black arrow points at the deer.';

  return (
    <Activity.Root className="physics-intercept">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Relative velocity"
          title={title ?? 'The tiger and the deer'}
          description={
            prompt ??
            'The deer runs across at a steady speed and the tiger can sprint for only a few seconds. Choose the tiger’s direction, then let it run.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        {strategy === 'straight' && <span>heading {heading}°</span>}
        <span>tiger {speed} m/s</span>
        <span>deer {Math.hypot(quarryVelocity.x, quarryVelocity.y)} m/s</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="The chase">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Segmented<Strategy>
            value={strategy}
            onChange={(v) => change(() => setStrategy(v))}
            options={[
              { value: 'straight', label: 'Run straight' },
              { value: 'chase', label: 'Keep turning' },
            ]}
            ariaLabel="the tiger's strategy"
          />
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'above', label: 'From above' },
              { value: 'quarry', label: 'The deer’s view' },
            ]}
            ariaLabel="which frame to watch from"
          />
          {strategy === 'straight' && (
            <Field label="heading" value={`${heading}°`}>
              <Slider
                value={heading}
                min={0}
                max={180}
                step={0.5}
                onChange={(v) => change(() => setHeading(v))}
                ariaLabel="tiger heading in degrees from east"
              />
            </Field>
          )}
          <Field label="tiger speed" value={`${speed} m/s`}>
            <Slider
              value={speed}
              min={10}
              max={24}
              step={1}
              onChange={(v) => change(() => setSpeed(v))}
              ariaLabel="tiger speed"
            />
          </Field>
        </Activity.Dock>
        {readout}
        {metrics}
      </Activity.Workspace>
      <Activity.Transport>
        <RunTransport
          running={running}
          onReset={reset}
          onToggle={go}
          state={running ? 'Running' : done ? (run.caught ? 'Caught' : 'Escaped') : 'Ready'}
          runLabel={done ? 'Run again' : 'Run'}
          resetLabel="Reset the chase"
        />
      </Activity.Transport>
      <Activity.Feedback>
        <span>What to notice</span>
        <div>{observation}</div>
      </Activity.Feedback>
      <LiveRegion>
        {done ? (run.caught ? `Caught after ${run.time.toFixed(1)} seconds.` : 'The deer escaped.') : ''}
      </LiveRegion>
    </Activity.Root>
  );
}
