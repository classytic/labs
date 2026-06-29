'use client';

import { toRad } from "../core/util.mjs";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/cycle.tsx
const edgeKey = (e) => `${e.from}->${e.to}`;
const TONES = [
	"var(--stage-accent)",
	"var(--stage-accent-2)",
	"var(--stage-good)",
	"var(--stage-warn)",
	"var(--stage-danger)",
	"var(--stage-muted)"
];
const r2 = (n) => Math.round(n * 100) / 100;
function CycleDiagram({ nodes, edges, size = 340, activeId = null, litEdges = null, edgeSlot, onNodeClick, ariaLabel }) {
	const c = size / 2;
	const R = size * .33;
	const nodeR = Math.max(16, Math.min(26, size * .075));
	const PAD = 46;
	const n = nodes.length || 1;
	const pos = /* @__PURE__ */ new Map();
	nodes.forEach((nd, i) => {
		const a = toRad(-90 + 360 * i / n);
		pos.set(nd.id, {
			x: r2(c + R * Math.cos(a)),
			y: r2(c + R * Math.sin(a)),
			tone: nd.tone ?? TONES[i % TONES.length],
			label: nd.label
		});
	});
	const idx = new Map(nodes.map((nd, i) => [nd.id, i]));
	const interactive = !!onNodeClick;
	const lit = litEdges ?? (activeId ? new Set(edges.filter((e) => e.from === activeId).map(edgeKey)) : null);
	const edgePaths = [];
	const slots = [];
	edges.forEach((e) => {
		const A = pos.get(e.from), B = pos.get(e.to);
		if (!A || !B) return;
		const key = edgeKey(e);
		const dx = B.x - A.x, dy = B.y - A.y;
		const L = Math.hypot(dx, dy) || 1;
		const ux = dx / L, uy = dy / L;
		const start = {
			x: r2(A.x + ux * nodeR),
			y: r2(A.y + uy * nodeR)
		};
		const end = {
			x: r2(B.x - ux * (nodeR + 7)),
			y: r2(B.y - uy * (nodeR + 7))
		};
		const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
		const ai = idx.get(e.from), bi = idx.get(e.to);
		const adjacent = (ai + 1) % n === bi || (bi + 1) % n === ai;
		let ctrl;
		if (adjacent) {
			const ox = mx - c, oy = my - c, ol = Math.hypot(ox, oy) || 1;
			const bow = R * .18;
			ctrl = {
				x: r2(mx + ox / ol * bow),
				y: r2(my + oy / ol * bow)
			};
		} else {
			const bow = L * .18;
			ctrl = {
				x: r2(mx - uy * bow),
				y: r2(my + ux * bow)
			};
		}
		const on = lit ? lit.has(key) : true;
		const dim = lit ? !on : false;
		const hot = on && !!lit;
		const col = hot ? "var(--stage-accent)" : "var(--stage-fg)";
		const adx = end.x - ctrl.x, ady = end.y - ctrl.y, al = Math.hypot(adx, ady) || 1;
		const hx = adx / al, hy = ady / al, px = -hy, py = hx, ah = 7;
		const b1 = {
			x: r2(end.x - hx * ah + px * ah * .6),
			y: r2(end.y - hy * ah + py * ah * .6)
		};
		const b2 = {
			x: r2(end.x - hx * ah - px * ah * .6),
			y: r2(end.y - hy * ah - py * ah * .6)
		};
		edgePaths.push(/* @__PURE__ */ jsxs("g", {
			opacity: dim ? .16 : .9,
			children: [/* @__PURE__ */ jsx("path", {
				d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
				fill: "none",
				stroke: col,
				strokeWidth: hot ? 2.6 : 1.8
			}), /* @__PURE__ */ jsx("polygon", {
				points: `${end.x},${end.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`,
				fill: col
			})]
		}, key));
		const bm = {
			x: r2(.25 * start.x + .5 * ctrl.x + .25 * end.x),
			y: r2(.25 * start.y + .5 * ctrl.y + .25 * end.y)
		};
		if (edgeSlot) slots.push(/* @__PURE__ */ jsx("g", {
			opacity: dim ? .25 : 1,
			children: edgeSlot(e, key, bm)
		}, `s-${key}`));
		else if (e.label) {
			const w = e.label.length * 5.7 + 14;
			slots.push(/* @__PURE__ */ jsxs("g", {
				opacity: dim ? .3 : 1,
				children: [/* @__PURE__ */ jsx("rect", {
					x: r2(bm.x - w / 2),
					y: bm.y - 9,
					width: r2(w),
					height: 18,
					rx: 9,
					fill: "var(--stage-bg)",
					stroke: hot ? "var(--stage-accent)" : "var(--stage-grid)",
					strokeWidth: 1
				}), /* @__PURE__ */ jsx("text", {
					x: bm.x,
					y: bm.y,
					fill: hot ? "var(--stage-accent)" : "var(--stage-muted)",
					fontSize: 10.5,
					fontWeight: 600,
					textAnchor: "middle",
					dominantBaseline: "central",
					children: e.label
				})]
			}, `l-${key}`));
		}
	});
	const nodeEls = nodes.map((nd) => {
		const p = pos.get(nd.id);
		const active = nd.id === activeId;
		return /* @__PURE__ */ jsxs("g", {
			opacity: (activeId ? !active : false) ? .45 : 1,
			style: { cursor: interactive ? "pointer" : "default" },
			onClick: interactive ? () => onNodeClick(nd.id) : void 0,
			role: interactive ? "button" : void 0,
			"aria-label": interactive ? nd.label : void 0,
			children: [
				active && /* @__PURE__ */ jsx("circle", {
					cx: p.x,
					cy: p.y,
					r: nodeR + 5,
					fill: "none",
					stroke: p.tone,
					strokeWidth: 2,
					opacity: .5
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: p.x,
					cy: p.y,
					r: nodeR,
					fill: p.tone,
					stroke: "var(--stage-bg)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("text", {
					x: p.x,
					y: r2(p.y + nodeR + 12),
					fill: "var(--stage-fg)",
					fontSize: 11,
					fontWeight: 700,
					textAnchor: "middle",
					children: p.label
				})
			]
		}, nd.id);
	});
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: `-46 -46 ${size + 2 * PAD} ${size + 2 * PAD}`,
		width: "100%",
		role: "img",
		"aria-label": ariaLabel,
		style: {
			display: "block",
			maxHeight: size + 2 * PAD
		},
		children: [
			edgePaths,
			nodeEls,
			slots
		]
	});
}

//#endregion
export { CycleDiagram, edgeKey };