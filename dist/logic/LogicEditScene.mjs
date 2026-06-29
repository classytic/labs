'use client';

import { JunctionDot, Wire, orthPoints } from "../kit/electronics.mjs";
import { GateGlyph, Lamp, ToggleSwitch, gatePorts } from "../kit/logic-gates.mjs";
import { getGate } from "./registry.mjs";
import { evaluate } from "./evaluate.mjs";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/logic/LogicEditScene.tsx
const SW_W = 52;
const SW_H = 28;
const GATE = 50;
const LED_R = 15;
const glyphOf = (kind) => getGate(kind)?.glyph ?? "AND";
const xy = (n, dx, dy) => ({
	x: n.x ?? dx,
	y: n.y ?? dy
});
function LogicEditScene({ doc, selectedId, wireStart, previewCursor, onNodePointerDown, onPortPointerDown, onBackground, ariaLabel }) {
	const sol = evaluate(doc);
	const W = doc.size?.w ?? 640, H = doc.size?.h ?? 360;
	const pos = /* @__PURE__ */ new Map();
	doc.inputs.forEach((n, i) => pos.set(n.id, xy(n, 40, 40 + i * 56)));
	doc.gates.forEach((n, i) => pos.set(n.id, xy(n, 260, 60 + i * 80)));
	doc.outputs.forEach((n, i) => pos.set(n.id, xy(n, W - 80, 60 + i * 70)));
	const outPort = (id) => {
		const p = pos.get(id);
		if (!p) return null;
		if (doc.inputs.some((n) => n.id === id)) return {
			x: p.x + 52,
			y: p.y + 28 / 2
		};
		const g = doc.gates.find((n) => n.id === id);
		if (g) return gatePorts(glyphOf(g.kind), p.x, p.y, 50).output;
		return null;
	};
	const gateInPorts = (id) => {
		const p = pos.get(id);
		const g = doc.gates.find((n) => n.id === id);
		if (!p || !g) return [];
		return gatePorts(glyphOf(g.kind), p.x, p.y, 50).inputs;
	};
	const outInPort = (id) => {
		const p = pos.get(id);
		return p ? {
			x: p.x,
			y: p.y + 15
		} : null;
	};
	const wires = [];
	const wire = (key, a, b, on) => {
		if (!a || !b) return;
		wires.push(/* @__PURE__ */ jsx(Wire, {
			points: orthPoints(a, b),
			live: on
		}, key));
	};
	doc.gates.forEach((g) => g.in.forEach((src, i) => {
		if (src) wire(`w-${g.id}-${i}`, outPort(src), gateInPorts(g.id)[i] ?? null, sol.high(src));
	}));
	doc.outputs.forEach((o) => {
		if (o.in) wire(`wo-${o.id}`, outPort(o.in), outInPort(o.id), sol.high(o.in));
	});
	const fanout = /* @__PURE__ */ new Map();
	const bump = (id) => {
		if (id) fanout.set(id, (fanout.get(id) ?? 0) + 1);
	};
	doc.gates.forEach((g) => g.in.forEach(bump));
	doc.outputs.forEach((o) => bump(o.in));
	const junctions = [];
	fanout.forEach((n, src) => {
		if (n >= 2) {
			const sp = outPort(src);
			if (sp) junctions.push(/* @__PURE__ */ jsx(JunctionDot, {
				x: sp.x,
				y: sp.y,
				r: 3.5,
				live: sol.high(src)
			}, `j-${src}`));
		}
	});
	const isStart = (r) => !!wireStart && wireStart.nodeId === r.nodeId && wireStart.dir === r.dir && wireStart.slot === r.slot;
	const portDot = (ref, at, on) => {
		if (!at) return null;
		const start = isStart(ref);
		return /* @__PURE__ */ jsxs("g", {
			onPointerDown: (e) => {
				e.stopPropagation();
				onPortPointerDown?.(ref, e);
			},
			style: { cursor: "crosshair" },
			children: [
				/* @__PURE__ */ jsx("circle", {
					cx: at.x,
					cy: at.y,
					r: 9,
					fill: "transparent"
				}),
				start && /* @__PURE__ */ jsx("circle", {
					cx: at.x,
					cy: at.y,
					r: 7,
					fill: "none",
					stroke: "var(--stage-accent)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: at.x,
					cy: at.y,
					r: 4,
					fill: on ? "var(--stage-live)" : "var(--stage-metal)",
					stroke: "var(--stage-bg)",
					strokeWidth: 1
				})
			]
		}, `p-${ref.nodeId}-${ref.dir}-${ref.slot ?? "x"}`);
	};
	const selRing = (id, x, y, w, h) => selectedId === id ? /* @__PURE__ */ jsx("rect", {
		x: x - 5,
		y: y - 5,
		width: w + 10,
		height: h + 10,
		rx: 7,
		fill: "none",
		stroke: "var(--stage-accent)",
		strokeWidth: 1.5,
		strokeDasharray: "4 3"
	}) : null;
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: `0 0 ${W} ${H}`,
		width: "100%",
		style: {
			maxWidth: W,
			display: "block",
			background: "var(--stage-bg)",
			borderRadius: 10,
			touchAction: "none"
		},
		role: "img",
		"aria-label": ariaLabel ?? "logic circuit builder canvas",
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: 0,
				y: 0,
				width: W,
				height: H,
				fill: "transparent",
				onPointerDown: () => onBackground?.()
			}),
			wires,
			junctions,
			wireStart && previewCursor && (() => {
				const a = outPort(wireStart.nodeId);
				if (!a) return null;
				let target = null, bd = 18;
				const consider = (pt) => {
					if (pt) {
						const d = Math.hypot(previewCursor.x - pt.x, previewCursor.y - pt.y);
						if (d < bd) {
							bd = d;
							target = pt;
						}
					}
				};
				doc.gates.forEach((g) => gateInPorts(g.id).forEach((pt) => consider(pt)));
				doc.outputs.forEach((o) => consider(outInPort(o.id)));
				const b = target ?? previewCursor;
				const dx = Math.max(18, Math.abs(b.x - a.x) * .45);
				return /* @__PURE__ */ jsxs("g", {
					style: { pointerEvents: "none" },
					children: [/* @__PURE__ */ jsx("path", {
						d: `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`,
						fill: "none",
						stroke: "var(--stage-accent)",
						strokeWidth: 2.5,
						strokeDasharray: "5 4",
						strokeLinecap: "round",
						opacity: .9
					}), /* @__PURE__ */ jsx("circle", {
						cx: b.x,
						cy: b.y,
						r: target ? 6 : 4,
						fill: target ? "var(--stage-accent)" : "var(--stage-bg)",
						stroke: "var(--stage-accent)",
						strokeWidth: 2
					})]
				});
			})(),
			doc.inputs.map((inp) => {
				const p = pos.get(inp.id);
				return /* @__PURE__ */ jsxs("g", { children: [
					selRing(inp.id, p.x, p.y, 52, 28),
					/* @__PURE__ */ jsx("g", {
						onPointerDown: (e) => onNodePointerDown?.(inp.id, e),
						style: { cursor: "grab" },
						children: /* @__PURE__ */ jsx(ToggleSwitch, {
							x: p.x,
							y: p.y,
							w: 52,
							h: 28,
							on: sol.value(inp.id),
							label: inp.label
						})
					}),
					portDot({
						nodeId: inp.id,
						dir: "out"
					}, outPort(inp.id), sol.high(inp.id))
				] }, inp.id);
			}),
			doc.gates.map((g) => {
				const p = pos.get(g.id);
				const ins = gateInPorts(g.id);
				return /* @__PURE__ */ jsxs("g", { children: [
					selRing(g.id, p.x, p.y, 50, 50),
					/* @__PURE__ */ jsx("g", {
						onPointerDown: (e) => onNodePointerDown?.(g.id, e),
						style: { cursor: "grab" },
						children: /* @__PURE__ */ jsx(GateGlyph, {
							x: p.x,
							y: p.y,
							size: 50,
							type: glyphOf(g.kind),
							live: sol.high(g.id),
							label: g.label ?? getGate(g.kind)?.label
						})
					}),
					ins.map((_, i) => portDot({
						nodeId: g.id,
						dir: "in",
						slot: i
					}, ins[i] ?? null, !!g.in[i] && sol.high(g.in[i]))),
					portDot({
						nodeId: g.id,
						dir: "out"
					}, outPort(g.id), sol.high(g.id))
				] }, g.id);
			}),
			doc.outputs.map((o) => {
				const p = pos.get(o.id);
				const lit = !!o.in && sol.high(o.in);
				const met = o.goal !== void 0 && (sol.outputs[o.id] ?? false) === o.goal;
				return /* @__PURE__ */ jsxs("g", { children: [
					selRing(o.id, p.x, p.y, 15 * 2, 15 * 2),
					/* @__PURE__ */ jsx("g", {
						onPointerDown: (e) => onNodePointerDown?.(o.id, e),
						style: { cursor: "grab" },
						children: /* @__PURE__ */ jsx(Lamp, {
							cx: p.x + 15,
							cy: p.y + 15,
							r: 15,
							on: lit,
							color: o.color,
							label: o.label
						})
					}),
					o.goal !== void 0 && /* @__PURE__ */ jsx("circle", {
						cx: p.x + 15,
						cy: p.y + 15,
						r: 20,
						fill: "none",
						stroke: met ? "var(--stage-good)" : "var(--stage-danger, #e03131)",
						strokeWidth: 2
					}),
					portDot({
						nodeId: o.id,
						dir: "in"
					}, outInPort(o.id), lit)
				] }, o.id);
			})
		]
	});
}

//#endregion
export { LogicEditScene };