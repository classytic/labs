'use client';

/**
 * The falling target: a coconut drops from its tree at the moment the stone is thrown. Where do
 * you aim?
 *
 * The instinct is to aim high, or ahead, or to allow for the fall somehow. The answer is to aim
 * straight at it. Gravity pulls the stone ½gt² below the straight line it was aimed along, and in
 * the same time pulls the coconut ½gt² below where it hung. Both drops are the same, so a stone
 * aimed at the coconut meets it, at any speed fast enough to arrive before the stone runs out of
 * height. It is the "monkey and hunter" that physics lecturers have fired across lecture halls for
 * a century, and the drawing on the blackboard is exactly what this figure draws: the no-gravity
 * line, and the ½gt² drop below it, the same for both.
 *
 * Switch gravity off and nothing falls, so the aim is plainly right. Switch it back on and the
 * picture changes while the result does not. Arithmetic in ./core.ts.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useFrameLoop, useInView } from '@classytic/stage';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity, RunTransport } from '../../kit/activity.js';
import { Ball, FigText, Figure, Ground, HUE, STROKE, Track, tint } from '../../kit/figure/index.js';
import {
  G_EARTH,
  aimAngle,
  launchVelocity,
  minimumSpeed,
  resolveShot,
  shotBall,
  shotTarget,
  timeToGround,
  type Shot,
  type Vec,
} from './core.js';
import { Cannon, CoconutPalm } from './glyphs.js';

export interface FallingTargetProps {
  /** Where the coconut hangs, in metres from the thrower. */
  target?: Vec;
  /** Starting aim, degrees above horizontal. */
  angle?: number;
  /** Starting throw speed, m/s. */
  speed?: number;
  /** Whether the target drops at the moment of the throw. Off shows a target that stays put. */
  drops?: boolean;
  /** Start with gravity switched off. */
  noGravity?: boolean;
  /** Open frozen at this many seconds after launch: a still figure for print, or a gallery shot. */
  at?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const W = 640;
const H = 380;
const STROBE = 0.15;
const ORIGIN: Vec = { x: 0, y: 0 };

export function FallingTargetLab({
  target = { x: 30, y: 15 },
  angle: initialAngle = 20,
  speed: initialSpeed = 25,
  drops = true,
  noGravity = false,
  at = 0,
  title,
  prompt,
  activity = 'falling-target',
}: FallingTargetProps = {}): ReactNode {
  const [angle, setAngle] = useState(initialAngle);
  const [speed, setSpeed] = useState(initialSpeed);
  const [gravity, setGravity] = useState<'on' | 'off'>(noGravity ? 'off' : 'on');
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(at);
  const [hits, setHits] = useState(0);
  const startRef = useRef<number | null>(null);
  /** One throw scores at most one hit, however many frames land after the end. */
  const scored = useRef(false);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const g = gravity === 'on' ? G_EARTH : 0;
  const shot: Shot = { angle, speed, origin: ORIGIN, target, g, drops, radius: 0.6 };
  const outcome = resolveShot(shot);
  // Run to the moment that decides the shot: the hit, or whichever body runs out of height or
  // room first. With gravity off nothing lands, so stop when the stone leaves the picture.
  const xMax = target.x + 6;
  const v = launchVelocity(shot);
  const leaveTime = v.x > 0 ? (xMax - ORIGIN.x) / v.x : 6;
  const endTime =
    outcome.kind === 'hit'
      ? outcome.time
      : Math.min(
          timeToGround(ORIGIN.y, v.y, g),
          drops ? timeToGround(target.y, 0, g) : Number.POSITIVE_INFINITY,
          leaveTime,
        );
  const done = t >= endTime - 1e-9;
  const aim = aimAngle(ORIGIN, target);

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs - t * 1000;
      const tt = Math.min(endTime, (f.timeMs - startRef.current) / 1000);
      setT(tt);
      if (tt >= endTime) {
        setRunning(false);
        if (outcome.kind === 'hit' && !scored.current) {
          scored.current = true;
          setHits((h) => h + 1);
        }
      }
    },
    { running: running && inView },
  );

  const reset = (): void => {
    startRef.current = null;
    setRunning(false);
    setT(0);
  };
  const fire = (): void => {
    if (running) {
      setRunning(false);
      startRef.current = null;
      return;
    }
    if (done) setT(0);
    startRef.current = null;
    scored.current = false;
    setRunning(true);
  };
  const change = (apply: () => void): void => {
    apply();
    reset();
  };

  const hitWithGravity = done && outcome.kind === 'hit' && gravity === 'on';
  useCheckpoint({ solved: hitWithGravity && drops, activity, response: `${angle}° at ${speed} m/s` });

  // ── the figure ─────────────────────────────────────────────────────────────────
  const xMin = -3;
  const top = target.y + 5;
  const k = Math.min((W - 30) / (xMax - xMin), (H - 50) / top);
  const X = (x: number): number => 15 + (x - xMin) * k;
  const Y = (y: number): number => H - 34 - y * k;
  const rad = (angle * Math.PI) / 180;
  const ux = Math.cos(rad),
    uy = Math.sin(rad);
  // The no-gravity line: where the stone would go if nothing pulled it down.
  const lineLen = Math.min((xMax - ORIGIN.x) / Math.max(ux, 1e-6), (top - ORIGIN.y) / Math.max(uy, 1e-6));
  const stone = shotBall(shot, Math.min(t, endTime));
  const coconut = shotTarget(shot, Math.min(t, endTime));
  const straight = { x: ORIGIN.x + speed * ux * t, y: ORIGIN.y + speed * uy * t };

  const marks: ReactNode[] = [];
  for (let s = STROBE; s <= Math.min(t, endTime) + 1e-9; s += STROBE) {
    const b = shotBall(shot, s),
      c = shotTarget(shot, s);
    marks.push(
      <g key={s.toFixed(2)}>
        <circle cx={X(b.x)} cy={Y(b.y)} r={3} fill={tint(HUE[1], 55)} />
        {drops && <circle cx={X(c.x)} cy={Y(c.y)} r={3.4} fill={tint(HUE[2], 55)} />}
      </g>,
    );
  }

  const figure = (
    <div ref={viewRef}>
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`A stone thrown at ${angle} degrees and ${speed} metres per second at a coconut ${target.x} metres away and ${target.y} metres up${drops ? ', which drops as the stone is thrown' : ''}.`}
      >
        <Ground x1={0} x2={W} y={Y(0)} />
        {/* A coconut palm whose crown sits just above where the coconut hangs. */}
        <CoconutPalm
          baseX={X(target.x + 2.6)}
          groundY={Y(0)}
          crownX={X(target.x + 0.6)}
          crownY={Y(target.y + 0.9)}
          scale={Math.max(10, 0.9 * k)}
        />
        {/* the aim, drawn as the path the stone would take without gravity */}
        <Track
          points={[
            [X(ORIGIN.x), Y(ORIGIN.y)],
            [X(ORIGIN.x + ux * lineLen), Y(ORIGIN.y + uy * lineLen)],
          ]}
          color={HUE.soft}
          weight="line"
        />
        <FigText
          x={X(ORIGIN.x + ux * lineLen * 0.62) - 6}
          y={Y(ORIGIN.y + uy * lineLen * 0.62) - 10}
          anchor="end"
          size="note"
          tone="soft"
        >
          no gravity
        </FigText>
        {marks}
        {/* the ½gt² drops, the same for both: the whole argument in two dashed lines */}
        {t > 0.05 && g > 0 && (
          <>
            <Track
              points={[
                [X(straight.x), Y(straight.y)],
                [X(stone.x), Y(stone.y)],
              ]}
              color={HUE.warn}
              weight="line"
            />
            <circle
              cx={X(straight.x)}
              cy={Y(straight.y)}
              r={4}
              fill="none"
              stroke={HUE.warn}
              strokeWidth={STROKE.line}
            />
            {drops && (
              <>
                {/* On the coconut's LEFT: the palm trunk stands to its right and would cross the label. */}
                <Track
                  points={[
                    [X(target.x) - 14, Y(target.y)],
                    [X(target.x) - 14, Y(coconut.y)],
                  ]}
                  color={HUE.warn}
                  weight="line"
                />
                <FigText
                  x={X(target.x) - 20}
                  y={(Y(target.y) + Y(coconut.y)) / 2}
                  anchor="end"
                  baseline="middle"
                  size="note"
                >
                  ½gt²
                </FigText>
              </>
            )}
            <FigText x={X(stone.x) + 10} y={(Y(straight.y) + Y(stone.y)) / 2} baseline="middle" size="note">
              ½gt²
            </FigText>
          </>
        )}
        {/* the thrower: a small cannon, its barrel along the aim */}
        <Cannon x={X(ORIGIN.x)} y={Y(ORIGIN.y)} angle={angle} />
        <Ball
          cx={X(coconut.x)}
          cy={Y(coconut.y)}
          r={9}
          color={HUE[2]}
          flash={done && outcome.kind === 'hit' ? 0.6 : 0}
        />
        {t > 0 && <Ball cx={X(stone.x)} cy={Y(stone.y)} r={6} color={HUE[1]} />}
        {done && outcome.kind === 'hit' && (
          <FigText x={X(coconut.x)} y={Y(coconut.y) - 20} anchor="middle" tone="good">
            hit
          </FigText>
        )}
      </Figure>
    </div>
  );

  const aimedAbove = angle > aim + 0.5,
    aimedBelow = angle < aim - 0.5;
  let readout: ReactNode;
  if (!done && t === 0)
    readout = (
      <Readout
        value="Hit the coconut"
        sub={drops ? 'It drops the moment you throw' : 'It stays on the tree'}
      />
    );
  else if (!done) readout = <Readout value={`${t.toFixed(2)} s`} sub="in flight" />;
  else if (outcome.kind === 'hit')
    readout = (
      <Readout
        value={`Hit after ${outcome.time.toFixed(2)} s`}
        sub={g > 0 ? `both fell ${outcome.drop.toFixed(1)} m` : 'nothing fell'}
      />
    );
  else if (outcome.kind === 'ball-landed')
    readout = <Readout value="The stone landed first" sub="it ran out of height before it arrived" />;
  else if (outcome.kind === 'target-landed')
    readout = <Readout value="The coconut landed first" sub="the stone never reached it" />;
  else
    readout = (
      <Readout
        value={`Missed by ${outcome.distance.toFixed(1)} m`}
        sub={aimedAbove ? 'passed above it' : aimedBelow ? 'passed below it' : 'just wide'}
      />
    );

  const vmin = drops && g > 0 ? minimumSpeed(ORIGIN, target, g) : 0;
  const observation = !done
    ? 'The dashed line is where the stone would go with no gravity. Decide where it should point, then throw.'
    : outcome.kind === 'hit'
      ? g > 0
        ? 'Both fell the same ½gt² below where they would have been, so aiming straight at the coconut was right.'
        : 'With no gravity nothing falls, and a stone aimed at the coconut simply flies straight to it.'
      : outcome.kind === 'ball-landed'
        ? `Aimed well, but too slow: below about ${vmin.toFixed(0)} m/s the stone reaches the ground before the coconut is in reach.`
        : aimedAbove && drops && g > 0
          ? 'Aiming high allows for the stone’s fall, but the coconut falls exactly as much. The allowance is the mistake.'
          : 'Line the dashed no-gravity path up with the coconut and throw again.';

  return (
    <Activity.Root className="physics-falling-target">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Projectiles"
          title={title ?? 'Hit the falling coconut'}
          description={
            prompt ??
            'The coconut drops the moment you throw. Choose where to aim and how hard to throw, then try to hit it in mid-air.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <span>{angle}°</span>
        <span>{speed} m/s</span>
        {hits > 0 && (
          <span>
            {hits} hit{hits > 1 ? 's' : ''}
          </span>
        )}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="The throw">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Field label="aim" value={`${angle}°`}>
            <Slider
              value={angle}
              min={0}
              max={75}
              step={0.5}
              onChange={(val) => change(() => setAngle(val))}
              ariaLabel="aim angle above horizontal"
            />
          </Field>
          <Field label="throw speed" value={`${speed} m/s`}>
            <Slider
              value={speed}
              min={5}
              max={50}
              step={1}
              onChange={(val) => change(() => setSpeed(val))}
              ariaLabel="throw speed"
            />
          </Field>
          <Segmented<'on' | 'off'>
            value={gravity}
            onChange={(val) => change(() => setGravity(val))}
            options={[
              { value: 'on', label: 'Gravity on' },
              { value: 'off', label: 'No gravity' },
            ]}
            ariaLabel="gravity"
          />
        </Activity.Dock>
        {readout}
      </Activity.Workspace>
      <Activity.Transport>
        <RunTransport
          running={running}
          onReset={reset}
          onToggle={fire}
          state={running ? 'In flight' : done ? (outcome.kind === 'hit' ? 'Hit' : 'Missed') : 'Ready'}
          runLabel={done ? 'Throw again' : 'Throw'}
          resetLabel="Reset the throw"
        />
      </Activity.Transport>
      <Activity.Feedback>
        <span>What to notice</span>
        <div>{observation}</div>
      </Activity.Feedback>
      <LiveRegion>{done ? (outcome.kind === 'hit' ? 'Hit.' : 'Missed.') : ''}</LiveRegion>
    </Activity.Root>
  );
}
