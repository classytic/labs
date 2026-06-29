'use client';

import { Chip } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { GateGlyph, Lamp, ToggleSwitch, gatePorts } from "../../kit/logic-gates.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/logic-circuit/preset.tsx
/**
* BooleanCircuitLab, the GENERAL "build something real with logic gates" tool.
* A creator declares a NETLIST (input switches, typed gates wired by id, output
* devices = LEDs/lamps); the learner flips switches and watches power flow
* through the gates and LIGHT the outputs. One tool → any combinational circuit:
* a light wired through an AND, a staircase XOR switch, a half-adder's two LEDs.
*
* Auto-layout by gate depth (inputs left → gates by level → devices right), wires
* as smooth beziers that GLOW + animate when carrying a 1. Signal truth comes
* from the same boolean semantics as the stage logic kernel. Mobile-responsive
* SVG (viewBox scales to the container); switches are big tap targets. Optional
* per-output `goal` makes it a puzzle ("light the lamp") graded by useCheckpoint.
*/
const GS = 46;
const SW = 50, SH = 26;
const LR = 17;
const COL = 118, ROW = 78, MARGIN = 30;
function gateEval(type, ins) {
	const a = ins[0] ?? false, b = ins[1] ?? false;
	switch (type) {
		case "AND": return a && b;
		case "OR": return a || b;
		case "NOT": return !a;
		case "NAND": return !(a && b);
		case "NOR": return !(a || b);
		case "XOR": return a !== b;
		case "XNOR": return a === b;
	}
}
function BooleanCircuitLab({ inputs: inputs0, gates, outputs, initial, title = "Logic circuit", prompt, objectives, hints: hintList, controlId, height = 320 }) {
	const inputs = useMemo(() => inputs0.map((i) => typeof i === "string" ? { id: i } : i), [inputs0]);
	const gateById = useMemo(() => new Map(gates.map((g) => [g.id, g])), [gates]);
	const inputIds = useMemo(() => new Set(inputs.map((i) => i.id)), [inputs]);
	const [state, setState] = useState(() => Object.fromEntries(inputs.map((i) => [i.id, initial?.[i.id] ?? false])));
	const hints = useHints(hintList);
	const values = useMemo(() => {
		const v = /* @__PURE__ */ new Map();
		const inProgress = /* @__PURE__ */ new Set();
		const val = (id) => {
			if (v.has(id)) return v.get(id);
			if (inputIds.has(id)) {
				const b = state[id] ?? false;
				v.set(id, b);
				return b;
			}
			if (inProgress.has(id)) return false;
			const g = gateById.get(id);
			if (!g) return false;
			inProgress.add(id);
			const out = gateEval(g.type, g.in.map(val));
			inProgress.delete(id);
			v.set(id, out);
			return out;
		};
		inputs.forEach((i) => val(i.id));
		gates.forEach((g) => val(g.id));
		return v;
	}, [
		state,
		inputs,
		gates,
		gateById,
		inputIds
	]);
	const layout = useMemo(() => {
		const depthMemo = /* @__PURE__ */ new Map();
		const inProg = /* @__PURE__ */ new Set();
		const depth = (id) => {
			if (inputIds.has(id)) return 0;
			if (depthMemo.has(id)) return depthMemo.get(id);
			if (inProg.has(id)) return 1;
			const g = gateById.get(id);
			if (!g) return 0;
			inProg.add(id);
			const d = 1 + Math.max(0, ...g.in.map(depth));
			inProg.delete(id);
			depthMemo.set(id, d);
			return d;
		};
		const outCol = (gates.length ? Math.max(...gates.map((g) => depth(g.id))) : 0) + 1;
		const cols = Array.from({ length: outCol + 1 }, () => []);
		inputs.forEach((i) => cols[0].push(i.id));
		gates.forEach((g) => cols[depth(g.id)].push(g.id));
		outputs.forEach((o) => cols[outCol].push(`out:${o.id}`));
		const pos = /* @__PURE__ */ new Map();
		const maxRows = Math.max(1, ...cols.map((c) => c.length));
		cols.forEach((col, ci) => {
			const x = MARGIN + ci * COL;
			const offset = (maxRows - col.length) / 2;
			col.forEach((id, ri) => pos.set(id, {
				x,
				y: MARGIN + (offset + ri) * ROW
			}));
		});
		return {
			pos,
			vbW: MARGIN * 2 + outCol * COL + GS + 30,
			vbH: MARGIN * 2 + maxRows * ROW,
			outCol
		};
	}, [
		inputs,
		gates,
		outputs,
		gateById,
		inputIds
	]);
	const outPoint = (id) => {
		const p = layout.pos.get(id);
		if (inputIds.has(id)) return {
			x: p.x + SW,
			y: p.y + SH / 2
		};
		return gatePorts(gateById.get(id).type, p.x, p.y, GS).output;
	};
	const wirePath = (s, t) => {
		const dx = Math.max(26, (t.x - s.x) * .45);
		return `M${s.x},${s.y} C${s.x + dx},${s.y} ${t.x - dx},${t.y} ${t.x},${t.y}`;
	};
	const goals = outputs.filter((o) => o.goal);
	const solved = goals.length > 0 && goals.every((o) => values.get(o.in));
	useCheckpoint({
		solved,
		activity: `logic-circuit:${title}`,
		hintsUsed: hints.count
	});
	const toggle = (id) => setState((s) => ({
		...s,
		[id]: !s[id]
	}));
	const reset = () => setState(Object.fromEntries(inputs.map((i) => [i.id, false])));
	useControlSurface(controlId, {
		...Object.fromEntries(inputs.map((i) => [`in_${i.id}`, {
			type: "boolean",
			label: `switch ${i.label ?? i.id}`,
			get: () => state[i.id] ?? false,
			set: (v) => setState((s) => ({
				...s,
				[i.id]: v
			}))
		}])),
		reset: {
			type: "action",
			label: "all switches off",
			invoke: reset
		}
	});
	const wires = [];
	gates.forEach((g) => {
		const ports = gatePorts(g.type, layout.pos.get(g.id).x, layout.pos.get(g.id).y, GS);
		g.in.forEach((src, k) => {
			if (ports.inputs[k]) wires.push({
				from: src,
				to: ports.inputs[k],
				live: values.get(src) ?? false,
				key: `${g.id}-${k}`
			});
		});
	});
	outputs.forEach((o) => {
		const p = layout.pos.get(`out:${o.id}`);
		wires.push({
			from: o.in,
			to: {
				x: p.x + 6,
				y: p.y + GS / 2
			},
			live: values.get(o.in) ?? false,
			key: `out-${o.id}`
		});
	});
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 8
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${layout.vbW} ${layout.vbH}`,
			style: {
				width: "100%",
				maxWidth: layout.vbW,
				height: "auto",
				display: "block",
				margin: "0 auto",
				maxHeight: height,
				touchAction: "manipulation"
			},
			role: "img",
			"aria-label": `Logic circuit; ${outputs.map((o) => `${o.label ?? o.id} is ${values.get(o.in) ? "on" : "off"}`).join(", ")}`,
			children: [
				wires.map((w) => /* @__PURE__ */ jsx("path", {
					d: wirePath(outPoint(w.from), w.to),
					fill: "none",
					stroke: w.live ? "var(--stage-live)" : "var(--stage-wire)",
					strokeWidth: w.live ? 3 : 2,
					strokeLinecap: "round",
					className: w.live ? "lc-wire-live" : void 0,
					opacity: w.live ? 1 : .55
				}, w.key)),
				gates.map((g) => {
					const p = layout.pos.get(g.id);
					return /* @__PURE__ */ jsx(GateGlyph, {
						x: p.x,
						y: p.y,
						size: GS,
						type: g.type,
						live: values.get(g.id),
						label: g.type
					}, g.id);
				}),
				inputs.map((i) => {
					const p = layout.pos.get(i.id);
					const on = state[i.id] ?? false;
					return /* @__PURE__ */ jsxs("g", {
						onClick: () => toggle(i.id),
						style: { cursor: "pointer" },
						role: "button",
						"aria-pressed": on,
						"aria-label": `switch ${i.label ?? i.id}`,
						children: [/* @__PURE__ */ jsx("rect", {
							x: p.x - 6,
							y: p.y - 16,
							width: 62,
							height: 48,
							fill: "transparent"
						}), /* @__PURE__ */ jsx(ToggleSwitch, {
							x: p.x,
							y: p.y,
							w: SW,
							h: SH,
							on,
							label: i.label ?? i.id
						})]
					}, i.id);
				}),
				outputs.map((o) => {
					const p = layout.pos.get(`out:${o.id}`);
					const on = values.get(o.in) ?? false;
					return /* @__PURE__ */ jsx(Lamp, {
						cx: p.x + LR + 10,
						cy: p.y + GS / 2,
						r: LR,
						on,
						color: o.color,
						label: o.label ?? o.id
					}, o.id);
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "all off"
			}),
			outputs.map((o) => /* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 700,
					color: values.get(o.in) ? "var(--stage-good)" : "var(--stage-muted)"
				},
				children: [
					o.label ?? o.id,
					": ",
					values.get(o.in) ? "ON" : "off"
				]
			}, o.id)),
			goals.length > 0 && solved && /* @__PURE__ */ jsx("span", {
				className: "lab-pill",
				"data-state": "ok",
				children: "✓ lit!"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [goals.length > 0 && /* @__PURE__ */ jsx(RevealSolution, {
			available: !solved,
			buttonLabel: "Stuck? hint",
			solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				"Flip the switches so the gate(s) output a 1 into ",
				/* @__PURE__ */ jsx("b", { children: goals.map((g) => g.label ?? g.id).join(", ") }),
				"."
			] }),
			onReveal: () => {},
			note: "Try each switch combination, the wires glow when they carry a 1."
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { BooleanCircuitLab };