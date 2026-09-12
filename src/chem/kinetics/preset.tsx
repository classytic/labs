'use client';

/**
 * KineticsLab, why heat and catalysts speed reactions, shown the visceral way: a
 * vessel of molecules bouncing around (faster when hot), where only collisions with
 * enough energy (≥ Eₐ) succeed, those flash and convert reactant A → product B.
 * Beside it, the Maxwell–Boltzmann energy spread shows the SAME story as the shaded
 * "can react" tail past Eₐ, and a composition bar tracks A→B in real time.
 *
 * Backed by the shared `@classytic/stage/chem` kinetics engine: the conversion pace
 * is the Arrhenius rate constant k = A·e^(−Eₐ/RT) (via arrheniusRatio), the readout
 * shows the real reactive fraction e^(−Eₐ/RT) and the half-life for the chosen order.
 * Raise the temperature → molecules speed up and more clear the barrier; drop Eₐ with
 * a catalyst → the barrier moves left and far more collisions succeed. The reaction
 * (Eₐ, rate, order, count, temperature) is fully AUTHORABLE, and a predict-first
 * question ships with it. Play-gated particle sim; pure SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { R, fractionAboveEa, halfLife, type RateOrder } from '@classytic/stage/chem';
import { RotateCcw } from 'lucide-react';
import { Slider, Segmented, IconButton } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Tex } from '../../core/tex.js';
import {
  Figure,
  FigText,
  Glass,
  Ball,
  Particle,
  PlotFrame,
  Curve,
  Area,
  Guide,
  SegmentBar,
  HUE,
} from '../../kit/figure/index.js';

export interface KineticsProps {
  /** Activation energy, kJ/mol (default 50). */
  EaKJ?: number;
  /** Rate constant at 300 K that sets the conversion pace (default 0.6). */
  kRef?: number;
  /** Reaction order for the half-life readout (default 1). */
  order?: RateOrder;
  /** Number of molecules in the vessel (default 30). */
  molecules?: number;
  /** Initial temperature, K (default 300). */
  T0?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const W = 720,
  H = 380;
const BX0 = 28,
  BX1 = 312,
  BY0 = 64,
  BY1 = 332; // vessel box
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

interface Mol {
  x: number;
  y: number;
  vx: number;
  vy: number;
  b: boolean;
  flash: number;
}

const QUESTIONS: NonNullable<AuthoredActivity['questions']> = [
  {
    id: 'temp',
    prompt: 'Raising the temperature speeds the reaction mainly because…',
    kind: 'choice',
    choices: [
      { value: 'energy', label: 'more molecules have energy ≥ Eₐ' },
      { value: 'bigger', label: 'the molecules get bigger' },
      { value: 'lowerEa', label: 'it lowers the activation energy' },
    ],
    answer: 'energy',
    explain:
      'Heat widens the energy spread, so a larger fraction (e^(−Eₐ/RT)) clears the barrier, and they move faster, so collide more often.',
  },
  {
    id: 'cat',
    prompt: 'A catalyst speeds a reaction by…',
    kind: 'choice',
    choices: [
      { value: 'lowerEa', label: 'lowering the activation energy Eₐ' },
      { value: 'heat', label: 'adding heat to the flask' },
      { value: 'shift', label: 'making the products more stable (changing ΔH)' },
    ],
    answer: 'lowerEa',
    explain:
      'A catalyst offers a lower-Eₐ path, so far more collisions succeed, without being used up or changing the energy of reactants/products.',
  },
];
const ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Reaction rate: temperature, activation energy and collisions',
  objectives: ['Connect collision energy to reaction rate', 'Explain temperature and catalyst effects'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the effect of heating',
      lead: 'Commit before running the particle model.',
      success: 'temperature',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Test collision conditions',
      lead: 'Run the vessel and change one collision condition.',
      controls: true,
      reveal: ['model'],
      success: 'condition-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the reactive tail',
      lead: 'Connect the barrier, shaded energy tail, rate and product count.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the catalyst',
      lead: 'Use the energy distribution and activation barrier.',
      success: 'catalyst',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Separate heat from catalysis',
      lead: 'Change temperature and turn on the catalyst; identify which changes the distribution and which lowers Eₐ.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'effects-compared',
    },
  ],
  questions: QUESTIONS,
  success: [
    { id: 'temperature', source: 'answer', key: 'temp', operator: 'eq', value: 'energy' },
    {
      id: 'condition-tested',
      source: 'metric',
      key: 'conditionChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change temperature or catalyst state.',
    },
    { id: 'catalyst', source: 'answer', key: 'cat', operator: 'eq', value: 'lowerEa' },
    {
      id: 'effects-compared',
      source: 'metric',
      key: 'bothEffects',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change temperature and turn on the catalyst.',
    },
  ],
};

export function KineticsLab({
  EaKJ = 50,
  kRef = 0.6,
  order = 1,
  molecules = 30,
  T0 = 300,
  title = 'Reaction rate: temperature, activation energy & collisions',
  prompt = 'Molecules must collide with enough energy (≥ Eₐ) to react. Heat them up or lower Eₐ with a catalyst and watch many more collisions succeed.',
  objectives = [
    'Explain rate by the collision model: enough-energy collisions react',
    'See temperature widen the energy spread so more molecules clear Eₐ',
    'Use Arrhenius k = A·e^(−Eₐ/RT); see a catalyst lower Eₐ, not ΔH',
  ],
  activity = ACTIVITY,
}: KineticsProps = {}): ReactNode {
  const runtimeActivity = activity === ACTIVITY ? { ...activity, objectives } : activity;
  const N = Math.max(6, Math.min(60, molecules));
  const [T, setT] = useState(T0);
  const [catalyst, setCatalyst] = useState(false);
  const [resetN, setResetN] = useState(0);
  const gate = usePlayGate();

  const Ea0 = EaKJ * 1000; // base activation energy, J/mol
  const Ea = Ea0 * (catalyst ? 0.55 : 1); // catalyst lowers Eₐ
  // Absolute Arrhenius k = A·e^(−Eₐ/RT), with A fixed by anchoring k = kRef at 300 K,
  // base Eₐ, no catalyst. So lowering Eₐ (catalyst) ALWAYS raises k, as it must.
  const Apre = kRef * Math.exp(Ea0 / (R * 300));
  const k = Apre * Math.exp(-Ea / (R * T));
  const ratioVs300 = k / kRef;
  const frac = fractionAboveEa(Ea, T);

  const makeMols = (): Mol[] =>
    Array.from({ length: N }, (_, i) => {
      const hx = (i * 0.6180339887) % 1,
        hy = (i * 0.7548776 + 0.13) % 1,
        th = i * 2.3999632;
      return {
        x: BX0 + 10 + hx * (BX1 - BX0 - 20),
        y: BY0 + 10 + hy * (BY1 - BY0 - 20),
        vx: Math.cos(th),
        vy: Math.sin(th),
        b: false,
        flash: 0,
      };
    });
  const molsRef = useRef<Mol[]>(makeMols());
  const coolRef = useRef(0);
  const sigRef = useRef('');
  const sig = `${N}:${resetN}`;
  if (sigRef.current !== sig) {
    sigRef.current = sig;
    molsRef.current = makeMols();
    coolRef.current = 0;
  }

  useFrameTick(gate.running, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    const spd = 58 * Math.sqrt(T / 300); // speed ∝ √T
    const p = 1 - Math.exp(-k * dt); // per-molecule reaction chance this step
    const mols = molsRef.current;
    let nA = 0;
    for (const m of mols) {
      m.x += m.vx * spd * dt;
      m.y += m.vy * spd * dt;
      if (m.x < BX0 + 7) {
        m.x = BX0 + 7;
        m.vx = Math.abs(m.vx);
      } else if (m.x > BX1 - 7) {
        m.x = BX1 - 7;
        m.vx = -Math.abs(m.vx);
      }
      if (m.y < BY0 + 7) {
        m.y = BY0 + 7;
        m.vy = Math.abs(m.vy);
      } else if (m.y > BY1 - 7) {
        m.y = BY1 - 7;
        m.vy = -Math.abs(m.vy);
      }
      if (m.flash > 0) m.flash = Math.max(0, m.flash - dt * 5);
      if (!m.b) {
        if (Math.random() < p) {
          m.b = true;
          m.flash = 1;
        } else nA++;
      }
    }
    if (nA === 0) {
      coolRef.current += dt;
      if (coolRef.current > 1.3) {
        molsRef.current = makeMols();
        coolRef.current = 0;
      }
    }
  });

  const mols = molsRef.current;
  const nB = mols.filter((m) => m.b).length;
  const nA = N - nB;
  const convPct = Math.round((nB / N) * 100);

  // ── Maxwell–Boltzmann (schematic): peak & spread grow with T; shade the tail past Eₐ ──
  const MX0 = 360,
    MX1 = 700,
    MY0 = 62,
    MY1 = 190;
  const Edist = 18 * (T / 300); // arbitrary energy units; spread ∝ T
  const eaDisp = clamp((EaKJ * (catalyst ? 0.55 : 1)) / 1.0, 6, 96); // kJ → axis units (0..100)
  const AXMAX = 100;
  const mb = (E: number): number => Math.sqrt(Math.max(0, E)) * Math.exp(-E / Edist);
  const mbMax = Math.max(...Array.from({ length: 50 }, (_, i) => mb((i / 49) * AXMAX))) || 1;
  const EX = (E: number): number => MX0 + (E / AXMAX) * (MX1 - MX0);
  const EY = (v: number): number => MY1 - (v / mbMax) * (MY1 - MY0);
  const curvePts: Array<[number, number]> = Array.from({ length: 61 }, (_, i) => {
    const E = (i / 60) * AXMAX;
    return [EX(E), EY(mb(E))];
  });
  const shadePts: Array<[number, number]> = Array.from({ length: 31 }, (_, i) => {
    const E = eaDisp + (i / 30) * (AXMAX - eaDisp);
    return [EX(E), EY(mb(E))];
  });

  const figure = (
    <PlayWrap gate={gate}>
      <div
        className="chem-scene chem-kinetics-scene chem-wide-scene"
        role="region"
        aria-label="Reaction vessel and molecular-energy diagram; scroll horizontally on a narrow screen"
        tabIndex={0}
      >
        <Figure
          viewBox={[W, H]}
          domain="chem"
          label={`Reaction vessel at ${T} kelvin, ${convPct}% converted to product`}
        >
          {/* ── reaction vessel ── */}
          <FigText x={(BX0 + BX1) / 2} y={BY0 - 10} anchor="middle" size="title">
            reaction vessel · {T} K
          </FigText>
          <Glass x={BX0} y={BY0} w={BX1 - BX0} h={BY1 - BY0} shape="beaker">
            {mols.map((m, i) => (
              <Ball key={i} cx={m.x} cy={m.y} r={5.5} color={m.b ? HUE[2] : HUE[1]} flash={m.flash} />
            ))}
          </Glass>
          {/* legend */}
          <Particle x={BX0 + 12} y={BY1 + 18} r={5} color={HUE[1]} />
          <FigText x={BX0 + 22} y={BY1 + 18} baseline="middle" size="note" tone="soft">
            A (reactant)
          </FigText>
          <Particle x={BX0 + 124} y={BY1 + 18} r={5} color={HUE[2]} />
          <FigText x={BX0 + 134} y={BY1 + 18} baseline="middle" size="note" tone="soft">
            B (product)
          </FigText>

          {/* ── Maxwell–Boltzmann energy spread ── */}
          <PlotFrame
            x={MX0}
            y={MY0}
            w={MX1 - MX0}
            h={MY1 - MY0}
            title="molecular energies"
            xLabel="energy"
            yLabel="molecules"
          >
            <Area points={shadePts} baseY={MY1} color={HUE[2]} opacity={28} />
            <Curve points={curvePts} color={HUE[1]} />
            <Guide
              x1={EX(eaDisp)}
              y1={MY1}
              x2={EX(eaDisp)}
              y2={MY0}
              color={HUE.hot}
              label="Eₐ"
              labelDy={14}
            />
            <FigText x={(EX(eaDisp) + MX1 * 2) / 3} y={MY1 - 12} anchor="middle" size="note" tone="hue-2">
              can react
            </FigText>
          </PlotFrame>

          {/* ── composition bar A → B ── */}
          <FigText x={MX0} y={236} size="title">
            composition
          </FigText>
          <SegmentBar
            x={MX0}
            y={246}
            w={MX1 - MX0}
            h={26}
            segments={[
              { frac: nA / N, color: HUE[1], label: `A ${nA}` },
              { frac: nB / N, color: HUE[2], label: `B ${nB}` },
            ]}
          />
          <FigText x={(MX0 + MX1) / 2} y={294} anchor="middle" size="note" tone="soft">
            {convPct}% converted
          </FigText>
        </Figure>
      </div>
    </PlayWrap>
  );

  const tHalf = halfLife(order, 1, Math.max(1e-6, k));
  const aside = (
    <>
      <Readout
        value={
          <>
            k ≈ {ratioVs300 < 1000 ? ratioVs300.toFixed(2) : ratioVs300.toExponential(1)}× (vs 300 K, no
            catalyst)
          </>
        }
        sub={
          <>
            fraction with E ≥ Eₐ ≈ {frac < 1e-4 ? frac.toExponential(1) : frac.toFixed(4)} · t½ ≈{' '}
            {tHalf < 100 ? tHalf.toFixed(1) : tHalf.toExponential(1)} s
          </>
        }
      />
      <div className="chem-explanation">
        <Tex tex={'k = A\\,e^{-E_a / RT}'} block />
        <span>
          Only collisions with energy ≥ Eₐ react.{' '}
          {catalyst ? (
            <>
              <strong data-tone="good">Catalyst on</strong>, Eₐ is lowered, so far more collisions succeed (ΔH
              is unchanged).
            </>
          ) : (
            <>Heat the vessel and the energy spread widens, pushing more molecules past Eₐ.</>
          )}
        </span>
      </div>
    </>
  );

  // Fields are direct children of the controls row: the bare wrapper <div>s they used to sit in
  // had no flex basis, so they collapsed to their content and squeezed the slider to a stub.
  const controls = (
    <>
      <Field label="temperature" value={`${T} K (${(T - 273).toFixed(0)} °C)`}>
        <Slider value={T} min={260} max={400} step={5} onChange={setT} ariaLabel="temperature (K)" />
      </Field>
      <Field label="catalyst">
        {/* the lab's state stays a boolean; only the control's value is a string union */}
        <Segmented
          ariaLabel="catalyst"
          value={catalyst ? 'on' : 'off'}
          onChange={(v) => setCatalyst(v === 'on')}
          options={[
            { value: 'on', label: 'catalyst on (lower Eₐ)' },
            { value: 'off', label: 'none' },
          ]}
        />
      </Field>
      <IconButton label="Refill reactant A" title="Refill A" onClick={() => setResetN((n) => n + 1)}>
        <RotateCcw aria-hidden="true" />
      </IconButton>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="kinetics"
      eyebrow="Chemical kinetics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{T} K</span>
          <span>{convPct}% product</span>
          <span>{catalyst ? 'catalysed' : 'uncatalysed'}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        <>
          At {T} K, about {frac < 1e-4 ? frac.toExponential(1) : frac.toFixed(4)} of the energy distribution
          clears Eₐ; {convPct}% is product.
        </>
      }
      transcript={
        <p>
          {nA} reactant and {nB} product particles. Temperature {T} kelvin; catalyst {catalyst ? 'on' : 'off'}
          .
        </p>
      }
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="condition-tested"
            met={sequence.current.id === 'act' && (T !== T0 || catalyst)}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="effects-compared"
            met={sequence.current.id === 'transfer' && T !== T0 && catalyst}
            complete={complete}
            outcome={`${T} K, catalyst on`}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
