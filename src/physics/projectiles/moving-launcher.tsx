'use client';

/**
 * The moving launcher: a cart fires a ball straight up and rolls on. Where does the ball land?
 *
 * Most people predict "behind the cart", because the cart moves on while the ball is in the air.
 * It lands in the cart. The ball left the cart already moving forward at the cart's speed, and
 * nothing in the air pushes it backwards, so it keeps pace. Watched from the cart it simply goes
 * up and comes down; watched from the ground it traces a parabola. Same motion, two frames.
 *
 * Two twists make the rule sharp. Let the cart speed up after firing and the ball lands behind,
 * by exactly the part of the cart's motion it did not share. And in the second mode two balls
 * leave a ledge together, one dropped and one thrown sideways: they land together, because the
 * sideways speed has no vertical part. Arithmetic in ./core.ts.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useFrameLoop, useInView } from '@classytic/stage';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity, RunTransport } from '../../kit/activity.js';
import { Arrow, Ball, Block, FigText, Figure, Ground, HUE, Track, tint } from '../../kit/figure/index.js';
import { LauncherCart, mouthHeight } from './glyphs.js';
import {
  G_EARTH,
  ballPosition,
  cartLanding,
  cartPosition,
  dropAndThrow,
  timeToGround,
  type CartLaunch,
} from './core.js';

export type LauncherMode = 'cart' | 'drop-and-throw';
type Frame = 'ground' | 'cart';
type CartGuess = 'behind' | 'in' | 'front' | 'none';
type PairGuess = 'dropped' | 'together' | 'thrown' | 'none';

export interface MovingLauncherProps {
  /** cart: a ball fired straight up from a moving cart. drop-and-throw: two balls leave a ledge. */
  mode?: LauncherMode;
  /** The cart's speed at launch, m/s. */
  cartSpeed?: number;
  /** The ball's upward speed relative to the cart, m/s. */
  launchSpeed?: number;
  /** The cart's acceleration after launch, m/s². */
  cartAccel?: number;
  /** drop-and-throw: the ledge height, m. */
  height?: number;
  /** drop-and-throw: the sideways speed of the thrown ball, m/s. */
  throwSpeed?: number;
  /** Ask for a prediction before the launch. */
  predict?: boolean;
  /** Which frame to watch from at the start. */
  frame?: Frame;
  /** Open frozen at this many seconds after launch: a still figure for print, or a gallery shot. */
  at?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const W = 640;
const H = 340;
const STROBE = 0.2;

export function MovingLauncherLab({
  mode = 'cart',
  cartSpeed: initialSpeed = 4,
  launchSpeed = 9.8,
  cartAccel: initialAccel = 0,
  height = 10,
  throwSpeed: initialThrow = 6,
  predict = true,
  frame: initialFrame = 'ground',
  at = 0,
  title,
  prompt,
  activity = 'moving-launcher',
}: MovingLauncherProps = {}): ReactNode {
  const [speed, setSpeed] = useState(initialSpeed);
  const [accel, setAccel] = useState(initialAccel);
  const [throwSpeed, setThrowSpeed] = useState(initialThrow);
  const [frame, setFrame] = useState<Frame>(initialFrame);
  const [cartGuess, setCartGuess] = useState<CartGuess>('none');
  const [pairGuess, setPairGuess] = useState<PairGuess>('none');
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(at);
  const startRef = useRef<number | null>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const launch: CartLaunch = { cartSpeed: speed, launchSpeed, cartAccel: accel, g: G_EARTH };
  const landing = cartLanding(launch);
  const pairTime = timeToGround(height, 0, G_EARTH);
  const endTime = mode === 'cart' ? landing.time : pairTime;
  const done = t >= endTime - 1e-9;
  // Everything is DRAWN at the clock clamped to the flight: a frozen `at` past landing, or a frame
  // that overshoots, must show the landing, not a cart twenty metres off-screen.
  const tt = Math.min(t, endTime);
  const guessed = mode === 'cart' ? cartGuess !== 'none' : pairGuess !== 'none';
  const canFire = !predict || guessed;

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs - t * 1000;
      const tt = Math.min(endTime, (f.timeMs - startRef.current) / 1000);
      setT(tt);
      if (tt >= endTime) setRunning(false);
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
    setRunning(true);
  };
  /** Any change to the set-up starts a fresh trial, prediction included. */
  const change = (apply: () => void): void => {
    apply();
    reset();
    setCartGuess('none');
    setPairGuess('none');
  };

  const cartVerdict: CartGuess =
    Math.abs(landing.offset) < 0.15 ? 'in' : landing.offset < 0 ? 'behind' : 'front';
  const solved =
    done && (mode === 'cart' ? !predict || cartGuess === cartVerdict : !predict || pairGuess === 'together');
  useCheckpoint({ solved, activity, response: mode === 'cart' ? cartGuess : pairGuess });

  // ── the cart scene ─────────────────────────────────────────────────────────────
  let scene: ReactNode;
  let readout: ReactNode;
  let metrics: ReactNode = null;
  let observation: string;
  let narration: string;
  let claim: string;
  let dock: ReactNode;

  if (mode === 'cart') {
    const span = Math.max(landing.ballX, landing.cartX, 1) + 4;
    const xMin = -2;
    const CART = { width: 1.8, bodyHeight: 0.55, wheelRadius: 0.2, tubeHeight: 0.45 };
    // The ball leaves from the MOUTH of the tube, so every height is measured from there.
    const deckY = mouthHeight(CART);
    const top = landing.height + deckY + 0.6;
    const k = Math.min((W - 40) / span, (H - 70) / top);
    const shift = frame === 'cart' ? cartPosition(launch, tt) - (span * 0.45 - 2) : 0;
    const X = (x: number): number => 20 + (x - xMin - shift) * k;
    const Y = (y: number): number => H - 40 - y * k;
    const cx = cartPosition(launch, tt);
    const ball = ballPosition(launch, tt);
    const strobes: ReactNode[] = [];
    for (let s = 0; s <= tt + 1e-9; s += STROBE) {
      const b = ballPosition(launch, s);
      // In the cart's frame a mark stays where the ball was RELATIVE TO THE CART at that instant.
      const bx = frame === 'cart' ? b.x - cartPosition(launch, s) + cx : b.x;
      strobes.push(
        <circle key={s.toFixed(2)} cx={X(bx)} cy={Y(b.y + deckY)} r={3.4} fill={tint(HUE[2], 55)} />,
      );
    }
    const ticks: ReactNode[] = [];
    for (let x = Math.floor(xMin + shift); x <= Math.ceil(xMin + shift + span); x += 1) {
      ticks.push(
        <line
          key={x}
          x1={X(x)}
          y1={Y(0)}
          x2={X(x)}
          y2={Y(0) + (x % 2 === 0 ? 8 : 5)}
          stroke={HUE.soft}
          strokeWidth={1}
        />,
      );
      if (x % 2 === 0)
        ticks.push(
          <FigText key={`n${x}`} x={X(x)} y={Y(0) + 22} anchor="middle" size="note" tone="soft">
            {`${x} m`}
          </FigText>,
        );
    }
    const vx = speed,
      vy = launchSpeed - G_EARTH * Math.min(t, landing.time);
    const scaleV = 12;
    const inAir = t > 0 && !done;
    scene = (
      <>
        <Ground x1={0} x2={W} y={Y(0)} />
        {ticks}
        {strobes}
        {/* the cart */}
        <LauncherCart cx={X(cx)} groundY={Y(0)} k={k} rolled={cx} color={HUE[1]} {...CART} />
        {/* the ball, with its velocity split into the part it shares with the cart and the rest */}
        {/* A plumb line from the ball to the cart: it stays vertical exactly when the ball keeps pace. */}
        {inAir && (
          <Track
            points={[
              [X(ball.x), Y(ball.y + deckY)],
              [X(cx), Y(deckY)],
            ]}
            color={HUE.soft}
            weight="hair"
            opacity={0.8}
          />
        )}
        {/* X already follows the cart in the cart frame, so the ball needs no special case. */}
        <Ball cx={X(ball.x)} cy={Y(ball.y + deckY)} r={Math.max(7, 0.2 * k)} color={HUE[2]} />
        {inAir && frame === 'ground' && (
          <Arrow
            x1={X(ball.x)}
            y1={Y(ball.y + deckY)}
            x2={X(ball.x) + vx * scaleV}
            y2={Y(ball.y + deckY)}
            color={HUE[1]}
            weight="line"
            head={7}
          />
        )}
        {inAir && Math.abs(vy) > 0.3 && (
          <Arrow
            x1={X(ball.x)}
            y1={Y(ball.y + deckY)}
            x2={X(ball.x)}
            y2={Y(ball.y + deckY) - vy * scaleV}
            color={HUE[2]}
            weight="line"
            head={7}
          />
        )}
        <FigText x={16} y={24} size="note" tone="soft">
          {frame === 'ground' ? 'watched from the ground' : 'watched from the cart'}
        </FigText>
        {done && (
          <FigText x={X(landing.ballX)} y={Y(deckY) - 26} anchor="middle" tone="ink">
            {cartVerdict === 'in' ? 'caught' : cartVerdict === 'behind' ? 'lands behind' : 'lands in front'}
          </FigText>
        )}
      </>
    );
    const verdictText =
      cartVerdict === 'in'
        ? 'Lands in the cart'
        : `Lands ${Math.abs(landing.offset).toFixed(1)} m ${cartVerdict === 'behind' ? 'behind' : 'in front of'} the cart`;
    readout = done ? (
      <Readout value={verdictText} sub={`after ${landing.time.toFixed(1)} s in the air`} />
    ) : predict && !guessed ? (
      <Readout value="Where will it land?" sub="Predict, then fire" />
    ) : (
      <Readout value={`${t.toFixed(1)} s`} sub="in the air" />
    );
    metrics = done ? (
      <div className="lab-metric-list">
        <div>
          <span>ball travelled</span>
          <strong>{landing.ballX.toFixed(1)} m</strong>
        </div>
        <div>
          <span>cart travelled</span>
          <strong>{landing.cartX.toFixed(1)} m</strong>
        </div>
      </div>
    ) : null;
    observation = !done
      ? 'The sideways arrow is the cart’s speed. Watch whether it ever changes while the ball is in the air.'
      : accel === 0
        ? 'The ball kept the cart’s sideways speed the whole time, so it stayed above the cart and fell back in.'
        : accel > 0
          ? 'The ball kept only the speed the cart had at launch. The cart then sped up and ran out from under it.'
          : 'The cart slowed down after launch, but the ball kept its launch speed and overtook it.';
    narration = done ? `${verdictText}.` : `Ball at height ${ball.y.toFixed(1)} metres.`;
    claim = 'A ball fired straight up from a moving cart';
    dock = (
      <>
        {predict && (
          <Segmented<CartGuess>
            value={cartGuess}
            onChange={(v) => {
              reset();
              setCartGuess(v);
            }}
            options={[
              { value: 'behind', label: 'Behind the cart' },
              { value: 'in', label: 'In the cart' },
              { value: 'front', label: 'In front' },
            ]}
            ariaLabel="your prediction"
          />
        )}
        <Segmented<Frame>
          value={frame}
          onChange={setFrame}
          options={[
            { value: 'ground', label: 'From the ground' },
            { value: 'cart', label: 'From the cart' },
          ]}
          ariaLabel="which frame to watch from"
        />
        <Field label="cart speed" value={`${speed} m/s`}>
          <Slider
            value={speed}
            min={0}
            max={8}
            step={0.5}
            onChange={(v) => change(() => setSpeed(v))}
            ariaLabel="cart speed"
          />
        </Field>
        <Field label="speeds up by" value={`${accel} m/s²`}>
          <Slider
            value={accel}
            min={-2}
            max={2}
            step={0.5}
            onChange={(v) => change(() => setAccel(v))}
            ariaLabel="cart acceleration after launch"
          />
        </Field>
      </>
    );
  } else {
    // ── dropped and thrown ───────────────────────────────────────────────────────
    const reach = Math.max(throwSpeed * pairTime, 1);
    const xMin = -2.5;
    const span = reach + 4;
    const top = height + 1.5;
    const k = Math.min((W - 40) / span, (H - 60) / top);
    const X = (x: number): number => 20 + (x - xMin) * k;
    const Y = (y: number): number => H - 36 - y * k;
    const now = dropAndThrow(height, throwSpeed, G_EARTH, Math.min(t, pairTime));
    const marks: ReactNode[] = [];
    for (let s = 0; s <= tt + 1e-9; s += STROBE / 1.5) {
      const p = dropAndThrow(height, throwSpeed, G_EARTH, s);
      marks.push(
        <g key={s.toFixed(3)}>
          <line
            x1={X(p.dropped.x)}
            y1={Y(p.dropped.y)}
            x2={X(p.thrown.x)}
            y2={Y(p.thrown.y)}
            stroke={HUE.soft}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.7}
          />
          <circle cx={X(p.dropped.x)} cy={Y(p.dropped.y)} r={3.2} fill={tint(HUE[1], 55)} />
          <circle cx={X(p.thrown.x)} cy={Y(p.thrown.y)} r={3.2} fill={tint(HUE[2], 55)} />
        </g>,
      );
    }
    scene = (
      <>
        <Ground x1={0} x2={W} y={Y(0)} />
        <Block x={X(-2.2)} y={Y(height)} w={2.2 * k} h={height * k} color={tint(HUE.soft, 25)} radius={2} />
        {marks}
        <Ball cx={X(now.dropped.x)} cy={Y(now.dropped.y)} r={8} color={HUE[1]} />
        <Ball cx={X(now.thrown.x)} cy={Y(now.thrown.y)} r={8} color={HUE[2]} />
        <FigText x={X(0) - 8} y={Y(height) - 14} anchor="end" tone="hue-1" size="note">
          dropped
        </FigText>
        <FigText x={X(0) + 10} y={Y(height) - 14} tone="hue-2" size="note">
          thrown
        </FigText>
        <Track
          points={[
            [X(0), Y(height)],
            [X(0), Y(0)],
          ]}
          color={HUE.soft}
          weight="hair"
          opacity={0.5}
        />
      </>
    );
    readout = done ? (
      <Readout value="They land together" sub={`after ${pairTime.toFixed(2)} s`} />
    ) : predict && !guessed ? (
      <Readout value="Which lands first?" sub="Predict, then release" />
    ) : (
      <Readout value={`${t.toFixed(2)} s`} sub="falling" />
    );
    metrics = done ? (
      <div className="lab-metric-list">
        <div>
          <span>thrown ball lands</span>
          <strong>{(throwSpeed * pairTime).toFixed(1)} m out</strong>
        </div>
      </div>
    ) : null;
    observation = done
      ? 'At every flash the two balls were at the same height. The sideways speed changed where the ball went, not when it landed.'
      : 'The dashed lines join the two balls at the same instant. Watch whether they ever tilt.';
    narration = done
      ? `Both balls landed after ${pairTime.toFixed(2)} seconds.`
      : `Both balls at height ${now.dropped.y.toFixed(1)} metres.`;
    claim = 'Two balls leave a ledge together';
    dock = (
      <>
        {predict && (
          <Segmented<PairGuess>
            value={pairGuess}
            onChange={(v) => {
              reset();
              setPairGuess(v);
            }}
            options={[
              { value: 'dropped', label: 'Dropped first' },
              { value: 'together', label: 'Together' },
              { value: 'thrown', label: 'Thrown first' },
            ]}
            ariaLabel="your prediction"
          />
        )}
        <Field label="throw speed" value={`${throwSpeed} m/s`}>
          <Slider
            value={throwSpeed}
            min={0}
            max={14}
            step={1}
            onChange={(v) => change(() => setThrowSpeed(v))}
            ariaLabel="sideways throw speed"
          />
        </Field>
      </>
    );
  }

  const figure = (
    <div ref={viewRef}>
      <Figure viewBox={[W, H]} domain="physics" label={`${claim}. ${narration}`}>
        {scene}
      </Figure>
    </div>
  );

  return (
    <Activity.Root className="physics-moving-launcher">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Projectiles"
          title={
            title ??
            (mode === 'cart' ? 'Fired straight up from a moving cart' : 'Dropped, or thrown sideways?')
          }
          description={
            prompt ??
            (mode === 'cart'
              ? 'The cart rolls on while the ball is in the air. Predict where the ball comes down, then fire.'
              : 'One ball is dropped and one is thrown sideways at the same moment. Predict which lands first.')
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        {mode === 'cart' ? (
          <>
            <span>cart {speed} m/s</span>
            {accel !== 0 && (
              <span>
                then {accel > 0 ? '+' : ''}
                {accel} m/s²
              </span>
            )}
          </>
        ) : (
          <span>ledge {height} m</span>
        )}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Projectile scene">{figure}</Activity.Canvas>
        <Activity.Dock>{dock}</Activity.Dock>
        {readout}
        {metrics}
      </Activity.Workspace>
      <Activity.Transport>
        <RunTransport
          running={running}
          onReset={reset}
          onToggle={fire}
          state={running ? 'In the air' : done ? 'Landed' : canFire ? 'Ready' : 'Predict first'}
          disabled={!canFire}
          runLabel={mode === 'cart' ? (done ? 'Fire again' : 'Fire') : done ? 'Again' : 'Release'}
          resetLabel="Reset the launch"
        />
      </Activity.Transport>
      <Activity.Feedback>
        <span>What to notice</span>
        <div>{observation}</div>
      </Activity.Feedback>
      <LiveRegion>{narration}</LiveRegion>
    </Activity.Root>
  );
}
