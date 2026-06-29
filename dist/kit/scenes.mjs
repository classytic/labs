'use client';

import { ThermometerGlyph } from "./thermal.mjs";
import { Vessel } from "./vessel.mjs";
import { DotCluster } from "./cluster.mjs";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/scenes.tsx
const REGISTRY = /* @__PURE__ */ new Map();
function registerScene(meta) {
	REGISTRY.set(meta.name, meta);
}
function getScene(name) {
	return REGISTRY.get(name);
}
function listScenes(kind) {
	return [...REGISTRY.values()].filter((m) => !kind || m.kind === kind);
}
const TONE = {
	idle: "var(--stage-accent)",
	ok: "var(--stage-good)",
	no: "var(--stage-warn)"
};
const FG = "var(--stage-fg)";
const MUTED = "var(--stage-muted)";
const clamp01 = (n) => Math.max(0, Math.min(1, n));
/** wrap a set of <g> children in a labelled, sized svg (the common scene shell). */
function Frame({ w, h, label, aria, children }) {
	return /* @__PURE__ */ jsxs("svg", {
		width: w,
		height: h,
		viewBox: `0 0 ${w} ${h}`,
		role: "img",
		"aria-label": aria,
		children: [children, label && /* @__PURE__ */ jsx("text", {
			x: w / 2,
			y: h - 6,
			fontSize: 12,
			fontWeight: 700,
			fill: FG,
			textAnchor: "middle",
			children: label
		})]
	});
}
/** a dashed guess-reading line across a level scene at fraction `g` of the band [top,bot]. */
function GuessLine({ x0, x1, top, bot, g, tone }) {
	if (g == null) return null;
	const y = bot - clamp01(g) * (bot - top);
	return /* @__PURE__ */ jsxs("g", {
		style: { transition: "transform 0.12s ease-out" },
		children: [/* @__PURE__ */ jsx("line", {
			x1: x0 - 5,
			y1: y,
			x2: x1 + 5,
			y2: y,
			stroke: TONE[tone],
			strokeWidth: 2.4,
			strokeDasharray: "6 4"
		}), /* @__PURE__ */ jsx("circle", {
			cx: x1 + 5,
			cy: y,
			r: 3.4,
			fill: TONE[tone]
		})]
	});
}
const trans = { transition: "y 0.5s ease-out, height 0.5s ease-out" };
registerScene({
	name: "vessel",
	kind: "level",
	label: "Beaker",
	render: (q) => /* @__PURE__ */ jsx(Vessel, {
		width: q.width ?? 120,
		height: q.height ?? 150,
		fillFrac: q.frac ?? 0,
		guessFrac: q.guessFrac,
		guessTone: q.guessTone,
		liquidColor: q.color ?? "var(--stage-accent)",
		label: q.label
	})
});
registerScene({
	name: "tank",
	kind: "level",
	label: "Tank",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const bw = Math.min(w - 16, 84), bx = (w - bw) / 2;
		const top = 14, bot = h - (q.label ? 28 : 12), ry = bw * .16;
		const f = clamp01(q.frac ?? 0);
		const liqTop = bot - f * (bot - top);
		const c = q.color ?? "#3aa0ff";
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `tank ${f * 100 | 0}% full`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: bx,
					y: liqTop,
					width: bw,
					height: Math.max(0, bot - liqTop),
					fill: c,
					fillOpacity: .45,
					style: trans
				}),
				f > .02 && /* @__PURE__ */ jsx("ellipse", {
					cx: bx + bw / 2,
					cy: liqTop,
					rx: bw / 2,
					ry,
					fill: c,
					fillOpacity: .8,
					style: { transition: "cy 0.5s ease-out" }
				}),
				/* @__PURE__ */ jsx("ellipse", {
					cx: bx + bw / 2,
					cy: top,
					rx: bw / 2,
					ry,
					fill: "none",
					stroke: MUTED,
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("path", {
					d: `M ${bx} ${top} L ${bx} ${bot} M ${bx + bw} ${top} L ${bx + bw} ${bot}`,
					stroke: MUTED,
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("path", {
					d: `M ${bx} ${bot} A ${bw / 2} ${ry} 0 0 0 ${bx + bw} ${bot}`,
					fill: "none",
					stroke: MUTED,
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx(GuessLine, {
					x0: bx,
					x1: bx + bw,
					top,
					bot,
					g: q.guessFrac,
					tone: q.guessTone ?? "idle"
				})
			]
		});
	}
});
registerScene({
	name: "bar",
	kind: "level",
	label: "Bar",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const bw = 44, bx = (w - bw) / 2;
		const top = 12, bot = h - (q.label ? 28 : 12);
		const f = clamp01(q.frac ?? 0);
		const fillTop = bot - f * (bot - top);
		const c = q.color ?? "var(--stage-accent)";
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `bar at ${f * 100 | 0}%`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: bx,
					y: top,
					width: bw,
					height: bot - top,
					rx: 10,
					fill: "color-mix(in oklab, var(--stage-fg) 12%, transparent)"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: bx,
					y: fillTop,
					width: bw,
					height: Math.max(0, bot - fillTop),
					rx: 10,
					fill: c,
					style: trans
				}),
				/* @__PURE__ */ jsx(GuessLine, {
					x0: bx,
					x1: bx + bw,
					top,
					bot,
					g: q.guessFrac,
					tone: q.guessTone ?? "idle"
				})
			]
		});
	}
});
registerScene({
	name: "battery",
	kind: "level",
	label: "Battery",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const bw = 56, bx = (w - bw) / 2;
		const top = 22, bot = h - (q.label ? 28 : 12);
		const f = clamp01(q.frac ?? 0);
		const fillTop = bot - f * (bot - top);
		const c = f > .5 ? "var(--stage-good)" : f > .2 ? "#e0a020" : "var(--stage-warn)";
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `battery ${f * 100 | 0}% charged`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: bx + bw * .3,
					y: top - 8,
					width: bw * .4,
					height: 8,
					rx: 2,
					fill: MUTED
				}),
				/* @__PURE__ */ jsx("rect", {
					x: bx,
					y: top,
					width: bw,
					height: bot - top,
					rx: 8,
					fill: "none",
					stroke: FG,
					strokeWidth: 2.5
				}),
				/* @__PURE__ */ jsx("rect", {
					x: bx + 4,
					y: fillTop,
					width: bw - 8,
					height: Math.max(0, bot - fillTop - 3),
					rx: 4,
					fill: c,
					style: trans
				}),
				/* @__PURE__ */ jsxs("text", {
					x: bx + bw / 2,
					y: (top + bot) / 2,
					fontSize: 13,
					fontWeight: 800,
					fill: FG,
					textAnchor: "middle",
					dominantBaseline: "middle",
					children: [f * 100 | 0, "%"]
				})
			]
		});
	}
});
registerScene({
	name: "jar",
	kind: "level",
	label: "Money jar",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const bw = Math.min(w - 18, 80), bx = (w - bw) / 2;
		const top = 24, bot = h - (q.label ? 28 : 12);
		const f = clamp01(q.frac ?? 0);
		const liqTop = bot - f * (bot - top);
		const c = q.color ?? "#f0b429";
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `jar ${f * 100 | 0}% full`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: bx - 3,
					y: top - 9,
					width: bw + 6,
					height: 9,
					rx: 3,
					fill: MUTED
				}),
				/* @__PURE__ */ jsx("path", {
					d: `M ${bx} ${top} L ${bx} ${bot - 10} Q ${bx} ${bot} ${bx + 10} ${bot} L ${bx + bw - 10} ${bot} Q ${bx + bw} ${bot} ${bx + bw} ${bot - 10} L ${bx + bw} ${top}`,
					fill: "color-mix(in oklab, var(--stage-fg) 5%, transparent)",
					stroke: MUTED,
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("rect", {
					x: bx + 2,
					y: liqTop,
					width: bw - 4,
					height: Math.max(0, bot - liqTop - 2),
					fill: c,
					fillOpacity: .6,
					style: trans
				}),
				f > .06 && /* @__PURE__ */ jsx("text", {
					x: bx + bw / 2,
					y: (liqTop + bot) / 2,
					fontSize: Math.min(20, bw * .4),
					textAnchor: "middle",
					dominantBaseline: "middle",
					children: "💰"
				}),
				/* @__PURE__ */ jsx(GuessLine, {
					x0: bx,
					x1: bx + bw,
					top,
					bot,
					g: q.guessFrac,
					tone: q.guessTone ?? "idle"
				})
			]
		});
	}
});
registerScene({
	name: "pie",
	kind: "level",
	label: "Pie",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const cx = w / 2, cy = (h - (q.label ? 22 : 8)) / 2 + 4;
		const r = Math.min(cx, cy) - 8;
		const f = clamp01(q.frac ?? 0);
		const c = q.color ?? "var(--stage-accent)";
		const a = f * 2 * Math.PI;
		const ex = cx + r * Math.sin(a), ey = cy - r * Math.cos(a);
		const large = f > .5 ? 1 : 0;
		const d = f <= 0 ? "" : f >= 1 ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - .01} ${cy - r} Z` : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `pie ${f * 100 | 0}%`,
			children: [
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r,
					fill: "color-mix(in oklab, var(--stage-fg) 10%, transparent)",
					stroke: MUTED,
					strokeWidth: 1.5
				}),
				d && /* @__PURE__ */ jsx("path", {
					d,
					fill: c,
					fillOpacity: .85
				}),
				/* @__PURE__ */ jsxs("text", {
					x: cx,
					y: cy,
					fontSize: 13,
					fontWeight: 800,
					fill: FG,
					textAnchor: "middle",
					dominantBaseline: "middle",
					style: {
						paintOrder: "stroke",
						stroke: "var(--stage-bg)",
						strokeWidth: 3
					},
					children: [f * 100 | 0, "%"]
				})
			]
		});
	}
});
registerScene({
	name: "balloon",
	kind: "level",
	label: "Balloon",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const cx = w / 2;
		const f = clamp01(q.frac ?? 0);
		const maxR = Math.min(w, h - 30) / 2 - 4;
		const r = maxR * (.32 + .68 * f);
		const cy = 12 + maxR;
		const c = q.color ?? "#e85aa6";
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `balloon ${f * 100 | 0}% inflated`,
			children: [
				/* @__PURE__ */ jsx("line", {
					x1: cx,
					y1: cy + r,
					x2: cx,
					y2: cy + maxR + 18,
					stroke: MUTED,
					strokeWidth: 1.5
				}),
				/* @__PURE__ */ jsx("ellipse", {
					cx,
					cy,
					rx: r,
					ry: r * 1.12,
					fill: c,
					fillOpacity: .85,
					style: { transition: "rx 0.4s ease-out, ry 0.4s ease-out" }
				}),
				/* @__PURE__ */ jsx("ellipse", {
					cx: cx - r * .32,
					cy: cy - r * .4,
					rx: r * .18,
					ry: r * .26,
					fill: "#fff",
					opacity: .4
				}),
				/* @__PURE__ */ jsx("path", {
					d: `M ${cx - 4} ${cy + r} L ${cx + 4} ${cy + r} L ${cx} ${cy + r + 6} Z`,
					fill: c
				})
			]
		});
	}
});
registerScene({
	name: "thermometer",
	kind: "level",
	label: "Thermometer",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const f = clamp01(q.frac ?? 0);
		return /* @__PURE__ */ jsx(Frame, {
			w,
			h,
			label: q.label,
			aria: `thermometer ${f * 100 | 0}%`,
			children: /* @__PURE__ */ jsx(ThermometerGlyph, {
				cx: w / 2,
				top: 12,
				h: h - (q.label ? 40 : 24),
				frac: f
			})
		});
	}
});
registerScene({
	name: "cluster",
	kind: "count",
	label: "Crowd",
	render: (q) => /* @__PURE__ */ jsx(DotCluster, {
		count: q.count ?? 0,
		highlight: q.highlight ?? 0,
		size: Math.min(q.width ?? 120, q.height ?? 130),
		label: q.label,
		highlightColor: q.color ?? "var(--stage-accent)"
	})
});
registerScene({
	name: "grid",
	kind: "count",
	label: "Grid",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 130;
		const n = Math.max(0, Math.round(q.count ?? 0));
		const cols = Math.ceil(Math.sqrt(Math.max(1, n)));
		const rows = Math.ceil(n / cols);
		const cell = (Math.min(w, h - (q.label ? 22 : 6)) - 6) / Math.max(cols, rows);
		const ox = (w - cols * cell) / 2, oy = 4;
		const c = q.color ?? "var(--stage-accent)";
		const hl = q.highlight ?? 0;
		const cells = [];
		for (let i = 0; i < n; i++) {
			const r = Math.floor(i / cols), col = i % cols;
			const isNew = i >= n - hl;
			cells.push(/* @__PURE__ */ jsx("rect", {
				x: ox + col * cell + 1.5,
				y: oy + r * cell + 1.5,
				width: cell - 3,
				height: cell - 3,
				rx: 3,
				fill: c,
				opacity: isNew ? .95 : .6,
				style: { animation: `scene-pop 0.3s ease-out ${i * .03}s backwards` }
			}, i));
		}
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `grid of ${n}`,
			children: [cells, /* @__PURE__ */ jsx("style", { children: `@keyframes scene-pop{from{opacity:0;transform:scale(0.4)}to{opacity:1}}` })]
		});
	}
});
registerScene({
	name: "coins",
	kind: "count",
	label: "Coin stack",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const n = Math.max(0, Math.round(q.count ?? 0));
		const cw = Math.min(54, w - 20);
		const cx = w / 2;
		const ch = 11;
		const bot = h - (q.label ? 26 : 10);
		const c = q.color ?? "#f0b429";
		const coins = [];
		for (let i = 0; i < n; i++) {
			const cy = bot - i * (ch - 3) - ch;
			coins.push(/* @__PURE__ */ jsxs("g", {
				style: { animation: `scene-drop 0.4s ease-out ${i * .06}s backwards` },
				children: [/* @__PURE__ */ jsx("ellipse", {
					cx,
					cy: cy + ch,
					rx: cw / 2,
					ry: ch * .5,
					fill: `color-mix(in oklab, ${c} 70%, black)`
				}), /* @__PURE__ */ jsx("ellipse", {
					cx,
					cy,
					rx: cw / 2,
					ry: ch * .5,
					fill: c,
					stroke: `color-mix(in oklab, ${c} 60%, black)`,
					strokeWidth: 1
				})]
			}, i));
		}
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `stack of ${n} coins`,
			children: [coins, /* @__PURE__ */ jsx("style", { children: `@keyframes scene-drop{from{opacity:0;transform:translateY(-26px)}to{opacity:1;transform:translateY(0)}}` })]
		});
	}
});
registerScene({
	name: "blocks",
	kind: "count",
	label: "Blocks",
	render: (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const n = Math.max(0, Math.round(q.count ?? 0));
		const per = Math.max(1, Math.min(5, Math.ceil(Math.sqrt(n))));
		const s = Math.min(26, (w - 16) / per);
		const bot = h - (q.label ? 26 : 10);
		const c = q.color ?? "var(--stage-accent)";
		const blocks = [];
		for (let i = 0; i < n; i++) {
			const row = Math.floor(i / per), col = i % per;
			const x0 = (w - Math.min(per, n - row * per) * s) / 2;
			blocks.push(/* @__PURE__ */ jsx("rect", {
				x: x0 + col * s + 1,
				y: bot - (row + 1) * s + 1,
				width: s - 2,
				height: s - 2,
				rx: 3,
				fill: c,
				fillOpacity: .85,
				stroke: `color-mix(in oklab, ${c} 55%, black)`,
				strokeWidth: 1,
				style: { animation: `scene-drop 0.4s ease-out ${i * .05}s backwards` }
			}, i));
		}
		return /* @__PURE__ */ jsxs(Frame, {
			w,
			h,
			label: q.label,
			aria: `${n} blocks`,
			children: [blocks, /* @__PURE__ */ jsx("style", { children: `@keyframes scene-drop{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}` })]
		});
	}
});

//#endregion
export { getScene, listScenes, registerScene };