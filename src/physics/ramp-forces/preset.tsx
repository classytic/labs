'use client';

/**
 * RampForcesLab, "Tilt the Ramp", where gravity gets a share (F = ma) AND you
 * can push/pull the crate.
 *
 * Tilt the incline and the weight SPLITS into a down-slope share (mg sinθ) and a
 * press-in share (mg cosθ = the normal N, which visibly shrinks as you tilt, the
 * headline misconception). Add an applied force (push up-slope / pull down) and
 * watch the SUM of forces: static friction holds it (adjusting up to μs·N) until
 * the drive exceeds that grip, then kinetic friction (μk·N, weaker) takes over
 * and it accelerates, a = net/m. A force-ledger bar shows every along-slope
 * force adding to the net, so "the forces add up" is visual, not just stated.
 *
 * Up-slope is the POSITIVE axis throughout. Tokenized SVG; reuses the diagram kit;
 * honours prefers-reduced-motion.
 */

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Label, useFrameLoop, useInView, type Vec2 } from '@classytic/stage';
import { toRad } from '../../core/util.js';
import { useReducedMotion } from '../../kit/anim.js';
import { AngleArc, RightAngleMark } from '../../kit/diagram/annotations.js';
import { Slider, Chip, StatusPill } from '../../kit/controls.js';
import { Field, Control, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { MechanicsVector, SceneSurface, SimulationTransport } from '../mechanics/presentation.js';
import { MechanicsCrateGlyph } from '../mechanics/glyphs.js';
import { rampForceState } from '../mechanics/core.js';

const RAMP_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Tilt the ramp: when does friction lose?',
  objectives: [
    'Resolve weight into ramp-aligned components',
    'Distinguish static and kinetic friction',
    'Use the force sum to predict acceleration',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the threshold',
      lead: 'Decide how static friction behaves before the crate slips.',
      success: 'friction-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Break static grip',
      lead: 'Change the angle or push until the crate can move, then release it.',
      controls: true,
      reveal: ['model'],
      success: 'released',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the force ledger',
      lead: 'Compare gravity, applied force, friction, and the net.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the transition',
      lead: 'Explain why static friction adjusts but kinetic friction has a fixed magnitude.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Reverse the motion',
      lead: 'Use an applied force to change the net-force direction.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'direction-changed',
    },
  ],
  questions: [
    {
      id: 'friction',
      prompt: 'Before an object slips, static friction…',
      choices: [
        { value: 'adjusts', label: 'adjusts up to a maximum' },
        { value: 'maximum', label: 'is always at its maximum' },
        { value: 'zero', label: 'is always zero' },
      ],
      answer: 'adjusts',
      explain: 'Static friction matches the required opposing force until the maximum μₛN is exceeded.',
    },
  ],
  success: [
    {
      id: 'friction-answer',
      source: 'answer',
      key: 'friction',
      operator: 'eq',
      value: 'adjusts',
      pendingLabel: 'Choose how static friction behaves.',
    },
    {
      id: 'released',
      source: 'metric',
      key: 'released',
      operator: 'eq',
      value: true,
      pendingLabel: 'Create a nonzero net force and release the crate.',
    },
    {
      id: 'direction-changed',
      source: 'metric',
      key: 'directionChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Reverse the initial net-force direction.',
    },
  ],
};

export interface RampForcesProps {
  angleDeg?: number;
  mass?: number;
  /** Static coefficient μs (the grip that must be broken to start moving). */
  friction?: number;
  /** Kinetic coefficient μk (while sliding; clamped ≤ μs). */
  frictionKinetic?: number;
  /** Applied force along the slope, N. Positive = push up-slope, negative = pull/push down. */
  appliedN?: number;
  g?: number;
  showComponents?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Creator's per-knob hide/lock policy. Names: angle, push, mass, frictionStatic, frictionKinetic, components, release. */
  controlConfig?: ControlConfig;
  activity?: string | AuthoredActivity;
}

const L = 4.2; // slope length (metres)
const HS = 0.52; // crate half-size (metres)
const WLEN = 1.55; // compact reference length; keeps the complete force diagram inside the focused viewport
const LANE = 0.17; // perpendicular gap so the along-slope arrows sit in separate lanes
const CRATE_EDGE = 0.43; // vectors begin outside the glyph instead of disappearing behind it

const C_MG = 'var(--stage-fg)';
const C_N = 'var(--stage-primary)';
const C_FRIC = 'var(--stage-warn)';
const C_GRAV = 'color-mix(in oklab, var(--stage-fg) 50%, transparent)';
const C_APPLIED = 'var(--stage-accent)';
const C_NET = 'var(--stage-good)';

/** One signed force bar on the along-slope ledger (left = down-slope, right = up). */
function LedgerBar({
  label,
  v,
  max,
  color,
  bold,
}: {
  label: string;
  v: number;
  max: number;
  color: string;
  bold?: boolean;
}): ReactNode {
  const pct = Math.min(50, (Math.abs(v) / (max || 1)) * 50);
  const up = v >= 0;
  return (
    <div className="physics-force-row" data-bold={bold || undefined}>
      <span className="physics-force-label">{label}</span>
      <div className="physics-force-track">
        <div className="physics-force-zero" />
        <div
          className="physics-force-fill"
          data-direction={up ? 'up' : 'down'}
          style={{ '--force-width': `${pct}%`, '--force-color': color } as CSSProperties}
        />
      </div>
      <span className="physics-force-value">
        {Math.abs(v) < 0.5 ? '0' : Math.abs(v).toFixed(0)}N{Math.abs(v) < 0.5 ? '' : up ? ' ↑' : ' ↓'}
      </span>
    </div>
  );
}

export function RampForcesLab({
  angleDeg = 25,
  mass = 2,
  friction = 0.4,
  frictionKinetic = 0.3,
  appliedN = 0,
  g = 9.8,
  showComponents = false,
  title = 'Tilt the Ramp: split the weight, add a push, sum the forces',
  prompt = 'Tilt it, then push or pull: static friction holds until the forces win, then it slides at a = net/m.',
  objectives,
  controlConfig,
  activity = 'ramp-forces',
}: RampForcesProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'ramp-forces';
  const authoredActivity = typeof activity === 'string' ? RAMP_ACTIVITY : activity;
  const [deg, setDeg] = useState(angleDeg);
  const [mus, setMus] = useState(friction);
  const [mukRaw, setMuk] = useState(frictionKinetic);
  const [m, setM] = useState(mass);
  const [applied, setApplied] = useState(appliedN);
  const [comps, setComps] = useState(showComponents);
  const [p, setP] = useState(0.55); // crate position along the slope (0 bottom → 1 top)
  const [sliding, setSliding] = useState(false);
  const [landed, setLanded] = useState(false);
  const startRef = useRef<number | null>(null);
  const p0 = useRef(0.55);
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const th = toRad(deg);
  const cos = Math.cos(th),
    sin = Math.sin(th);
  const muk = Math.min(mukRaw, mus); // kinetic ≤ static (physical)

  // ── forces along the slope, UP = positive ───────────────────────────────────
  const W = m * g;
  const forceState = rampForceState(m, g, th, applied, mus, muk);
  const N = forceState.normal;
  const gravAlong = forceState.gravityAlong;
  const fsMax = forceState.staticLimit;
  const held = forceState.held;
  const frictionUp = forceState.friction;
  const net = forceState.net;
  const initialNet = rampForceState(
    mass,
    g,
    toRad(angleDeg),
    appliedN,
    friction,
    Math.min(frictionKinetic, friction),
  ).net;
  const aSigned = forceState.acceleration;
  const a = Math.abs(aSigned);
  const slidesUp = net > 0;
  const ledgerMax = Math.max(gravAlong, Math.abs(applied), Math.abs(frictionUp), Math.abs(net), 1);

  // geometry (metres): wedge apex at origin, slope length L at angle θ
  const Ctop: Vec2 = { x: L * cos, y: L * sin };
  const baseCorner: Vec2 = { x: L * cos, y: 0 };
  const u: Vec2 = { x: cos, y: sin }; // up-slope unit
  const nrm: Vec2 = { x: -sin, y: cos }; // out-of-surface unit
  const dn: Vec2 = { x: -cos, y: -sin }; // down-slope unit
  const surf: Vec2 = { x: p * Ctop.x, y: p * Ctop.y };
  const O: Vec2 = { x: surf.x + nrm.x * HS, y: surf.y + nrm.y * HS };

  const sc = WLEN / (W || 1); // newtons → metres
  const arrow = (dir: Vec2, mag: number): Vec2 => ({ x: dir.x * mag * sc, y: dir.y * mag * sc });
  const add = (p1: Vec2, p2: Vec2): Vec2 => ({ x: p1.x + p2.x, y: p1.y + p2.y });
  const lane = (k: number): Vec2 => ({ x: O.x + nrm.x * LANE * k, y: O.y + nrm.y * LANE * k });
  const beyond = (tip: Vec2, dir: Vec2, off = 15): { x: number; y: number; dx: number; dy: number } => {
    const d = Math.hypot(dir.x, dir.y) || 1;
    return { x: tip.x, y: tip.y, dx: (dir.x / d) * off, dy: (-dir.y / d) * off };
  };

  // along-slope arrows live in separate perpendicular LANES so they never overlap
  const mgTail: Vec2 = { x: O.x, y: O.y - CRATE_EDGE };
  const mgTip: Vec2 = { x: mgTail.x, y: mgTail.y - WLEN };
  const nTail = add(O, { x: nrm.x * CRATE_EDGE, y: nrm.y * CRATE_EDGE });
  const nTip = add(nTail, arrow(nrm, N));
  const appDir = applied >= 0 ? u : dn;
  const appLane = lane(1);
  const appTail = add(appLane, { x: appDir.x * CRATE_EDGE, y: appDir.y * CRATE_EDGE });
  const appTip = add(appTail, arrow(appDir, Math.abs(applied)));
  const fricDir = frictionUp >= 0 ? u : dn;
  const fricLane = lane(-1);
  const fricTail = add(fricLane, { x: fricDir.x * CRATE_EDGE, y: fricDir.y * CRATE_EDGE });
  const fricTip = add(fricTail, arrow(fricDir, Math.abs(frictionUp)));
  const gravTail = add(O, { x: dn.x * CRATE_EDGE, y: dn.y * CRATE_EDGE });
  const gravTip = add(gravTail, arrow(dn, gravAlong)); // mg sinθ (centre lane)

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs;
      const t = (f.timeMs - startRef.current) / 1000;
      const np = p0.current + (0.5 * aSigned * t * t) / L; // signed: up or down
      if (np <= 0 || np >= 1) {
        setP(Math.max(0, Math.min(1, np)));
        setSliding(false);
        setLanded(true);
      } else setP(np);
    },
    { running: sliding && inView },
  );

  const release = (): void => {
    if (held) return;
    p0.current = p;
    startRef.current = null;
    if (reduce) {
      setP(slidesUp ? 1 : 0);
      setLanded(true);
      return;
    }
    setSliding(true);
  };
  const reset =
    (set: (n: number) => void) =>
    (n: number): void => {
      set(n);
      setSliding(false);
      setP(0.55);
      p0.current = 0.55;
      setLanded(false);
    };

  // Keep the experiment dominant in the viewport. The old square-ish world
  // bounds shrank the ramp into the middle of a wide card and made every
  // annotation feel like a tiny technical footnote.
  const view = { xMin: -1.15, xMax: L + 1.45, yMin: -1.55, yMax: 3.8 };

  const figure = (
    <SceneSurface ref={viewRef}>
      <Stage
        view={view}
        height={280}
        preserveAspect
        ariaLabel={`Ramp at ${deg} degrees, applied force ${applied} newtons; ${held ? 'held by friction' : `sliding ${slidesUp ? 'up' : 'down'} at ${a.toFixed(1)} metres per second squared`}`}
      >
        <Segment
          from={{ x: -3, y: 0 }}
          to={{ x: L + 1, y: 0 }}
          color="var(--stage-fg)"
          opacity={0.5}
          weight={2}
        />
        <Polygon
          points={[{ x: 0, y: 0 }, baseCorner, Ctop]}
          color="var(--stage-metal)"
          fill="var(--stage-metal)"
          fillOpacity={0.16}
          weight={2}
        />
        <AngleArc
          at={{ x: 0, y: 0 }}
          from={{ x: 1, y: 0 }}
          to={u}
          rPx={30}
          label={`${deg}°`}
          color="var(--stage-fg)"
        />
        <MechanicsCrateGlyph at={O} angleDeg={deg} />

        {/* weight mg (down) + normal N (out), non-collinear with the slope */}
        <MechanicsVector
          tail={mgTail}
          tip={mgTip}
          labelAt={beyond(mgTip, { x: 0, y: -1 })}
          label="mg"
          color={C_MG}
        />
        <MechanicsVector
          tail={nTail}
          tip={nTip}
          labelAt={nTip}
          labelDx={8}
          labelDy={-18}
          label={comps ? 'N = mg cosθ' : 'N'}
          color={C_N}
          active={comps}
        />

        {/* gravity's down-slope share (components mode), centre lane */}
        {comps && gravAlong > 0.5 && (
          <>
            <MechanicsVector
              tail={gravTail}
              tip={gravTip}
              labelAt={gravTip}
              labelDx={-44}
              labelDy={-10}
              label="mg sinθ"
              color={C_GRAV}
              active
            />
            <RightAngleMark at={surf} u={u} v={nrm} />
          </>
        )}

        {/* friction, its own lane below the box (direction = whichever way it resists) */}
        {Math.abs(frictionUp) > 0.5 && (
          <>
            <MechanicsVector
              tail={fricTail}
              tip={fricTip}
              labelAt={fricTip}
              labelDx={16}
              labelDy={-16}
              label={held ? 'fₛ' : 'fₖ'}
              color={C_FRIC}
              active={!held}
            />
          </>
        )}

        {/* applied push/pull, its own lane above the box */}
        {Math.abs(applied) > 0.5 && (
          <>
            <MechanicsVector
              tail={appTail}
              tip={appTip}
              labelAt={beyond(appTip, appDir)}
              label="Fₐ"
              color={C_APPLIED}
              weight={3}
              active
            />
          </>
        )}
      </Stage>
    </SceneSurface>
  );

  const aside = (
    <>
      {/* ── force ledger: every along-slope force, summing to the net ── */}
      <div className="physics-force-ledger">
        <div className="physics-force-ledger-head">
          <span>← down-slope</span>
          <span>sum of forces along the ramp</span>
          <span>up-slope →</span>
        </div>
        <div className="physics-force-ledger-rows">
          <LedgerBar label="gravity" v={-gravAlong} max={ledgerMax} color={C_GRAV} />
          <LedgerBar label="applied" v={applied} max={ledgerMax} color={C_APPLIED} />
          <LedgerBar
            label={held ? 'friction (static)' : 'friction (kinetic)'}
            v={frictionUp}
            max={ledgerMax}
            color={C_FRIC}
          />
          <LedgerBar
            label="= net"
            v={held ? 0 : net}
            max={ledgerMax}
            color={held ? 'var(--stage-good)' : C_NET}
            bold
          />
        </div>
      </div>
      <LiveRegion>{`At ${deg} degrees with ${applied} newtons applied: net ${held ? 0 : net.toFixed(0)} newtons, ${held ? 'held by friction' : `slides ${slidesUp ? 'up' : 'down'} at ${a.toFixed(1)} metres per second squared`}.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <Control name="components">
        <Chip selected={comps} onClick={() => setComps((c) => !c)}>
          components
        </Chip>
      </Control>
      <StatusPill ok={!held}>{held ? 'friction holds' : `slides ${slidesUp ? 'up' : 'down'}`}</StatusPill>
      <Field label="angle" name="angle" value={`${deg}°`}>
        <Slider
          value={deg}
          min={0}
          max={75}
          step={1}
          onChange={reset(setDeg)}
          ariaLabel="incline angle (degrees)"
        />
      </Field>
      <Field
        label="push"
        name="push"
        value={applied === 0 ? '0' : `${Math.abs(applied)}N ${applied > 0 ? '↑' : '↓'}`}
      >
        <Slider
          value={applied}
          min={-30}
          max={30}
          step={1}
          onChange={reset(setApplied)}
          ariaLabel="applied force along the slope (newtons; positive up)"
        />
      </Field>
      <Field label="mass" name="mass" value={`${m} kg`}>
        <Slider value={m} min={1} max={10} step={0.5} onChange={reset(setM)} ariaLabel="crate mass (kg)" />
      </Field>
      <Field label="μₛ static" name="frictionStatic" value={mus.toFixed(2)}>
        <Slider
          value={mus}
          min={0}
          max={1}
          step={0.05}
          onChange={reset(setMus)}
          ariaLabel="static friction coefficient"
        />
      </Field>
      <Field label="μₖ kinetic" name="frictionKinetic" value={muk.toFixed(2)}>
        <Slider
          value={mukRaw}
          min={0}
          max={1}
          step={0.05}
          onChange={reset(setMuk)}
          ariaLabel="kinetic friction coefficient"
        />
      </Field>
      <SimulationTransport
        running={sliding}
        onReset={() => {
          setSliding(false);
          setP(0.55);
          p0.current = 0.55;
          setLanded(false);
          startRef.current = null;
        }}
        onToggle={sliding ? () => setSliding(false) : release}
        state={held ? 'Held by friction' : sliding ? 'Sliding' : landed ? 'Complete' : 'Ready'}
        detail={held ? 'increase the slope or push' : `net ${Math.abs(net).toFixed(1)} N`}
        startLabel={landed ? 'Release again' : 'Release'}
        disabled={held}
        resetLabel="Reset ramp"
      />
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{held ? 'Static equilibrium' : sliding ? 'Sliding' : landed ? 'Complete' : 'Ready'}</span>
          <span>net {net.toFixed(0)} N</span>
          <span>a {a.toFixed(1)} m/s²</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        held
          ? `Static friction supplies ${Math.abs(frictionUp).toFixed(1)} N, below its ${fsMax.toFixed(1)} N limit, so the net force is zero.`
          : `The driving force exceeded static grip; kinetic friction now opposes motion and the remaining ${Math.abs(net).toFixed(1)} N accelerates the crate.`
      }
      transcript={
        <p>{`At ${deg} degrees, gravity contributes ${gravAlong.toFixed(1)} newtons down the ramp. The applied force is ${applied.toFixed(1)} newtons and friction is ${Math.abs(frictionUp).toFixed(1)} newtons, giving ${held ? 'zero net force' : `a net force of ${net.toFixed(1)} newtons ${slidesUp ? 'up' : 'down'} the ramp`}.`}</p>
      }
      controlConfig={controlConfig}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="released" met={sliding || landed} complete={complete} />
          <AuthoredMetricGate
            conditionId="direction-changed"
            met={Math.sign(net) !== 0 && Math.sign(net) !== Math.sign(initialNet)}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
