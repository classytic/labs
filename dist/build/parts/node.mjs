'use client';

import { JunctionDot } from "../../kit/electronics.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/node.tsx
/**
* Junction node: a free connection point (one pin, no element = a perfect conductor). Every
* wire touching it shares one electrical net, so it is how parallel branches, bridges and
* ladders are built. The editor only ever creates one ON a wire (a tap), and prunes any that
* fall below two connections, so junctions never float as clutter.
*/
const NODE = {
	kind: "node",
	label: "Node (junction)",
	pins: ["j"],
	defaultProps: {},
	terminalAt: (i) => ({
		x: i.at.x,
		y: i.at.y
	}),
	toElems: () => [],
	render: (i, s) => /* @__PURE__ */ jsx(JunctionDot, {
		x: i.at.x,
		y: i.at.y,
		live: s.live,
		r: 5
	}, i.id)
};

//#endregion
export { NODE };