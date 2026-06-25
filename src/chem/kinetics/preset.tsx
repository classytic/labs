'use client';

/**
 * KineticsLab — why heat and catalysts speed reactions, shown the visceral way: a
 * vessel of molecules bouncing around (faster when hot), where only collisions with
 * enough energy (≥ Eₐ) succeed — those flash and convert reactant A → product B.
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
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { Tex } from '../../core/tex.js';

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
}

const W = 720, H = 380;
const BX0 = 28, BX1 = 312, BY0 = 64, BY1 = 332;       // vessel box
const A_COL = 'var(--stage-accent, #3b82f6)';
const B_COL = 'var(--stage-good, #16a34a)';
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

interface Mol { x: number; y: number; vx: number; vy: number; b: boolean; flash: number }

const KINETICS_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'temp',
    prompt: 'Raising the temperature speeds the reaction mainly because…',
    choices: [
      { value: 'energy', label: 'more molecules have energy ≥ Eₐ' },
      { value: 'bigger', label: 'the molecules get bigger' },
      { value: 'lowerEa', label: 'it lowers the activation energy' },
    ],
    answer: 'energy',
    explain: 'Heat widens the energy spread, so a larger fraction (e^(−Eₐ/RT)) clears the barrier — and they move faster, so collide more often.',
  },
  {
    id: 'cat',
    prompt: 'A catalyst speeds a reaction by…',
    choices: [
      { value: 'lowerEa', label: 'lowering the activation energy Eₐ' },
      { value: 'heat', label: 'adding heat to the flask' },
      { value: 'shift', label: 'making the products more stable (changing ΔH)' },
    ],
    answer: 'lowerEa',
    explain: 'A catalyst offers a lower-Eₐ path, so far more collisions succeed — without being used up or changing the energy of reactants/products.',
  },
];

export function KineticsLab({
  EaKJ = 50,
  kRef = 0.6,
  order = 1,
  molecules = 30,
  T0 = 300,
  title = 'Reaction rate — temperature, activation energy & collisions',
  prompt = 'Molecules must collide with enough energy (≥ Eₐ) to react. Heat them up or lower Eₐ with a catalyst and watch many more collisions succeed.',
  objectives = [
    'Explain rate by the collision model: enough-energy collisions react',
    'See temperature widen the energy spread so more molecules clear Eₐ',
    'Use Arrhenius k = A·e^(−Eₐ/RT); see a catalyst lower Eₐ, not ΔH',
  ],
}: KineticsProps = {}): ReactNode {
  const N = Math.max(6, Math.min(60, molecules));
  const [T, setT] = useState(T0);
  const [catalyst, setCatalyst] = useState(false);
  const [resetN, setResetN] = useState(0);
  const gate = usePlayGate();
  const challenge = useChallenge(KINETICS_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'kinetics' });

  const Ea0 = EaKJ * 1000;                            // base activation energy, J/mol
  const Ea = Ea0 * (catalyst ? 0.55 : 1);             // catalyst lowers Eₐ
  // Absolute Arrhenius k = A·e^(−Eₐ/RT), with A fixed by anchoring k = kRef at 300 K,
  // base Eₐ, no catalyst. So lowering Eₐ (catalyst) ALWAYS raises k, as it must.
  const Apre = kRef * Math.exp(Ea0 / (R * 300));
  const k = Apre * Math.exp(-Ea / (R * T));
  const ratioVs300 = k / kRef;
  const frac = fractionAboveEa(Ea, T);

  const makeMols = (): Mol[] => Array.from({ length: N }, (_, i) => {
    const hx = (i * 0.6180339887) % 1, hy = (i * 0.7548776 + 0.13) % 1, th = i * 2.3999632;
    return { x: BX0 + 10 + hx * (BX1 - BX0 - 20), y: BY0 + 10 + hy * (BY1 - BY0 - 20), vx: Math.cos(th), vy: Math.sin(th), b: false, flash: 0 };
  });
  const molsRef = useRef<Mol[]>(makeMols());
  const coolRef = useRef(0);
  const sigRef = useRef('');
  const sig = `${N}:${resetN}`;
  if (sigRef.current !== sig) { sigRef.current = sig; molsRef.current = makeMols(); coolRef.current = 0; }

  useFrameTick(gate.running, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    const spd = 58 * Math.sqrt(T / 300);              // speed ∝ √T
    const p = 1 - Math.exp(-k * dt);                  // per-molecule reaction chance this step
    const mols = molsRef.current;
    let nA = 0;
    for (const m of mols) {
      m.x += m.vx * spd * dt; m.y += m.vy * spd * dt;
      if (m.x < BX0 + 7) { m.x = BX0 + 7; m.vx = Math.abs(m.vx); } else if (m.x > BX1 - 7) { m.x = BX1 - 7; m.vx = -Math.abs(m.vx); }
      if (m.y < BY0 + 7) { m.y = BY0 + 7; m.vy = Math.abs(m.vy); } else if (m.y > BY1 - 7) { m.y = BY1 - 7; m.vy = -Math.abs(m.vy); }
      if (m.flash > 0) m.flash = Math.max(0, m.flash - dt * 5);
      if (!m.b) { if (Math.random() < p) { m.b = true; m.flash = 1; } else nA++; }
    }
    if (nA === 0) { coolRef.current += dt; if (coolRef.current > 1.3) { molsRef.current = makeMols(); coolRef.current = 0; } }
  });

  const mols = molsRef.current;
  const nB = mols.filter((m) => m.b).length;
  const nA = N - nB;
  const convPct = Math.round((nB / N) * 100);

  // ── Maxwell–Boltzmann (schematic): peak & spread grow with T; shade the tail past Eₐ ──
  const MX0 = 360, MX1 = 700, MY0 = 62, MY1 = 190;
  const Edist = 18 * (T / 300);                        // arbitrary energy units; spread ∝ T
  const eaDisp = clamp((EaKJ * (catalyst ? 0.55 : 1)) / 1.0, 6, 96);  // kJ → axis units (0..100)
  const AXMAX = 100;
  const mb = (E: number): number => Math.sqrt(Math.max(0, E)) * Math.exp(-E / Edist);
  const mbMax = Math.max(...Array.from({ length: 50 }, (_, i) => mb((i / 49) * AXMAX))) || 1;
  const EX = (E: number): number => MX0 + (E / AXMAX) * (MX1 - MX0);
  const EY = (v: number): number => MY1 - (v / mbMax) * (MY1 - MY0);
  const curvePts = Array.from({ length: 61 }, (_, i) => { const E = (i / 60) * AXMAX; return `${EX(E).toFixed(1)},${EY(mb(E)).toFixed(1)}`; });
  const shadePts = [`${EX(eaDisp).toFixed(1)},${MY1}`, ...Array.from({ length: 31 }, (_, i) => { const E = eaDisp + (i / 30) * (AXMAX - eaDisp); return `${EX(E).toFixed(1)},${EY(mb(E)).toFixed(1)}`; }), `${EX(AXMAX).toFixed(1)},${MY1}`];

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Reaction vessel at ${T} kelvin, ${convPct}% converted to product`}>
          {/* ── reaction vessel ── */}
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={8} fill="color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))" stroke="var(--stage-metal)" strokeWidth={2} />
          <text x={(BX0 + BX1) / 2} y={BY0 - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--stage-fg)">reaction vessel · {T} K</text>
          {mols.map((m, i) => (
            <g key={i}>
              {m.flash > 0 && <circle cx={m.x} cy={m.y} r={6 + (1 - m.flash) * 8} fill="none" stroke="var(--stage-warn)" strokeWidth={2} opacity={m.flash} />}
              <circle cx={m.x} cy={m.y} r={5.5} fill={m.b ? B_COL : A_COL} opacity={0.92} />
            </g>
          ))}
          {/* legend */}
          <circle cx={BX0 + 12} cy={BY1 + 16} r={5} fill={A_COL} /><text x={BX0 + 22} y={BY1 + 20} fontSize={11} fill="var(--stage-muted)">A (reactant)</text>
          <circle cx={BX0 + 120} cy={BY1 + 16} r={5} fill={B_COL} /><text x={BX0 + 130} y={BY1 + 20} fontSize={11} fill="var(--stage-muted)">B (product)</text>

          {/* ── Maxwell–Boltzmann energy spread ── */}
          <text x={MX0} y={MY0 - 6} fontSize={12} fontWeight={700} fill="var(--stage-fg)">molecular energies <tspan fontWeight={400} fill="var(--stage-muted)">(schematic)</tspan></text>
          <line x1={MX0} y1={MY1} x2={MX1} y2={MY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <polygon points={shadePts.join(' ')} fill="var(--stage-warn)" opacity={0.25} />
          <polyline points={curvePts.join(' ')} fill="none" stroke="var(--stage-accent)" strokeWidth={2.5} />
          <line x1={EX(eaDisp)} y1={MY0} x2={EX(eaDisp)} y2={MY1} stroke="var(--stage-danger, #e03131)" strokeWidth={2} strokeDasharray="4 3" />
          <text x={EX(eaDisp)} y={MY0 + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--stage-danger, #e03131)">Eₐ</text>
          <text x={(EX(eaDisp) + MX1) / 2} y={MY1 - 8} textAnchor="middle" fontSize={9.5} fill="color-mix(in oklab, var(--stage-warn) 75%, var(--stage-fg))">can react</text>
          <text x={MX1} y={MY1 + 16} textAnchor="end" fontSize={10} fill="var(--stage-muted)">energy →</text>

          {/* ── composition bar A → B ── */}
          <text x={MX0} y={234} fontSize={12} fontWeight={700} fill="var(--stage-fg)">composition</text>
          <rect x={MX0} y={244} width={MX1 - MX0} height={26} rx={5} fill={A_COL} opacity={0.85} />
          <rect x={MX0} y={244} width={(MX1 - MX0) * (nB / N)} height={26} rx={5} fill={B_COL} />
          <text x={MX0 + 8} y={261} fontSize={12} fontWeight={700} fill="#fff">A {nA}</text>
          <text x={MX1 - 8} y={261} textAnchor="end" fontSize={12} fontWeight={700} fill="#fff">B {nB}</text>
          <text x={(MX0 + MX1) / 2} y={292} textAnchor="middle" fontSize={12} fill="var(--stage-muted)">{convPct}% converted</text>
        </svg>
      </div>
    </PlayWrap>
  );

  const tHalf = halfLife(order, 1, Math.max(1e-6, k));
  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>k ≈ {ratioVs300 < 1000 ? ratioVs300.toFixed(2) : ratioVs300.toExponential(1)}× (vs 300 K, no catalyst)</span>
          <span style={{ fontSize: 12.5, color: 'var(--stage-muted)' }}>fraction with E ≥ Eₐ ≈ {frac < 1e-4 ? frac.toExponential(1) : frac.toFixed(4)} · t½ ≈ {tHalf < 100 ? tHalf.toFixed(1) : tHalf.toExponential(1)} s</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        <Tex tex={'k = A\\,e^{-E_a / RT}'} block />
        <span style={{ color: 'var(--stage-muted)' }}>Only collisions with energy ≥ Eₐ react. {catalyst ? <><strong style={{ color: B_COL }}>Catalyst on</strong> — Eₐ is lowered, so far more collisions succeed (ΔH is unchanged).</> : <>Heat the vessel and the energy spread widens, pushing more molecules past Eₐ.</>}</span>
      </div>
    </>
  );

  // challenge full-width in the footer (in the narrow aside it left the figure box empty)
  const footer = <ChallengeCard questions={KINETICS_CHALLENGE} state={challenge} title="Predict first" />;

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="temperature" value={`${T} K (${(T - 273).toFixed(0)} °C)`}>
          <Slider value={T} min={260} max={400} step={5} onChange={setT} ariaLabel="temperature (K)" />
        </Field>
      </ControlBar>
      <ControlBar>
        <Field label="catalyst">
          <span className="lab-field-row">
            <Chip selected={catalyst} onClick={() => setCatalyst(true)}>catalyst on (lower Eₐ)</Chip>
            <Chip selected={!catalyst} onClick={() => setCatalyst(false)}>none</Chip>
          </span>
        </Field>
        <Field label=" "><Chip selected={false} onClick={() => setResetN((n) => n + 1)}>↻ refill A</Chip></Field>
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
