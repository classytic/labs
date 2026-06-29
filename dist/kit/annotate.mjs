'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/annotate.tsx
const TONE = {
	info: "var(--stage-accent)",
	good: "var(--stage-good)",
	warn: "var(--stage-warn)",
	bad: "var(--stage-danger, #e03131)",
	muted: "var(--stage-muted)"
};
const charW = 6.4;
/** A labelled pointer to (x,y): a dot, a leader line, and a tinted bubble offset by
*  (dx,dy). Keep dx/dy pointing into open space so the bubble clears the figure.
*  (Named `Pointer`, not Callout, to avoid clashing with frame.js's prose-box Callout
*  and cms-ui's document-level Callout block, this one anchors to FIGURE geometry.) */
function Pointer({ x, y, text, dx = 30, dy = -26, tone = "info", fontSize = 11 }) {
	const col = TONE[tone];
	const w = text.length * (charW * (fontSize / 11)) + 14, h = fontSize + 9;
	const bx = dx >= 0 ? x + dx : x + dx - w, by = y + dy - h / 2;
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [
			/* @__PURE__ */ jsx("line", {
				x1: x,
				y1: y,
				x2: dx >= 0 ? bx : bx + w,
				y2: by + h / 2,
				stroke: col,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: x,
				cy: y,
				r: 3,
				fill: col
			}),
			/* @__PURE__ */ jsx("rect", {
				x: bx,
				y: by,
				width: w,
				height: h,
				rx: h / 2,
				fill: "var(--stage-bg)",
				stroke: col,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ jsx("text", {
				x: bx + w / 2,
				y: by + h / 2,
				textAnchor: "middle",
				dominantBaseline: "central",
				fontSize,
				fontWeight: 700,
				fill: col,
				children: text
			})
		]
	});
}
/** A pulsing attention ring at (cx,cy), draws the eye to "look here". */
function Spotlight({ cx, cy, r = 13, tone = "warn" }) {
	const col = TONE[tone];
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r,
			fill: "none",
			stroke: col,
			strokeWidth: 2,
			className: "lab-pulse",
			style: {
				transformBox: "fill-box",
				transformOrigin: "center"
			}
		}), /* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: r * .55,
			fill: "none",
			stroke: col,
			strokeWidth: 2,
			opacity: .9
		})]
	});
}
/** A span bracket from x1→x2 at height y with a centred label, "this range means …".
*  `side: 'below'` drops the ticks/label under y; 'above' lifts them over it. */
function Bracket({ x1, x2, y, text, tone = "info", side = "below", fontSize = 11 }) {
	const col = TONE[tone];
	const tick = 6 * (side === "below" ? 1 : -1), ly = y + (side === "below" ? 14 : -8);
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [/* @__PURE__ */ jsx("path", {
			d: `M${x1},${y + tick} L${x1},${y} L${x2},${y} L${x2},${y + tick}`,
			fill: "none",
			stroke: col,
			strokeWidth: 1.5
		}), /* @__PURE__ */ jsx("text", {
			x: (x1 + x2) / 2,
			y: ly,
			textAnchor: "middle",
			dominantBaseline: side === "below" ? "hanging" : "auto",
			fontSize,
			fontWeight: 700,
			fill: col,
			children: text
		})]
	});
}

//#endregion
export { Bracket, Pointer, Spotlight };