'use client';

/**
 * HeatingCurveLab — pour heat into ice and watch temperature climb in steps.
 *
 * The whole heat story in one picture, driven by the shared `thermal` core: a
 * burner heats a beaker (ice → water → steam), a thermometer reads the temperature,
 * and the heating curve draws itself on the right — SLOPED runs where one phase
 * warms (q = mcΔθ) and FLAT plateaus where it changes phase (q = mL, temperature
 * stuck while the latent heat goes in). The width of each part IS the heat it needs,
 * so water's huge boiling plateau (latent vaporisation ≫ everything) is impossible
 * to miss. Slide the power to heat faster, the mass for a bigger sample, or flip the
 * substance; pull power negative to cool back down. Hand-driven on ThermalCore.
 */

import { useRef, useState, type ReactNode } from 'react';
import { ThermalCore, WATER, ETHANOL, type ThermalState } from '@classytic/stage/sim';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { ThermometerGlyph, BeakerGlyph, BurnerGlyph } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';

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

const W = 760, H = 440;
const GX0 = 330, GX1 = 736, GY0 = 38, GY1 = 396;
const kJ = (j: number): string => `${(j / 1000).toFixed(j < 10000 ? 1 : 0)} kJ`;

export function HeatingCurveLab({
  substance: sub0 = 'water',
  title = 'Heating curve — pour in heat, watch it climb in steps',
  prompt = 'Heat ice until it melts, warms, and boils. Temperature RISES while one phase warms (q = mcΔθ) but stays FLAT during a phase change (q = mL).',
  objectives = [
    'Read a heating curve: sloped = warming, flat = changing phase',
    'Use q = mcΔθ for a temperature change and q = mL for a phase change',
    'See why water’s boiling plateau is so wide (latent heat ≫ specific heat)',
  ],
  substanceName, cSolid, cLiquid, cGas, lFusion, lVapor, tMelt, tBoil,
  mass: mass0 = 50,
  power: power0 = 120,
}: HeatingCurveProps = {}): ReactNode {
  const [substance, setSubstance] = useState<'water' | 'ethanol'>(sub0);
  const [power, setPower] = useState(power0);
  const [mass, setMass] = useState(mass0);
  const [resetN, setResetN] = useState(0);
  const gate = usePlayGate();

  // Base preset + any creator overrides = the substance model.
  const base = substance === 'water' ? WATER : ETHANOL;
  const sub = {
    ...base,
    name: substanceName ?? base.name,
    cSolid: cSolid ?? base.cSolid, cLiquid: cLiquid ?? base.cLiquid, cGas: cGas ?? base.cGas,
    lFusion: lFusion ?? base.lFusion, lVapor: lVapor ?? base.lVapor,
    tMelt: tMelt ?? base.tMelt, tBoil: tBoil ?? base.tBoil,
  };
  const tStart = sub.tMelt - 20;
  const tMax = sub.tBoil + 40;

  // (re)build the core whenever the sample (substance/overrides/mass) or reset changes.
  const sig = `${substance}:${mass}:${resetN}:${sub.tMelt}:${sub.tBoil}:${sub.lFusion}:${sub.lVapor}:${sub.cLiquid}`;
  const sigRef = useRef('');
  const stateRef = useRef<ThermalState>(ThermalCore.reset({ substance: sub, mass, tStart, tMax, powerW: power }));
  if (sigRef.current !== sig) {
    sigRef.current = sig;
    stateRef.current = ThermalCore.reset({ substance: sub, mass, tStart, tMax, powerW: power });
  }

  useFrameTick(gate.running, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    // power is live: merge it onto state each step (like RC charge/leak target).
    stateRef.current = ThermalCore.step({ ...stateRef.current, powerW: power }, dt * 12);
  });

  const st = stateRef.current;
  const { segs, totalJ, energyJ, tempC, phase, fracMelt } = st;

  // ── curve mapping ──
  const QX = (q: number): number => GX0 + (totalJ > 0 ? q / totalJ : 0) * (GX1 - GX0);
  const TY = (t: number): number => GY1 - ((t - tStart) / (tMax - tStart)) * (GY1 - GY0);

  // ── apparatus display intensities from phase/fractions ──
  const iceFrac = phase === 'solid' ? 1 : phase === 'melting' ? 1 - fracMelt : 0;
  const fracBoil = st.fracBoil;
  const boiling = phase === 'boiling' ? 1 : phase === 'liquid' ? Math.max(0, (tempC - sub.tBoil + 25) / 25) * 0.5 : 0;
  const steam = phase === 'boiling' ? Math.max(0.25, fracBoil) : phase === 'gas' ? 1 : 0;
  const fillFrac = phase === 'gas' ? 0.05 : 0.72 * (1 - 0.55 * fracBoil);
  const tFrac = (tempC - tStart) / (tMax - tStart);

  // current segment → live formula
  const cur = segs.find((s, i) => energyJ <= s.qStart + s.q || i === segs.length - 1) ?? segs[0]!;
  const cName = cur.phase === 'solid' ? sub.solidName : cur.phase === 'gas' ? sub.gasName : sub.liquidName;
  const cVal = cur.phase === 'solid' ? sub.cSolid : cur.phase === 'gas' ? sub.cGas : sub.cLiquid;
  const pct = totalJ > 0 ? Math.round((energyJ / totalJ) * 100) : 0;

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
          aria-label={`${sub.name} at ${Math.round(tempC)} degrees, ${phase}, ${pct} percent of the way through heating`}>
          {/* ── apparatus ── */}
          <BurnerGlyph cx={150} baseY={300} w={84} level={power > 0 ? Math.min(1, power / 200) : Math.max(-1, power / 200)} phase={st.tSec} />
          <BeakerGlyph x={92} y={132} w={116} h={140} fillFrac={fillFrac} color={sub.color} boiling={boiling} steam={steam} iceFrac={iceFrac} phase={st.tSec} label={`${mass} g ${sub.name.toLowerCase()}`} />
          <ThermometerGlyph cx={252} top={104} h={196} frac={tFrac} label={`${tempC >= 0 ? '' : '−'}${Math.abs(tempC).toFixed(0)}°C`} />

          {/* ── heating-curve graph ── */}
          {/* axes */}
          <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <text x={GX0 - 6} y={GY0 + 4} textAnchor="end" fontSize={11} fill="var(--stage-muted)">°C</text>
          <text x={GX1} y={GY1 + 22} textAnchor="end" fontSize={11} fill="var(--stage-muted)">heat added →</text>
          {/* melt / boil guide lines */}
          {[{ t: sub.tMelt, l: `${sub.tMelt}° melt` }, { t: sub.tBoil, l: `${sub.tBoil}° boil` }].map((g) => (
            <g key={g.l}>
              <line x1={GX0} y1={TY(g.t)} x2={GX1} y2={TY(g.t)} stroke="var(--stage-grid)" strokeWidth={1} strokeDasharray="4 4" />
              <text x={GX1 - 4} y={TY(g.t) - 3} textAnchor="end" fontSize={10} fill="var(--stage-muted)">{g.l}</text>
            </g>
          ))}
          {/* segments — sloped heat runs vs flat plateaus, each with its q */}
          {segs.map((s, i) => {
            const x0 = QX(s.qStart), x1 = QX(s.qStart + s.q), y0 = TY(s.t0), y1 = TY(s.t1);
            const isChange = s.kind === 'change';
            const col = isChange ? 'var(--stage-warn, #e0a020)' : 'var(--stage-accent, #3b82f6)';
            const big = s.q / totalJ > 0.04;
            return (
              <g key={i}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={col} strokeWidth={isChange ? 4 : 3} strokeLinecap="round" />
                {big && <text x={(x0 + x1) / 2} y={isChange ? (y0 + y1) / 2 - 7 : (y0 + y1) / 2 - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill={col} style={{ fontVariantNumeric: 'tabular-nums' }}>{kJ(s.q)}</text>}
              </g>
            );
          })}
          {/* live marker */}
          <circle cx={QX(energyJ)} cy={TY(tempC)} r={6} fill="var(--stage-good, #16a34a)" stroke="var(--stage-bg)" strokeWidth={2} />
          <line x1={QX(energyJ)} y1={TY(tempC)} x2={QX(energyJ)} y2={GY1} stroke="var(--stage-good, #16a34a)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        </svg>
      </div>
    </PlayWrap>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{tempC >= 0 ? '' : '−'}{Math.abs(tempC).toFixed(0)} °C · {phase}</span>
          <span>heat added: {kJ(energyJ)} of {kJ(totalJ)} ({pct}%)</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        <Callout tone="info">
          <span style={{ display: 'grid', gap: 6 }}>
            <span><span style={{ color: 'var(--stage-accent)', fontWeight: 800 }}>sloped</span> — warming one phase: <Tex tex="q = mc\,\Delta\theta" /></span>
            <span><span style={{ color: 'var(--stage-warn)', fontWeight: 800 }}>flat</span> — phase change: <Tex tex="q = mL" /></span>
          </span>
        </Callout>
        <span style={{ color: 'var(--stage-muted)' }}>now: <strong style={{ color: 'var(--stage-fg)' }}>
          {cur.kind === 'change' ? (cur.which === 'melt' ? `melting ${sub.solidName}` : `boiling ${sub.liquidName}`) : `warming ${cName}`}</strong></span>
        <span style={{ fontSize: 13 }}>
          {cur.kind === 'change'
            ? <Tex tex={`q = mL = ${mass}\\times ${cur.which === 'melt' ? sub.lFusion : sub.lVapor} = ${kJ(cur.q).replace(' kJ', '')}\\,\\text{kJ}`} />
            : <Tex tex={`q = mc\\,\\Delta\\theta = ${mass}\\times ${cVal}\\times\\Delta\\theta`} />}
        </span>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="substance">
        <span className="lab-field-row">
          <Chip selected={substance === 'water'} onClick={() => setSubstance('water')}>💧 water</Chip>
          <Chip selected={substance === 'ethanol'} onClick={() => setSubstance('ethanol')}>🧪 ethanol</Chip>
        </span>
      </Field>
      <Field label="power" value={`${power} W`}>
        <Slider value={power} min={-150} max={300} step={10} onChange={setPower} ariaLabel="heating power (watts; negative cools)" />
      </Field>
      <Field label="mass" value={`${mass} g`}>
        <Slider value={mass} min={10} max={200} step={10} onChange={setMass} ariaLabel="mass (grams)" />
      </Field>
      <Field label=" "><Chip selected={false} onClick={() => setResetN((n) => n + 1)}>↻ reset</Chip></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
