'use client';

import { CellGlyph } from "../../kit/electronics.mjs";
import { num, render2, term2 } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/cell.tsx
/** Battery / cell: an ideal voltage source. `volts` sets its EMF; it drives the loop current. */
const CELL = {
	kind: "cell",
	label: "Battery",
	pins: ["a", "b"],
	defaultProps: { volts: 5 },
	controls: [{
		key: "volts",
		label: "Voltage",
		unit: "V",
		min: 0,
		max: 24,
		step: .5
	}],
	terminalAt: term2,
	toElems: (i, n) => [{
		kind: "V",
		n1: n("a"),
		n2: n("b"),
		value: num(i.props?.volts, 5),
		id: i.id
	}],
	render: (i, s) => render2(i, `${num(i.props?.volts, 5)} V`, (cx, cy, h, l) => /* @__PURE__ */ jsx(CellGlyph, {
		cx,
		cy,
		half: h,
		live: s.live,
		label: l
	}))
};

//#endregion
export { CELL };