'use client';

/**
 * ThermalExpansionLab, heat a solid and it grows. Drag the temperature and watch:
 *
 *   • LENGTH  ΔL = α·L·ΔT          (a rod stretches, why rails and bridges leave gaps)
 *   • AREA    ΔA = 2α·A·ΔT          (a plate grows in both directions)
 *   • VOLUME  ΔV = 3α·V·ΔT          (a ball swells in all three)
 *   • BIMETALLIC STRIP, two metals with different α bonded back-to-back: the one
 *     that expands more (brass) ends up on the OUTSIDE of the curve, so the strip
 *     bends. Heat it enough and it closes a contact, that's a thermostat.
 *
 * Real expansion is tiny (α ~ 10⁻⁵ /°C), so the drawing is MAGNIFIED for visibility
 * (the on-screen note says by how much) while the readout shows the TRUE ΔL/ΔA/ΔV.
 * Interactive, recomputes as you drag, no simulation loop. Pure SVG, themed.
 */

import { useId, useState, type ReactNode } from 'react';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, type ControlConfig } from '../../kit/frame.js';
import { thermalColor } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';

type Mode = 'length' | 'area' | 'volume' | 'bimetallic';

export interface ThermalExpansionProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /**
   * Creator policy. For a single-case lesson (e.g. area only) set `mode: 'area'`
   * and `controlConfig: { hide: ['what expands'] }`; lock/hide the material or ΔT
   * the same way.
   */
  controlConfig?: ControlConfig;
}

const W = 720, H = 360;
const MAG = 120;                                     // drawing magnification (honest: shown on screen)
// linear expansion coefficients α, /°C
const METALS: Record<string, { a: number; label: string }> = {
  aluminium: { a: 23e-6, label: 'aluminium' },
  brass: { a: 19e-6, label: 'brass' },
  copper: { a: 17e-6, label: 'copper' },
  steel: { a: 12e-6, label: 'steel' },
  invar: { a: 1.2e-6, label: 'Invar' },
};

export function ThermalExpansionLab({
  mode: mode0 = 'length',
  title = 'Thermal expansion: heat it, it grows',
  prompt = 'Solids expand when heated as their atoms jiggle further apart. Drag the temperature: length, area and volume each grow, and two bonded metals bend.',
  objectives = [
    'Use ΔL = αLΔT, and that area grows by 2α and volume by 3α',
    'See expansion is tiny but real, why rails, bridges and pipes need gaps',
    'Explain a bimetallic strip / thermostat: unequal α → it bends',
  ],
  controlConfig,
}: ThermalExpansionProps = {}): ReactNode {
  const [mode, setMode] = useState<Mode>(mode0);
  const [material, setMaterial] = useState('aluminium');
  const [dT, setDT] = useState(100);
  const gid = useId().replace(/:/g, '');

  const a = METALS[material]!.a;
  const frac = a * dT;                                 // fractional linear expansion
  const tCol = thermalColor(Math.max(0, Math.min(1, dT / 200)));
  const cold = thermalColor(0);

  let figure: ReactNode;
  let aside: ReactNode;

  if (mode === 'length') {
    const x0 = 110, y = 180, h = 44, L0 = 320;
    const L1 = L0 * (1 + frac * MAG);
    const dLmm = 1000 * frac;                          // real ΔL for a 1 m rod, mm
    figure = expansionWrap(
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Rod expands by ${dLmm.toFixed(2)} millimetres`}>
        {/* original (dashed outline) */}
        <rect x={x0} y={y - h / 2} width={L0} height={h} rx={4} fill="none" stroke={cold} strokeWidth={2} strokeDasharray="6 4" />
        {/* heated rod */}
        <rect x={x0} y={y - h / 2} width={L1} height={h} rx={4} fill={tCol} opacity={0.85} stroke="var(--stage-metal)" strokeWidth={2} />
        {/* growth marker at the free end */}
        <line x1={x0 + L0} y1={y - h / 2 - 14} x2={x0 + L0} y2={y + h / 2 + 14} stroke="var(--stage-muted)" strokeWidth={1} strokeDasharray="3 3" />
        <line x1={x0 + L1} y1={y - h / 2 - 14} x2={x0 + L1} y2={y + h / 2 + 14} stroke="var(--stage-good)" strokeWidth={1.5} />
        {L1 > L0 + 2 && <>
          <line x1={x0 + L0} y1={y + h / 2 + 22} x2={x0 + L1} y2={y + h / 2 + 22} stroke="var(--stage-good)" strokeWidth={2} />
          <text x={(x0 + L0 + x0 + L1) / 2} y={y + h / 2 + 38} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--stage-good)">ΔL</text>
        </>}
        {/* clamped (fixed) left end */}
        <rect x={x0 - 12} y={y - h / 2 - 8} width={12} height={h + 16} fill="var(--stage-metal)" />
        <text x={x0 + L0 / 2} y={y - h / 2 - 16} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">drawing ×{MAG} (real ΔL = {dLmm.toFixed(2)} mm for a 1 m rod)</text>
      </svg>,
    );
    aside = expansionAside(<Tex tex={'\\Delta L = \\alpha\\,L\\,\\Delta T'} block />, `ΔL = ${dLmm.toFixed(2)} mm`,
      <>A 1 m {METALS[material]!.label} rod warmed {dT} °C grows just <strong style={{ color: 'var(--stage-fg)' }}>{dLmm.toFixed(2)} mm</strong>, tiny, but a 100 m bridge would grow {(dLmm * 100).toFixed(0)} mm, so it needs expansion joints.</>);
  } else if (mode === 'area') {
    const cx = W / 2, cy = H / 2 + 6, s0 = 210;        // centred; grows symmetrically about the centre
    const s1 = s0 * (1 + frac * MAG);
    const dAcm2 = 10000 * 2 * frac;                    // real ΔA for a 1 m² plate, cm²
    figure = expansionWrap(
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Plate area grows by ${dAcm2.toFixed(1)} square centimetres`}>
        <rect x={cx - s0 / 2} y={cy - s0 / 2} width={s0} height={s0} fill="none" stroke={cold} strokeWidth={2} strokeDasharray="6 4" />
        <rect x={cx - s1 / 2} y={cy - s1 / 2} width={s1} height={s1} fill={tCol} opacity={0.55} stroke="var(--stage-metal)" strokeWidth={2} />
        {/* both-directions arrows */}
        <text x={cx} y={cy + s1 / 2 + 20} textAnchor="middle" fontSize={15} fill="var(--stage-good)">↔</text>
        <text x={cx - s1 / 2 - 16} y={cy + 5} textAnchor="middle" fontSize={15} fill="var(--stage-good)">↕</text>
        <text x={cx} y={cy - s1 / 2 - 12} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">drawing ×{MAG}, grows in BOTH directions (2α)</text>
      </svg>,
    );
    aside = expansionAside(<Tex tex={'\\Delta A = 2\\alpha\\,A\\,\\Delta T'} block />, `ΔA = ${dAcm2.toFixed(1)} cm²`,
      <>A plate expands along its width AND its length, so the area coefficient is <strong style={{ color: 'var(--stage-fg)' }}>2α</strong>. A 1 m² {METALS[material]!.label} sheet warmed {dT} °C gains {dAcm2.toFixed(1)} cm².</>);
  } else if (mode === 'volume') {
    const cx = W / 2, cy = H / 2 + 6, r0 = 96;
    const r1 = r0 * (1 + frac * MAG);
    const dVcm3 = 1000 * 3 * frac;                     // real ΔV for a 1 L block, cm³
    figure = expansionWrap(
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Volume grows by ${dVcm3.toFixed(1)} cubic centimetres`}>
        <defs>
          {/* spherical shading: warm body, dark rim (curvature), bright top-left specular */}
          <radialGradient id={`${gid}-rim`} cx="50%" cy="50%" r="50%">
            <stop offset="62%" stopColor="rgba(0,0,0,0)" /><stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
          </radialGradient>
          <radialGradient id={`${gid}-spec`} cx="33%" cy="29%" r="44%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" /><stop offset="60%" stopColor="rgba(255,255,255,0.12)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {/* ground shadow grounds the ball in 3-D */}
        <ellipse cx={cx} cy={cy + r1 + 16} rx={r1 * 0.82} ry={r1 * 0.13} fill="rgba(0,0,0,0.16)" />
        {/* the heated ball, solid colour + curvature rim + specular */}
        <circle cx={cx} cy={cy} r={r1} fill={tCol} />
        <circle cx={cx} cy={cy} r={r1} fill={`url(#${gid}-rim)`} />
        {/* latitude / longitude lines so it reads as a sphere, not a disc */}
        <ellipse cx={cx} cy={cy} rx={r1} ry={r1 * 0.34} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth={1.2} />
        <ellipse cx={cx} cy={cy} rx={r1 * 0.34} ry={r1} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={1.2} />
        <circle cx={cx} cy={cy} r={r1} fill={`url(#${gid}-spec)`} />
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="var(--stage-metal)" strokeWidth={2} />
        {/* original size, marked on the ball's face */}
        <circle cx={cx} cy={cy} r={r0} fill="none" stroke="var(--stage-bg)" strokeWidth={2.5} strokeDasharray="6 5" opacity={0.85} />
        <text x={cx} y={cy - r1 - 14} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">drawing ×{MAG}, grows in ALL three directions (3α)</text>
      </svg>,
    );
    aside = expansionAside(<Tex tex={'\\Delta V = 3\\alpha\\,V\\,\\Delta T'} block />, `ΔV = ${dVcm3.toFixed(1)} cm³`,
      <>A solid swells in all three directions, so the volume coefficient is <strong style={{ color: 'var(--stage-fg)' }}>3α</strong>. A 1 L {METALS[material]!.label} block warmed {dT} °C gains {dVcm3.toFixed(1)} cm³.</>);
  } else {
    // bimetallic strip, brass (high α) bonded over steel (low α); bends toward steel
    const x0 = 150, y0 = 120, L = 320, thick = 9;
    const aHi = METALS.brass!.a, aLo = METALS.steel!.a;
    const theta = Math.max(0, Math.min(1.15, (aHi - aLo) * dT * 1700)); // total bend angle, rad (magnified)
    const R = theta > 1e-3 ? L / theta : 1e6;
    const N = 36;
    const center: { x: number; y: number; tx: number; ty: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const al = theta * (i / N);
      center.push({ x: x0 + R * Math.sin(al), y: y0 + R * (1 - Math.cos(al)), tx: Math.cos(al), ty: Math.sin(al) });
    }
    // offset each side by ±thick/2 along the normal (sin α, −cos α) points to the outer/brass side
    const off = (sign: number): string => center.map((p) => {
      const al = Math.atan2(p.ty, p.tx);
      return `${(p.x + sign * (thick / 2) * Math.sin(al)).toFixed(1)},${(p.y - sign * (thick / 2) * Math.cos(al)).toFixed(1)}`;
    }).join(' ');
    const tip = center[N]!;
    const contactY = y0 + 150, on = tip.y >= contactY - 6;
    figure = expansionWrap(
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Bimetallic strip bent ${(theta * 57).toFixed(0)} degrees, contact ${on ? 'closed' : 'open'}`}>
        {/* clamp */}
        <rect x={x0 - 16} y={y0 - 14} width={16} height={28} fill="var(--stage-metal)" />
        {/* brass (outer/top) and steel (inner/bottom) */}
        <polyline points={off(1)} fill="none" stroke="#c9912f" strokeWidth={thick} strokeLinecap="round" />
        <polyline points={off(-1)} fill="none" stroke="color-mix(in oklab, var(--stage-metal) 70%, var(--stage-fg))" strokeWidth={thick} strokeLinecap="round" />
        {/* contact terminal + lamp */}
        <circle cx={tip.x} cy={contactY} r={7} fill={on ? 'var(--stage-good)' : 'var(--stage-grid)'} stroke="var(--stage-metal)" strokeWidth={2} />
        <line x1={tip.x} y1={contactY} x2={tip.x} y2={contactY + 30} stroke="var(--stage-metal)" strokeWidth={2} />
        <text x={tip.x + 16} y={contactY + 4} fontSize={12} fontWeight={800} fill={on ? 'var(--stage-good)' : 'var(--stage-muted)'}>{on ? 'ON' : 'off'}</text>
        {/* legend */}
        <g fontSize={11}>
          <rect x={470} y={70} width={12} height={12} fill="#c9912f" /><text x={488} y={80} fill="var(--stage-fg)">brass (α high), outside</text>
          <rect x={470} y={90} width={12} height={12} fill="color-mix(in oklab, var(--stage-metal) 70%, var(--stage-fg))" /><text x={488} y={100} fill="var(--stage-fg)">steel (α low), inside</text>
        </g>
      </svg>,
    );
    aside = expansionAside(<Tex tex={'\\text{brass } \\alpha > \\text{steel } \\alpha'} block />, on ? 'contact CLOSED' : 'contact open',
      <>Brass expands more than steel, so when heated it must take the <strong style={{ color: 'var(--stage-fg)' }}>longer, outer</strong> edge of the curve, the strip bends toward the steel. Drag the temperature up until it closes the contact: that's how a <strong style={{ color: 'var(--stage-fg)' }}>thermostat</strong> works.</>);
  }

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="what expands">
          <span className="lab-field-row">
            <Chip selected={mode === 'length'} onClick={() => setMode('length')}>length</Chip>
            <Chip selected={mode === 'area'} onClick={() => setMode('area')}>area</Chip>
            <Chip selected={mode === 'volume'} onClick={() => setMode('volume')}>volume</Chip>
            <Chip selected={mode === 'bimetallic'} onClick={() => setMode('bimetallic')}>bimetallic strip</Chip>
          </span>
        </Field>
      </ControlBar>
      <ControlBar>
        {mode !== 'bimetallic' && (
          <Field label="material">
            <span className="lab-field-row">
              {Object.entries(METALS).map(([key, m]) => (
                <Chip key={key} selected={material === key} onClick={() => setMaterial(key)}>{m.label} (α={(m.a * 1e6).toFixed(1)}×10⁻⁶)</Chip>
              ))}
            </span>
          </Field>
        )}
        <Field label="temperature rise ΔT" value={`+${dT} °C`}>
          <Slider value={dT} min={0} max={200} step={5} onChange={setDT} ariaLabel="temperature rise (Celsius)" />
        </Field>
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}

function expansionWrap(svg: ReactNode): ReactNode {
  return <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>{svg}</div>;
}

function expansionAside(formula: ReactNode, result: string, note: ReactNode): ReactNode {
  return (
    <>
      <Callout tone="result"><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 16 }}>{result}</span></Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        {formula}
        <span style={{ color: 'var(--stage-muted)' }}>{note}</span>
      </div>
    </>
  );
}
