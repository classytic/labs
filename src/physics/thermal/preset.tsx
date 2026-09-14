'use client';

/**
 * HeatingCurveLab, pour heat into ice and watch temperature climb in steps.
 *
 * The whole heat story in one picture, driven by the shared `thermal` core: a
 * burner heats a beaker (ice → water → steam), a thermometer reads the temperature,
 * and the heating curve draws itself on the right, SLOPED runs where one phase
 * warms (q = mcΔθ) and FLAT plateaus where it changes phase (q = mL, temperature
 * stuck while the latent heat goes in). The width of each part IS the heat it needs,
 * so water's huge boiling plateau (latent vaporisation ≫ everything) is impossible
 * to miss. Slide the power to heat faster, the mass for a bigger sample, or flip the
 * substance; pull power negative to cool back down. Hand-driven on ThermalCore.
 */

import { useRef, useState, type ReactNode } from 'react';
import { ThermalCore, WATER, ETHANOL, type ThermalState } from '@classytic/stage/sim';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useFrameTick, useReducedMotionDeferred } from '../../kit/anim.js';
import { usePlayGate } from '../../kit/play.js';
import { ThermometerGlyph, BeakerGlyph, BurnerGlyph } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';
import { DiagramLabel } from '../../kit/annotate.js';
import { SceneSurface, SimulationTransport } from '../mechanics/presentation.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../kit/authored-activity-runtime.js';
import { Activity } from '../../kit/activity.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

export interface HeatingCurveProps {
  /** Preset to start from (custom fields below override it). */
  substance?: 'water' | 'ethanol';
  /** Declare a custom substance by overriding any of the preset's constants. */
  substanceName?: string;
  /** Specific heats J/(g·°C). */
  cSolid?: number;
  cLiquid?: number;
  cGas?: number;
  /** Latent heats J/g. */
  lFusion?: number;
  lVapor?: number;
  /** Transition temperatures °C. */
  tMelt?: number;
  tBoil?: number;
  /** Initial sample mass, g (default 50). */
  mass?: number;
  /** Initial heating power, W (default 120; negative cools). */
  power?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 760,
  H = 440;
const GX0 = 330,
  GX1 = 736,
  GY0 = 38,
  GY1 = 396;
const kJ = (j: number): string => `${(j / 1000).toFixed(j < 10000 ? 1 : 0)} kJ`;

const heatingActivity = (objectives: string[]): AuthoredActivity => ({
  pattern: 'investigation',
  title: 'Heating curve investigation',
  objectives,
  success: [
    {
      id: 'plateau-prediction',
      source: 'answer',
      key: 'plateau',
      pendingLabel: 'Predict what happens on a phase-change plateau.',
    },
    {
      id: 'experiment-started',
      source: 'action',
      key: 'play',
      pendingLabel: 'Start the heating experiment.',
    },
    {
      id: 'law-selected',
      source: 'answer',
      key: 'law',
      pendingLabel: 'Choose the model for a phase change.',
    },
    {
      id: 'transfer-explanation',
      source: 'reflection',
      key: 'transfer',
      pendingLabel: 'Explain how a larger mass changes the curve.',
    },
  ],
  questions: [
    {
      id: 'plateau',
      prompt: 'While a pure substance changes phase at constant pressure, its temperature…',
      choices: [
        { value: 'rises', label: 'keeps rising' },
        { value: 'constant', label: 'stays constant while energy changes the phase' },
        { value: 'falls', label: 'falls' },
      ],
      answer: 'constant',
      explain: 'Energy changes intermolecular arrangement instead of raising temperature during the plateau.',
    },
    {
      id: 'law',
      prompt: 'Which relation models the energy transferred during a phase change?',
      choices: [
        { value: 'mc', label: 'q = mcΔθ' },
        { value: 'ml', label: 'q = mL' },
        { value: 'iv', label: 'P = IV' },
      ],
      answer: 'ml',
      explain: 'Latent heat q = mL applies while phase changes at constant temperature.',
    },
    {
      kind: 'reflection',
      id: 'transfer',
      prompt:
        'If the sample mass doubles at the same power, how do the segment widths and heating time change?',
      rubric: [
        'States that required energy doubles',
        'Connects doubled energy to doubled time at fixed power',
      ],
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the plateau',
      lead: 'Commit to what temperature does before adding heat.',
      success: 'plateau-prediction',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Run the experiment',
      lead: 'Start heating and compare the apparatus with the moving graph marker.',
      controls: true,
      success: 'experiment-started',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read linked evidence',
      lead: 'Slopes show warming; plateaus show energy entering without a temperature rise.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Choose the physical model',
      lead: 'Distinguish sensible heating from latent heating.',
      success: 'law-selected',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Scale the sample',
      lead: 'Transfer the energy model to a different mass.',
      success: 'transfer-explanation',
    },
  ],
});

export function HeatingCurveLab({
  substance: sub0 = 'water',
  title = 'Heating curve: pour in heat, watch it climb in steps',
  prompt = 'Heat ice until it melts, warms, and boils. Temperature rises while one phase warms (q = mcΔθ) but holds steady during a phase change (q = mL).',
  objectives = [
    'Read a heating curve: sloped = warming, flat = changing phase',
    'Use q = mcΔθ for a temperature change and q = mL for a phase change',
    'See why water’s boiling plateau is so wide (latent heat ≫ specific heat)',
  ],
  substanceName,
  cSolid,
  cLiquid,
  cGas,
  lFusion,
  lVapor,
  tMelt,
  tBoil,
  mass: mass0 = 50,
  power: power0 = 120,
}: HeatingCurveProps = {}): ReactNode {
  const [substance, setSubstance] = useState<'water' | 'ethanol'>(sub0);
  const [power, setPower] = useState(power0);
  const [mass, setMass] = useState(mass0);
  const [resetN, setResetN] = useState(0);
  const gate = usePlayGate();
  const reduceMotion = useReducedMotionDeferred();

  // Base preset + any creator overrides = the substance model.
  const base = substance === 'water' ? WATER : ETHANOL;
  const sub = {
    ...base,
    name: substanceName ?? base.name,
    cSolid: cSolid ?? base.cSolid,
    cLiquid: cLiquid ?? base.cLiquid,
    cGas: cGas ?? base.cGas,
    lFusion: lFusion ?? base.lFusion,
    lVapor: lVapor ?? base.lVapor,
    tMelt: tMelt ?? base.tMelt,
    tBoil: tBoil ?? base.tBoil,
  };
  const tStart = sub.tMelt - 20;
  const tMax = sub.tBoil + 40;

  // (re)build the core whenever the sample (substance/overrides/mass) or reset changes.
  const sig = `${substance}:${mass}:${resetN}:${sub.tMelt}:${sub.tBoil}:${sub.lFusion}:${sub.lVapor}:${sub.cLiquid}`;
  const sigRef = useRef('');
  const stateRef = useRef<ThermalState>(
    ThermalCore.reset({ substance: sub, mass, tStart, tMax, powerW: power }),
  );
  if (sigRef.current !== sig) {
    sigRef.current = sig;
    stateRef.current = ThermalCore.reset({ substance: sub, mass, tStart, tMax, powerW: power });
  }

  const repaint = useFrameTick(gate.running && !reduceMotion, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    // power is live: merge it onto state each step (like RC charge/leak target).
    stateRef.current = ThermalCore.step({ ...stateRef.current, powerW: power }, dt * 12);
  });

  const st = stateRef.current;
  const { segs, totalJ, energyJ, tempC, phase, fracMelt } = st;

  // ── curve mapping ──
  const QX = (q: number): number => GX0 + (totalJ > 0 ? q / totalJ : 0) * (GX1 - GX0);
  // The plot is drawn to a slightly HIGHER top than the run ends at, so the final climb has
  // headroom instead of running into the frame: mapping the axis straight to tMax put the last
  // segment exactly on the top edge, where it read as a clipped line.
  const tTop = tMax + (tMax - tStart) * 0.08;
  const TY = (t: number): number => GY1 - ((t - tStart) / (tTop - tStart)) * (GY1 - GY0);

  // ── apparatus display intensities from phase/fractions ──
  const iceFrac = phase === 'solid' ? 1 : phase === 'melting' ? 1 - fracMelt : 0;
  const fracBoil = st.fracBoil;
  const boiling =
    phase === 'boiling' ? 1 : phase === 'liquid' ? Math.max(0, (tempC - sub.tBoil + 25) / 25) * 0.5 : 0;
  const steam = phase === 'boiling' ? Math.max(0.25, fracBoil) : phase === 'gas' ? 1 : 0;
  const fillFrac = phase === 'gas' ? 0.05 : 0.72 * (1 - 0.55 * fracBoil);
  const tFrac = (tempC - tStart) / (tMax - tStart);

  // current segment → live formula
  const cur = segs.find((s, i) => energyJ <= s.qStart + s.q || i === segs.length - 1) ?? segs[0]!;
  const cName = cur.phase === 'solid' ? sub.solidName : cur.phase === 'gas' ? sub.gasName : sub.liquidName;
  const cVal = cur.phase === 'solid' ? sub.cSolid : cur.phase === 'gas' ? sub.cGas : sub.cLiquid;
  const pct = totalJ > 0 ? Math.round((energyJ / totalJ) * 100) : 0;

  const figure = (
    <SceneSurface className="physics-heating-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${sub.name} at ${Math.round(tempC)} degrees, ${phase}, ${pct} percent of the way through heating`}
      >
        {/* ── apparatus ── */}
        <BurnerGlyph
          cx={150}
          baseY={300}
          w={84}
          level={power > 0 ? Math.min(1, power / 200) : Math.max(-1, power / 200)}
          phase={st.tSec}
        />
        <BeakerGlyph
          x={92}
          y={132}
          w={116}
          h={140}
          fillFrac={fillFrac}
          color={sub.color}
          boiling={boiling}
          steam={steam}
          iceFrac={iceFrac}
          phase={st.tSec}
          label={`${mass} g ${sub.name.toLowerCase()}`}
        />
        <ThermometerGlyph
          cx={252}
          top={104}
          h={196}
          frac={tFrac}
          label={`${tempC >= 0 ? '' : '−'}${Math.abs(tempC).toFixed(0)}°C`}
        />

        {/* ── heating-curve graph ── */}
        {/* phase-region bands: each segment softly tints its share of the
              x-axis (warming = accent, phase change = warn) with the phase
              named at the base — the "steps" story reads at a glance, before
              the learner parses the curve itself. Clean region shading, no
              extra chrome. */}
        {segs.map((s, i) => {
          const x0 = QX(s.qStart),
            x1 = QX(s.qStart + s.q);
          const isChange = s.kind === 'change';
          const tint = isChange ? 'var(--stage-warn)' : 'var(--stage-accent)';
          const showName = x1 - x0 >= 64;
          const name = isChange
            ? s.which === 'melt'
              ? 'melting'
              : 'boiling'
            : s.phase === 'solid'
              ? sub.solidName
              : s.phase === 'gas'
                ? sub.gasName
                : sub.liquidName;
          return (
            <g key={`band${i}`}>
              <rect
                x={x0}
                y={GY0}
                width={Math.max(0, x1 - x0)}
                height={GY1 - GY0}
                fill={tint}
                opacity={isChange ? 0.06 : 0.04}
              />
              {i > 0 && <line x1={x0} y1={GY0} x2={x0} y2={GY1} stroke="var(--stage-grid)" strokeWidth={1} />}
              {showName && (
                <DiagramLabel
                  x={(x0 + x1) / 2}
                  y={GY1 - 8}
                  text={name.toLowerCase()}
                  tone="muted"
                  fontSize={11}
                  fontWeight={650}
                  maxChars={14}
                  bounds={{ left: GX0 + 4, right: GX1 - 4, top: GY0, bottom: GY1 - 4 }}
                />
              )}
            </g>
          );
        })}
        {/* axes */}
        <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <text x={GX0 - 6} y={GY0 + 4} textAnchor="end" fontSize={13} fill="var(--stage-muted)">
          °C
        </text>
        <text x={GX1} y={GY1 + 22} textAnchor="end" fontSize={13} fill="var(--stage-muted)">
          heat added →
        </text>
        {/* melt / boil guide lines */}
        {[
          { t: sub.tMelt, l: `${sub.tMelt}° melt` },
          { t: sub.tBoil, l: `${sub.tBoil}° boil` },
        ].map((g) => (
          <g key={g.l}>
            <line
              x1={GX0}
              y1={TY(g.t)}
              x2={GX1}
              y2={TY(g.t)}
              stroke="var(--stage-grid)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          </g>
        ))}
        {/* segments, sloped heat runs vs flat plateaus, each with its q */}
        {segs.map((s, i) => {
          const x0 = QX(s.qStart),
            x1 = QX(s.qStart + s.q),
            y0 = TY(s.t0),
            y1 = TY(s.t1);
          const isChange = s.kind === 'change';
          const col = isChange ? 'var(--stage-warn, #e0a020)' : 'var(--stage-accent, #3b82f6)';
          const showEnergy = x1 - x0 >= 48;
          return (
            <g key={i}>
              <line
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke={col}
                strokeWidth={isChange ? 4 : 3}
                strokeLinecap="round"
              />
              {showEnergy && (
                <DiagramLabel
                  className="physics-svg-numeric"
                  x={(x0 + x1) / 2}
                  y={isChange ? (y0 + y1) / 2 - 8 : (y0 + y1) / 2 - 7}
                  text={kJ(s.q)}
                  tone={isChange ? 'warn' : 'info'}
                  fontSize={11.5}
                  fontWeight={700}
                  bounds={{ left: GX0 + 4, right: GX1 - 4, top: GY0 + 4, bottom: GY1 - 4 }}
                />
              )}
            </g>
          );
        })}
        {/* Melt / boil labels ride ON TOP of the curve, not under it: drawn with the guide lines
            they were painted over by the first climb, which sliced the "t" off "0° melt". */}
        {[
          { t: sub.tMelt, l: `${sub.tMelt}° melt` },
          { t: sub.tBoil, l: `${sub.tBoil}° boil` },
        ].map((g) => (
          <DiagramLabel
            key={g.l}
            x={GX0 + 8}
            y={TY(g.t) - 6}
            text={g.l}
            tone="muted"
            anchor="start"
            fontSize={13}
            fontWeight={650}
            bounds={{ left: GX0 + 4, right: GX1 - 4, top: GY0 + 4, bottom: GY1 - 4 }}
          />
        ))}
        {/* live marker */}
        <circle
          cx={QX(energyJ)}
          cy={TY(tempC)}
          r={6}
          fill="var(--stage-good, #16a34a)"
          stroke="var(--stage-bg)"
          strokeWidth={2}
        />
        <line
          x1={QX(energyJ)}
          y1={TY(tempC)}
          x2={QX(energyJ)}
          y2={GY1}
          stroke="var(--stage-good, #16a34a)"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
      </svg>
    </SceneSurface>
  );

  const instruments = (
    <>
      <div className="physics-probe">
        <span>Current state</span>
        <strong>{`${tempC >= 0 ? '' : '−'}${Math.abs(tempC).toFixed(0)} °C · ${phase}`}</strong>
        <small>
          {kJ(energyJ)} of {kJ(totalJ)} added ({pct}%)
        </small>
      </div>
      <div className="physics-thermal-model">
        <span className="physics-thermal-laws">
          <span>
            <span className="physics-thermal-sensible">sloped</span>, warming one phase:{' '}
            <Tex tex="q = mc\,\Delta\theta" />
          </span>
          <span>
            <span className="physics-thermal-latent">flat</span>, phase change: <Tex tex="q = mL" />
          </span>
        </span>
        <span className="physics-explain">
          Now:{' '}
          <strong className="physics-emphasis">
            {cur.kind === 'change'
              ? cur.which === 'melt'
                ? `melting ${sub.solidName}`
                : `boiling ${sub.liquidName}`
              : `warming ${cName}`}
          </strong>
        </span>
        <span className="physics-thermal-equation">
          {cur.kind === 'change' ? (
            <Tex
              tex={`q = mL = ${mass}\\times ${cur.which === 'melt' ? sub.lFusion : sub.lVapor} = ${kJ(cur.q).replace(' kJ', '')}\\,\\text{kJ}`}
            />
          ) : (
            <Tex tex={`q = mc\\,\\Delta\\theta = ${mass}\\times ${cVal}\\times\\Delta\\theta`} />
          )}
        </span>
      </div>
    </>
  );

  const controls = (
    <>
      <Field label="substance">
        <Segmented
          ariaLabel="substance"
          value={substance}
          onChange={setSubstance}
          options={[
            { value: 'water', label: 'Water' },
            { value: 'ethanol', label: 'Ethanol' },
          ]}
        />
      </Field>
      <Field label="power" value={`${power} W`}>
        <Slider
          value={power}
          min={-150}
          max={300}
          step={10}
          onChange={setPower}
          ariaLabel="heating power (watts; negative cools)"
        />
      </Field>
      <Field label="mass" value={`${mass} g`}>
        <Slider value={mass} min={10} max={200} step={10} onChange={setMass} ariaLabel="mass (grams)" />
      </Field>
    </>
  );

  const reset = (): void => {
    gate.setPlaying(false);
    setResetN((n) => n + 1);
  };
  const runtimeActivity = heatingActivity(objectives);
  const experimentControls = (context: AuthoredActivityContext): ReactNode => (
    <>
      <SimulationTransport
        running={gate.playing && !reduceMotion}
        onReset={reset}
        onToggle={() => {
          context.complete('experiment-started');
          if (reduceMotion) {
            stateRef.current = ThermalCore.step({ ...stateRef.current, powerW: power }, 30);
            gate.setPlaying(false);
            repaint();
          } else gate.setPlaying(!gate.playing);
        }}
        state={reduceMotion ? 'Step mode' : gate.playing ? (power >= 0 ? 'Heating' : 'Cooling') : 'Paused'}
        detail={`${Math.round(tempC)} °C · ${pct}%`}
        resetLabel="Reset heating curve"
      />
      {controls}
    </>
  );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="heating-curve"
      eyebrow="Thermal physics"
      title={title}
      description={prompt}
      status={
        <>
          {/* Phase and power are setup. Temperature is the measurement, and the first step asks
              what temperature does on a plateau. */}
          <span>{phase}</span>
          <Activity.Measured label="temperature, measured after you predict">
            {Math.round(tempC)} °C
          </Activity.Measured>
          <Activity.Measured label="progress, measured after you predict">{pct}% heated</Activity.Measured>
          <span>{power} W</span>
        </>
      }
      inspector={(context) => (
        <>
          {instruments}
          {experimentControls(context)}
        </>
      )}
      transcript={
        <p>
          {sub.name}, {mass} grams, is currently {phase} at {tempC.toFixed(1)} degrees Celsius. {kJ(energyJ)}{' '}
          of {kJ(totalJ)} has been transferred. The active segment uses{' '}
          {cur.kind === 'change' ? 'q equals m L' : 'q equals m c delta theta'}.
        </p>
      }
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
