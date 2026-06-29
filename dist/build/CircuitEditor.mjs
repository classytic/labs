'use client';

import { getPart, listParts } from "./registry.mjs";
import { partState, solveCircuit } from "./solve.mjs";
import { addPart, addWire, deletePart, disconnectWire, movePart, retargetWire, rotatePart, setGround, setWireWaypoints, spliceIntoWire, tapWire, terminalOf, updateProps, wirePolyline } from "./editor-ops.mjs";
import { CircuitScene } from "./CircuitScene.mjs";
import { EBtn, Field, NumInput, Panel, TextInput } from "./editor-ui.mjs";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/build/CircuitEditor.tsx
/**
* CircuitEditor — the authoring surface. Pick a part from the palette to drop it on
* the canvas, drag parts to lay them out, click two pins to wire them, and tune the
* selected part in the inspector. The doc solves live as you build, so the lamp lights
* and current flows while you author. Emits the CircuitDoc via `onChange`; the UI is
* themed from the host's design tokens (see editor-ui).
*/
const SNAP = 10;
const snap = (n) => Math.round(n / SNAP) * SNAP;
const emptyDoc = {
	parts: [],
	nodes: [],
	size: {
		w: 560,
		h: 300
	}
};
/** distance from point p to segment a→b. */
function segDist(p, a, b) {
	const dx = b[0] - a[0], dy = b[1] - a[1];
	const len2 = dx * dx + dy * dy;
	const t = len2 ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / len2)) : 0;
	return Math.hypot(p.x - (a[0] + t * dx), p.y - (a[1] + t * dy));
}
/** the part pin whose terminal is within `thresh` px of point `at` (nearest wins, or null). */
function pinAt(doc, at, thresh = 16) {
	let best = null, bd = thresh;
	for (const p of doc.parts) {
		const def = getPart(p.kind);
		if (!def) continue;
		for (const pin of def.pins) {
			const t = def.terminalAt(p, pin);
			const d = Math.hypot(at.x - t.x, at.y - t.y);
			if (d < bd) {
				bd = d;
				best = {
					partId: p.id,
					pin
				};
			}
		}
	}
	return best;
}
/** The full routed polyline of a wire (through its bend points), as tuples. */
function wirePts(doc, w) {
	const ta = terminalOf(doc, w.a), tb = terminalOf(doc, w.b);
	if (!ta || !tb) return [];
	return wirePolyline(ta, w.mid ?? [], tb).map((p) => [p.x, p.y]);
}
/** the wire whose routed path passes within `thresh` px of point `at` (or null). */
function wireAt(doc, at, thresh = 16) {
	let best = null, bestD = thresh;
	for (const w of doc.wires ?? []) {
		const route = wirePts(doc, w);
		for (let i = 0; i < route.length - 1; i++) {
			const d = segDist(at, route[i], route[i + 1]);
			if (d < bestD) {
				bestD = d;
				best = w.id;
			}
		}
	}
	return best;
}
/** A tiny preview of a part's own glyph for the palette (label cropped out of view). */
function PartThumb({ kind }) {
	const def = getPart(kind);
	if (!def) return null;
	const inst = {
		id: "_t",
		kind,
		at: {
			x: 40,
			y: 34
		},
		orient: "h",
		props: def.defaultProps,
		pins: {}
	};
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "6 18 68 30",
		width: 46,
		height: 20,
		"aria-hidden": true,
		style: { flexShrink: 0 },
		children: def.render(inst, {
			live: false,
			i: 0,
			v: 0,
			power: 0,
			pinV: () => 0
		})
	});
}
function CircuitEditor({ value, onChange }) {
	const doc = value ?? emptyDoc;
	const W = doc.size?.w ?? 560;
	const [selected, setSelected] = useState(null);
	const [selectedWire, setSelectedWire] = useState(null);
	const [pending, setPending] = useState(null);
	const [preview, setPreview] = useState(null);
	const [endDrag, setEndDrag] = useState(null);
	const [full, setFull] = useState(false);
	const hostRef = useRef(null);
	const docRef = useRef(doc);
	docRef.current = doc;
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const pendingRef = useRef(pending);
	pendingRef.current = pending;
	const previewRef = useRef(preview);
	previewRef.current = preview;
	const sel = doc.parts.find((p) => p.id === selected) ?? null;
	const selDef = sel ? getPart(sel.kind) : null;
	const sol = solveCircuit(doc);
	const shorted = sol.shorted.map((id) => doc.parts.find((p) => p.id === id)).filter((p) => !!p);
	const damaged = doc.parts.map((p) => ({
		p,
		st: partState(p, sol)
	})).filter((x) => !!x.st.damage);
	const place = (kind) => {
		const d = docRef.current;
		const n = d.parts.length;
		const next = addPart(d, kind, {
			x: snap(120 + n % 3 * 150),
			y: snap(80 + Math.floor(n / 3) * 90)
		});
		onChangeRef.current(next);
		setSelected(next.parts[next.parts.length - 1]?.id ?? null);
	};
	const dropAt = (kind, clientX, clientY) => {
		const host = hostRef.current;
		if (!host) {
			place(kind);
			return;
		}
		const r = host.getBoundingClientRect();
		if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) {
			place(kind);
			return;
		}
		const sc = r.width / W;
		const at = {
			x: snap((clientX - r.left) / sc),
			y: snap((clientY - r.top) / sc)
		};
		const d = docRef.current;
		const wid = wireAt(d, at);
		if (wid && kind === "node") {
			const { doc: next, pin } = tapWire(d, wid, at);
			onChangeRef.current(next);
			setSelected(pin.partId);
			return;
		}
		const next = wid ? spliceIntoWire(d, wid, kind, at) : addPart(d, kind, at);
		onChangeRef.current(next);
		setSelected(next.parts[next.parts.length - 1]?.id ?? null);
	};
	const startPaletteDrag = (kind) => {
		const up = (ev) => {
			window.removeEventListener("pointerup", up);
			dropAt(kind, ev.clientX, ev.clientY);
		};
		window.addEventListener("pointerup", up);
	};
	const toCanvas = (cx, cy) => {
		const host = hostRef.current;
		if (!host) return {
			x: 0,
			y: 0
		};
		const r = host.getBoundingClientRect();
		const scale = r.width / W;
		return {
			x: (cx - r.left) / scale,
			y: (cy - r.top) / scale
		};
	};
	useEffect(() => {
		if (!pending) {
			setPreview(null);
			return;
		}
		const move = (ev) => {
			const at = toCanvas(ev.clientX, ev.clientY);
			const d = docRef.current;
			setPreview({
				to: at,
				valid: !!pinAt(d, at) || !!wireAt(d, at)
			});
		};
		const key = (ev) => {
			if (ev.key === "Escape") setPending(null);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("keydown", key);
		return () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("keydown", key);
		};
	}, [pending]);
	/** Create the wire the user drew (a→b) carrying its routing bends. Uses addWire (not connect)
	*  so it is created even between pins already on the same net — a drawn wire never vanishes. */
	const connectWithMids = (d, a, b, mids) => addWire(d, a, b, mids);
	const handlePinClick = (from) => {
		const p = pendingRef.current;
		if (!p) {
			setPending({
				from,
				mids: []
			});
			setSelected(from.partId);
			setSelectedWire(null);
			return;
		}
		if (p.from.partId === from.partId && p.from.pin === from.pin) {
			setPending(null);
			return;
		}
		onChangeRef.current(connectWithMids(docRef.current, p.from, from, p.mids));
		setPending(null);
		setSelected(from.partId);
	};
	const beginMove = (partId, e, onClick) => {
		const part = docRef.current.parts.find((p) => p.id === partId);
		const host = hostRef.current;
		if (!part || !host) return;
		e.preventDefault();
		const scale = host.getBoundingClientRect().width / W;
		const sx = e.clientX, sy = e.clientY, ox = part.at.x, oy = part.at.y;
		let moved = false;
		const move = (ev) => {
			if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true;
			if (moved) onChangeRef.current(movePart(docRef.current, partId, {
				x: snap(ox + (ev.clientX - sx) / scale),
				y: snap(oy + (ev.clientY - sy) / scale)
			}));
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			if (!moved) onClick();
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};
	const onPartPointerDown = (partId, e) => beginMove(partId, e, () => {
		setSelected(partId);
		setSelectedWire(null);
		setPending(null);
	});
	const onPinPointerDown = (partId, pin, e) => {
		if (docRef.current.parts.find((p) => p.id === partId)?.kind === "node") {
			beginMove(partId, e, () => handlePinClick({
				partId,
				pin
			}));
			return;
		}
		e.preventDefault();
		const sx = e.clientX, sy = e.clientY;
		let moved = false;
		const move = (ev) => {
			if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true;
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			if (!moved) handlePinClick({
				partId,
				pin
			});
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};
	const onWireClick = (wireId) => {
		const p = pendingRef.current;
		if (p) {
			const at = previewRef.current?.to ?? terminalOf(docRef.current, p.from) ?? {
				x: 0,
				y: 0
			};
			const { doc: d2, pin: jp } = tapWire(docRef.current, wireId, at);
			onChangeRef.current(connectWithMids(d2, p.from, jp, p.mids));
			setPending(null);
			setSelected(jp.partId);
		} else {
			setSelectedWire(wireId);
			setSelected(null);
		}
	};
	const onBackground = (e) => {
		const p = pendingRef.current;
		if (p) {
			const at = toCanvas(e.clientX, e.clientY);
			setPending({
				from: p.from,
				mids: [...p.mids, {
					x: snap(at.x),
					y: snap(at.y)
				}]
			});
			return;
		}
		setSelected(null);
		setSelectedWire(null);
	};
	const snapPt = (p) => ({
		x: snap(p.x),
		y: snap(p.y)
	});
	const pruneCollinear = (ta, mids, tb) => {
		const anchors = [
			ta,
			...mids,
			tb
		];
		return mids.filter((m, i) => segDist(m, [anchors[i].x, anchors[i].y], [anchors[i + 2].x, anchors[i + 2].y]) > 3);
	};
	const dragBend = (wireId, startMids, index, e) => {
		e.preventDefault();
		const d0 = docRef.current;
		const w0 = (d0.wires ?? []).find((x) => x.id === wireId);
		const ta = w0 && terminalOf(d0, w0.a), tb = w0 && terminalOf(d0, w0.b);
		if (!ta || !tb) return;
		let mids = startMids;
		let moved = false;
		const move = (ev) => {
			moved = true;
			const at = snapPt(toCanvas(ev.clientX, ev.clientY));
			mids = mids.map((m, i) => i === index ? at : m);
			onChangeRef.current(setWireWaypoints(docRef.current, wireId, mids));
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			if (moved) onChangeRef.current(setWireWaypoints(docRef.current, wireId, pruneCollinear(ta, mids, tb)));
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};
	const onWireWaypointDown = (wireId, index, e) => {
		const w = (docRef.current.wires ?? []).find((x) => x.id === wireId);
		if (w?.mid) dragBend(wireId, [...w.mid], index, e);
	};
	const onWireBodyDown = (wireId, e) => {
		const d = docRef.current;
		const w = (d.wires ?? []).find((x) => x.id === wireId);
		const ta = w && terminalOf(d, w.a), tb = w && terminalOf(d, w.b);
		if (!w || !ta || !tb) return;
		const at = toCanvas(e.clientX, e.clientY);
		const mids = [...w.mid ?? []];
		let idx = mids.findIndex((m) => Math.hypot(at.x - m.x, at.y - m.y) < 10);
		if (idx < 0) {
			const anchors = [
				ta,
				...mids,
				tb
			];
			let seg = 0, sd = Infinity;
			for (let i = 0; i < anchors.length - 1; i++) {
				const dd = segDist(at, [anchors[i].x, anchors[i].y], [anchors[i + 1].x, anchors[i + 1].y]);
				if (dd < sd) {
					sd = dd;
					seg = i;
				}
			}
			mids.splice(seg, 0, snapPt(at));
			idx = seg;
		}
		dragBend(wireId, mids, idx, e);
	};
	const onWireEndDown = (wireId, end, e) => {
		const d0 = docRef.current;
		const w = (d0.wires ?? []).find((x) => x.id === wireId);
		if (!w) return;
		e.preventDefault();
		const fixedPos = terminalOf(d0, end === "a" ? w.b : w.a) ?? {
			x: 0,
			y: 0
		};
		setEndDrag({
			fixedPos,
			to: fixedPos,
			valid: false
		});
		let moved = false, last = fixedPos;
		const move = (ev) => {
			moved = true;
			const at = toCanvas(ev.clientX, ev.clientY);
			last = at;
			setEndDrag({
				fixedPos,
				to: at,
				valid: !!pinAt(docRef.current, at) || !!wireAt(docRef.current, at)
			});
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			setEndDrag(null);
			if (!moved) return;
			const pin = pinAt(docRef.current, last);
			if (pin) {
				onChangeRef.current(retargetWire(docRef.current, wireId, end, pin));
				return;
			}
			const wid = wireAt(docRef.current, last);
			if (wid && wid !== wireId) {
				const { doc: d2, pin: jp } = tapWire(docRef.current, wid, last);
				onChangeRef.current(retargetWire(d2, wireId, end, jp));
				return;
			}
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};
	const set = (patch) => {
		if (sel) onChange(updateProps(doc, sel.id, patch));
	};
	return /* @__PURE__ */ jsxs("div", {
		style: full ? {
			position: "fixed",
			inset: 0,
			zIndex: 60,
			background: "var(--background, #fff)",
			padding: 18,
			overflow: "auto",
			display: "grid",
			gridTemplateColumns: "180px 1fr 264px",
			gap: 16,
			alignItems: "start"
		} : {
			display: "grid",
			gridTemplateColumns: "172px 1fr 244px",
			gap: 14,
			alignItems: "start"
		},
		children: [
			/* @__PURE__ */ jsx(Panel, {
				title: "Parts",
				children: /* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 4
					},
					children: listParts().map((d) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onPointerDown: () => startPaletteDrag(d.kind),
						title: `add ${d.label} — or drag onto a wire to splice it in`,
						style: {
							display: "flex",
							alignItems: "center",
							gap: 10,
							width: "100%",
							textAlign: "left",
							padding: "7px 9px",
							fontSize: 13,
							fontWeight: 600,
							color: "var(--foreground, #1c1c1c)",
							background: "transparent",
							border: "1px solid transparent",
							borderRadius: "calc(var(--radius, 0.6rem) - 2px)",
							cursor: "pointer"
						},
						onMouseEnter: (e) => {
							e.currentTarget.style.background = "var(--accent, #f1f1f3)";
							e.currentTarget.style.borderColor = "var(--border, #e4e4e7)";
						},
						onMouseLeave: (e) => {
							e.currentTarget.style.background = "transparent";
							e.currentTarget.style.borderColor = "transparent";
						},
						children: [
							/* @__PURE__ */ jsx(PartThumb, { kind: d.kind }),
							/* @__PURE__ */ jsx("span", {
								style: { flex: 1 },
								children: d.label
							}),
							/* @__PURE__ */ jsx("span", {
								style: {
									color: "var(--muted-foreground, #999)",
									fontSize: 15,
									lineHeight: 1
								},
								children: "+"
							})
						]
					}, d.kind))
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 8
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 10,
							fontSize: 12,
							color: "var(--muted-foreground, #777)"
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: { flex: 1 },
							children: pending ? "Click another pin to finish the wire (or a wire to branch off it). Click empty space to drop a bend and keep routing. Press Esc to cancel." : "Click a pin dot to start a wire, then click another pin to finish (no need to hold). Drag a part or junction to move it. Click a wire to select it (delete it in the inspector)."
						}), /* @__PURE__ */ jsx(EBtn, {
							variant: "ghost",
							onClick: () => setFull((f) => !f),
							children: full ? "⤡ exit fullscreen" : "⤢ fullscreen"
						})]
					}),
					shorted.length > 0 && /* @__PURE__ */ jsxs("div", {
						role: "alert",
						style: {
							fontSize: 12.5,
							lineHeight: 1.4,
							padding: "8px 11px",
							borderRadius: "var(--radius, 8px)",
							color: "var(--destructive-foreground, #fff)",
							background: "var(--destructive, oklch(0.58 0.22 27))"
						},
						children: [
							"⚠ Short circuit: ",
							shorted.map((p) => getPart(p.kind)?.label ?? p.kind).join(", "),
							" ",
							shorted.length > 1 ? "have" : "has",
							" both terminals on the same net. To clear it: select the part and un-ground a terminal (the ⏚ grounded button), or click the shorting wire to delete it. A source needs a component (bulb, resistor) in the loop between + and −."
						]
					}),
					damaged.length > 0 && /* @__PURE__ */ jsxs("div", {
						role: "alert",
						style: {
							fontSize: 12.5,
							lineHeight: 1.4,
							padding: "8px 11px",
							borderRadius: "var(--radius, 8px)",
							color: "var(--destructive-foreground, #fff)",
							background: "var(--destructive, oklch(0.58 0.22 27))"
						},
						children: [
							"🔥 Overload: ",
							damaged.map((d) => `${getPart(d.p.kind)?.label ?? d.p.kind} (${d.st.damage === "overvoltage" ? `${Math.abs(d.st.v).toFixed(1)} V across` : `${d.st.power.toFixed(2)} W`})`).join(", "),
							" ",
							damaged.length > 1 ? "exceed their ratings" : "exceeds its rating",
							" and would burn out. Lower the supply voltage, raise the resistance, or increase the part's rating in the inspector."
						]
					}),
					/* @__PURE__ */ jsx("div", {
						ref: hostRef,
						style: { touchAction: "none" },
						children: /* @__PURE__ */ jsx(CircuitScene, {
							doc,
							ariaLabel: "circuit editor canvas",
							selectedId: selected ?? void 0,
							editor: {
								showPins: true,
								onPinPointerDown,
								onSelect: (id) => {
									setSelected(id);
									setSelectedWire(null);
								},
								onPartPointerDown,
								onBackground,
								onWireClick,
								selectedWireId: selectedWire ?? void 0,
								onWireBodyDown,
								onWireWaypointDown,
								onWireEndDown,
								wirePreview: endDrag ? {
									from: endDrag.fixedPos,
									to: endDrag.to,
									valid: endDrag.valid
								} : pending && preview ? {
									from: terminalOf(doc, pending.from) ?? preview.to,
									mids: pending.mids,
									to: preview.to,
									valid: preview.valid
								} : void 0
							}
						})
					})
				]
			}),
			/* @__PURE__ */ jsx(Panel, {
				title: "Inspector",
				children: selectedWire ? /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 12
					},
					children: [
						/* @__PURE__ */ jsx("span", {
							style: {
								fontSize: 14,
								fontWeight: 700,
								color: "var(--foreground, #1c1c1c)"
							},
							children: "Wire"
						}),
						/* @__PURE__ */ jsx("div", {
							style: {
								fontSize: 13,
								color: "var(--muted-foreground, #777)",
								lineHeight: 1.5
							},
							children: "Drag the wire (or a square bend handle) to position its path. Drag an end ring off its pin to detach / re-attach it. Drag a bend onto the straight line to remove it."
						}),
						/* @__PURE__ */ jsx(EBtn, {
							variant: "danger",
							title: "delete wire",
							onClick: () => {
								onChange(disconnectWire(doc, selectedWire));
								setSelectedWire(null);
							},
							children: "🗑 delete wire"
						})
					]
				}) : !sel || !selDef ? /* @__PURE__ */ jsx("div", {
					style: {
						fontSize: 13,
						color: "var(--muted-foreground, #777)",
						lineHeight: 1.5
					},
					children: "Select a part or wire on the canvas to edit it, or add a part from the palette."
				}) : /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 14
					},
					children: [
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 10
							},
							children: [/* @__PURE__ */ jsx(PartThumb, { kind: sel.kind }), /* @__PURE__ */ jsx("span", {
								style: {
									fontSize: 14,
									fontWeight: 700,
									color: "var(--foreground, #1c1c1c)"
								},
								children: selDef.label
							})]
						}),
						(selDef.controls?.length || Object.keys(selDef.defaultProps ?? {}).length > 0) && /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: 9
							},
							children: [selDef.controls?.map((c) => {
								const cur = Number(sel.props?.[c.key] ?? selDef.defaultProps?.[c.key] ?? 0);
								const clamp = (v) => Math.min(c.max ?? Infinity, Math.max(c.min ?? -Infinity, v));
								return /* @__PURE__ */ jsx(Field, {
									label: c.unit ? `${c.label} (${c.unit})` : c.label,
									children: /* @__PURE__ */ jsx(NumInput, {
										value: cur,
										onChange: (v) => set({ [c.key]: clamp(v) }),
										step: c.step ?? 1,
										min: c.min,
										ariaLabel: c.label
									})
								}, c.key);
							}), Object.entries(selDef.defaultProps ?? {}).filter(([key]) => !selDef.controls?.some((c) => c.key === key)).map(([key, dflt]) => {
								const cur = sel.props?.[key] ?? dflt;
								if (typeof dflt === "boolean") return /* @__PURE__ */ jsx(Field, {
									label: key,
									children: /* @__PURE__ */ jsx("input", {
										type: "checkbox",
										checked: !!cur,
										onChange: (e) => set({ [key]: e.target.checked }),
										"aria-label": key
									})
								}, key);
								if (typeof dflt === "string") return /* @__PURE__ */ jsx(Field, {
									label: key,
									children: /* @__PURE__ */ jsx(TextInput, {
										value: String(cur),
										onChange: (v) => set({ [key]: v }),
										ariaLabel: key
									})
								}, key);
								return /* @__PURE__ */ jsx(Field, {
									label: key,
									children: /* @__PURE__ */ jsx(NumInput, {
										value: Number(cur),
										onChange: (v) => set({ [key]: v }),
										step: key === "k" || key === "farads" ? .1 : 1,
										ariaLabel: key
									})
								}, key);
							})]
						}),
						/* @__PURE__ */ jsx("div", { style: {
							height: 1,
							background: "var(--border, #e4e4e7)"
						} }),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: 8
							},
							children: [/* @__PURE__ */ jsx("span", {
								style: {
									fontSize: 10.5,
									fontWeight: 700,
									letterSpacing: "0.04em",
									textTransform: "uppercase",
									color: "var(--muted-foreground, #999)"
								},
								children: "Ground"
							}), /* @__PURE__ */ jsx("div", {
								style: {
									display: "flex",
									gap: 6,
									flexWrap: "wrap"
								},
								children: selDef.pins.map((pin) => {
									const grounded = sel.props && sel.pins[pin] === "gnd";
									return /* @__PURE__ */ jsxs(EBtn, {
										active: !!grounded,
										title: grounded ? `disconnect ${pin} from ground` : `tie ${pin} to ground`,
										onClick: () => onChange(setGround(doc, {
											partId: sel.id,
											pin
										})),
										children: [
											pin,
											" ",
											grounded ? "⏚" : "→ gnd"
										]
									}, pin);
								})
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								gap: 6,
								flexWrap: "wrap"
							},
							children: [/* @__PURE__ */ jsx(EBtn, {
								variant: "ghost",
								title: "rotate 90°",
								onClick: () => onChange(rotatePart(doc, sel.id)),
								children: "⟳ rotate"
							}), /* @__PURE__ */ jsx(EBtn, {
								variant: "danger",
								title: "delete part",
								onClick: () => {
									onChange(deletePart(doc, sel.id));
									setSelected(null);
								},
								children: "🗑 delete"
							})]
						})
					]
				})
			})
		]
	});
}

//#endregion
export { CircuitEditor };