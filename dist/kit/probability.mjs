'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/probability.tsx
const FG = "var(--stage-fg)";
const FACE = "color-mix(in oklab, var(--stage-bg) 92%, var(--stage-fg))";
const METAL = "var(--stage-metal)";
const GOLD = "var(--stage-warn)";
const GOOD = "var(--stage-good)";
const SHEEN = "color-mix(in oklab, var(--stage-sheen, white) 60%, transparent)";
const PIPS = {
	1: [[1, 1]],
	2: [[0, 0], [2, 2]],
	3: [
		[0, 0],
		[1, 1],
		[2, 2]
	],
	4: [
		[0, 0],
		[2, 0],
		[0, 2],
		[2, 2]
	],
	5: [
		[0, 0],
		[2, 0],
		[1, 1],
		[0, 2],
		[2, 2]
	],
	6: [
		[0, 0],
		[2, 0],
		[0, 1],
		[2, 1],
		[0, 2],
		[2, 2]
	]
};
/** A six-sided die showing `value` (1–6) in box (x,y) of side `size`. */
function DiceGlyph({ x, y, size: s, value, highlight = false }) {
	const r = s * .2;
	const pipR = s * .082;
	const pos = PIPS[Math.max(1, Math.min(6, Math.round(value)))] ?? PIPS[1];
	return /* @__PURE__ */ jsxs("g", { children: [
		highlight && /* @__PURE__ */ jsx("rect", {
			x: x - 3,
			y: y - 3,
			width: s + 6,
			height: s + 6,
			rx: r + 3,
			fill: "none",
			stroke: GOOD,
			strokeWidth: 3
		}),
		/* @__PURE__ */ jsx("rect", {
			x,
			y,
			width: s,
			height: s,
			rx: r,
			fill: FACE,
			stroke: METAL,
			strokeWidth: Math.max(1, s * .025)
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${x + r},${y + s * .06} H${x + s * .62}`,
			stroke: SHEEN,
			strokeWidth: s * .04,
			strokeLinecap: "round",
			opacity: .5
		}),
		pos.map(([c, rr], i) => /* @__PURE__ */ jsx("circle", {
			cx: x + s * (.25 + .25 * c),
			cy: y + s * (.25 + .25 * rr),
			r: pipR,
			fill: FG
		}, i))
	] });
}
/** A coin in box centred (cx,cy) radius `r`, showing 'H' or 'T'. */
function CoinGlyph({ cx, cy, r, face = "H", highlight = false }) {
	const heads = face === "H" || face === "h";
	const base = heads ? GOLD : METAL;
	return /* @__PURE__ */ jsxs("g", { children: [
		highlight && /* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: r * 1.22,
			fill: "none",
			stroke: GOOD,
			strokeWidth: 2.5
		}),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy: cy + r * .12,
			r,
			fill: `color-mix(in oklab, ${base} 55%, black)`
		}),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r,
			fill: base,
			stroke: `color-mix(in oklab, ${base} 60%, black)`,
			strokeWidth: Math.max(1, r * .08)
		}),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: r * .82,
			fill: "none",
			stroke: `color-mix(in oklab, ${base} 70%, black)`,
			strokeWidth: Math.max(1, r * .05),
			opacity: .6
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${cx - r * .5},${cy - r * .45} A${r * .7},${r * .7} 0 0 1 ${cx + r * .3},${cy - r * .62}`,
			fill: "none",
			stroke: SHEEN,
			strokeWidth: r * .14,
			strokeLinecap: "round",
			opacity: .7
		}),
		/* @__PURE__ */ jsx("text", {
			x: cx,
			y: cy,
			textAnchor: "middle",
			dominantBaseline: "central",
			fontSize: r * 1.05,
			fontWeight: 800,
			fill: `color-mix(in oklab, ${base} 30%, black)`,
			children: heads ? "H" : "T"
		})
	] });
}

//#endregion
export { CoinGlyph, DiceGlyph };