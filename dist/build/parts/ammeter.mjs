'use client';

import { AmmeterGlyph } from "../../kit/electronics.mjs";
import { render2, term2 } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/ammeter.tsx
/** Ammeter: an ideal 0 V branch that reads the current through it (mA). Drop it in series. */
const AMMETER = {
	kind: "ammeter",
	label: "Ammeter",
	pins: ["a", "b"],
	defaultProps: {},
	terminalAt: term2,
	toElems: (i, n) => [{
		kind: "V",
		n1: n("a"),
		n2: n("b"),
		value: 0,
		id: i.id
	}],
	render: (i, s) => render2(i, void 0, (cx, cy, h) => /* @__PURE__ */ jsx(AmmeterGlyph, {
		cx,
		cy,
		half: h,
		live: s.live,
		reading: `${(Math.abs(s.i) * 1e3).toFixed(Math.abs(s.i) >= .0995 ? 0 : 1)} mA`
	}))
};

//#endregion
export { AMMETER };