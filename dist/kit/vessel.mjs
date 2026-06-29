'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/vessel.tsx
const METAL = "var(--stage-metal, #8a8a8a)";
const GLASS = "color-mix(in oklab, var(--stage-fg) 26%, transparent)";
const FG = "var(--stage-fg, #222)";
const MUTED = "var(--stage-muted, #777)";
const TONE_COLOR = {
	idle: "var(--stage-accent)",
	ok: "var(--stage-good)",
	no: "var(--stage-warn)"
};
/** The pure <g> vessel, glass + liquid + objects + optional reading line. */
function VesselGlyph({ x, y, w, h, fillFrac, color = "var(--stage-accent)", objects = 0, objectColor = "#e85aa6", guessFrac, guessTone = "idle" }) {
	const lipH = 6;
	const wall = 3;
	const innerTop = y + lipH;
	const innerBot = y + h - 3;
	const innerH = innerBot - innerTop;
	const lx = x + wall;
	const rx = x + w - wall;
	const innerW = rx - lx;
	const liq = Math.max(0, Math.min(1, fillFrac));
	const liquidTop = innerBot - liq * innerH;
	const cubes = [];
	if (objects > 0) {
		const r = Math.max(5, Math.min(11, innerW / 5.5));
		const perRow = Math.max(1, Math.floor((innerW - 4) / (r * 2)));
		for (let i = 0; i < objects; i++) {
			const row = Math.floor(i / perRow);
			const col = i % perRow;
			const rowW = Math.min(perRow, objects - row * perRow) * r * 2;
			const cxp = (lx + rx) / 2 - rowW / 2 + r + col * r * 2 + row % 2 * (r * .5);
			const cyp = innerBot - r - row * r * 1.7;
			cubes.push(/* @__PURE__ */ jsxs("g", {
				style: { animation: `vessel-drop 0.45s cubic-bezier(0.3,1.3,0.6,1) ${i * .08}s backwards` },
				children: [/* @__PURE__ */ jsx("circle", {
					cx: cxp,
					cy: cyp,
					r,
					fill: objectColor,
					opacity: .92
				}), /* @__PURE__ */ jsx("circle", {
					cx: cxp - r * .32,
					cy: cyp - r * .32,
					r: r * .3,
					fill: "#fff",
					opacity: .55
				})]
			}, `o${i}`));
		}
	}
	const gColor = TONE_COLOR[guessTone];
	const guessY = guessFrac != null ? innerBot - Math.max(0, Math.min(1, guessFrac)) * innerH : null;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("rect", {
			x: lx,
			y: liquidTop,
			width: innerW,
			height: Math.max(0, innerBot - liquidTop),
			fill: color,
			fillOpacity: .4,
			style: { transition: "y 0.5s ease-out, height 0.5s ease-out" }
		}),
		liq > .02 && /* @__PURE__ */ jsx("ellipse", {
			cx: (lx + rx) / 2,
			cy: liquidTop,
			rx: innerW / 2,
			ry: 3.5,
			fill: color,
			fillOpacity: .7,
			style: { transition: "cy 0.5s ease-out" }
		}),
		cubes,
		/* @__PURE__ */ jsx("path", {
			d: `M ${x} ${y} L ${lx} ${innerBot} L ${rx} ${innerBot} L ${x + w} ${y}`,
			fill: "none",
			stroke: GLASS,
			strokeWidth: wall,
			strokeLinejoin: "round",
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: x - 3,
			y1: y,
			x2: x + w + 3,
			y2: y,
			stroke: METAL,
			strokeWidth: 3,
			strokeLinecap: "round"
		}),
		guessY != null && /* @__PURE__ */ jsxs("g", {
			style: { transition: "transform 0.12s ease-out" },
			children: [/* @__PURE__ */ jsx("line", {
				x1: x - 6,
				y1: guessY,
				x2: x + w + 6,
				y2: guessY,
				stroke: gColor,
				strokeWidth: 2.5,
				strokeDasharray: "6 4"
			}), /* @__PURE__ */ jsx("circle", {
				cx: x + w + 6,
				cy: guessY,
				r: 3.5,
				fill: gColor
			})]
		})
	] });
}
/** Self-contained vessel (its own <svg>), drops in beside a graph as the concrete twin. */
function Vessel({ width = 150, height = 300, fillFrac, guessFrac, guessTone = "idle", objects = 0, liquidColor = "var(--stage-accent)", objectColor = "#e85aa6", label, scaleMax, scaleStep, unit }) {
	const padL = scaleMax != null ? 4 : 8;
	const padR = scaleMax != null ? 34 : 8;
	const padTop = 10;
	const padBot = label ? 26 : 10;
	const vx = padL;
	const vw = width - padL - padR;
	const vy = padTop;
	const vh = height - padTop - padBot;
	const innerTop = 16;
	const innerBot = vy + vh - 3;
	const innerH = innerBot - innerTop;
	const ticks = [];
	if (scaleMax != null) {
		const step = scaleStep ?? scaleMax / 4;
		for (let v = 0; v <= scaleMax + 1e-6; v += step) {
			const ty = innerBot - v / scaleMax * innerH;
			ticks.push(/* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
				x1: vx + vw,
				y1: ty,
				x2: vx + vw + 5,
				y2: ty,
				stroke: MUTED,
				strokeWidth: 1.5
			}), /* @__PURE__ */ jsx("text", {
				x: vx + vw + 8,
				y: ty,
				fontSize: 10,
				fill: MUTED,
				dominantBaseline: "middle",
				children: v
			})] }, `t${v}`));
		}
	}
	return /* @__PURE__ */ jsxs("svg", {
		width,
		height,
		viewBox: `0 0 ${width} ${height}`,
		role: "img",
		"aria-label": label ? `${label}: liquid at ${(fillFrac * 100).toFixed(0)}% of full` : "vessel",
		children: [
			ticks,
			/* @__PURE__ */ jsx(VesselGlyph, {
				x: vx,
				y: vy,
				w: vw,
				h: vh,
				fillFrac,
				color: liquidColor,
				objects,
				objectColor,
				guessFrac,
				guessTone
			}),
			unit && scaleMax != null && /* @__PURE__ */ jsx("text", {
				x: vx + vw + 8,
				y: 12,
				fontSize: 9,
				fill: MUTED,
				dominantBaseline: "hanging",
				children: unit
			}),
			label && /* @__PURE__ */ jsx("text", {
				x: width / 2,
				y: height - 8,
				fontSize: 12,
				fontWeight: 700,
				fill: FG,
				textAnchor: "middle",
				children: label
			}),
			/* @__PURE__ */ jsx("style", { children: `@keyframes vessel-drop{from{transform:translateY(-34px);opacity:0}to{transform:translateY(0);opacity:1}}` })
		]
	});
}

//#endregion
export { Vessel, VesselGlyph };