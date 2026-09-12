/**
 * Electronics glyph vocabulary, split by category (each module is its own file so a
 * lab that draws a diode never recompiles the meters, and tree-shaking has a clean
 * boundary). Two tiers:
 *  1. SCHEMATIC symbols, exam-standard (CAIE / IGCSE / A-level) circuit symbols for
 *     circuit DIAGRAMS — basics (R / rheostat / cell / switch / bulb / cap),
 *     semiconductor (diode / LED / MOSFET), meter (A / V), wire (Wire / FlowDots /
 *     JunctionDot / routing helpers).
 *  2. ILLUSTRATIVE icons (./icons) — engaging real-object glyphs (LampGlyph,
 *     AcDcSourceGlyph) for hero / analogy contexts, with thermal glow + bloom.
 * Both are a subject vocabulary, so they live in @classytic/labs (not the
 * domain-neutral stage engine). Import from a specific module for the cleanest
 * tree-shaking, or from this barrel for convenience.
 *
 * ── Authoring contract (every schematic symbol MUST follow it) ──────────────────
 * • A two-terminal device is drawn CENTERED at (cx, cy), terminals at (cx ± half, cy).
 *   Draw the short LEADS with the shared `Leads` helper, then the body.
 * • COLOUR IS A TOKEN, never a literal: conductors → var(--stage-wire); the energised
 *   path → var(--stage-live); body outline → var(--stage-metal); fills → var(--stage-bg);
 *   charge/field → var(--stage-charge); warning glow → var(--stage-warn); top-edge sheen
 *   via var(--stage-sheen). A raw #hex/rgb() in a body is a bug.
 * • PURE SVG fragment: a <g> of SVG only, NO <style>/<defs>/hooks/CSS animation. Motion
 *   is DATA (a 0..1 phase/level prop the host frame loop drives, so reduced-motion is
 *   honoured upstream). Schematic, not skeuomorphic; use the haloed `Tag` for labels.
 */

export { Leads, Tag, type LeadGlyphProps, type TagProps } from './_shared.js';
export {
  ResistorGlyph,
  CellGlyph,
  CapacitorGlyph,
  SwitchGlyph,
  BulbGlyph,
  RheostatGlyph,
  type CapacitorGlyphProps,
  type SwitchGlyphProps,
  type BulbGlyphProps,
  type RheostatGlyphProps,
} from './basics.js';
export {
  DiodeGlyph,
  LedGlyph,
  MosfetGlyph,
  type DiodeGlyphProps,
  type LedGlyphProps,
  type MosfetGlyphProps,
} from './semiconductor.js';
export { AmmeterGlyph, VoltmeterGlyph, type AmmeterGlyphProps } from './meter.js';
export { Wire, orthPoints, pointAlong, FlowDots, JunctionDot } from './wire.js';
export {
  SupplyRail,
  BreadboardSurface,
  LogicPort,
  VoltagePort,
  type SupplyRailProps,
  type BreadboardSurfaceProps,
  type LogicPortProps,
  type VoltagePortProps,
} from './signals.js';
export { LampGlyph, AcDcSourceGlyph } from './icons.js';
