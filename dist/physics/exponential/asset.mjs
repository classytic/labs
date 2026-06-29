'use client';

import { pxRect } from "../../kit/asset-util.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCoords } from "@classytic/stage";

//#region src/physics/exponential/asset.tsx
const H = 320;
const CH = {
	x0: 290,
	x1: 632,
	yTop: 278,
	yBot: 54
};
const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
const numOr = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
const arr = (v) => Array.isArray(v) ? v : [];
function resolver({ sim, params }) {
	return {
		kind: "asset-geom",
		parts: {},
		meta: {
			value: numOr(sim?.value, 0),
			target: numOr(sim?.target, 0),
			samples: arr(sim?.samples),
			tSec: numOr(sim?.tSec, 0),
			done: sim?.done === true,
			kind: numOr(params?.kind, 0),
			value0: numOr(params?.value0, 100),
			tau: numOr(params?.tau, 1)
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const m = geom.meta ?? {};
	const P = (x, y) => c.toPx(x, H - y);
	const decay = m.kind === 0;
	const maxV = Math.max(m.value0, m.target, 1);
	const sy = (v) => CH.yTop - clamp01(v / maxV) * (CH.yTop - CH.yBot);
	const sx = (i, len) => CH.x0 + (len <= 1 ? 0 : i / (len - 1)) * (CH.x1 - CH.x0);
	const frame = pxRect(P, CH.x0, CH.yBot, CH.x1, CH.yTop);
	const curve = m.samples.map((v, i) => P(sx(i, m.samples.length), sy(v)).join(",")).join(" ");
	const [tx0, ty] = P(CH.x0, sy(m.target));
	const [tx1] = P(CH.x1, sy(m.target));
	const halfLife = m.tau * Math.LN2;
	const valStr = decay ? Math.round(m.value).toString() : `${m.value.toFixed(0)}°`;
	let skin;
	if (decay) {
		const N = Math.min(100, Math.round(m.value0));
		const lit = Math.round(m.value / (m.value0 || 1) * N);
		const cols = 10, gap = 18, ox = 30, oy = 86;
		const dots = [];
		for (let i = 0; i < N; i++) {
			const [px, py] = P(ox + i % cols * gap, oy + Math.floor(i / cols) * gap);
			const on = i < lit;
			dots.push(/* @__PURE__ */ jsx("circle", {
				cx: px,
				cy: py,
				r: 5,
				fill: on ? "var(--stage-accent)" : "none",
				stroke: on ? "none" : "var(--stage-grid)",
				strokeWidth: 1.2,
				opacity: on ? 1 : .6
			}, i));
		}
		skin = /* @__PURE__ */ jsx("g", { children: dots });
	} else {
		const frac = clamp01((m.value - m.target) / (m.value0 - m.target || 1));
		const tubeX = 120, top = 80, bot = 250, w = 22;
		const [bx, byTop] = P(tubeX - w / 2, top);
		const [, byBot] = P(131, bot);
		const tube = pxRect(P, tubeX - w / 2, top, 131, bot);
		const [fillBx, fillTop] = P(112, top + (1 - frac) * (bot - top));
		const fillRect = pxRect(P, 112, top + (1 - frac) * (bot - top), 128, bot);
		const [bulbX, bulbY] = P(tubeX, 266);
		const hot = `color-mix(in oklab, var(--stage-warn) ${Math.round(frac * 100)}%, var(--stage-accent))`;
		return /* @__PURE__ */ jsxs(Fragment, { children: [
			chart(P, m, decay, maxV, sy, sx, frame, curve, tx0, tx1, ty, halfLife, valStr),
			/* @__PURE__ */ jsx("rect", {
				x: tube.x,
				y: tube.y,
				width: tube.width,
				height: tube.height,
				rx: 11,
				fill: "var(--stage-bg)",
				stroke: "var(--stage-metal)",
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsx("rect", {
				x: fillRect.x,
				y: fillRect.y,
				width: fillRect.width,
				height: fillRect.height,
				rx: 8,
				fill: hot
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: bulbX,
				cy: bulbY,
				r: 16,
				fill: hot,
				stroke: "var(--stage-metal)",
				strokeWidth: 2
			}),
			(() => {
				return null;
			})()
		] });
	}
	return /* @__PURE__ */ jsxs(Fragment, { children: [chart(P, m, decay, maxV, sy, sx, frame, curve, tx0, tx1, ty, halfLife, valStr), skin] });
}
/** the shared curve panel + readouts (both skins use it) */
function chart(P, m, decay, maxV, sy, _sx, frame, curve, tx0, tx1, ty, halfLife, valStr) {
	return /* @__PURE__ */ jsxs("g", { children: [
		(() => {
			const [x, y] = P(90, 290);
			return /* @__PURE__ */ jsx("text", {
				x,
				y,
				textAnchor: "middle",
				fontSize: 24,
				fontWeight: 800,
				fill: "var(--stage-accent)",
				style: { fontVariantNumeric: "tabular-nums" },
				children: valStr
			});
		})(),
		(() => {
			const [x, y] = P(90, 268);
			return /* @__PURE__ */ jsxs("text", {
				x,
				y,
				textAnchor: "middle",
				fontSize: 11,
				fill: "var(--stage-muted)",
				children: [decay ? "atoms left" : "temperature", m.done ? "  ·  ✓" : ""]
			});
		})(),
		/* @__PURE__ */ jsx("rect", {
			x: frame.x,
			y: frame.y,
			width: frame.width,
			height: frame.height,
			rx: 8,
			fill: "color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))",
			stroke: "var(--stage-grid)",
			strokeWidth: 1
		}),
		/* @__PURE__ */ jsx("line", {
			x1: tx0,
			y1: ty,
			x2: tx1,
			y2: ty,
			stroke: "var(--stage-good)",
			strokeWidth: 1.5,
			strokeDasharray: "6 5"
		}),
		(() => {
			const [x, y] = P(CH.x1 + 6, sy(m.target));
			return /* @__PURE__ */ jsx("text", {
				x,
				y: y + 3,
				fontSize: 11,
				fontWeight: 700,
				fill: "var(--stage-good)",
				children: decay ? "0" : `${m.target.toFixed(0)}° room`
			});
		})(),
		decay && (() => {
			const [x, y] = P(CH.x0, sy(m.value0 / 2));
			const [x1] = P(CH.x1, 0);
			return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("line", {
				x1: x,
				y1: y,
				x2: x1,
				y2: y,
				stroke: "var(--stage-grid)",
				strokeWidth: 1,
				strokeDasharray: "3 4"
			}), /* @__PURE__ */ jsx("text", {
				x: x + 4,
				y: y - 3,
				fontSize: 9.5,
				fill: "var(--stage-muted)",
				children: "N₀/2"
			})] });
		})(),
		/* @__PURE__ */ jsx("polyline", {
			points: curve,
			fill: "none",
			stroke: "var(--stage-accent)",
			strokeWidth: 2.5,
			strokeLinejoin: "round",
			strokeLinecap: "round"
		}),
		(() => {
			const [x, y] = P((CH.x0 + CH.x1) / 2, CH.yBot - 16);
			return /* @__PURE__ */ jsxs("text", {
				x,
				y,
				textAnchor: "middle",
				fontSize: 11,
				fill: "var(--stage-muted)",
				children: [
					decay ? `half-life ≈ ${halfLife.toFixed(1)} s, each one halves what's left` : `cooling toward room temp · τ ≈ ${m.tau.toFixed(1)} s`,
					" · t = ",
					m.tSec.toFixed(1),
					" s"
				]
			});
		})()
	] });
}
const RATE_PROCESS_ASSET = {
	resolver,
	Component
};

//#endregion
export { RATE_PROCESS_ASSET };