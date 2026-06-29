'use client';

import { FlowDots, JunctionDot, Wire } from "../kit/electronics.mjs";
import { useReducedMotion } from "../kit/anim.mjs";
import { getPart } from "./registry.mjs";
import { registerBuiltinParts } from "./parts/index.mjs";
import { partState, solveCircuit } from "./solve.mjs";
import { FLOW_EPS, nodeKey, pinKey, wireCurrents } from "./flow.mjs";
import { wirePolyline } from "./editor-ops.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useFrameLoop } from "@classytic/stage";

//#region src/build/CircuitScene.tsx
/**
* CircuitScene — pure render of a CircuitDoc. It solves the doc, draws a wire from
* every part pin to the node it names, places a junction dot where 3+ pins meet, and
* lets each PartDef draw its own glyph with the solved state. Live branches carry
* moving charge dots. No drawing logic lives here: parts own their look.
*
* Read-only by default. Pass `onPartTap` for click-to-operate (learner), or an
* `editor` bag for authoring (selection + pin handles for wiring). A node with no
* explicit `at` is drawn at the centroid of the terminals wired to it, so the
* author never has to place junctions by hand.
*/
registerBuiltinParts();
/** Manhattan route terminal → node: straight when aligned, else a single elbow (vertical-first). */
function orthRoute(a, b) {
	if (a.x === b.x || a.y === b.y) return [[a.x, a.y], [b.x, b.y]];
	return [
		[a.x, a.y],
		[a.x, b.y],
		[b.x, b.y]
	];
}
function CircuitScene({ doc, flow = true, ariaLabel = "circuit diagram", onPartTap, selectedId, editor }) {
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const W = doc.size?.w ?? 520;
	const H = doc.size?.h ?? 220;
	const sol = solveCircuit(doc);
	const states = new Map(doc.parts.map((p) => [p.id, partState(p, sol)]));
	const anyLive = [...states.values()].some((s) => s.live);
	const wf = wireCurrents(doc, sol);
	const termOf = (partId, pin) => {
		const p = doc.parts.find((x) => x.id === partId);
		const def = p && getPart(p.kind);
		return def ? def.terminalAt(p, pin) : void 0;
	};
	const rev = (s) => [...s].reverse();
	const termsByNode = /* @__PURE__ */ new Map();
	for (const p of doc.parts) {
		const def = getPart(p.kind);
		if (!def) continue;
		for (const pin of def.pins) {
			const nid = p.pins[pin];
			if (!nid) continue;
			(termsByNode.get(nid) ?? termsByNode.set(nid, []).get(nid)).push(def.terminalAt(p, pin));
		}
	}
	const explicit = new Map(doc.nodes.map((n) => [n.id, n.at]));
	const nodePos = (nid) => {
		const fixed = explicit.get(nid);
		if (fixed) return fixed;
		const ts = termsByNode.get(nid) ?? [];
		return ts.length ? {
			x: ts.reduce((s, t) => s + t.x, 0) / ts.length,
			y: ts.reduce((s, t) => s + t.y, 0) / ts.length
		} : {
			x: W / 2,
			y: H / 2
		};
	};
	const drawnNode = (nid) => explicit.has(nid) || (termsByNode.get(nid)?.length ?? 0) >= 2;
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1400) % 1), { running: flow && anyLive && !reduce });
	const wires = [];
	const live = [];
	const pinHandles = [];
	const wireEndpoints = /* @__PURE__ */ new Map();
	const bump = (k) => {
		wireEndpoints.set(k, (wireEndpoints.get(k) ?? 0) + 1);
	};
	for (const p of doc.parts) {
		const def = getPart(p.kind);
		if (!def) continue;
		for (const pin of def.pins) {
			const nid = p.pins[pin];
			if (!nid || !drawnNode(nid)) continue;
			const seg = orthRoute(def.terminalAt(p, pin), nodePos(nid));
			const I = wf.current(pinKey(p.id, pin), nodeKey(nid));
			const isLive = Math.abs(I) > FLOW_EPS;
			wires.push(/* @__PURE__ */ jsx(Wire, {
				points: seg,
				live: isLive
			}, `stub-${p.id}-${pin}`));
			if (isLive) live.push(I > 0 ? rev(seg) : seg);
		}
	}
	for (const w of doc.wires ?? []) {
		const ta = termOf(w.a.partId, w.a.pin);
		const tb = termOf(w.b.partId, w.b.pin);
		if (!ta || !tb) continue;
		const seg = wirePolyline(ta, w.mid ?? [], tb).map((p) => [p.x, p.y]);
		const ptStr = seg.map((q) => `${q[0]},${q[1]}`).join(" ");
		const isSel = editor?.selectedWireId === w.id;
		const I = wf.current(pinKey(w.a.partId, w.a.pin), pinKey(w.b.partId, w.b.pin));
		const isLive = Math.abs(I) > FLOW_EPS;
		wires.push(/* @__PURE__ */ jsxs("g", {
			style: { cursor: editor?.onWireClick ? "pointer" : "default" },
			onClick: editor?.onWireClick ? (e) => {
				e.stopPropagation();
				editor.onWireClick(w.id);
			} : void 0,
			children: [
				isSel && /* @__PURE__ */ jsx("polyline", {
					points: ptStr,
					fill: "none",
					stroke: "var(--stage-accent)",
					strokeWidth: 6,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					opacity: .4
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: seg,
					live: isLive
				}),
				editor?.onWireClick && /* @__PURE__ */ jsx("polyline", {
					points: ptStr,
					fill: "none",
					stroke: "transparent",
					strokeWidth: isSel ? 20 : 14,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					style: {
						cursor: isSel ? "move" : "pointer",
						pointerEvents: "stroke"
					},
					onPointerDown: isSel && editor.onWireBodyDown ? (e) => {
						e.stopPropagation();
						editor.onWireBodyDown(w.id, e);
					} : void 0
				}),
				isSel && (w.mid ?? []).map((m, i) => /* @__PURE__ */ jsx("rect", {
					x: m.x - 5,
					y: m.y - 5,
					width: 10,
					height: 10,
					rx: 2,
					fill: "var(--stage-bg)",
					stroke: "var(--stage-accent)",
					strokeWidth: 2,
					style: { cursor: "move" },
					onPointerDown: editor.onWireWaypointDown ? (e) => {
						e.stopPropagation();
						editor.onWireWaypointDown(w.id, i, e);
					} : void 0
				}, `wp-${i}`))
			]
		}, `wire-${w.id}`));
		if (isLive) live.push(I > 0 ? rev(seg) : seg);
		bump(`${w.a.partId} ${w.a.pin}`);
		bump(`${w.b.partId} ${w.b.pin}`);
	}
	if (editor?.showPins) for (const p of doc.parts) {
		const def = getPart(p.kind);
		if (!def) continue;
		for (const pin of def.pins) {
			const t = def.terminalAt(p, pin);
			const armed = editor.wireStart?.partId === p.id && editor.wireStart?.pin === pin;
			pinHandles.push(/* @__PURE__ */ jsx("circle", {
				cx: t.x,
				cy: t.y,
				r: armed ? 7 : 5.5,
				fill: armed ? "var(--stage-accent)" : "var(--stage-bg)",
				stroke: "var(--stage-accent)",
				strokeWidth: 2,
				style: { cursor: "crosshair" },
				role: "button",
				"aria-label": `${pin} of ${def.label}`,
				onPointerDown: (e) => {
					e.stopPropagation();
					editor.onPinPointerDown?.(p.id, pin, e);
				}
			}, `pin-${p.id}-${pin}`));
		}
	}
	const dots = [];
	for (const [nid, ts] of termsByNode) if (drawnNode(nid) && ts.length > 2) {
		const np = nodePos(nid);
		dots.push(/* @__PURE__ */ jsx(JunctionDot, {
			x: np.x,
			y: np.y,
			live: false
		}, `j-${nid}`));
	}
	for (const [key, n] of wireEndpoints) if (n >= 2) {
		const [partId, pin] = key.split(" ");
		const t = partId && pin ? termOf(partId, pin) : void 0;
		if (t) dots.push(/* @__PURE__ */ jsx(JunctionDot, {
			x: t.x,
			y: t.y,
			live: false
		}, `jw-${key}`));
	}
	return /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": ariaLabel,
			children: [
				editor?.onBackground && /* @__PURE__ */ jsx("rect", {
					x: 0,
					y: 0,
					width: W,
					height: H,
					fill: "transparent",
					onPointerDown: (e) => editor.onBackground(e)
				}),
				wires,
				flow && !reduce && live.map((seg, k) => /* @__PURE__ */ jsx(FlowDots, {
					points: seg,
					phase,
					spacing: 54,
					r: 2.3
				}, `f${k}`)),
				dots,
				editor?.wirePreview && (() => {
					const { from, mids = [], to, valid } = editor.wirePreview;
					const pts = [
						from,
						...mids,
						to
					];
					const col = "var(--stage-accent)";
					return /* @__PURE__ */ jsxs("g", {
						style: { pointerEvents: "none" },
						children: [
							/* @__PURE__ */ jsx("polyline", {
								points: pts.map((q) => `${q.x},${q.y}`).join(" "),
								fill: "none",
								stroke: col,
								strokeWidth: 2.5,
								strokeDasharray: "5 4",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								opacity: .9
							}),
							mids.map((m, i) => /* @__PURE__ */ jsx("circle", {
								cx: m.x,
								cy: m.y,
								r: 3.5,
								fill: col
							}, i)),
							/* @__PURE__ */ jsx("circle", {
								cx: to.x,
								cy: to.y,
								r: valid ? 6 : 5,
								fill: valid ? col : "var(--stage-bg)",
								stroke: col,
								strokeWidth: 2
							})
						]
					});
				})(),
				doc.parts.map((p) => {
					const def = getPart(p.kind);
					if (!def) return null;
					const glyph = def.render(p, states.get(p.id));
					const tappable = !!onPartTap && (def.tap?.(p) ?? null) !== null;
					const selectable = !!editor?.onSelect;
					const selected = selectedId === p.id;
					if (!tappable && !selectable && !selected) return glyph;
					const onActivate = selectable ? () => editor.onSelect(p.id) : tappable ? () => onPartTap(p.id) : void 0;
					const label = !selectable && tappable ? `toggle ${def.label.toLowerCase()}` : `select ${def.label.toLowerCase()}`;
					return /* @__PURE__ */ jsxs("g", {
						role: onActivate ? "button" : void 0,
						tabIndex: onActivate ? 0 : void 0,
						"aria-label": onActivate ? label : void 0,
						style: { cursor: editor?.onPartPointerDown ? "move" : onActivate ? "pointer" : "default" },
						onPointerDown: editor?.onPartPointerDown ? (e) => editor.onPartPointerDown(p.id, e) : void 0,
						onClick: onActivate ? (e) => {
							e.stopPropagation();
							onActivate();
						} : void 0,
						onKeyDown: onActivate ? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onActivate();
							}
						} : void 0,
						children: [
							selected && /* @__PURE__ */ jsx("rect", {
								x: p.at.x - 40,
								y: p.at.y - 30,
								width: 80,
								height: 60,
								rx: 8,
								fill: "none",
								stroke: "var(--stage-accent)",
								strokeWidth: 1.5,
								strokeDasharray: "4 3"
							}),
							(tappable || selectable) && /* @__PURE__ */ jsx("rect", {
								x: p.at.x - 38,
								y: p.at.y - 28,
								width: 76,
								height: 56,
								rx: 8,
								fill: "transparent"
							}),
							glyph
						]
					}, `hit-${p.id}`);
				}),
				doc.parts.map((p) => {
					const dmg = states.get(p.id)?.damage;
					if (!dmg) return null;
					const c = "var(--stage-danger, #e03131)";
					return /* @__PURE__ */ jsxs("g", {
						style: { pointerEvents: "none" },
						children: [/* @__PURE__ */ jsx("rect", {
							x: p.at.x - 34,
							y: p.at.y - 24,
							width: 68,
							height: 48,
							rx: 8,
							fill: "color-mix(in oklab, var(--stage-danger, #e03131) 14%, transparent)",
							stroke: c,
							strokeWidth: 2,
							strokeDasharray: "3 3"
						}), /* @__PURE__ */ jsx("text", {
							x: p.at.x,
							y: p.at.y - 30,
							fill: c,
							fontSize: 14,
							fontWeight: 800,
							textAnchor: "middle",
							dominantBaseline: "auto",
							children: dmg === "overpower" ? "🔥" : "⚡"
						})]
					}, `dmg-${p.id}`);
				}),
				pinHandles,
				editor?.selectedWireId && editor.onWireEndDown && (() => {
					const w = (doc.wires ?? []).find((x) => x.id === editor.selectedWireId);
					if (!w) return null;
					return [{
						end: "a",
						t: termOf(w.a.partId, w.a.pin)
					}, {
						end: "b",
						t: termOf(w.b.partId, w.b.pin)
					}].map(({ end, t }) => t && /* @__PURE__ */ jsx("circle", {
						cx: t.x,
						cy: t.y,
						r: 7.5,
						fill: "var(--stage-bg)",
						stroke: "var(--stage-accent)",
						strokeWidth: 2.5,
						style: { cursor: "grab" },
						role: "button",
						"aria-label": `wire end ${end}`,
						onPointerDown: (e) => {
							e.stopPropagation();
							editor.onWireEndDown(w.id, end, e);
						}
					}, `we-${end}`));
				})()
			]
		})
	});
}

//#endregion
export { CircuitScene };