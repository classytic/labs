import { registerGate } from "./registry.mjs";

//#region src/logic/gates.ts
const parity = (i) => i.filter(Boolean).length % 2;
const GATES = [
	{
		kind: "AND",
		label: "AND",
		glyph: "AND",
		arity: 2,
		eval: (i) => i.length > 0 && i.every(Boolean)
	},
	{
		kind: "OR",
		label: "OR",
		glyph: "OR",
		arity: 2,
		eval: (i) => i.some(Boolean)
	},
	{
		kind: "NOT",
		label: "NOT",
		glyph: "NOT",
		arity: 1,
		eval: (i) => !i[0]
	},
	{
		kind: "NAND",
		label: "NAND",
		glyph: "NAND",
		arity: 2,
		eval: (i) => !(i.length > 0 && i.every(Boolean))
	},
	{
		kind: "NOR",
		label: "NOR",
		glyph: "NOR",
		arity: 2,
		eval: (i) => !i.some(Boolean)
	},
	{
		kind: "XOR",
		label: "XOR",
		glyph: "XOR",
		arity: 2,
		eval: (i) => parity(i) === 1
	},
	{
		kind: "XNOR",
		label: "XNOR",
		glyph: "XNOR",
		arity: 2,
		eval: (i) => parity(i) === 0
	},
	{
		kind: "buffer",
		label: "BUF",
		glyph: "NOT",
		arity: 1,
		eval: (i) => !!i[0]
	}
];
let registered = false;
/** Register the built-in gates (idempotent). Imported for its side effect. */
function registerBuiltinGates() {
	if (registered) return;
	registered = true;
	GATES.forEach(registerGate);
}
registerBuiltinGates();

//#endregion
export { registerBuiltinGates };