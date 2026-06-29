'use client';

import { ResistorGlyph } from "../../kit/electronics.mjs";
import { num, ohmLabel, render2, term2 } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/resistor.tsx
/** Resistor: an ohmic element. `ohms` sets its resistance; current = V across it / ohms. */
const RESISTOR = {
	kind: "resistor",
	label: "Resistor",
	pins: ["a", "b"],
	defaultProps: {
		ohms: 1e3,
		maxPower: .5
	},
	controls: [{
		key: "ohms",
		label: "Resistance",
		unit: "Ω",
		min: 1,
		max: 1e5,
		step: 10
	}, {
		key: "maxPower",
		label: "Power rating",
		unit: "W",
		min: 0,
		max: 50,
		step: .05
	}],
	terminalAt: term2,
	toElems: (i, n) => [{
		kind: "R",
		n1: n("a"),
		n2: n("b"),
		value: num(i.props?.ohms, 1e3)
	}],
	render: (i, s) => render2(i, ohmLabel(num(i.props?.ohms, 1e3)), (cx, cy, h, l) => /* @__PURE__ */ jsx(ResistorGlyph, {
		cx,
		cy,
		half: h,
		live: s.live,
		label: l
	}))
};

//#endregion
export { RESISTOR };