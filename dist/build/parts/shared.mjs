'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/build/parts/shared.tsx
/** centre → terminal distance for a 2-terminal part, px. */
const HALF = 30;
const num = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
const ohmLabel = (r) => r >= 1e3 ? `${r / 1e3} kΩ` : `${r} Ω`;
const labelOf = (i) => i.props?.label ?? void 0;
/** terminal world position for a 2-terminal part (a = left/top, b = right/bottom). */
function term2(inst, pin) {
	const { x, y } = inst.at, o = inst.orient ?? "h", s = pin === "a" ? -1 : 1;
	return o === "v" ? {
		x,
		y: y + s * 30
	} : {
		x: x + s * 30,
		y
	};
}
/** render a 2-terminal glyph at the instance, rotated for 'v', label kept horizontal. */
function render2(inst, label, glyph) {
	const { x, y } = inst.at;
	if ((inst.orient ?? "h") === "v") return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("g", {
		transform: `rotate(90 ${x} ${y})`,
		children: glyph(x, y, 30, void 0)
	}), label && /* @__PURE__ */ jsx("text", {
		x: x + 30 + 8,
		y: y + 4,
		fill: "var(--stage-fg)",
		fontSize: 11,
		fontWeight: 600,
		textAnchor: "start",
		style: { pointerEvents: "none" },
		children: label
	})] }, inst.id);
	return /* @__PURE__ */ jsx("g", { children: glyph(x, y, 30, label) }, inst.id);
}

//#endregion
export { labelOf, num, ohmLabel, render2, term2 };