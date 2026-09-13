'use client';

/**
 * ImpulseLab, "Catch the egg", why a long contact time saves you.
 *
 * The SAME ball at the SAME speed is brought to rest, so the impulse it delivers
 * is FIXED: J = Δp = m·v. You only change HOW LONG the stop takes (a hard wall vs
 * a soft glove / airbag). The force–time pulse is modelled as a half-sine,
 * F(t) = F_peak·sin(πt/Δt), whose area ∫F dt = F_peak·(2Δt/π) is pinned to Δp ,
 * so as Δt grows the curve morphs from a tall-thin SPIKE (hard, big peak force)
 * to a low-wide BUMP (soft), the two shaded areas staying equal on FIXED axes:
 * the single-image proof that impulse is conserved while peak force is not.
 *
 * A fragile target (egg) cracks if the peak force tops its limit, so "bend your
 * knees / airbags / follow-through" stops being a slogan and becomes a number.
 *
 * Tokenized SVG; time-dependent (integrator here); honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Polyline, Label, useInView, useLearner } from '@classytic/stage';
import { Slider, StatusPill } from '../../kit/controls.js';
import { Field, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { SceneSurface, SimulationTransport, TracePanel } from '../mechanics/presentation.js';
import { halfSinePeakForce, halfSinePulse } from '../mechanics/core.js';
import { Arrow, FigTag, FigText, Figure, Ground, HUE, STROKE, alpha, shade } from '../../kit/figure/index.js';

const IMPULSE_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Catch the egg: same impulse, safer force',
  objectives: [
    'Relate impulse to force-time area',
    'Explain why longer stopping time lowers peak force',
    'Transfer the model to a safety design',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the safer catch',
      lead: 'Commit before changing the cushion.',
      success: 'safety-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Run the impact',
      lead: 'Launch the egg and follow the force pulse.',
      controls: true,
      reveal: ['model'],
      success: 'impact-finished',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare area and peak',
      lead: 'Read the fixed impulse and changing peak force.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the safer stop',
      lead: 'Use J = FΔt to connect stopping time and force.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Design a soft landing',
      lead: 'Increase contact time until the egg survives.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'safe-stop',
    },
  ],
  questions: [
    {
      id: 'safety',
      prompt: 'The same moving egg must stop. Which change reduces its peak force?',
      choices: [
        { value: 'longer', label: 'Increase stopping time' },
        { value: 'shorter', label: 'Decrease stopping time' },
        { value: 'same', label: 'Stopping time cannot matter' },
      ],
      answer: 'longer',
      explain: 'For the same momentum change, spreading the impulse over more time lowers the force peak.',
    },
  ],
  success: [
    {
      id: 'safety-answer',
      source: 'answer',
      key: 'safety',
      operator: 'eq',
      value: 'longer',
      pendingLabel: 'Choose the safer stopping-time change.',
    },
    {
      id: 'impact-finished',
      source: 'metric',
      key: 'settled',
      operator: 'eq',
      value: true,
      pendingLabel: 'Run the impact to completion.',
    },
    {
      id: 'safe-stop',
      source: 'metric',
      key: 'safe',
      operator: 'eq',
      value: true,
      pendingLabel: 'Increase contact time until the egg survives.',
    },
  ],
};

export interface ImpulseProps {
  mass?: number;
  speed?: number;
  /** Contact time in seconds (soft = long). */
  contact?: number;
  /** Peak force the fragile target survives (N). */
  crackForce?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['mass','speed'] }` to fix the impulse. */
  controlConfig?: ControlConfig;
  activity?: string | AuthoredActivity;
}

// Fixed axes for the force–time graph so EQUAL impulse reads as EQUAL shaded area.
const T_MAX = 0.34; // s, x-axis span
const F_MAX = 360; // N, y-axis span
const DT_MIN = 0.02,
  DT_MAX = 0.3;

export function ImpulseLab({
  mass = 0.5,
  speed = 8,
  contact = 0.05,
  crackForce = 120,
  title = 'Catch the egg: stretch the stop, shrink the force',
  prompt = 'Same ball, same speed, so the impulse J = m·v is fixed. Drag the contact time: a softer, slower stop keeps the same area but a much smaller peak force.',
  objectives,
  controlConfig,
  activity = 'impulse',
}: ImpulseProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'impulse';
  const authoredActivity = typeof activity === 'string' ? IMPULSE_ACTIVITY : activity;
  const [m, setM] = useState(mass);
  const [v, setV] = useState(speed);
  const [dt, setDt] = useState(clamp(contact, DT_MIN, DT_MAX));
  const [running, setRunning] = useState(false);

  const tRef = useRef(0); // animation clock, 0..(approach+dt+settle)
  const reduce = useReducedMotion();
  const learner = useLearner();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const dp = m * v; // impulse delivered to stop the ball
  const fpeak = halfSinePeakForce(dp, dt);
  const cracks = fpeak > crackForce;
  const curve = halfSinePulse(dp, dt);
  const hard = halfSinePulse(dp, DT_MIN); // faint reference: the hard-wall spike

  const APPROACH = 0.6,
    SETTLE = 0.5;
  const TOTAL = APPROACH + dt + SETTLE;

  const repaint = useFrameTick(running && inView, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
    if (tRef.current >= TOTAL) {
      setRunning(false);
      learner?.report({
        activity: 'impulse',
        correct: !cracks,
        score: { raw: cracks ? 0 : 1, max: 1 },
        completion: true,
      });
    }
  });

  const launch = (): void => {
    tRef.current = 0;
    if (reduce) {
      tRef.current = TOTAL;
      repaint();
      return;
    }
    setRunning(true);
  };
  const onParam =
    (set: (n: number) => void) =>
    (n: number): void => {
      set(n);
      setRunning(false);
      tRef.current = 0;
    };

  // ---- impact-scene geometry ----
  // The egg flies in from the left, compresses the cushion, then rests. Scene
  // geometry is deliberately separate from the graph coordinate system: the
  // learner sees an object first and reads the measurement below it.
  const t = tRef.current;
  const wallX = 6;
  const ballR = 0.9;
  const restX = wallX - ballR; // ball centre when fully stopped at the cushion face
  const startX = -6;
  // compression fraction 0..1 over the contact window
  const phase = t < APPROACH ? 0 : t < APPROACH + dt ? (t - APPROACH) / dt : 1;
  // squish depth scales with Δt (soft = deep give); pure visual cue
  const give = 0.4 + 2.6 * ((dt - DT_MIN) / (DT_MAX - DT_MIN));
  const compress = Math.sin(phase * Math.PI) * give; // in then back a touch
  const settled = t >= APPROACH + dt;
  const ballX = t < APPROACH ? startX + (restX - give - startX) * (t / APPROACH) : restX - compress;
  const sceneX = 92 + ((ballX - startX) / (restX - startX)) * 438;
  const cushionDepth = 36 + give * 11;
  const cushionX = 548 - Math.sin(phase * Math.PI) * cushionDepth * 0.55;
  const eggTilt = running ? -8 + phase * 14 : 0;

  const scene = (
    <Figure
      viewBox={[720, 224]}
      domain="physics"
      label={`A ${m} kilogram egg approaches at ${v} metres per second and stops against a cushion over ${(dt * 1000).toFixed(0)} milliseconds.`}
      className="physics-impulse-scene"
    >
      <Ground x1={38} x2={682} y={184} />
      <FigText x={42} y={30} size="eyebrow" tone="soft">
        SAME EGG · SAME MOMENTUM
      </FigText>
      <FigText x={678} y={30} size="eyebrow" tone="soft" anchor="end">
        ADJUSTABLE CATCH
      </FigText>

      <g transform={`translate(${sceneX} 137) rotate(${eggTilt})`}>
        <ellipse cx={0} cy={47} rx={27} ry={5} fill={alpha(HUE.ink, 12)} />
        <path
          d="M 0 -42 C -27 -39 -36 -7 -31 17 C -27 40 -13 51 0 51 C 13 51 27 40 31 17 C 36 -7 27 -39 0 -42 Z"
          fill={cracks && settled ? alpha(HUE.danger, 45) : HUE.warn}
          stroke={shade(cracks && settled ? HUE.danger : HUE.warn)}
          strokeWidth={STROKE.edge}
        />
        <ellipse cx={-9} cy={-22} rx={8} ry={12} fill="var(--fig-sheen)" opacity={0.55} />
        {cracks && settled ? (
          <path
            d="M -3 -18 L 6 -6 L -2 5 L 8 18 L 1 32"
            fill="none"
            stroke={HUE.danger}
            strokeWidth={STROKE.bold}
          />
        ) : null}
      </g>

      {t < APPROACH ? (
        <Arrow x1={sceneX - 48} y1={72} x2={sceneX + 48} y2={72} color={HUE[1]} weight="bold" />
      ) : null}
      <FigTag x={sceneX} y={45} anchor="middle" color={HUE[1]}>{`${v} m/s`}</FigTag>

      <rect
        x={632}
        y={58}
        width={20}
        height={126}
        rx={5}
        fill="var(--fig-metal)"
        stroke="var(--fig-outline)"
        strokeWidth={STROKE.edge}
      />
      {[0, 1, 2].map((layer) => (
        <rect
          key={layer}
          x={cushionX + layer * 8}
          y={68 + layer * 4}
          width={632 - cushionX - layer * 8}
          height={106 - layer * 8}
          rx={14}
          fill={alpha(cracks ? HUE.warn : HUE.good, 12 + layer * 7)}
          stroke={alpha(cracks ? HUE.warn : HUE.good, 70)}
          strokeWidth={STROKE.hair}
        />
      ))}
      <rect
        x={cushionX}
        y={68}
        width={632 - cushionX}
        height={106}
        rx={14}
        fill={alpha(cracks ? HUE.warn : HUE.good, 16)}
        stroke={cracks ? HUE.warn : HUE.good}
        strokeWidth={STROKE.edge}
      />
      {[91, 116, 141].map((y) => (
        <path
          key={y}
          d={`M ${cushionX + 10} ${y} Q ${(cushionX + 632) / 2} ${y - 7} 622 ${y}`}
          fill="none"
          stroke={cracks ? HUE.warn : HUE.good}
          strokeWidth={STROKE.hair}
          opacity={0.55}
        />
      ))}
      <FigTag x={594} y={45} anchor="middle" color={cracks ? HUE.warn : HUE.good}>
        {dt > 0.16 ? 'soft catch' : dt < 0.06 ? 'hard stop' : 'cushion'}
      </FigTag>
      <FigText x={594} y={207} anchor="middle" size="note" tone={cracks ? 'hot' : 'good'}>
        {cracks ? 'too little stopping time' : 'longer contact · lower peak'}
      </FigText>
    </Figure>
  );

  // ---- force–time graph (fixed axes; shaded area = impulse) ----
  const gv = { xMin: 0, xMax: T_MAX, yMin: 0, yMax: F_MAX };
  const playT = clamp(t - APPROACH, 0, dt);
  const filled = curve.filter((p) => p.x <= playT);
  const graph = (
    <Stage
      view={gv}
      height={175}
      preserveAspect={false}
      ariaLabel={`Force versus time. Peak force ${fpeak.toFixed(0)} newtons over ${(dt * 1000).toFixed(0)} milliseconds`}
    >
      {/* axes */}
      <Segment
        from={{ x: 0, y: 0 }}
        to={{ x: T_MAX, y: 0 }}
        color="var(--stage-fg)"
        opacity={0.5}
        weight={1.5}
      />
      <Segment
        from={{ x: 0, y: 0 }}
        to={{ x: 0, y: F_MAX }}
        color="var(--stage-fg)"
        opacity={0.5}
        weight={1.5}
      />
      <Label x={T_MAX} y={0} text="time" color="var(--stage-muted)" size={10} dy={-7} anchor="end" />
      <Label
        x={0}
        y={F_MAX * 0.96}
        text="force (N)"
        color="var(--stage-muted)"
        size={10}
        dy={8}
        anchor="start"
      />
      {/* crack threshold */}
      <Segment
        from={{ x: 0, y: crackForce }}
        to={{ x: T_MAX, y: crackForce }}
        color="var(--stage-warn)"
        opacity={0.7}
        weight={1.2}
        dashed
      />
      <Label
        x={T_MAX}
        y={crackForce}
        text="fragile limit"
        color="var(--stage-warn)"
        size={9}
        dy={-3}
        anchor="end"
      />
      {/* faint hard-wall reference spike */}
      <Polyline points={hard} color="var(--stage-muted)" weight={1} opacity={0.5} dashed />
      {/* the pulse + its shaded impulse */}
      <Polygon
        points={[{ x: 0, y: 0 }, ...curve, { x: dt, y: 0 }]}
        color="none"
        fill="var(--stage-accent)"
        fillOpacity={0.18}
        weight={0}
      />
      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      {/* swept fill during playback */}
      {running && filled.length > 1 && (
        <Polygon
          points={[{ x: 0, y: 0 }, ...filled, { x: playT, y: 0 }]}
          color="none"
          fill="var(--stage-accent)"
          fillOpacity={0.4}
          weight={0}
        />
      )}
      {/* peak marker */}
      <Segment
        from={{ x: dt / 2, y: 0 }}
        to={{ x: dt / 2, y: fpeak }}
        color="var(--stage-accent)"
        opacity={0.5}
        weight={1}
        dashed
      />
    </Stage>
  );

  const figure = (
    <div ref={viewRef} className="physics-visual-stack">
      <SceneSurface
        tone="grid"
        data-state={running ? 'impact' : settled ? (cracks ? 'failed' : 'safe') : 'ready'}
      >
        {scene}
      </SceneSurface>
      <TracePanel
        className="physics-impulse-trace"
        title="Force spread over stopping time"
        detail={`Both curves enclose the same impulse: ${dp.toFixed(1)} N·s`}
        legend={
          <div aria-label="Force curve legend">
            <span data-kind="hard">hard stop</span>
            <span data-kind="chosen">your cushion</span>
          </div>
        }
      >
        {graph}
      </TracePanel>
    </div>
  );

  const aside = (
    <>
      <div className="physics-dynamics-ledger">
        <div>
          <span>Impulse · Δp</span>
          <strong>{dp.toFixed(1)} kg·m/s</strong>
        </div>
        <div>
          <span>Contact time · Δt</span>
          <strong>{(dt * 1000).toFixed(0)} ms</strong>
        </div>
        <div data-alert={cracks} data-highlight={!cracks}>
          <span>Peak force</span>
          <strong>{fpeak.toFixed(0)} N</strong>
        </div>
      </div>
      <StatusPill ok={!cracks}>
        {cracks ? 'Impact exceeds the egg limit' : 'Egg survives the impact'}
      </StatusPill>
      <p className="physics-explain">
        Same area under both curves = same impulse. Spreading the stop over more time is exactly why
        <strong> airbags, crumple zones, knee-bending landings</strong> and <strong>following through</strong>{' '}
        work.
      </p>
      <LiveRegion>{`Impulse ${dp.toFixed(1)}, contact ${(dt * 1000).toFixed(0)} milliseconds, peak force ${fpeak.toFixed(0)} newtons. Egg ${cracks ? 'cracks' : 'survives'}.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <Field label="contact Δt" value={`${(dt * 1000).toFixed(0)} ms`}>
        <Slider
          value={dt}
          min={DT_MIN}
          max={DT_MAX}
          step={0.005}
          onChange={onParam(setDt)}
          ariaLabel="contact time (seconds)"
        />
      </Field>
      <Field label="mass" value={`${m} kg`}>
        <Slider
          value={m}
          min={0.2}
          max={1.5}
          step={0.1}
          onChange={onParam(setM)}
          ariaLabel="ball mass (kg)"
        />
      </Field>
      <Field label="speed" value={`${v} m/s`}>
        <Slider
          value={v}
          min={2}
          max={12}
          step={0.5}
          onChange={onParam(setV)}
          ariaLabel="impact speed (m/s)"
        />
      </Field>
      <SimulationTransport
        running={running}
        onReset={() => {
          setRunning(false);
          tRef.current = 0;
        }}
        onToggle={running ? () => setRunning(false) : launch}
        state={running ? 'Impact in progress' : settled ? (cracks ? 'Egg cracked' : 'Safe stop') : 'Ready'}
        detail={`${(dt * 1000).toFixed(0)} ms contact`}
        startLabel={settled ? 'Run again' : 'Launch impact'}
        resetLabel="Reset impact"
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
          <span>
            {running
              ? t < APPROACH
                ? 'Approaching'
                : 'Impact'
              : settled
                ? cracks
                  ? 'Cracked'
                  : 'Safe stop'
                : 'Ready'}
          </span>
          <span>{(dt * 1000).toFixed(0)} ms</span>
          <span>{fpeak.toFixed(0)} N peak</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={`The shaded area stays ${dp.toFixed(1)} N·s. A longer stop spreads that impulse across time and lowers the peak force.`}
      transcript={
        <p>{`The ${m.toFixed(1)} kilogram egg approaches at ${v.toFixed(1)} metres per second. Stopping it over ${(dt * 1000).toFixed(0)} milliseconds gives an impulse of ${dp.toFixed(1)} newton seconds and a peak force of ${fpeak.toFixed(0)} newtons. The egg ${cracks ? 'cracks' : 'survives'}.`}</p>
      }
      controlConfig={controlConfig}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="impact-finished" met={settled} complete={complete} />
          <AuthoredMetricGate
            conditionId="safe-stop"
            met={settled && !cracks && dt !== clamp(contact, DT_MIN, DT_MAX)}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
