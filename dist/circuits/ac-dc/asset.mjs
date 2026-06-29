'use client';

import { AcDcSourceGlyph, LampGlyph } from "../../kit/electronics.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { StageAssetDefs, registerAsset, useCoords } from "@classytic/stage";

//#region src/circuits/ac-dc/asset.tsx
const SRC = {
	x: 96,
	y: 96
};
const LAMP = {
	x: 624,
	y: 96
};
const PIPE = {
	x0: 96,
	x1: 624,
	y: 252
};
const SCOPE = {
	x0: 60,
	x1: 660,
	yTop: 320,
	yBot: 500
};
const LOOP = [
	[SRC.x, 64],
	[SRC.x, 28],
	[LAMP.x, 28],
	[LAMP.x, 64],
	[LAMP.x, 128],
	[LAMP.x, 164],
	[SRC.x, 164],
	[SRC.x, 128],
	[SRC.x, 64]
];
const LOOP_SEGS = (() => {
	const segs = [];
	let total = 0;
	for (let i = 0; i < LOOP.length - 1; i++) {
		const a = LOOP[i];
		const b = LOOP[i + 1];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const len = Math.hypot(dx, dy);
		segs.push({
			x: a[0],
			y: a[1],
			dx,
			dy,
			len
		});
		total += len;
	}
	return {
		segs,
		total
	};
})();
function loopPoint(d) {
	const { segs, total } = LOOP_SEGS;
	let dist = (d % total + total) % total;
	for (const s of segs) {
		if (dist <= s.len) {
			const t = s.len > 0 ? dist / s.len : 0;
			return {
				x: s.x + s.dx * t,
				y: s.y + s.dy * t
			};
		}
		dist -= s.len;
	}
	const last = segs[segs.length - 1];
	return {
		x: last.x + last.dx,
		y: last.y + last.dy
	};
}
const numOr = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
function resolver({ sim }) {
	const v = numOr(sim?.v, 0);
	const charge = numOr(sim?.charge, 0);
	const volts = Math.max(1, numOr(sim?.volts, 9));
	const mode = typeof sim?.mode === "string" ? sim.mode : "dc";
	const samples = Array.isArray(sim?.samples) ? sim.samples : [];
	const level = v / volts;
	const brightness = Math.min(1, v * v / (volts * volts));
	const flow = charge * 26;
	const N = 16;
	const spacing = LOOP_SEGS.total / N;
	const electrons = [];
	for (let i = 0; i < N; i++) electrons.push(loopPoint(flow + i * spacing));
	const D = 13;
	const span = PIPE.x1 - PIPE.x0;
	const gap = span / D;
	const drops = [];
	for (let i = 0; i < D; i++) {
		const px = PIPE.x0 + ((flow * .6 + i * gap) % span + span) % span;
		drops.push({
			x: px,
			y: PIPE.y
		});
	}
	const mid = (SCOPE.yTop + SCOPE.yBot) / 2;
	const halfH = (SCOPE.yBot - SCOPE.yTop) / 2 - 8;
	const w = SCOPE.x1 - SCOPE.x0;
	const cap = Math.max(1, samples.length - 1);
	const trace = samples.map((s, i) => ({
		x: SCOPE.x0 + i / cap * w,
		y: mid - s / volts * halfH
	}));
	const meta = {
		mode,
		volts,
		level,
		brightness,
		lastV: samples.length ? samples[samples.length - 1] : v,
		electrons,
		drops,
		trace
	};
	return {
		kind: "asset-geom",
		parts: {
			src: SRC,
			lamp: LAMP
		},
		meta
	};
}
function Component({ geom }) {
	const c = useCoords();
	const m = geom.meta ?? {};
	const P = (p) => c.toPx(p.x, 540 - p.y);
	const loopPath = "M " + LOOP.map((d) => P({
		x: d[0],
		y: d[1]
	}).join(",")).join(" L ");
	const mid = (SCOPE.yTop + SCOPE.yBot) / 2;
	const [scX0, scYa] = P({
		x: SCOPE.x0,
		y: SCOPE.yTop
	});
	const [scX1, scYb] = P({
		x: SCOPE.x1,
		y: SCOPE.yBot
	});
	const scTop = Math.min(scYa, scYb);
	const scH = Math.abs(scYb - scYa);
	const [, scMid] = P({
		x: 0,
		y: mid
	});
	const lit = Math.abs(m.level) > .02;
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(StageAssetDefs, {}),
		/* @__PURE__ */ jsx("path", {
			d: loopPath,
			fill: "none",
			stroke: "var(--stage-metal)",
			strokeWidth: 3,
			strokeLinejoin: "round",
			strokeLinecap: "round"
		}),
		m.electrons.map((e, i) => {
			const [x, y] = P(e);
			return /* @__PURE__ */ jsx("circle", {
				cx: x,
				cy: y,
				r: 3,
				fill: "var(--stage-charge)",
				opacity: lit ? .9 : .25
			}, `e${i}`);
		}),
		(() => {
			const [x, y] = P(geom.parts.src);
			return /* @__PURE__ */ jsx(AcDcSourceGlyph, {
				cx: x,
				cy: y,
				mode: m.mode === "ac" ? "ac" : "dc",
				level: m.level
			});
		})(),
		(() => {
			const [x, y] = P(geom.parts.lamp);
			return /* @__PURE__ */ jsx(LampGlyph, {
				cx: x,
				cy: y,
				brightness: m.brightness
			});
		})(),
		(() => {
			const [px0, py] = P({
				x: PIPE.x0,
				y: PIPE.y
			});
			const [px1] = P({
				x: PIPE.x1,
				y: PIPE.y
			});
			return /* @__PURE__ */ jsxs("g", { children: [
				/* @__PURE__ */ jsx("rect", {
					x: px0 - 14,
					y: py - 16,
					width: px1 - px0 + 28,
					height: 32,
					rx: 16,
					fill: "color-mix(in oklab, var(--stage-accent) 10%, var(--stage-bg))",
					stroke: "var(--stage-grid)",
					strokeWidth: 2
				}),
				m.drops.map((d, i) => {
					const [x, y] = P(d);
					return /* @__PURE__ */ jsx("circle", {
						cx: x,
						cy: y,
						r: 5,
						fill: "var(--stage-accent)",
						opacity: .85
					}, `d${i}`);
				}),
				/* @__PURE__ */ jsxs("text", {
					x: px0 - 6,
					y: py + 38,
					fontSize: 12,
					fill: "var(--stage-metal)",
					children: [
						"water analogy, ",
						m.mode === "dc" ? "steady one-way flow" : "back-and-forth slosh",
						" (same signal)"
					]
				})
			] });
		})(),
		/* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("rect", {
				x: scX0,
				y: scTop,
				width: scX1 - scX0,
				height: scH,
				rx: 10,
				fill: "color-mix(in oklab, var(--stage-accent) 6%, var(--stage-bg))",
				stroke: "var(--stage-grid)",
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ jsx("line", {
				x1: scX0,
				y1: scMid,
				x2: scX1,
				y2: scMid,
				stroke: "var(--stage-grid)",
				strokeWidth: 1,
				strokeDasharray: "4 5"
			}),
			/* @__PURE__ */ jsx("polyline", {
				points: m.trace.map((p) => P(p).join(",")).join(" "),
				fill: "none",
				stroke: "var(--stage-live)",
				strokeWidth: 2.5,
				strokeLinejoin: "round",
				strokeLinecap: "round",
				filter: "url(#stage-glow)"
			}),
			/* @__PURE__ */ jsx("text", {
				x: scX0 + 10,
				y: scTop + 20,
				fontSize: 13,
				fontWeight: 700,
				fill: "var(--stage-live)",
				children: "voltage vs time"
			}),
			/* @__PURE__ */ jsxs("text", {
				x: scX1 - 10,
				y: scTop + 20,
				textAnchor: "end",
				fontSize: 13,
				fill: "var(--stage-metal)",
				children: [
					m.lastV >= 0 ? "+" : "",
					m.lastV.toFixed(1),
					" V"
				]
			})
		] })
	] });
}
const AC_DC_ASSET = {
	resolver,
	Component
};
registerAsset("ac-dc", AC_DC_ASSET);

//#endregion
export { AC_DC_ASSET };