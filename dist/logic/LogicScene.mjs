'use client';

import { JunctionDot, Wire } from "../kit/electronics.mjs";
import { GateGlyph, Lamp, ToggleSwitch, gatePorts } from "../kit/logic-gates.mjs";
import { getGate } from "./registry.mjs";
import { evaluate } from "./evaluate.mjs";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/logic/LogicScene.tsx
const COL = 128, ROW = 66, MX = 34, MY = 30;
const SW_W = 50, SW_H = 26, GATE = 48, LED_R = 16;
const NET_HUES = [
	"oklch(0.62 0.19 255)",
	"oklch(0.70 0.17 50)",
	"oklch(0.62 0.20 320)",
	"oklch(0.68 0.16 160)",
	"oklch(0.62 0.21 25)",
	"oklch(0.66 0.15 200)",
	"oklch(0.64 0.18 290)",
	"oklch(0.72 0.16 110)"
];
function LogicScene({ doc, onToggleInput, onOutputClick, outputText, outputState, reveal, showValues, ariaLabel = "logic circuit" }) {
	const sol = evaluate(doc);
	const levelOf = (id) => sol.depthOf(id);
	const lit = (id) => sol.high(id) && (reveal === void 0 || levelOf(id) < reveal);
	const cols = sol.levels.length;
	const colCount = Math.max(1, ...sol.levels.map((l) => l.length), doc.outputs.length);
	const slotC = (n, i) => (colCount - n) * ROW / 2 + i * ROW + ROW / 2;
	const halfH = (gate) => (gate ? GATE : SW_H) / 2;
	const raw = /* @__PURE__ */ new Map();
	sol.levels.forEach((ids, lvl) => ids.forEach((id, i) => raw.set(id, {
		x: MX + lvl * COL,
		y: slotC(ids.length, i),
		gate: lvl > 0
	})));
	const outRaw = doc.outputs.map((o, i) => ({
		id: o.id,
		y: slotC(doc.outputs.length, i)
	}));
	let top = Infinity, bot = -Infinity;
	raw.forEach((p) => {
		top = Math.min(top, p.y - halfH(p.gate));
		bot = Math.max(bot, p.y + halfH(p.gate));
	});
	outRaw.forEach((o) => {
		top = Math.min(top, o.y - LED_R);
		bot = Math.max(bot, o.y + LED_R);
	});
	const vOff = MY - top;
	const pos = /* @__PURE__ */ new Map();
	raw.forEach((p, id) => pos.set(id, {
		x: p.x,
		y: p.y + vOff,
		gate: p.gate
	}));
	const outX = MX + cols * COL;
	const outY = new Map(outRaw.map((o) => [o.id, o.y + vOff]));
	const outPort = (id) => {
		const p = pos.get(id);
		if (!p) return null;
		if (!p.gate) return {
			x: p.x + SW_W,
			y: p.y
		};
		const g = doc.gates.find((q) => q.id === id);
		return gatePorts((g && getGate(g.kind)?.glyph) ?? "AND", p.x, p.y - GATE / 2, GATE).output;
	};
	const W = outX + 80, H = bot - top + MY * 2;
	const sinkPorts = /* @__PURE__ */ new Map();
	const addSink = (src, p) => {
		if (!src || !p) return;
		const arr = sinkPorts.get(src) ?? [];
		arr.push(p);
		sinkPorts.set(src, arr);
	};
	for (const g of doc.gates) {
		const p = pos.get(g.id);
		if (!p) continue;
		const ins = gatePorts(getGate(g.kind)?.glyph ?? "AND", p.x, p.y - GATE / 2, GATE).inputs;
		g.in.forEach((src, k) => addSink(src, ins[k] ?? null));
	}
	for (const o of doc.outputs) addSink(o.in, {
		x: outX - LED_R - 4,
		y: outY.get(o.id) ?? MY
	});
	const order = /* @__PURE__ */ new Map();
	let oi = 0;
	doc.inputs.forEach((i) => order.set(i.id, oi++));
	doc.gates.forEach((g) => order.set(g.id, oi++));
	const hue = (src) => NET_HUES[(order.get(src) ?? 0) % NET_HUES.length];
	const byCol = /* @__PURE__ */ new Map();
	for (const src of sinkPorts.keys()) {
		const sp = outPort(src);
		if (!sp) continue;
		const k = Math.round(sp.x);
		const a = byCol.get(k) ?? [];
		a.push(src);
		byCol.set(k, a);
	}
	const trunkX = /* @__PURE__ */ new Map();
	byCol.forEach((srcs) => {
		srcs.sort((a, b) => (outPort(a)?.y ?? 0) - (outPort(b)?.y ?? 0));
		srcs.forEach((src, i) => {
			const sp = outPort(src);
			const near = Math.min(...sinkPorts.get(src).map((s) => s.x));
			trunkX.set(src, sp.x + Math.min(14 + i * 11, Math.max(8, near - sp.x - 8)));
		});
	});
	const wires = [];
	const junctions = [];
	sinkPorts.forEach((list, src) => {
		const sp = outPort(src);
		if (!sp) return;
		const on = lit(src), col = hue(src), tx = trunkX.get(src) ?? sp.x + 14;
		const ys = [sp.y, ...list.map((s) => s.y)];
		const lo = Math.min(...ys), hi = Math.max(...ys);
		wires.push(/* @__PURE__ */ jsx(Wire, {
			points: [[sp.x, sp.y], [tx, sp.y]],
			live: on,
			color: col
		}, `e-${src}`));
		if (hi - lo > 1) wires.push(/* @__PURE__ */ jsx(Wire, {
			points: [[tx, lo], [tx, hi]],
			live: on,
			color: col
		}, `t-${src}`));
		list.forEach((s, i) => wires.push(/* @__PURE__ */ jsx(Wire, {
			points: [[tx, s.y], [s.x, s.y]],
			live: on,
			color: col
		}, `b-${src}-${i}`)));
		const tap = (yy, k) => {
			if (yy > lo + .5 && yy < hi - .5) junctions.push(/* @__PURE__ */ jsx(JunctionDot, {
				x: tx,
				y: yy,
				r: 3,
				live: on,
				color: col
			}, `j-${src}-${k}`));
		};
		tap(sp.y, "s");
		list.forEach((s, i) => tap(s.y, `${i}`));
	});
	return /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 12,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			maxWidth: W,
			margin: "0 auto"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": ariaLabel,
			children: [
				wires,
				junctions,
				doc.inputs.map((inp) => {
					const p = pos.get(inp.id);
					if (!p) return null;
					return /* @__PURE__ */ jsxs("g", {
						role: onToggleInput ? "button" : void 0,
						tabIndex: onToggleInput ? 0 : void 0,
						"aria-label": onToggleInput ? `toggle ${inp.label ?? inp.id}` : void 0,
						style: { cursor: onToggleInput ? "pointer" : "default" },
						onClick: onToggleInput ? () => onToggleInput(inp.id) : void 0,
						onKeyDown: onToggleInput ? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onToggleInput(inp.id);
							}
						} : void 0,
						children: [/* @__PURE__ */ jsx(ToggleSwitch, {
							x: p.x,
							y: p.y - SW_H / 2,
							w: SW_W,
							h: SW_H,
							on: sol.value(inp.id),
							label: inp.label
						}), showValues && (() => {
							const on = sol.value(inp.id);
							return /* @__PURE__ */ jsx("text", {
								x: on ? p.x + SW_H * .55 : p.x + SW_W - SW_H * .55,
								y: p.y,
								fill: "var(--stage-fg)",
								fontSize: 11,
								fontWeight: 800,
								textAnchor: "middle",
								dominantBaseline: "central",
								style: { pointerEvents: "none" },
								children: on ? "1" : "0"
							});
						})()]
					}, inp.id);
				}),
				doc.gates.map((g) => {
					const p = pos.get(g.id);
					if (!p) return null;
					const gl = getGate(g.kind)?.glyph ?? "AND";
					const op = gatePorts(gl, p.x, p.y - GATE / 2, GATE).output;
					return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx(GateGlyph, {
						x: p.x,
						y: p.y - GATE / 2,
						size: GATE,
						type: gl,
						live: lit(g.id),
						label: g.label ?? getGate(g.kind)?.label
					}), showValues && /* @__PURE__ */ jsx("text", {
						x: op.x + 4,
						y: op.y - 6,
						fill: lit(g.id) ? hue(g.id) : "var(--stage-muted)",
						fontSize: 11,
						fontWeight: 800,
						textAnchor: "start",
						dominantBaseline: "auto",
						style: { pointerEvents: "none" },
						children: sol.value(g.id) ? "1" : "0"
					})] }, g.id);
				}),
				doc.outputs.map((o) => {
					const oy = outY.get(o.id) ?? MY;
					const actual = sol.outputs[o.id] ?? false;
					const st = outputState?.(o.id, actual);
					const txt = outputText?.(o.id, actual) ?? (actual ? "1" : "0");
					return /* @__PURE__ */ jsxs("g", {
						role: onOutputClick ? "button" : void 0,
						tabIndex: onOutputClick ? 0 : void 0,
						"aria-label": onOutputClick ? `set ${o.label ?? o.id}` : void 0,
						style: { cursor: onOutputClick ? "pointer" : "default" },
						onClick: onOutputClick ? () => onOutputClick(o.id) : void 0,
						onKeyDown: onOutputClick ? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onOutputClick(o.id);
							}
						} : void 0,
						children: [
							st && /* @__PURE__ */ jsx("circle", {
								cx: outX,
								cy: oy,
								r: 22,
								fill: "none",
								stroke: st === "ok" ? "var(--stage-good)" : "var(--stage-danger, #e03131)",
								strokeWidth: 2
							}),
							/* @__PURE__ */ jsx(Lamp, {
								cx: outX,
								cy: oy,
								r: LED_R,
								on: lit(o.in),
								color: o.color,
								label: o.label
							}),
							/* @__PURE__ */ jsx("text", {
								x: outX,
								y: oy,
								fill: lit(o.in) ? "var(--stage-bg)" : "var(--stage-fg)",
								fontSize: 14,
								fontWeight: 800,
								textAnchor: "middle",
								dominantBaseline: "central",
								style: { pointerEvents: "none" },
								children: txt
							})
						]
					}, o.id);
				})
			]
		})
	});
}

//#endregion
export { LogicScene };