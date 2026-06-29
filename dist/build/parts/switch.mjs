'use client';

import { SwitchGlyph } from "../../kit/electronics.mjs";
import { labelOf, render2, term2 } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/switch.tsx
/** Switch: closed = a 0 V short (conducts), open = no element (breaks the loop). Tap to toggle. */
const SWITCH = {
	kind: "switch",
	label: "Switch",
	pins: ["a", "b"],
	defaultProps: { closed: false },
	terminalAt: term2,
	toElems: (i, n) => i.props?.closed ? [{
		kind: "V",
		n1: n("a"),
		n2: n("b"),
		value: 0,
		id: i.id
	}] : [],
	render: (i, s) => render2(i, labelOf(i), (cx, cy, h, l) => /* @__PURE__ */ jsx(SwitchGlyph, {
		cx,
		cy,
		half: h,
		live: s.live,
		closed: !!i.props?.closed,
		label: l
	})),
	tap: (i) => ({ closed: !i.props?.closed })
};

//#endregion
export { SWITCH };