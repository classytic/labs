'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/logic-gates.tsx
const WIRE = "var(--stage-wire)";
const LIVE = "var(--stage-live)";
const METAL = "var(--stage-metal)";
const BG = "var(--stage-bg)";
const FG = "var(--stage-fg)";
const SHEEN = "color-mix(in oklab, var(--stage-sheen) 50%, transparent)";
const isNeg = (t) => t === "NAND" || t === "NOR" || t === "XNOR" || t === "NOT";
const baseOf = (t) => t === "NAND" ? "AND" : t === "NOR" ? "OR" : t === "XNOR" ? "XOR" : t === "NOT" ? "NOT" : t;
/** Wire-attach ports for a gate in box (x,y,size). 1 input for NOT, else 2. */
function gatePorts(type, x, y, s) {
	const single = type === "NOT";
	const bub = isNeg(type) ? .16 * s : 0;
	const bodyRight = baseOf(type) === "NOT" ? x + .7 * s : x + .86 * s;
	return {
		inputs: single ? [{
			x,
			y: y + s / 2
		}] : [{
			x,
			y: y + .28 * s
		}, {
			x,
			y: y + .72 * s
		}],
		output: {
			x: bodyRight + bub,
			y: y + s / 2
		}
	};
}
/** Where a small TYPE label (AND/OR/…) sits INSIDE the gate body: resolved per shape so it lands
*  on the visual centroid (the D-body of AND, the right-shifted bulge of OR/XOR, the triangle of
*  NOT) instead of overlapping an edge. */
function gateLabelPos(type, x, y, s) {
	const base = baseOf(type);
	const cy = y + s / 2;
	if (base === "OR" || base === "XOR") return {
		x: x + .46 * s,
		y: cy
	};
	if (base === "NOT") return {
		x: x + .3 * s,
		y: cy
	};
	return {
		x: x + .38 * s,
		y: cy
	};
}
/** A logic gate glyph. `live` = its OUTPUT is high. */
function GateGlyph({ x, y, size: s, type, live, label }) {
	const base = baseOf(type);
	const stroke = live ? LIVE : METAL;
	const fill = live ? "color-mix(in oklab, var(--stage-live) 14%, var(--stage-bg))" : BG;
	const ports = gatePorts(type, x, y, s);
	const cy = y + s / 2;
	let body;
	if (base === "AND") body = /* @__PURE__ */ jsx("path", {
		d: `M${x},${y} H${x + .36 * s} A${.5 * s},${.5 * s} 0 0 1 ${x + .36 * s},${y + s} H${x} Z`,
		fill,
		stroke,
		strokeWidth: 2,
		strokeLinejoin: "round"
	});
	else if (base === "OR" || base === "XOR") {
		const ox = base === "XOR" ? x + .08 * s : x;
		body = /* @__PURE__ */ jsx("path", {
			d: `M${ox},${y} C${ox + .22 * s},${y + .16 * s} ${ox + .22 * s},${y + .84 * s} ${ox},${y + s} C${ox + .45 * s},${y + s} ${ox + .72 * s},${y + .82 * s} ${x + .86 * s},${cy} C${ox + .72 * s},${y + .18 * s} ${ox + .45 * s},${y} ${ox},${y} Z`,
			fill,
			stroke,
			strokeWidth: 2,
			strokeLinejoin: "round"
		});
	} else body = /* @__PURE__ */ jsx("path", {
		d: `M${x + .06 * s},${y} L${x + .7 * s},${cy} L${x + .06 * s},${y + s} Z`,
		fill,
		stroke,
		strokeWidth: 2,
		strokeLinejoin: "round"
	});
	return /* @__PURE__ */ jsxs("g", { children: [
		base === "XOR" && /* @__PURE__ */ jsx("path", {
			d: `M${x - .02 * s},${y} C${x + .2 * s},${y + .16 * s} ${x + .2 * s},${y + .84 * s} ${x - .02 * s},${y + s}`,
			fill: "none",
			stroke,
			strokeWidth: 2,
			strokeLinecap: "round"
		}),
		body,
		isNeg(type) && /* @__PURE__ */ jsx("circle", {
			cx: ports.output.x - .08 * s,
			cy,
			r: .08 * s,
			fill: BG,
			stroke,
			strokeWidth: 2
		}),
		/* @__PURE__ */ jsx("line", {
			x1: ports.output.x,
			y1: cy,
			x2: ports.output.x + .14 * s,
			y2: cy,
			stroke: live ? LIVE : WIRE,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: base === "AND" ? `M${x + .04 * s},${y + .12 * s} H${x + .4 * s}` : `M${x + .1 * s},${y + .16 * s} q${.2 * s},${.04 * s} ${.32 * s},${.14 * s}`,
			fill: "none",
			stroke: SHEEN,
			strokeWidth: 1.4,
			strokeLinecap: "round"
		}),
		label && (() => {
			const lp = gateLabelPos(type, x, y, s);
			return /* @__PURE__ */ jsx("text", {
				x: lp.x,
				y: lp.y,
				fill: FG,
				fontSize: Math.max(7, s * .17),
				fontWeight: 700,
				textAnchor: "middle",
				dominantBaseline: "central",
				style: { pointerEvents: "none" },
				children: label
			});
		})()
	] });
}
/** An output LED: a clean filled disc (lit = `color`, idle = a faint outlined disc). No glow. */
function Lamp({ cx, cy, r, on, color = LIVE, label }) {
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r,
			fill: on ? color : "color-mix(in oklab, var(--stage-metal) 14%, var(--stage-bg))",
			stroke: on ? color : METAL,
			strokeWidth: 1.5
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: cx - r * .28,
			cy: cy - r * .3,
			r: r * .28,
			fill: SHEEN,
			opacity: on ? .5 : .2
		}),
		label && /* @__PURE__ */ jsx("text", {
			x: cx,
			y: cy + r + 5,
			fill: FG,
			fontSize: Math.max(8, r * .85),
			fontWeight: 700,
			textAnchor: "middle",
			dominantBaseline: "hanging",
			style: { pointerEvents: "none" },
			children: label
		})
	] });
}
/** Which of segments a–g are lit for each hex digit 0–F (decoder truth, for a 7-seg display). */
const SEG_MAP = [
	[
		1,
		1,
		1,
		1,
		1,
		1,
		0
	],
	[
		0,
		1,
		1,
		0,
		0,
		0,
		0
	],
	[
		1,
		1,
		0,
		1,
		1,
		0,
		1
	],
	[
		1,
		1,
		1,
		1,
		0,
		0,
		1
	],
	[
		0,
		1,
		1,
		0,
		0,
		1,
		1
	],
	[
		1,
		0,
		1,
		1,
		0,
		1,
		1
	],
	[
		1,
		0,
		1,
		1,
		1,
		1,
		1
	],
	[
		1,
		1,
		1,
		0,
		0,
		0,
		0
	],
	[
		1,
		1,
		1,
		1,
		1,
		1,
		1
	],
	[
		1,
		1,
		1,
		1,
		0,
		1,
		1
	],
	[
		1,
		1,
		1,
		0,
		1,
		1,
		1
	],
	[
		0,
		0,
		1,
		1,
		1,
		1,
		1
	],
	[
		1,
		0,
		0,
		1,
		1,
		1,
		0
	],
	[
		0,
		1,
		1,
		1,
		1,
		0,
		1
	],
	[
		1,
		0,
		0,
		1,
		1,
		1,
		1
	],
	[
		1,
		0,
		0,
		0,
		1,
		1,
		1
	]
].map((r) => r.map(Boolean));
function digitSegments(value) {
	return SEG_MAP[(value % 16 + 16) % 16];
}
/**
* A seven-segment display digit. Drive it with a `value` (0–15 → 0–F) or explicit `segs`
* (a..g booleans). Lit segments glow in the display colour; dark segments are a faint ghost,
* so you read it like a real LED display. This is the output for binary/decoder/DLD labs.
*/
function SevenSegment({ x, y, w = 46, h = 80, value, segs, color = "var(--stage-warn)" }) {
	const on = segs ?? (value !== void 0 ? digitSegments(value) : [
		false,
		false,
		false,
		false,
		false,
		false,
		false
	]);
	const t = Math.min(w, h) * .13;
	const off = "color-mix(in oklab, var(--stage-metal) 16%, transparent)";
	const seg = (key, lit, x1, y1, x2, y2) => /* @__PURE__ */ jsx("line", {
		x1,
		y1,
		x2,
		y2,
		stroke: lit ? color : off,
		strokeWidth: t,
		strokeLinecap: "round",
		opacity: lit ? 1 : .55
	}, key);
	const midY = y + h / 2;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("rect", {
			x: x - t,
			y: y - t,
			width: w + 2 * t,
			height: h + 2 * t,
			rx: 6,
			fill: "color-mix(in oklab, var(--stage-bg) 80%, var(--stage-metal))",
			stroke: "var(--stage-grid)",
			strokeWidth: 1
		}),
		seg("a", on[0], x + t, y, x + w - t, y),
		seg("b", on[1], x + w, y + t, x + w, midY - t * .5),
		seg("c", on[2], x + w, midY + t * .5, x + w, y + h - t),
		seg("d", on[3], x + t, y + h, x + w - t, y + h),
		seg("e", on[4], x, midY + t * .5, x, y + h - t),
		seg("f", on[5], x, y + t, x, midY - t * .5),
		seg("g", on[6], x + t, midY, x + w - t, midY)
	] });
}
/** An input switch (toggle). Render inside a `<g onClick>` in the lab for taps. */
function ToggleSwitch({ x, y, w, h, on, label }) {
	const r = h / 2;
	const knobX = on ? x + w - r : x + r;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("rect", {
			x,
			y,
			width: w,
			height: h,
			rx: r,
			fill: on ? "color-mix(in oklab, var(--stage-live) 35%, transparent)" : "color-mix(in oklab, var(--stage-metal) 18%, transparent)",
			stroke: on ? LIVE : METAL,
			strokeWidth: 1.5
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: knobX,
			cy: y + r,
			r: r - 2.5,
			fill: BG,
			stroke: on ? LIVE : METAL,
			strokeWidth: 1.5
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: knobX - (r - 2.5) * .3,
			cy: y + r - (r - 2.5) * .3,
			r: (r - 2.5) * .34,
			fill: SHEEN,
			opacity: .6
		}),
		label && /* @__PURE__ */ jsx("text", {
			x: x + w / 2,
			y: y - 4,
			fill: FG,
			fontSize: Math.max(9, h * .7),
			fontWeight: 700,
			textAnchor: "middle",
			dominantBaseline: "auto",
			style: { pointerEvents: "none" },
			children: label
		})
	] });
}

//#endregion
export { GateGlyph, Lamp, SevenSegment, ToggleSwitch, gatePorts };