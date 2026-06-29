import { registerPart } from "../registry.mjs";
import { CELL } from "./cell.mjs";
import { RESISTOR } from "./resistor.mjs";
import { BULB } from "./bulb.mjs";
import { SWITCH } from "./switch.mjs";
import { DIODE } from "./diode.mjs";
import { CAPACITOR } from "./capacitor.mjs";
import { AMMETER } from "./ammeter.mjs";
import { NODE } from "./node.mjs";
import { NMOS, PMOS } from "./mosfet.mjs";

//#region src/build/parts/index.ts
/**
* Built-in part registry. Each component is its own module (cell, resistor, bulb, switch,
* diode, capacitor, mosfet, node, ammeter), self-contained: its pins, electrical stamp, glyph,
* tunables and any tap behaviour. This barrel is the ONE place that wires them into the live
* registry. Add a component = add a file here and one line below. Nothing else special-cases a
* part kind, so the solver and renderer stay component-agnostic.
*/
/** The built-ins in palette order. */
const BUILTIN_PARTS = [
	CELL,
	RESISTOR,
	BULB,
	SWITCH,
	DIODE,
	CAPACITOR,
	AMMETER,
	NODE,
	NMOS,
	PMOS
];
let registered = false;
/** Register the built-in parts (idempotent). Imported for its side effect. */
function registerBuiltinParts() {
	if (registered) return;
	registered = true;
	BUILTIN_PARTS.forEach(registerPart);
}
registerBuiltinParts();

//#endregion
export { registerBuiltinParts };