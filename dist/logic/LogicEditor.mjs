'use client';

import { GateGlyph } from "../kit/logic-gates.mjs";
import { EBtn, Field, Panel, TextInput } from "../build/editor-ui.mjs";
import { listGates } from "./registry.mjs";
import { LogicEditScene } from "./LogicEditScene.mjs";
import { addNode, connect, deleteNode, disconnect, moveNode, relabel, setGoal, toggleInput } from "./edit-ops.mjs";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/logic/LogicEditor.tsx
/**
* LogicEditor — the drag-and-drop digital-logic canvas (the gate-circuit counterpart of the
* analog CircuitEditor, reusing its editor-UI kit and click-vs-drag interaction). Drop a
* source, an LED, or any gate from the palette; drag nodes to lay them out; click an OUTPUT
* dot then an INPUT slot to wire them; toggle a source by clicking it. The doc evaluates live,
* so wires glow and LEDs light as you build. Emits the LogicDoc via `onChange`.
*/
const SNAP = 10;
const snap = (n) => Math.round(n / SNAP) * SNAP;
const emptyDoc = {
	inputs: [],
	gates: [],
	outputs: [],
	size: {
		w: 640,
		h: 360
	}
};
function PaletteThumb({ glyph }) {
	if (!glyph) return /* @__PURE__ */ jsx("span", {
		style: {
			width: 30,
			textAlign: "center",
			fontSize: 16
		},
		"aria-hidden": true,
		children: "●"
	});
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "0 0 34 34",
		width: 30,
		height: 22,
		"aria-hidden": true,
		style: { flexShrink: 0 },
		children: /* @__PURE__ */ jsx(GateGlyph, {
			x: 2,
			y: 2,
			size: 30,
			type: glyph
		})
	});
}
function LogicEditor({ value, onChange }) {
	const doc = value ?? emptyDoc;
	const W = doc.size?.w ?? 640;
	const [selected, setSelected] = useState(null);
	const [wireStart, setWireStart] = useState(null);
	const [cursor, setCursor] = useState(null);
	const [full, setFull] = useState(false);
	const hostRef = useRef(null);
	const docRef = useRef(doc);
	docRef.current = doc;
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const wireRef = useRef(wireStart);
	wireRef.current = wireStart;
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
		if (!wireStart) {
			setCursor(null);
			return;
		}
		const move = (ev) => setCursor(toCanvas(ev.clientX, ev.clientY));
		const key = (ev) => {
			if (ev.key === "Escape") setWireStart(null);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("keydown", key);
		return () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("keydown", key);
		};
	}, [wireStart]);
	const palette = [
		{
			kind: "input",
			label: "Source (switch)"
		},
		...listGates().map((g) => ({
			kind: g.kind,
			label: g.label,
			glyph: g.glyph
		})),
		{
			kind: "output",
			label: "LED (output)"
		}
	];
	const sel = [
		...doc.inputs,
		...doc.gates,
		...doc.outputs
	].find((n) => n.id === selected) ?? null;
	const selKind = !sel ? null : doc.inputs.some((n) => n.id === sel.id) ? "input" : doc.gates.some((n) => n.id === sel.id) ? "gate" : "output";
	const selOutput = selKind === "output" ? doc.outputs.find((o) => o.id === sel.id) ?? null : null;
	const selInput = selKind === "input" ? doc.inputs.find((i) => i.id === sel.id) ?? null : null;
	const place = (kind, at) => {
		const { doc: next, id } = addNode(docRef.current, kind, at);
		onChangeRef.current(next);
		setSelected(id);
	};
	const dropAt = (kind, clientX, clientY) => {
		const host = hostRef.current;
		const n = docRef.current.gates.length + docRef.current.inputs.length;
		const fallback = {
			x: snap(120 + n % 3 * 140),
			y: snap(70 + Math.floor(n / 3) * 80)
		};
		if (!host) return place(kind, fallback);
		const r = host.getBoundingClientRect();
		if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return place(kind, fallback);
		const sc = r.width / W;
		place(kind, {
			x: snap((clientX - r.left) / sc),
			y: snap((clientY - r.top) / sc)
		});
	};
	const startPaletteDrag = (kind) => {
		const up = (ev) => {
			window.removeEventListener("pointerup", up);
			dropAt(kind, ev.clientX, ev.clientY);
		};
		window.addEventListener("pointerup", up);
	};
	const portClick = (ref) => {
		if (ref.dir === "out") {
			setWireStart((prev) => prev && prev.nodeId === ref.nodeId ? null : ref);
			return;
		}
		const start = wireRef.current;
		if (start) {
			onChangeRef.current(connect(docRef.current, start.nodeId, {
				nodeId: ref.nodeId,
				slot: ref.slot
			}));
			setWireStart(null);
		} else onChangeRef.current(disconnect(docRef.current, {
			nodeId: ref.nodeId,
			slot: ref.slot
		}));
	};
	const nodeClick = (id) => {
		setSelected(id);
		if (docRef.current.inputs.some((i) => i.id === id)) onChangeRef.current(toggleInput(docRef.current, id));
	};
	const beginDrag = (id, e, onClick) => {
		const node = [
			...docRef.current.inputs,
			...docRef.current.gates,
			...docRef.current.outputs
		].find((n) => n.id === id);
		const host = hostRef.current;
		if (!node || !host) return;
		e.preventDefault();
		const scale = host.getBoundingClientRect().width / W;
		const sx = e.clientX, sy = e.clientY, ox = node.x ?? 0, oy = node.y ?? 0;
		let moved = false;
		const move = (ev) => {
			if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) {
				moved = true;
				setSelected(id);
			}
			if (moved) onChangeRef.current(moveNode(docRef.current, id, {
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
	const onNodePointerDown = (id, e) => beginDrag(id, e, () => nodeClick(id));
	const onPortPointerDown = (ref, e) => beginDrag(ref.nodeId, e, () => portClick(ref));
	return /* @__PURE__ */ jsxs("div", {
		style: full ? {
			position: "fixed",
			inset: 0,
			zIndex: 60,
			background: "var(--background, #fff)",
			padding: 18,
			overflow: "auto",
			display: "grid",
			gridTemplateColumns: "188px 1fr 240px",
			gap: 16,
			alignItems: "start"
		} : {
			display: "grid",
			gridTemplateColumns: "180px 1fr 224px",
			gap: 14,
			alignItems: "start"
		},
		children: [
			/* @__PURE__ */ jsx(Panel, {
				title: "Add",
				children: /* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 4
					},
					children: palette.map((it) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onPointerDown: () => startPaletteDrag(it.kind),
						title: `add ${it.label} (or drag onto the canvas)`,
						style: {
							display: "flex",
							alignItems: "center",
							gap: 9,
							width: "100%",
							textAlign: "left",
							padding: "6px 9px",
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
							/* @__PURE__ */ jsx(PaletteThumb, { glyph: it.glyph }),
							/* @__PURE__ */ jsx("span", {
								style: { flex: 1 },
								children: it.label
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
					}, it.kind))
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 8
				},
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 10,
						fontSize: 12,
						color: "var(--muted-foreground, #777)"
					},
					children: [
						/* @__PURE__ */ jsx("span", {
							style: { flex: 1 },
							children: wireStart ? "Now click an input slot to connect (the wire follows your cursor). Press Esc or click empty space to cancel." : "Drag to arrange. Wire: click an output dot ● then an input slot. Click a source to flip it. Click a filled input slot to unwire it."
						}),
						wireStart && /* @__PURE__ */ jsx(EBtn, {
							variant: "ghost",
							onClick: () => setWireStart(null),
							children: "cancel wire"
						}),
						/* @__PURE__ */ jsx(EBtn, {
							variant: "ghost",
							onClick: () => setFull((f) => !f),
							children: full ? "⤡ exit fullscreen" : "⤢ fullscreen"
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					ref: hostRef,
					children: /* @__PURE__ */ jsx(LogicEditScene, {
						doc,
						selectedId: selected ?? void 0,
						wireStart: wireStart ?? void 0,
						previewCursor: wireStart ? cursor ?? void 0 : void 0,
						onNodePointerDown,
						onPortPointerDown,
						onBackground: () => {
							setSelected(null);
							setWireStart(null);
						},
						ariaLabel: "logic circuit builder canvas"
					})
				})]
			}),
			/* @__PURE__ */ jsx(Panel, {
				title: "Inspector",
				children: !sel ? /* @__PURE__ */ jsx("div", {
					style: {
						fontSize: 13,
						color: "var(--muted-foreground, #777)",
						lineHeight: 1.5
					},
					children: "Select a node to edit it, or add one from the palette."
				}) : /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 12
					},
					children: [
						/* @__PURE__ */ jsx(Field, {
							label: "label",
							children: /* @__PURE__ */ jsx(TextInput, {
								value: sel.label ?? "",
								onChange: (v) => onChange(relabel(doc, sel.id, v)),
								ariaLabel: "node label"
							})
						}),
						selInput && /* @__PURE__ */ jsx(Field, {
							label: "value",
							children: /* @__PURE__ */ jsx(EBtn, {
								active: !!selInput.value,
								onClick: () => onChange(toggleInput(doc, sel.id)),
								children: selInput.value ? "1 (HIGH)" : "0 (LOW)"
							})
						}),
						selOutput && /* @__PURE__ */ jsxs("div", {
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
								children: "Goal (this LED)"
							}), /* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									gap: 6,
									flexWrap: "wrap"
								},
								children: [
									/* @__PURE__ */ jsx(EBtn, {
										active: selOutput.goal === void 0,
										onClick: () => onChange(setGoal(doc, sel.id, void 0)),
										children: "none"
									}),
									/* @__PURE__ */ jsx(EBtn, {
										active: selOutput.goal === false,
										onClick: () => onChange(setGoal(doc, sel.id, false)),
										children: "want 0"
									}),
									/* @__PURE__ */ jsx(EBtn, {
										active: selOutput.goal === true,
										onClick: () => onChange(setGoal(doc, sel.id, true)),
										children: "want 1"
									})
								]
							})]
						}),
						/* @__PURE__ */ jsx("div", { style: {
							height: 1,
							background: "var(--border, #e4e4e7)"
						} }),
						/* @__PURE__ */ jsx(EBtn, {
							variant: "danger",
							title: "delete node",
							onClick: () => {
								onChange(deleteNode(doc, sel.id));
								setSelected(null);
							},
							children: "🗑 delete"
						})
					]
				})
			})
		]
	});
}

//#endregion
export { LogicEditor };