'use client';

import { CapacitorGlyph } from "../../kit/electronics.mjs";
import { labelOf, render2, term2 } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/capacitor.tsx
/** Capacitor: stores charge. Open at DC (no element here); the transient solver gives it dynamics. */
const CAPACITOR = {
	kind: "capacitor",
	label: "Capacitor",
	pins: ["a", "b"],
	defaultProps: { farads: 1e-5 },
	terminalAt: term2,
	toElems: () => [],
	render: (i, s) => render2(i, labelOf(i), (cx, cy, h, l) => /* @__PURE__ */ jsx(CapacitorGlyph, {
		cx,
		cy,
		half: h,
		live: s.live,
		label: l
	}))
};

//#endregion
export { CAPACITOR };