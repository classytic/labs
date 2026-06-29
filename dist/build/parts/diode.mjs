'use client';

import { DiodeGlyph } from "../../kit/electronics.mjs";
import { labelOf, render2, term2 } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/diode.tsx
/** Diode: one-way valve (Shockley model in the solver). Conducts a→b above ~0.7 V, blocks reverse. */
const DIODE = {
	kind: "diode",
	label: "Diode",
	pins: ["a", "b"],
	defaultProps: {},
	terminalAt: term2,
	toElems: (i, n) => [{
		kind: "D",
		n1: n("a"),
		n2: n("b"),
		value: 0,
		id: i.id
	}],
	render: (i, s) => render2(i, labelOf(i), (cx, cy, h, l) => /* @__PURE__ */ jsx(DiodeGlyph, {
		cx,
		cy,
		half: h,
		live: s.live,
		conducting: s.live,
		label: l
	}))
};

//#endregion
export { DIODE };