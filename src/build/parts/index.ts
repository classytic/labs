/**
 * Built-in part registry. Each component is its own module (cell, resistor, bulb, switch,
 * diode, capacitor, mosfet, node, ammeter), self-contained: its pins, electrical stamp, glyph,
 * tunables and any tap behaviour. This barrel is the ONE place that wires them into the live
 * registry. Add a component = add a file here and one line below. Nothing else special-cases a
 * part kind, so the solver and renderer stay component-agnostic.
 */

import { registerPart } from '../registry.js';
import type { PartDef } from '../contract.js';
import { CELL } from './cell.js';
import { RESISTOR } from './resistor.js';
import { BULB } from './bulb.js';
import { SWITCH } from './switch.js';
import { DIODE } from './diode.js';
import { CAPACITOR } from './capacitor.js';
import { AMMETER } from './ammeter.js';
import { NODE } from './node.js';
import { NMOS, PMOS } from './mosfet.js';

/** The built-ins in palette order. */
export const BUILTIN_PARTS: PartDef[] = [CELL, RESISTOR, BULB, SWITCH, DIODE, CAPACITOR, AMMETER, NODE, NMOS, PMOS];

let registered = false;
/** Register the built-in parts (idempotent). Imported for its side effect. */
export function registerBuiltinParts(): void {
  if (registered) return;
  registered = true;
  BUILTIN_PARTS.forEach(registerPart);
}
registerBuiltinParts();

export { CELL, RESISTOR, BULB, SWITCH, DIODE, CAPACITOR, AMMETER, NODE, NMOS, PMOS };
