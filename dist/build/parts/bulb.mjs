'use client';

import { BulbGlyph } from "../../kit/electronics.mjs";
import { labelOf, num, render2, term2 } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/bulb.tsx
/** Lamp / bulb: a resistor that glows. `ohms` sets its resistance; brightness tracks |current|. */
const BULB = {
	kind: "bulb",
	label: "Lamp",
	pins: ["a", "b"],
	defaultProps: {
		ohms: 100,
		maxPower: 2
	},
	controls: [{
		key: "ohms",
		label: "Resistance",
		unit: "Ω",
		min: 1,
		max: 1e4,
		step: 10
	}, {
		key: "maxPower",
		label: "Power rating",
		unit: "W",
		min: 0,
		max: 50,
		step: .1
	}],
	terminalAt: term2,
	toElems: (i, n) => [{
		kind: "R",
		n1: n("a"),
		n2: n("b"),
		value: num(i.props?.ohms, 100)
	}],
	render: (i, s) => render2(i, labelOf(i) ?? "lamp", (cx, cy, h, l) => /* @__PURE__ */ jsx(BulbGlyph, {
		cx,
		cy,
		half: h,
		live: s.live,
		brightness: Math.max(0, Math.min(1, Math.abs(s.i) * 40)),
		label: l
	}))
};

//#endregion
export { BULB };