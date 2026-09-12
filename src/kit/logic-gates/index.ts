/**
 * Logic-gate glyph kit — the DIGITAL vocabulary, split so a gate-diagram lab and a
 * seven-segment display lab don't share a compile unit:
 *   ./gate     — GateGlyph, gatePorts, gateLabelPos, GateType (the ANSI/IEEE shapes)
 *   ./display  — ToggleSwitch (input), Lamp (output LED), SevenSegment + digitSegments
 * Drawn in PIXEL space (like kit/electronics), tokenized, pure-SVG. Import the specific
 * module for the cleanest tree-shaking, or this barrel for convenience.
 */

export { GateGlyph, gatePorts, gateLabelPos, type GateType } from './gate.js';
export { ToggleSwitch, Lamp, SevenSegment, digitSegments } from './display.js';
