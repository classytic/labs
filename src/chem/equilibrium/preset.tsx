'use client';

/**
 * LeChatelierLab, a reversible reaction at equilibrium that fights back, on the
 * shared `equilibrium` core. The reaction is AUTHORABLE: a creator declares the two
 * species, the product coefficient, the colours, K, and whether the forward reaction
 * is endothermic, so the SAME lab teaches N₂O₄⇌2NO₂ (brown/colourless), the
 * chromate⇌dichromate colour change, a cobalt-complex equilibrium, and so on. The
 * default is the classic:
 *
 *     A ⇌ ν·B      (default N₂O₄ ⇌ 2 NO₂, colourless ⇌ brown, endothermic forward)
 *
 * The flask tint tracks the product; concentration bars + a live trace show both.
 * Apply a stress (add a species, compress, heat/cool) and watch Le Chatelier shift
 * it to oppose the change, the SHIFT DIRECTION emerges from the core's Q-vs-K, never
 * hardcoded, so it stays correct for whatever reaction the creator declares.
 * Hand-driven on EquilibriumCore, play-gated.
 */

import { useRef, useState, type ReactNode } from 'react';
import { EquilibriumCore, type EquilibriumState, type RxnSpecies } from '@classytic/stage/sim';
import { useFrameTick } from '../../kit/anim.js';
import { Chip, IconButton, Segmented } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Tex } from '../../core/tex.js';
import { Flame, Maximize2, Minimize2, RotateCcw, Snowflake } from 'lucide-react';
import {
  Figure,
  FigText,
  Glass,
  glassInner,
  Block,
  Particle,
  Marker,
  PlotFrame,
  Curve,
  HUE,
  STROKE,
  tint,
} from '../../kit/figure/index.js';

export interface LeChatelierProps {
  /** Reactant (left side, coefficient 1) name. */
  reactantName?: string;
  /** Product (right side) name. */
  productName?: string;
  /** Product stoichiometric coefficient ν (A ⇌ ν·B). */
  productCoeff?: number;
  /** Product colour token, the flask tints toward this as product forms. */
  productColor?: string;
  /** Reactant colour token. */
  reactantColor?: string;
  /** Equilibrium constant K = [B]^ν/[A] at room temperature. */
  K?: number;
  /** Is the forward reaction endothermic? (heating then favours the product). Default true. */
  endothermic?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const W = 720,
  H = 322;
const T0 = 300,
  CAP = 200;
// flask (left), concentration bars (middle), concentration–time plot (right)
const FX = 30,
  FY = 44,
  FW = 200,
  FH = 236;
const BAR_W = 34,
  BAR_X = [278, 328] as const,
  BAR_TOP = 70,
  BAR_BOT = 250;
const GX0 = 420,
  GX1 = 690,
  GY0 = 62,
  GY1 = 250;
/** Deterministic molecule slots inside the flask body (no per-frame randomness). */
const SLOTS = 32;

/** Predict the shift the default N₂O₄ ⇌ 2NO₂ system makes: pressure favours fewer moles; heating the endothermic forward reaction makes more product. */
const QUESTIONS: NonNullable<AuthoredActivity['questions']> = [
  {
    id: 'compress',
    prompt: 'Compress the flask (raise pressure). N₂O₄ ⇌ 2NO₂ shifts toward…',
    kind: 'choice',
    choices: [
      { value: 'reactant', label: 'N₂O₄ (paler)' },
      { value: 'product', label: 'NO₂ (browner)' },
      { value: 'none', label: 'no change' },
    ],
    answer: 'reactant',
    explain:
      'Squeezing favours the side with fewer gas moles, 1 mol N₂O₄ beats 2 mol NO₂, so the mix goes paler.',
  },
  {
    id: 'heat',
    prompt: 'The forward reaction is endothermic. Heating the flask makes the mix…',
    kind: 'choice',
    choices: [
      { value: 'browner', label: 'browner, and K rises' },
      { value: 'paler', label: 'paler, and K falls' },
      { value: 'same', label: 'unchanged' },
    ],
    answer: 'browner',
    explain:
      'Heat is a reactant for an endothermic forward step, so it drives more NO₂ (browner) and raises K.',
  },
];
const ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Le Chatelier: equilibrium fights back',
  objectives: ['Use Q and K to predict shift direction', 'Predict pressure and temperature effects'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict a pressure stress',
      lead: 'Commit before changing the flask.',
      success: 'compress',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Stress the equilibrium',
      lead: 'Add species, change volume, and watch Q return toward K.',
      controls: true,
      reveal: ['model'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain temperature',
      lead: 'Connect the reaction enthalpy to the new equilibrium.',
      success: 'heat',
    },
  ],
  questions: QUESTIONS,
  success: [
    { id: 'compress', source: 'answer', key: 'compress', operator: 'eq', value: 'reactant' },
    { id: 'heat', source: 'answer', key: 'heat', operator: 'eq', value: 'browner' },
  ],
};

export function LeChatelierLab({
  reactantName = 'N₂O₄',
  productName = 'NO₂',
  productCoeff = 2,
  productColor = HUE[2],
  reactantColor = HUE[1],
  K = 0.6,
  endothermic = true,
  title = 'Le Chatelier: equilibrium fights back',
  prompt = 'A reversible reaction sits at equilibrium (Q = K). Stress it, add a gas, squeeze it, heat it, and watch the reaction shift to oppose the change.',
  objectives = [
    'Read equilibrium as Q = K (the reaction quotient meets the constant)',
    'Predict the shift when you add/remove a species or change the volume',
    'See heating favour the endothermic side and change K itself',
  ],
  activity = ACTIVITY,
}: LeChatelierProps = {}): ReactNode {
  const runtimeActivity = activity === ACTIVITY ? { ...activity, objectives } : activity;
  const [T, setT] = useState(T0);
  const [resetN, setResetN] = useState(0);
  const gate = usePlayGate();

  const SPEC: RxnSpecies[] = [
    { name: reactantName, coeff: 1, side: 'reactant' },
    { name: productName, coeff: productCoeff, side: 'product' },
  ];
  // K = kf/kr; fix kr = 1 so kf = K. Heating scales kf: endothermic → up, exothermic → down.
  const kf = endothermic ? K * (T / T0) : K * (T0 / T);

  const sigRef = useRef('');
  const histRef = useRef<{ a: number; b: number }[]>([]);
  const coreRef = useRef<EquilibriumState>(
    EquilibriumCore.reset({ species: SPEC, conc0: [1, 0], kf, kr: 1 }),
  );
  const sig = `${reactantName}:${productName}:${productCoeff}:${resetN}`;
  if (sigRef.current !== sig) {
    sigRef.current = sig;
    coreRef.current = EquilibriumCore.reset({ species: SPEC, conc0: [1, 0], kf, kr: 1 });
    histRef.current = [];
  }

  useFrameTick(gate.running, () => {
    coreRef.current = EquilibriumCore.step({ ...coreRef.current, kf }, 0.02);
    const h = histRef.current;
    h.push({ a: coreRef.current.conc[0]!, b: coreRef.current.conc[1]! });
    if (h.length > CAP) h.shift();
  });

  const st = coreRef.current;
  const [a, b] = [st.conc[0]!, st.conc[1]!];
  const stress = (fn: (s: EquilibriumState) => Partial<EquilibriumState>): void => {
    coreRef.current = { ...coreRef.current, ...fn(coreRef.current) };
  };
  const addA = () => stress((s) => ({ conc: [s.conc[0]! + 0.4, s.conc[1]!] }));
  const addB = () => stress((s) => ({ conc: [s.conc[0]!, s.conc[1]! + 0.6] }));
  const compress = () => stress((s) => ({ conc: s.conc.map((c) => c / 0.7) }));
  const expand = () => stress((s) => ({ conc: s.conc.map((c) => c * 0.7) }));

  const maxC = Math.max(1.2, a, b, ...histRef.current.map((p) => Math.max(p.a, p.b)));
  const ratio = st.K > 0 && isFinite(st.Q) ? st.Q / st.K : 1;
  const status =
    ratio < 0.92
      ? `shifting → (making ${productName})`
      : ratio > 1.08
        ? `shifting ← (making ${reactantName})`
        : 'at equilibrium · Q = K';
  const tintOp = Math.min(0.85, (b / (a + b + 1e-6)) * 0.95);

  // ── molecules in the flask: count tracks total concentration, split tracks the mix ──
  const inner = glassInner(FX, FY, FW, FH, 'flask');
  const bodyTop = FY + FH * 0.5,
    bodyBot = inner.y + inner.h - 14,
    bodyL = FX + 22,
    bodyR = FX + FW - 22;
  const nMol = Math.max(4, Math.min(SLOTS, Math.round((SLOTS * (a + b)) / 1.6)));
  const nProd = Math.round((nMol * b) / (a + b + 1e-6));
  const molecules = Array.from({ length: nMol }, (_, i) => {
    const hx = (i * 0.6180339887 + 0.07) % 1,
      hy = (i * 0.7548776 + 0.31) % 1;
    return { x: bodyL + hx * (bodyR - bodyL), y: bodyTop + hy * (bodyBot - bodyTop), product: i < nProd };
  });

  // ── concentration vs time (scrolling window; the current point is always drawn) ──
  const hist = histRef.current;
  const px = (i: number, n: number): number => GX0 + (n <= 1 ? 0 : i / (n - 1)) * (GX1 - GX0);
  const py = (v: number): number => GY1 - (v / maxC) * (GY1 - GY0);
  const trace = (key: 'a' | 'b'): Array<[number, number]> =>
    hist.map((p, i) => [px(i, hist.length), py(p[key])]);
  const nowX = px(Math.max(0, hist.length - 1), hist.length);
  const barY = (v: number): number => BAR_BOT - (v / maxC) * (BAR_BOT - BAR_TOP);

  const figure = (
    <PlayWrap gate={gate}>
      <SceneViewport
        className="chem-scene chem-equilibrium-scene"
        size="wide"
        overflow="scroll"
        label="Equilibrium vessel and concentration graph. Pan horizontally on a narrow screen."
      >
        <Figure
          viewBox={[W, H]}
          domain="chem"
          label={`${reactantName} to ${productName} equilibrium, Q ${st.Q.toFixed(2)}, K ${st.K.toFixed(2)}, ${status}`}
        >
          {/* ── sealed flask: gas tint tracks the product ── */}
          <FigText x={FX + FW / 2} y={FY - 14} anchor="middle" size="title">
            sealed flask · {T} K
          </FigText>
          <Glass x={FX} y={FY} w={FW} h={FH} shape="flask" label={<>tint ∝ [{productName}]</>}>
            <rect
              className="fig-ease"
              x={FX}
              y={FY}
              width={FW}
              height={FH}
              fill={productColor}
              fillOpacity={tintOp}
              style={{ transition: 'fill-opacity 0.45s ease' }}
            />
            {molecules.map((m, i) => (
              <Particle key={i} x={m.x} y={m.y} r={5} color={m.product ? productColor : reactantColor} />
            ))}
          </Glass>

          {/* ── concentration bars ── */}
          <FigText x={(BAR_X[0] + BAR_X[1]) / 2 + BAR_W / 2} y={FY - 14} anchor="middle" size="title">
            now
          </FigText>
          {(
            [
              [reactantName, a, reactantColor, BAR_X[0]],
              [productName, b, productColor, BAR_X[1]],
            ] as [string, number, string, number][]
          ).map(([nm, v, col, bx]) => {
            const top = barY(v);
            return (
              <g key={nm}>
                <rect
                  x={bx}
                  y={BAR_TOP}
                  width={BAR_W}
                  height={BAR_BOT - BAR_TOP}
                  rx={4}
                  fill={tint(col, 12)}
                />
                <Block x={bx} y={top} w={BAR_W} h={Math.max(2, BAR_BOT - top)} color={col} />
                <FigText x={bx + BAR_W / 2} y={top - 7} anchor="middle" size="note">
                  {v.toFixed(2)}
                </FigText>
                <FigText x={bx + BAR_W / 2} y={BAR_BOT + 18} anchor="middle" size="note" tone="soft">
                  {nm}
                </FigText>
              </g>
            );
          })}
          <line
            x1={BAR_X[0] - 6}
            y1={BAR_BOT}
            x2={BAR_X[1] + BAR_W + 6}
            y2={BAR_BOT}
            stroke={HUE.ink}
            strokeWidth={STROKE.hair}
          />

          {/* ── concentration vs time ── */}
          <PlotFrame
            x={GX0}
            y={GY0}
            w={GX1 - GX0}
            h={GY1 - GY0}
            title="concentration over time"
            xLabel="time"
            yLabel="concentration"
          >
            {hist.length > 1 && (
              <>
                <Curve points={trace('a')} color={reactantColor} />
                <Curve points={trace('b')} color={productColor} />
              </>
            )}
            <Marker x={nowX} y={py(a)} color={reactantColor} r={4.5} />
            <Marker x={nowX} y={py(b)} color={productColor} r={4.5} />
          </PlotFrame>
        </Figure>
      </SceneViewport>
    </PlayWrap>
  );

  const exp = productCoeff === 1 ? '' : `^${productCoeff}`;
  const aside = (
    <>
      <Readout
        value={
          <>
            Q = {isFinite(st.Q) ? st.Q.toFixed(2) : '∞'} · K = {st.K.toFixed(2)}
          </>
        }
        sub={<>{status}</>}
      />
      <div className="chem-explanation">
        <Tex tex={`K = \\dfrac{[\\mathrm{${productName}}]${exp}}{[\\mathrm{${reactantName}}]}`} block />
        <span>
          The system always moves to bring <strong>Q back to K</strong>. Add a species and it’s consumed;
          compress and it shifts to fewer moles;{' '}
          {endothermic
            ? 'heat and the endothermic forward reaction wins'
            : 'heat and the exothermic reverse reaction wins'}
          , and K itself changes with temperature.
        </span>
      </div>
    </>
  );

  const controls = (
    <>
      <div>
        <Field label="add / remove">
          <span className="lab-field-row">
            <Chip selected={false} onClick={addA}>
              + {reactantName}
            </Chip>
            <Chip selected={false} onClick={addB}>
              + {productName}
            </Chip>
          </span>
        </Field>
        <Field label="volume">
          <span className="lab-field-row">
            <Chip selected={false} onClick={compress}>
              <Minimize2 aria-hidden /> Compress
            </Chip>
            <Chip selected={false} onClick={expand}>
              <Maximize2 aria-hidden /> Expand
            </Chip>
          </span>
        </Field>
      </div>
      <div>
        <Field label="temperature">
          {/* T is a number; the track's value is the band it falls in, and each option sets a T. */}
          <Segmented
            ariaLabel="temperature"
            value={T > T0 ? 'hot' : T < T0 ? 'cold' : 'room'}
            onChange={(band) => setT(band === 'hot' ? 420 : band === 'cold' ? 220 : T0)}
            options={[
              {
                value: 'hot',
                label: (
                  <>
                    <Flame aria-hidden /> Heat
                  </>
                ),
              },
              { value: 'room', label: 'room' },
              {
                value: 'cold',
                label: (
                  <>
                    <Snowflake aria-hidden /> Cool
                  </>
                ),
              },
            ]}
          />
        </Field>
        <IconButton label="Reset equilibrium" onClick={() => setResetN((n) => n + 1)}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
      </div>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="le-chatelier"
      eyebrow="Chemical equilibrium"
      title={title}
      description={prompt}
      status={
        <>
          <span>{status}</span>
          <span>Q {isFinite(st.Q) ? st.Q.toFixed(2) : '∞'}</span>
          <span>K {st.K.toFixed(2)}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        <>The system shifts until its reaction quotient moves back toward the equilibrium constant.</>
      }
      transcript={
        <p>
          {reactantName} concentration {a.toFixed(2)}; {productName} concentration {b.toFixed(2)}. {status} at{' '}
          {T} kelvin.
        </p>
      }
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
