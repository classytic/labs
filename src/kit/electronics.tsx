'use client';

/**
 * Electronics glyph vocabulary (two tiers, one file):
 *  1. SCHEMATIC symbols, exam-standard (CAIE / IGCSE / A-level) circuit symbols
 *     (Resistor, Cell, Capacitor, Bulb, Diode, Switch, meters…) for circuit
 *     DIAGRAMS, where the conventional symbol is what's being taught.
 *  2. ILLUSTRATIVE icons (bottom of file), engaging, real-object glyphs
 *     (LampGlyph, AcDcSourceGlyph) for hero / analogy contexts, with thermal
 *     glow + bloom from the shared <defs>.
 * Both are a subject vocabulary, so they live in @classytic/labs (not the
 * domain-neutral stage engine). Pick the tier that fits the lesson.
 *
 * Schematic symbols are drawn in PIXEL space (callers project math→px first), the
 * same contract as the balance-kit glyphs (glyphs.tsx).
 *
 * ── Authoring contract (every symbol MUST follow it) ────────────────────────
 * • A two-terminal device is drawn CENTERED at (cx, cy), its terminals at
 *   (cx − half, cy) and (cx + half, cy). Draw the two short LEADS from each
 *   terminal to the body edge with the `Leads` helper, then the body symbol.
 * • COLOUR IS A TOKEN, never a literal. Conductors/leads → var(--stage-wire);
 *   the energised path → var(--stage-live) when `live`; the body outline →
 *   var(--stage-metal); fills → var(--stage-bg); charge/field → var(--stage-charge);
 *   warning/hot glow → var(--stage-warn). Shade with color-mix(in oklab, <token> …),
 *   top-edge highlight via var(--stage-sheen). A raw #hex / rgb()/oklch() in a body is a bug.
 * • PURE SVG fragment: return a <g> of SVG only, NO <style>, NO <defs>, NO hooks,
 *   NO CSS animation. Motion is DATA: take a 0..1 phase/level prop and the host's
 *   frame loop drives it (so it honours prefers-reduced-motion upstream). This is
 *   how CapacitorGlyph animates its leak.
 * • Schematic, not skeuomorphic: clean strokes, rounded caps/joins, a hairline
 *   sheen on the lit/top edge, match the Brilliant-grade flat read of glyphs.tsx,
 *   no glossy 3-stop gradients.
 * • Label (value/name like "220Ω", "10µF", "A") sits ABOVE the body, centered,
 *   var(--stage-fg), pointer-events:none.
 */

import type { ReactNode } from 'react';

/** Common props for a two-terminal device glyph. `half` = px center→terminal. */
export interface LeadGlyphProps {
  cx: number;
  cy: number;
  half: number;
  /** Energised (current flowing) → leads + symbol pick up the live colour. */
  live?: boolean;
  /** Value / name shown above the body (e.g. "220Ω", "10µF", "A"). */
  label?: string;
}

const WIRE = 'var(--stage-wire)';
const LIVE = 'var(--stage-live)';
const METAL = 'var(--stage-metal)';
const BG = 'var(--stage-bg)';
const FG = 'var(--stage-fg)';
const CHARGE = 'var(--stage-charge)';
const SHEEN = 'color-mix(in oklab, var(--stage-sheen) 45%, transparent)';

// Per-device SIGNATURE colours (token + a tasteful oklch fallback) so each part reads
// as itself, not a uniform grey. Real-object inspired: tan resistor, teal cap, violet
// diode, green cell, amber lamp, indigo MOSFET. Body picks up the colour; the leads
// still go LIVE when current flows, so energised state stays legible too.
// green is reserved for the energised wires/flow, so no component uses it.
const C_RESISTOR = 'var(--stage-resistor, oklch(0.74 0.09 70))';  // tan / beige body
const C_CAP = 'var(--stage-capacitor, oklch(0.6 0.14 250))';      // blue
const C_DIODE = 'var(--stage-diode, oklch(0.56 0.16 290))';       // violet
const C_CELL = 'var(--stage-cell, oklch(0.58 0.18 28))';          // red / vermilion
const C_LAMP = 'var(--stage-warn, oklch(0.78 0.15 75))';          // amber glass
const C_SWITCH = 'var(--stage-switch, oklch(0.6 0.04 250))';      // slate
const C_MOS = 'var(--stage-mosfet, oklch(0.57 0.13 300))';        // magenta-indigo
const C_BAND = ['oklch(0.45 0.08 50)', 'oklch(0.55 0.18 28)', 'oklch(0.6 0.15 75)']; // resistor colour bands
const tint = (c: string, pct = 12): string => `color-mix(in oklab, ${c} ${pct}%, ${BG})`;

/** The two clean leads from each terminal to the body edge at ±bodyHalf (no nubs, no bloat). */
export function Leads({ cx, cy, half, bodyHalf, live }: { cx: number; cy: number; half: number; bodyHalf: number; live?: boolean }): ReactNode {
  const wire = live ? LIVE : WIRE;
  return (
    <g>
      <line x1={cx - half} y1={cy} x2={cx - bodyHalf} y2={cy} stroke={wire} strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + bodyHalf} y1={cy} x2={cx + half} y2={cy} stroke={wire} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export interface TagProps {
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  /** halo colour painted UNDER the text so it stays legible over wires/lines/fills. */
  halo?: string;
}

/**
 * Tag — an SVG text label with a background HALO (a stroke in the bg colour painted under
 * the fill). ALWAYS use this instead of a bare <text> in a schematic: it keeps labels
 * readable wherever they land, so a label crossing a wire or sitting on a fill never turns
 * into mud. (This is the same paint-order trick the stage axis labels use.)
 */
export function Tag({ x, y, text, color = FG, size = 11, weight = 600, anchor = 'middle', halo = BG }: TagProps): ReactNode {
  return (
    <text
      x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor}
      style={{ pointerEvents: 'none', paintOrder: 'stroke', stroke: halo, strokeWidth: 3.5, strokeLinejoin: 'round' }}
    >
      {text}
    </text>
  );
}

/** Value/name label above a body of half-height `bodyH` (haloed via Tag). */
function GlyphLabel({ cx, cy, bodyH, label }: { cx: number; cy: number; bodyH: number; label?: string }): ReactNode {
  if (!label) return null;
  return <Tag x={cx} y={cy - bodyH - 7} text={label} />;
}

/**
 * RESISTOR, the IEC/CAIE rectangle (an open box interrupting the wire). The
 * exam-standard symbol; clean token fill + metal outline + a top-edge sheen.
 */
export function ResistorGlyph({ cx, cy, half, live, label }: LeadGlyphProps): ReactNode {
  const bw = 22;            // body half-width
  const bh = 11;            // body half-height
  const body = `color-mix(in oklab, ${C_RESISTOR} 78%, ${BG})`;
  const edge = `color-mix(in oklab, ${C_RESISTOR} 60%, #000)`;
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />
      {/* pill-shaped resistor body */}
      <rect x={cx - bw} y={cy - bh} width={bw * 2} height={bh * 2} rx={bh * 0.85} fill={body} stroke={edge} strokeWidth={1.5} />
      {/* colour bands (the real-resistor read) */}
      {C_BAND.map((c, i) => <rect key={i} x={cx - 8 + i * 7} y={cy - bh + 2} width={3} height={bh * 2 - 4} rx={1} fill={c} />)}
      {/* top-edge sheen */}
      <line x1={cx - bw * 0.7} y1={cy - bh + 2.5} x2={cx + bw * 0.7} y2={cy - bh + 2.5} stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      <GlyphLabel cx={cx} cy={cy} bodyH={bh} label={label} />
    </g>
  );
}

/**
 * CELL / BATTERY, one long thin plate (+) and one short thick plate (−). Pass
 * `cells` > 1 to draw a battery (repeated plate pairs). EMF label above.
 */
export function CellGlyph({ cx, cy, half, live, label, cells = 1 }: LeadGlyphProps & { cells?: number }): ReactNode {
  const n = Math.max(1, Math.round(cells));
  const gap = 7;                       // px between the long and short plate of a cell
  const span = n * gap * 2 - gap;      // total width of all plates
  const bodyHalf = span / 2 + 2;
  const longH = 13;                    // + plate (long, thin)
  const shortH = 7;                    // − plate (short, thick)
  const plates: ReactNode[] = [];
  let x = cx - span / 2;
  for (let i = 0; i < n; i++) {
    plates.push(<line key={`l${i}`} x1={x} y1={cy - longH} x2={x} y2={cy + longH} stroke={C_CELL} strokeWidth={2} strokeLinecap="round" />);
    x += gap;
    plates.push(<line key={`s${i}`} x1={x} y1={cy - shortH} x2={x} y2={cy + shortH} stroke={C_CELL} strokeWidth={4.5} strokeLinecap="round" />);
    x += gap;
  }
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bodyHalf} live={live} />
      {plates}
      <GlyphLabel cx={cx} cy={cy} bodyH={longH} label={label} />
    </g>
  );
}

export interface CapacitorGlyphProps extends LeadGlyphProps {
  /** Stored charge, 0 (empty) → 1 (full). Drives the field-line count + intensity. */
  charge?: number;
  /** Leak in progress, render falling drips driven by `leakPhase`. */
  leaking?: boolean;
  /** 0..1 leak animation phase (host frame loop drives it; honours reduced-motion). */
  leakPhase?: number;
  /** Polarised (electrolytic): the negative plate is curved + a "+" marks the anode. */
  polarised?: boolean;
}

/**
 * CAPACITOR, two parallel plates with a visible STORED-CHARGE field between them
 * and an optional LEAK. This is the centerpiece glyph: `charge` (0..1) sets how
 * many field lines bridge the plates and their intensity, so a charging cap fills
 * and a leaking cap visibly empties; `leaking` + `leakPhase` drip charge off the
 * lower plate (the "why capacitors don't hold charge forever" picture). All motion
 * is data, the lab's RC integrator lowers `charge` and advances `leakPhase`.
 */
export function CapacitorGlyph({ cx, cy, half, live, label, charge = 0, leaking, leakPhase = 0, polarised }: CapacitorGlyphProps): ReactNode {
  const q = Math.max(0, Math.min(1, charge));
  const plateGap = 14;                 // px between plates (wide enough to read the field)
  const plateH = 18;                   // plate half-height
  const bodyHalf = plateGap / 2 + 3;
  const lx = cx - plateGap / 2;        // left (+) plate x
  const rx = cx + plateGap / 2;        // right (−) plate x

  // stored charge: a FAINT field between the plates (the plates stay dominant so
  // it always reads as a capacitor, not a ladder), 1..3 thin lines that thin out
  // as the charge leaks away.
  const lines = q > 0.02 ? Math.round(1 + q * 2) : 0;
  const field: ReactNode[] = [];
  for (let i = 0; i < lines; i++) {
    const fy = cy - plateH * 0.5 + (plateH) * (lines === 1 ? 0.5 : i / (lines - 1));
    field.push(<line key={`f${i}`} x1={lx + 2} y1={fy} x2={rx - 2} y2={fy} stroke={CHARGE} strokeWidth={1} strokeLinecap="round" opacity={0.12 + 0.3 * q} />);
  }

  // leak drips falling off the lower plate edge, position from leakPhase (0..1)
  const drips: ReactNode[] = [];
  if (leaking && q > 0.02) {
    for (let d = 0; d < 2; d++) {
      const ph = (leakPhase + d * 0.5) % 1;
      const dy = cy + plateH + ph * 16;
      drips.push(<circle key={`d${d}`} cx={cx} cy={dy} r={2.2} fill={CHARGE} opacity={(1 - ph) * (0.3 + 0.5 * q)} />);
    }
  }

  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bodyHalf} live={live} />
      {/* stored charge fills the gap between the plates (the bucket level) */}
      {q > 0.02 && <rect x={lx + 1} y={cy - plateH} width={rx - lx - 2} height={plateH * 2} fill={C_CAP} opacity={0.12 + 0.4 * q} rx={1} />}
      {field}
      {/* + plate (straight) */}
      <line x1={lx} y1={cy - plateH} x2={lx} y2={cy + plateH} stroke={C_CAP} strokeWidth={4} strokeLinecap="round" />
      {/* − plate: curved if polarised, else straight */}
      {polarised
        ? <path d={`M ${rx} ${cy - plateH} Q ${rx + 5} ${cy} ${rx} ${cy + plateH}`} fill="none" stroke={C_CAP} strokeWidth={3.5} strokeLinecap="round" />
        : <line x1={rx} y1={cy - plateH} x2={rx} y2={cy + plateH} stroke={C_CAP} strokeWidth={3.5} strokeLinecap="round" />}
      {polarised && <text x={lx - 4} y={cy - plateH + 2} fill={FG} fontSize={11} fontWeight={700} textAnchor="end" style={{ pointerEvents: 'none' }}>+</text>}
      {drips}
      <GlyphLabel cx={cx} cy={cy} bodyH={plateH} label={label} />
    </g>
  );
}

export interface SwitchGlyphProps extends LeadGlyphProps {
  /** Lever down on the right contact (closed) vs lifted ~40° (open). */
  closed?: boolean;
}

/**
 * SWITCH (SPST), the exam-standard open/closed switch: two terminal contacts and
 * a hinged lever off the left contact. Closed → lever lies horizontal onto the
 * right contact (energised path picks up the live colour); open → lever lifts
 * ~40° and the gap is drawn in the warn/neutral colour.
 */
export function SwitchGlyph({ cx, cy, half, live, label, closed }: SwitchGlyphProps): ReactNode {
  const bw = 18;                         // body half-width (hinge ↔ right contact)
  const hx = cx - bw;                    // hinge (left contact) x
  const tx = cx + bw;                    // right contact x
  const len = bw * 2;                    // lever length
  const ang = closed ? 0 : -40 * (Math.PI / 180);
  const ex = hx + len * Math.cos(ang);   // lever free-end x
  const ey = cy + len * Math.sin(ang);   // lever free-end y (up = negative)
  // The lever keeps the switch's own signature colour (never the green live colour) so
  // a closed switch still reads as a switch on an energised wire, not as plain conductor.
  const lever = closed ? C_SWITCH : 'var(--stage-warn)';
  const bodyH = closed ? 4 : len * Math.sin(-ang) + 4;
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />
      {/* contact pads at hinge + right terminal, tinted with the switch colour */}
      <circle cx={hx} cy={cy} r={3.4} fill={C_SWITCH} />
      <circle cx={tx} cy={cy} r={3.4} fill={C_SWITCH} />
      {/* the hinged lever */}
      <line x1={hx} y1={cy} x2={ex} y2={ey} stroke={lever} strokeWidth={3.6} strokeLinecap="round" />
      {/* hairline sheen along the lit/top edge of the lever */}
      <line x1={hx} y1={cy - 1.4} x2={ex} y2={ey - 1.4} stroke={SHEEN} strokeWidth={1.2} strokeLinecap="round" />
      <GlyphLabel cx={cx} cy={cy} bodyH={bodyH} label={label} />
    </g>
  );
}

export interface BulbGlyphProps extends LeadGlyphProps {
  /** Filament brightness, 0 (dark) → 1 (fully lit). Scales the glow halo + cross intensity. */
  brightness?: number;
}

/**
 * FILAMENT LAMP, the exam-standard circle with an inscribed × cross (NOT a ~,
 * which is the AC-source mark). When `live`, a warm glow halo (var(--stage-warn))
 * whose radius + opacity scale with `brightness` blooms behind the bulb and the
 * cross brightens; when dark, the cross is neutral metal. `bodyHalf` ≈ the circle
 * radius, so it lines up with ResistorGlyph. Glow is DATA, the host drives
 * `brightness` from the circuit's power.
 */
export function BulbGlyph({ cx, cy, half, live, label, brightness = 0 }: BulbGlyphProps): ReactNode {
  const r = 16;                                   // circle radius == bodyHalf
  const b = Math.max(0, Math.min(1, brightness));
  const lit = live && b > 0.02;
  const k = r * Math.SQRT1_2;                      // half-diagonal of the inscribed ×
  const crossStroke = lit ? C_LAMP : METAL;
  const ring = lit ? C_LAMP : METAL;
  return (
    <g>
      {/* warm glow halo behind the bulb, radius + opacity ramp with brightness */}
      {lit && (
        <circle cx={cx} cy={cy} r={r + 4 + b * 12} fill="var(--stage-warn)" opacity={0.12 + 0.32 * b} style={{ pointerEvents: 'none' }} />
      )}
      <Leads cx={cx} cy={cy} half={half} bodyHalf={r} live={live} />
      <circle cx={cx} cy={cy} r={r} fill={lit ? tint(C_LAMP, 18) : BG} stroke={ring} strokeWidth={2} />
      {/* inscribed × cross (the filament) */}
      <line x1={cx - k} y1={cy - k} x2={cx + k} y2={cy + k} stroke={crossStroke} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - k} y1={cy + k} x2={cx + k} y2={cy - k} stroke={crossStroke} strokeWidth={2.5} strokeLinecap="round" />
      {/* hairline sheen on the top-left lit edge */}
      <path d={`M ${cx - r * 0.62} ${cy - r * 0.62} A ${r} ${r} 0 0 1 ${cx + r * 0.18} ${cy - r * 0.86}`} fill="none" stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      <GlyphLabel cx={cx} cy={cy} bodyH={r} label={label} />
    </g>
  );
}

export interface DiodeGlyphProps extends LeadGlyphProps {
  /** Forward-biased & passing current, tint the triangle/leads LIVE (when `live`). */
  conducting?: boolean;
}

/**
 * DIODE, the exam-standard symbol: a filled triangle (anode, current →) pointing
 * right into a vertical bar (cathode). Current flows anode→cathode only; when it is
 * forward-biased and `live`, the triangle, bar and leads light up (`conducting`).
 */
export function DiodeGlyph({ cx, cy, half, live, label, conducting }: DiodeGlyphProps): ReactNode {
  const bw = 16;                 // body half-width (triangle base → cathode bar)
  const bh = 13;                 // triangle half-height
  const on = !!(conducting && live);
  const accent = C_DIODE;        // keep its signature colour; energised state shows on the leads/flow
  const apex = cx + bw;          // triangle tip == cathode bar == body edge (leads meet it)
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={on} />
      {/* anode triangle (current points → into the cathode bar) */}
      <path
        d={`M ${cx - bw} ${cy - bh} L ${apex} ${cy} L ${cx - bw} ${cy + bh} Z`}
        fill={tint(C_DIODE, on ? 38 : 14)}
        stroke={accent}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* cathode bar */}
      <line x1={apex} y1={cy - bh} x2={apex} y2={cy + bh} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      {/* hairline sheen on the upper anode edge */}
      <line x1={cx - bw + 1.5} y1={cy - bh + 1.5} x2={apex - 1.5} y2={cy - 1} stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      <GlyphLabel cx={cx} cy={cy} bodyH={bh} label={label} />
    </g>
  );
}

export interface LedGlyphProps extends LeadGlyphProps {
  /** Forward-biased and emitting, arrows + a soft glow light up in `color`. */
  on?: boolean;
  /** Emission colour token when `on` (default the charge token). */
  color?: string;
}

/**
 * LED (light-emitting diode), the exam-standard diode triangle pointing into a
 * cathode bar, PLUS two short emission arrows pointing away (up-right) from the
 * junction. When `on`, the arrows + a soft halo glow in `color`; off → neutral metal.
 */
export function LedGlyph({ cx, cy, half, live, label, on, color = CHARGE }: LedGlyphProps): ReactNode {
  const bw = 16;                         // body half-width (triangle base → bar)
  const th = 12;                         // triangle half-height
  const baseX = cx - bw;                 // anode side (triangle base)
  const barX = cx + bw;                  // cathode bar x
  const emit = on ? color : METAL;       // arrow + glow colour
  // two short emission arrows, fanning up-right from just above the junction
  const arrows: ReactNode[] = [];
  for (let a = 0; a < 2; a++) {
    const ox = cx + 2 + a * 7;           // tail x, stepped right
    const oy = cy - th - 2 - a * 1;      // tail y, just above the body
    const ex = ox + 7;                   // head x (up-right)
    const ey = oy - 8;                   // head y
    arrows.push(
      <g key={`em${a}`} stroke={emit} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={on ? 0.95 : 0.6}>
        <line x1={ox} y1={oy} x2={ex} y2={ey} />
        <path d={`M ${ex} ${ey} L ${ex - 4} ${ey + 0.5} M ${ex} ${ey} L ${ex - 0.5} ${ey + 4}`} />
      </g>,
    );
  }
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />
      {/* soft emission halo behind the junction when lit */}
      {on && <circle cx={cx} cy={cy} r={bw + 4} fill={color} opacity={0.16} />}
      {/* diode triangle (anode → cathode) */}
      <path d={`M ${baseX} ${cy - th} L ${barX} ${cy} L ${baseX} ${cy + th} Z`} fill={BG} stroke={live ? LIVE : METAL} strokeWidth={2} strokeLinejoin="round" />
      {/* hairline sheen on the lit top edge of the triangle */}
      <line x1={baseX + 1.5} y1={cy - th + 2} x2={barX - 2} y2={cy - 1} stroke={SHEEN} strokeWidth={1.2} strokeLinecap="round" />
      {/* cathode bar */}
      <line x1={barX} y1={cy - th} x2={barX} y2={cy + th} stroke={live ? LIVE : METAL} strokeWidth={3} strokeLinecap="round" />
      {arrows}
      <GlyphLabel cx={cx} cy={cy} bodyH={th} label={label} />
    </g>
  );
}

export interface AmmeterGlyphProps extends LeadGlyphProps {
  /** Measured current shown as the label above (e.g. "0.5 A"). Falls back to `label`. */
  reading?: string;
}

/**
 * AMMETER, the exam-standard meter symbol: a circle on the wire with a centered
 * capital "A". Energised circle picks up the live colour; the `reading` (e.g.
 * "0.5 A") sits above the body as the value label.
 */
export function AmmeterGlyph({ cx, cy, half, live, label, reading }: AmmeterGlyphProps): ReactNode {
  const r = 17;                          // body radius ≈ bodyHalf
  const ring = live ? LIVE : METAL;
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={r} live={live} />
      <circle cx={cx} cy={cy} r={r} fill={BG} stroke={ring} strokeWidth={2} />
      <path d={`M ${cx - r * 0.6} ${cy - r * 0.45} A ${r} ${r} 0 0 1 ${cx + r * 0.6} ${cy - r * 0.45}`} fill="none" stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      <text x={cx} y={cy} fill={ring} fontSize={16} fontWeight={700} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>A</text>
      <GlyphLabel cx={cx} cy={cy} bodyH={r} label={reading ?? label} />
    </g>
  );
}

/**
 * VOLTMETER, the exam-standard meter symbol: a circle interrupting the wire with
 * a centered capital "V" (connected in parallel). Matched pair with AmmeterGlyph
 * (identical body; only the letter differs), label like "6 V" above.
 */
export function VoltmeterGlyph({ cx, cy, half, live, label }: LeadGlyphProps): ReactNode {
  const r = 16;            // meter circle radius (body half-width)
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={r} live={live} />
      <circle cx={cx} cy={cy} r={r} fill={BG} stroke={live ? LIVE : METAL} strokeWidth={2} />
      {/* hairline sheen on the lit top edge */}
      <path d={`M ${cx - r * 0.62} ${cy - r * 0.62} A ${r} ${r} 0 0 1 ${cx + r * 0.62} ${cy - r * 0.62}`} fill="none" stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      <text x={cx} y={cy} fill={FG} fontSize={15} fontWeight={700} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>V</text>
      <GlyphLabel cx={cx} cy={cy} bodyH={r} label={label} />
    </g>
  );
}

export interface RheostatGlyphProps extends LeadGlyphProps {
  /** Wiper position 0..1 nudges the arrowhead along the diagonal (0 = lower-left, 1 = upper-right). */
  wiper?: number;
}

/**
 * RHEOSTAT / VARIABLE RESISTOR, the ResistorGlyph rectangle crossed by a single
 * diagonal arrow (lower-left → upper-right), the exam-standard variable-resistance
 * symbol; `wiper` (0..1) slides the arrowhead along that diagonal.
 */
export function RheostatGlyph({ cx, cy, half, live, label, wiper = 0.5 }: RheostatGlyphProps): ReactNode {
  const bw = 21;            // body half-width  (matches ResistorGlyph)
  const bh = 10;            // body half-height (matches ResistorGlyph)
  const stroke = live ? LIVE : METAL;

  // diagonal arrow, extending a little past the box on both ends
  const ext = 7;
  const x0 = cx - bw - ext, y0 = cy + bh + ext;   // lower-left tail
  const x1 = cx + bw + ext, y1 = cy - bh - ext;   // upper-right head
  const t = 0.78 + Math.max(0, Math.min(1, wiper)) * 0.22; // wiper nudges head along diagonal
  const hx = x0 + (x1 - x0) * t;
  const hy = y0 + (y1 - y0) * t;
  // unit direction along the diagonal (toward the head)
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
  const ah = 7;             // arrowhead length
  const aw = 4;             // arrowhead half-width
  // perpendicular
  const px = -uy, py = ux;
  const bxx = hx - ux * ah, byy = hy - uy * ah;

  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />
      <rect x={cx - bw} y={cy - bh} width={bw * 2} height={bh * 2} rx={3} fill={BG} stroke={stroke} strokeWidth={2} />
      <line x1={cx - bw * 0.7} y1={cy - bh + 1.5} x2={cx + bw * 0.7} y2={cy - bh + 1.5} stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      {/* variable-resistance diagonal arrow */}
      <line x1={x0} y1={y0} x2={hx} y2={hy} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
      <path
        d={`M ${hx} ${hy} L ${bxx + px * aw} ${byy + py * aw} L ${bxx - px * aw} ${byy - py * aw} Z`}
        fill={stroke}
        stroke={stroke}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <GlyphLabel cx={cx} cy={cy} bodyH={bh} label={label} />
    </g>
  );
}

/**
 * JUNCTION DOT, the wire-junction marker: a single filled node placed where
 * wires meet to show they are electrically connected (vs. a crossing). Not a
 * two-terminal device, so no `Leads`; energised junctions pick up the live colour.
 */
export function JunctionDot({ x, y, r = 4, live, color }: { x: number; y: number; r?: number; live?: boolean; color?: string }): ReactNode {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={live ? (color ?? LIVE) : METAL} />
      <path d={`M ${x - r * 0.55} ${y - r * 0.55} A ${r} ${r} 0 0 1 ${x + r * 0.55} ${y - r * 0.55}`} fill="none" stroke={SHEEN} strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

export interface MosfetGlyphProps {
  cx: number;
  cy: number;
  /** half = px from centre up to the DRAIN terminal (and down to the SOURCE). */
  half: number;
  /** gate lead length to the left. */
  gateLen?: number;
  /** channel formed → channel + drain/source path light up. */
  on?: boolean;
  live?: boolean;
  /** P-channel: draw the gate inversion bubble. */
  pmos?: boolean;
  label?: string;
  /** where the type label sits. Default 'right' (clear of the drain wire that runs above the
   *  device in a vertical schematic); 'top' centres it above. */
  labelPos?: 'right' | 'top';
}

/**
 * NMOS (enhancement) transistor, the exam-standard symbol turned for a circuit:
 * DRAIN at top, SOURCE at bottom, GATE out the left. The gate bar is separated from
 * the channel by the oxide gap; the channel is the three dashes of an enhancement
 * device (normally off); the body arrow points inward (NMOS). When `on`, the channel
 * and drain-source path pick up the live colour.
 */
export function MosfetGlyph({ cx, cy, half, gateLen = 24, on, live, pmos, label, labelPos = 'right' }: MosfetGlyphProps): ReactNode {
  const ch = on && live ? LIVE : C_MOS;
  const wire = live ? LIVE : WIRE;
  const gx = cx - 13;                 // gate bar x
  const chx = cx - 4;                 // channel bar x
  const ext = cx + 9;                 // drain/source vertical-lead x
  const top = cy - half, bot = cy + half;
  const gateTermX = gx - gateLen;
  return (
    <g>
      {/* gate: lead + bar (separated from the channel = the insulating oxide) */}
      <line x1={gateTermX} y1={cy} x2={pmos ? gx - 9 : gx} y2={cy} stroke={wire} strokeWidth={2.5} strokeLinecap="round" />
      {pmos && <circle cx={gx - 5} cy={cy} r={4} fill={BG} stroke={C_MOS} strokeWidth={1.6} />}
      <line x1={gx} y1={cy - 13} x2={gx} y2={cy + 13} stroke={C_MOS} strokeWidth={2.5} strokeLinecap="round" />
      {/* channel: three enhancement dashes */}
      {[[-13, -5], [-3, 5], [7, 13]].map(([a, b], i) => (
        <line key={i} x1={chx} y1={cy + a!} x2={chx} y2={cy + b!} stroke={ch} strokeWidth={3} strokeLinecap="round" />
      ))}
      {/* drain (top) */}
      <line x1={chx} y1={cy - 9} x2={ext} y2={cy - 9} stroke={ch} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={ext} y1={cy - 9} x2={ext} y2={top} stroke={wire} strokeWidth={2.5} strokeLinecap="round" />
      {/* source (bottom) + inward body arrow */}
      <line x1={chx} y1={cy + 9} x2={ext} y2={cy + 9} stroke={ch} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={ext} y1={cy + 9} x2={ext} y2={bot} stroke={wire} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M ${chx + 9} ${cy + 6} L ${chx + 2} ${cy + 9} L ${chx + 9} ${cy + 12} Z`} fill={ch} />
      <circle cx={ext} cy={top} r={2.6} fill={METAL} />
      <circle cx={ext} cy={bot} r={2.6} fill={METAL} />
      <circle cx={gateTermX} cy={cy} r={2.6} fill={METAL} />
      {label && (labelPos === 'top'
        ? <text x={cx} y={top - 7} fill={FG} fontSize={11} fontWeight={600} textAnchor="middle" style={{ pointerEvents: 'none' }}>{label}</text>
        : <text x={ext + 7} y={cy} fill={FG} fontSize={11} fontWeight={600} textAnchor="start" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{label}</text>)}
    </g>
  );
}

// ── wires + current flow (shared so labs stop re-deriving the loop drawing) ───

/** A thin, crisp wire polyline through pixel points; energised path picks up the live colour (or a
 *  per-net `color` override, so a scene can colour each signal so it stays traceable where wires cross). */
export function Wire({ points, live, color }: { points: [number, number][]; live?: boolean; color?: string }): ReactNode {
  return <polyline points={points.map((p) => `${p[0]},${p[1]}`).join(' ')} fill="none" stroke={live ? (color ?? LIVE) : WIRE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
}

/** Orthogonal (right-angle) route from a left source to a right sink, as polyline points for
 *  `Wire`: straight when aligned, otherwise out to a mid-x, vertical, then in. One wire model
 *  shared by the electronics and logic scenes (no second wire primitive). */
export function orthPoints(a: { x: number; y: number }, b: { x: number; y: number }): [number, number][] {
  if (Math.abs(a.y - b.y) < 1.5) return [[a.x, a.y], [b.x, b.y]];
  const midX = a.x + Math.max(14, (b.x - a.x) * 0.5);
  return [[a.x, a.y], [midX, a.y], [midX, b.y], [b.x, b.y]];
}

function pathLength(points: [number, number][]): number {
  let t = 0;
  for (let i = 1; i < points.length; i++) t += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  return t;
}

/** Point a fraction t∈[0,1] along a pixel polyline (for placing current dots). */
export function pointAlong(points: [number, number][], t: number): [number, number] {
  if (points.length < 2) return points[0] ?? [0, 0];
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i]![0], p[1] - points[i]![1]));
  const total = segs.reduce((a, b) => a + b, 0) || 1;
  let d = (((t % 1) + 1) % 1) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]!) {
      const f = segs[i]! ? d / segs[i]! : 0;
      const a = points[i]!, b = points[i + 1]!;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    d -= segs[i]!;
  }
  return points[points.length - 1]!;
}

/**
 * Conventional current as clean, evenly-spaced dots drifting along a wire path.
 * Auto-spaces by arc length (one dot per ~`spacing` px) so it reads as flow, not
 * noise — Brilliant-style. `phase` (0..1) animates them.
 */
export function FlowDots({ points, phase = 0, spacing = 60, r = 3.5 }: { points: [number, number][]; phase?: number; spacing?: number; r?: number }): ReactNode {
  const n = Math.max(3, Math.round(pathLength(points) / spacing));
  return (
    <g style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pointAlong(points, phase + i / n);
        return <circle key={i} cx={x} cy={y} r={r} fill={LIVE} />;
      })}
    </g>
  );
}

/* ── ILLUSTRATIVE ICONS, engaging, non-schematic (hero/analogy contexts) ──── */

export function LampGlyph({ cx, cy, brightness, r = 30 }: { cx: number; cy: number; brightness: number; r?: number }): ReactNode {
  const b = Math.max(0, Math.min(1, brightness));
  const hot = b > 0.04;
  // filament colour: cool metal at b=0 → warm at b=1 (cross-fade via color-mix %)
  const filament = `color-mix(in oklab, var(--stage-metal) ${Math.round((1 - b) * 100)}%, var(--stage-warn))`;
  return (
    <g>
      {hot && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6 + b * 26}
          fill="url(#stage-grad-thermal)"
          opacity={0.18 + 0.7 * b}
          filter={b > 0.55 ? 'url(#stage-bloom)' : 'url(#stage-glow)'}
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* glass envelope */}
      <circle cx={cx} cy={cy} r={r} fill="var(--stage-bg)" stroke={hot ? 'var(--stage-warn)' : 'var(--stage-metal)'} strokeWidth={2.5} />
      {/* coil filament */}
      <path
        d={`M ${cx - 16} ${cy + 6} q 4 -16 8 0 q 4 16 8 0 q 4 -16 8 0 q 4 16 8 0`}
        fill="none"
        stroke={filament}
        strokeWidth={hot ? 3 : 2.2}
        strokeLinecap="round"
        filter={b > 0.55 ? 'url(#stage-bloom)' : undefined}
      />
      {/* white-hot core flash at peak output */}
      {b > 0.6 && (
        <circle cx={cx} cy={cy} r={6 + (b - 0.6) * 14} fill="white" opacity={(b - 0.6) * 1.6} filter="url(#stage-bloom)" style={{ pointerEvents: 'none' }} />
      )}
      {/* screw base */}
      <rect x={cx - 9} y={cy + r - 2} width={18} height={10} rx={2} fill="var(--stage-metal)" />
    </g>
  );
}

/** An AC (~) or DC (=) source; a halo behind it tracks output magnitude `level` (-1..1). */
export function AcDcSourceGlyph({ cx, cy, mode, level, r = 30 }: { cx: number; cy: number; mode: 'ac' | 'dc'; level: number; r?: number }): ReactNode {
  const live = Math.abs(Math.max(-1, Math.min(1, level)));
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 10} fill="url(#stage-grad-halo)" opacity={0.25 + 0.6 * live} style={{ pointerEvents: 'none' }} />
      <circle cx={cx} cy={cy} r={r} fill="var(--stage-bg)" stroke="var(--stage-accent)" strokeWidth={2.5} />
      {mode === 'ac' ? (
        <path d={`M ${cx - 16} ${cy} q 8 -14 16 0 q 8 14 16 0`} fill="none" stroke="var(--stage-accent)" strokeWidth={3} strokeLinecap="round" />
      ) : (
        <g stroke="var(--stage-accent)" strokeLinecap="round">
          <line x1={cx - 15} y1={cy - 6} x2={cx + 15} y2={cy - 6} strokeWidth={3.5} />
          <line x1={cx - 15} y1={cy + 6} x2={cx + 15} y2={cy + 6} strokeWidth={2} strokeDasharray="4 4" />
        </g>
      )}
      <text x={cx} y={cy + r + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--stage-accent)">
        {mode.toUpperCase()}
      </text>
    </g>
  );
}
