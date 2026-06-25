'use client';

/**
 * HeatTransferLab — the three ways heat travels, side by side, each with its real
 * rate law and an iconic animation:
 *
 *   • CONDUCTION — through a solid, atom to atom. A rod between a hot and a cold
 *     end settles into a linear temperature gradient; energy packets march down it
 *     at a speed set by Fourier's law  Q̇ = k·A·ΔT/L  (copper races, wood crawls).
 *   • CONVECTION — bulk flow in a fluid. Heated fluid expands, rises, cools at the
 *     top and sinks — a rolling convection current. Rate  Q̇ = h·A·ΔT.
 *   • RADIATION — electromagnetic waves, no medium needed. A hot body glows and
 *     throws photons outward; the power obeys Stefan–Boltzmann  P = εσA(T⁴ − T₀⁴),
 *     so doubling the absolute temperature multiplies the radiated power by 16.
 *
 * Hand-driven on a frame loop (the rates are steady-state formulas; the loop only
 * animates the packets / current / photons). Pure SVG, play-gated, themed.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { BurnerGlyph, thermalColor } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';

type Mode = 'conduction' | 'convection' | 'radiation';

export interface HeatTransferProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /**
   * Creator policy. To author a SINGLE-mechanism lesson (e.g. conduction only),
   * set `mode: 'conduction'` and `controlConfig: { hide: ['mechanism'] }` — the
   * switcher vanishes and the lab is focused on that one idea. Any knob (material,
   * rod length, body temperature, …) can likewise be hidden or locked.
   */
  controlConfig?: ControlConfig;
}

const W = 720, H = 380;
const SIGMA = 5.67e-8;

const MATERIALS: Record<string, { k: number; label: string }> = {
  copper: { k: 400, label: '🟧 copper' },
  aluminium: { k: 235, label: '⬜ aluminium' },
  glass: { k: 0.8, label: '🔲 glass' },
  wood: { k: 0.15, label: '🟫 wood' },
};
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export function HeatTransferLab({
  mode: mode0 = 'conduction',
  title = 'Heat transfer — conduction, convection & radiation',
  prompt = 'The three ways heat moves: through solids (conduction), by bulk fluid flow (convection), and as radiation across empty space.',
  objectives = [
    'Tell conduction, convection and radiation apart by their mechanism',
    'See conduction depends on the material: Q̇ = k·A·ΔT/L (copper ≫ wood)',
    'See radiation obeys T⁴ — double the temperature, 16× the power',
  ],
  controlConfig,
}: HeatTransferProps = {}): ReactNode {
  const [mode, setMode] = useState<Mode>(mode0);
  // conduction
  const [material, setMaterial] = useState('copper');
  const [hotC, setHotC] = useState(100);
  const [lengthCm, setLengthCm] = useState(20);
  // convection
  const [powerC, setPowerC] = useState(140);
  // radiation
  const [bodyK, setBodyK] = useState(500);
  const [emiss, setEmiss] = useState(1);

  const tRef = useRef(0);
  const gate = usePlayGate();
  useFrameTick(gate.running, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
  });
  const t = tRef.current;

  // ── rates ──
  const A = 4e-4;                                       // 4 cm² cross-section (conduction/radiation use this scale)
  const k = MATERIALS[material]!.k;
  const condRate = k * A * hotC / (lengthCm / 100);     // W (cold end at 0 °C)
  const surrK = 300;
  const radP = emiss * SIGMA * 0.02 * (bodyK ** 4 - surrK ** 4); // W (A=0.02 m²)
  const convRate = 12 * 0.02 * (powerC / 140) * 60;    // W, h·A·ΔT toy scaling

  // ── figures ──
  let figure: ReactNode;
  let controls: ReactNode;
  let aside: ReactNode;

  if (mode === 'conduction') {
    const x0 = 150, x1 = 600, yMid = 175, rodH = 46;
    const len = x1 - x0;
    const NSEG = 16;
    const speed = clamp(condRate / 80, 0.05, 2.5);      // packets per second factor
    const nPk = Math.max(0, Math.round(clamp(condRate / 8, 0, 14)));
    figure = (
      <PlayWrap gate={gate}>
        <div style={fwrap}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Conduction through ${material}, rate ${condRate.toFixed(1)} watts`}>
            {/* hot & cold reservoirs */}
            <rect x={70} y={yMid - 55} width={80} height={110} rx={8} fill={thermalColor(1)} opacity={0.85} />
            <text x={110} y={yMid - 62} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--stage-fg)">{hotC}°C</text>
            <rect x={x1} y={yMid - 55} width={80} height={110} rx={8} fill={thermalColor(0)} opacity={0.85} />
            <text x={x1 + 40} y={yMid - 62} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--stage-fg)">0°C</text>
            {/* rod — segmented hot→cold gradient */}
            {Array.from({ length: NSEG }, (_, i) => (
              <rect key={i} x={x0 + (i / NSEG) * len} y={yMid - rodH / 2} width={len / NSEG + 1} height={rodH} fill={thermalColor(1 - i / NSEG)} />
            ))}
            <rect x={x0} y={yMid - rodH / 2} width={len} height={rodH} fill="none" stroke="var(--stage-metal)" strokeWidth={2} rx={4} />
            {/* vibrating atoms (amplitude ∝ local temperature) */}
            {Array.from({ length: 11 }, (_, i) => {
              const fx = i / 10, ax = x0 + fx * len, amp = (1 - fx) * 5 + 1;
              const jy = Math.sin(t * 11 + i) * amp, jx = Math.cos(t * 9 + i * 1.3) * amp * 0.5;
              return <circle key={i} cx={ax + jx} cy={yMid + jy} r={3} fill="var(--stage-bg)" opacity={0.8} />;
            })}
            {/* energy packets flowing hot→cold */}
            {Array.from({ length: nPk }, (_, i) => {
              const p = ((t * speed + i / Math.max(1, nPk)) % 1);
              return <circle key={i} cx={x0 + p * len} cy={yMid} r={5} fill="var(--stage-warn)" opacity={0.9} />;
            })}
            <BurnerGlyph cx={110} baseY={yMid + 58} w={66} level={0.8} phase={t} />
          </svg>
        </div>
      </PlayWrap>
    );
    controls = (
      <ControlBar>
        <Field label="material">
          <span className="lab-field-row">
            {Object.entries(MATERIALS).map(([key, m]) => (
              <Chip key={key} selected={material === key} onClick={() => setMaterial(key)}>{m.label}</Chip>
            ))}
          </span>
        </Field>
        <Field label="hot end ΔT" value={`${hotC} °C`}><Slider value={hotC} min={20} max={200} step={10} onChange={setHotC} ariaLabel="hot-end temperature" /></Field>
        <Field label="rod length" value={`${lengthCm} cm`}><Slider value={lengthCm} min={5} max={50} step={5} onChange={setLengthCm} ariaLabel="rod length" /></Field>
      </ControlBar>
    );
    aside = (
      <>
        <Callout tone="result"><span style={tnum}><strong style={{ fontSize: 16 }}>Q̇ = {condRate.toFixed(condRate < 10 ? 2 : 0)} W</strong></span></Callout>
        <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
          <Tex tex={'\\dot{Q} = \\dfrac{k\\,A\\,\\Delta T}{L}'} block />
          <span style={{ color: 'var(--stage-muted)' }}>conduction = atom-to-atom through a solid. <strong style={{ color: 'var(--stage-fg)' }}>{MATERIALS[material]!.label}</strong> has k = {k} W/m·K — metals conduct ~1000× better than wood.</span>
        </div>
      </>
    );
  } else if (mode === 'convection') {
    const cx = 360, potTop = 110, potBot = 285, potHW = 150;
    // two mirrored convection loops; parcels rise in the centre (hot), sink at the walls (cool)
    const loopPts = (sign: number): { x: number; y: number; h: number }[] => {
      const pts: { x: number; y: number; h: number }[] = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        let x: number, y: number;
        if (u < 0.25) { x = cx + sign * 8; y = potBot - (u / 0.25) * (potBot - potTop); }       // rise centre
        else if (u < 0.5) { x = cx + sign * ((u - 0.25) / 0.25) * (potHW - 16); y = potTop + 6; } // across top
        else if (u < 0.75) { x = cx + sign * (potHW - 16); y = potTop + ((u - 0.5) / 0.25) * (potBot - potTop); } // sink wall
        else { x = cx + sign * (potHW - 16) * (1 - (u - 0.75) / 0.25); y = potBot - 6; }           // across bottom
        pts.push({ x, y, h: (potBot - y) / (potBot - potTop) });                                   // h: 1 hot(bottom) → 0 cool(top)
      }
      return pts;
    };
    const loops = [loopPts(-1), loopPts(1)];
    figure = (
      <PlayWrap gate={gate}>
        <div style={fwrap}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Convection currents in a heated fluid">
            {/* fluid */}
            <rect x={cx - potHW} y={potTop} width={potHW * 2} height={potBot - potTop} rx={6} fill="color-mix(in oklab, var(--stage-accent) 16%, transparent)" />
            {/* current path hints */}
            {loops.map((pts, li) => (
              <polyline key={li} points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--stage-grid)" strokeWidth={1} strokeDasharray="3 4" />
            ))}
            {/* parcels moving round each loop, coloured by height (hot low, cool high) */}
            {loops.flatMap((pts, li) => Array.from({ length: 7 }, (_, i) => {
              const u = ((t * 0.16 * (powerC / 140) + i / 7) % 1);
              const idx = Math.min(pts.length - 1, Math.floor(u * pts.length));
              const p = pts[idx]!;
              return <circle key={`${li}-${i}`} cx={p.x} cy={p.y} r={6} fill={thermalColor(p.h)} opacity={0.92} />;
            }))}
            {/* rise / sink arrows */}
            <text x={cx} y={potTop + 40} textAnchor="middle" fontSize={16} fill="var(--stage-warn)">↑</text>
            <text x={cx - potHW + 18} y={potBot - 30} textAnchor="middle" fontSize={16} fill="var(--stage-accent)">↓</text>
            <text x={cx + potHW - 18} y={potBot - 30} textAnchor="middle" fontSize={16} fill="var(--stage-accent)">↓</text>
            {/* pot walls + burner */}
            <path d={`M ${cx - potHW} ${potTop} L ${cx - potHW} ${potBot} L ${cx + potHW} ${potBot} L ${cx + potHW} ${potTop}`} fill="none" stroke="var(--stage-metal)" strokeWidth={3} strokeLinejoin="round" />
            <BurnerGlyph cx={cx} baseY={potBot + 6} w={120} level={clamp(powerC / 200, 0.1, 1)} phase={t} />
          </svg>
        </div>
      </PlayWrap>
    );
    controls = (
      <ControlBar>
        <Field label="heat" value={`${powerC} W`}><Slider value={powerC} min={40} max={200} step={10} onChange={setPowerC} ariaLabel="heating power" /></Field>
      </ControlBar>
    );
    aside = (
      <>
        <Callout tone="result"><span style={tnum}><strong style={{ fontSize: 16 }}>Q̇ ≈ {convRate.toFixed(0)} W</strong></span></Callout>
        <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
          <Tex tex={'\\dot{Q} = h\\,A\\,\\Delta T'} block />
          <span style={{ color: 'var(--stage-muted)' }}>Heated fluid expands → less dense → <strong style={{ color: 'var(--stage-fg)' }}>rises</strong>; it cools up top, grows denser and <strong style={{ color: 'var(--stage-fg)' }}>sinks</strong> — a rolling current that carries heat with the moving matter. (No solid needed; impossible in a vacuum.)</span>
        </div>
      </>
    );
  } else {
    const cx = 300, cy = 190;
    const tFrac = clamp((bodyK - surrK) / 700, 0, 1);
    const bodyR = 34;
    const glowR = bodyR + tFrac * 26;
    const nPhotons = Math.round(clamp((bodyK / surrK) ** 4 * 1.5, 2, 28)) * (0.4 + emiss * 0.6);
    figure = (
      <PlayWrap gate={gate}>
        <div style={fwrap}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Radiation from a body at ${bodyK} kelvin, ${radP.toFixed(0)} watts`}>
            {/* cold surroundings note (top-left, clear of the play toggle) */}
            <text x={20} y={26} textAnchor="start" fontSize={12} fill="var(--stage-muted)">surroundings {surrK} K</text>
            {/* radiated photons — wavy arrows flying outward (recycled by phase) */}
            {Array.from({ length: Math.round(nPhotons) }, (_, i) => {
              const ang = (i / Math.round(nPhotons)) * Math.PI * 2 + i * 0.7;
              const u = ((t * (0.4 + tFrac) + i * 0.13) % 1);
              const r = glowR + 6 + u * 150;
              const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
              const o = (1 - u) * (0.4 + emiss * 0.6);
              return <g key={i} opacity={o}><circle cx={px} cy={py} r={2.5} fill={thermalColor(tFrac)} /><line x1={cx + Math.cos(ang) * (r - 12)} y1={cy + Math.sin(ang) * (r - 12)} x2={px} y2={py} stroke={thermalColor(tFrac)} strokeWidth={1.5} opacity={0.5} /></g>;
            })}
            {/* glow + body */}
            <circle cx={cx} cy={cy} r={glowR} fill={thermalColor(tFrac)} opacity={0.18} />
            <circle cx={cx} cy={cy} r={bodyR} fill={emiss > 0.5 ? thermalColor(tFrac) : 'color-mix(in oklab, var(--stage-metal) 60%, var(--stage-bg))'} stroke="var(--stage-metal)" strokeWidth={2} />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--stage-bg)">{bodyK} K</text>
            {/* T⁴ insight bar */}
            <text x={520} y={120} fontSize={12} fill="var(--stage-muted)">power ∝ T⁴</text>
            <rect x={520} y={130} width={160} height={16} rx={4} fill="var(--stage-grid)" />
            <rect x={520} y={130} width={clamp((bodyK / 1000) ** 4 * 160, 2, 160)} height={16} rx={4} fill={thermalColor(tFrac)} />
          </svg>
        </div>
      </PlayWrap>
    );
    controls = (
      <ControlBar>
        <Field label="body temperature" value={`${bodyK} K`}><Slider value={bodyK} min={surrK} max={1000} step={10} onChange={setBodyK} ariaLabel="body temperature (kelvin)" /></Field>
        <Field label="surface">
          <span className="lab-field-row">
            <Chip selected={emiss > 0.5} onClick={() => setEmiss(1)}>matte black (ε≈1)</Chip>
            <Chip selected={emiss <= 0.5} onClick={() => setEmiss(0.1)}>shiny (ε≈0.1)</Chip>
          </span>
        </Field>
      </ControlBar>
    );
    aside = (
      <>
        <Callout tone="result"><span style={tnum}><strong style={{ fontSize: 16 }}>P = {radP.toFixed(radP < 10 ? 1 : 0)} W</strong></span></Callout>
        <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
          <Tex tex={'P = \\varepsilon\\,\\sigma\\,A\\,(T^4 - T_0^4)'} block />
          <span style={{ color: 'var(--stage-muted)' }}>EM waves — needs <strong style={{ color: 'var(--stage-fg)' }}>no medium</strong> (this is how the Sun reaches us). The T⁴ is fierce: double the kelvin temperature → <strong style={{ color: 'var(--stage-fg)' }}>16×</strong> the power. A matte-black surface radiates far more than a shiny one.</span>
        </div>
      </>
    );
  }

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controlConfig={controlConfig}
      controls={(
        <div style={{ display: 'grid', gap: 10 }}>
          <ControlBar>
            <Field label="mechanism">
              <span className="lab-field-row">
                <Chip selected={mode === 'conduction'} onClick={() => setMode('conduction')}>conduction</Chip>
                <Chip selected={mode === 'convection'} onClick={() => setMode('convection')}>convection</Chip>
                <Chip selected={mode === 'radiation'} onClick={() => setMode('radiation')}>radiation</Chip>
              </span>
            </Field>
          </ControlBar>
          {controls}
        </div>
      )}>
      {figure}
    </LabFrame>
  );
}

const fwrap: React.CSSProperties = { borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' };
const tnum: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };
