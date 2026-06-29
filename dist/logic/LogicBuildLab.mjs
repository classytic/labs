'use client';

import { LabFrame } from "../kit/frame.mjs";
import { useCheckpoint } from "../kit/pedagogy.mjs";
import { evaluate } from "./evaluate.mjs";
import { presetDoc } from "./presets.mjs";
import { LogicEditor } from "./LogicEditor.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/logic/LogicBuildLab.tsx
/**
* LogicBuildLab — a build-your-own-circuit activity on top of LogicEditor. In sandbox mode it
* is an open canvas (build, wire, play, watch the signal glow). Given a `goal` (a reference
* LogicDoc or a preset key) it becomes a graded DLD task: the target truth table is shown, the
* learner wires gates, and the checkpoint fires when their circuit reproduces every target
* output column (matched by label, over every input combination). The seed canvas starts with
* the right switches and LEDs so the learner only has to wire the logic.
*/
const SIZE = {
	w: 640,
	h: 360
};
const labelOf = (n) => n.label ?? n.id;
/** The column of `outputLabel` over every combination of `inputLabels` (given order); null if missing. */
function columnByLabels(doc, inputLabels, outputLabel) {
	const idFor = inputLabels.map((lab) => doc.inputs.find((i) => labelOf(i) === lab)?.id);
	if (idFor.some((id) => !id)) return null;
	const out = doc.outputs.find((o) => labelOf(o) === outputLabel);
	if (!out) return null;
	const n = inputLabels.length;
	if (n > 12) return null;
	const col = [];
	for (let m = 0; m < 2 ** n; m++) {
		const setVals = new Map(idFor.map((id, k) => [id, Boolean(m >> n - 1 - k & 1)]));
		const probe = {
			...doc,
			inputs: doc.inputs.map((i) => setVals.has(i.id) ? {
				...i,
				value: setVals.get(i.id)
			} : i)
		};
		col.push(evaluate(probe).outputs[out.id] ?? false);
	}
	return col;
}
const eqCol = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);
/** Seed a starting canvas from the goal: its switches + empty LEDs, so the learner just wires gates. */
function seedFromGoal(goalDoc) {
	return {
		size: SIZE,
		inputs: goalDoc.inputs.map((inp, i) => ({
			id: `in${i + 1}`,
			label: labelOf(inp),
			value: false,
			x: 40,
			y: 36 + i * 58
		})),
		gates: [],
		outputs: goalDoc.outputs.map((o, i) => ({
			id: `out${i + 1}`,
			in: "",
			label: labelOf(o),
			x: SIZE.w - 76,
			y: 56 + i * 72
		}))
	};
}
function LogicBuildLab({ doc: doc0, goal, title = "Build the circuit", prompt, activity = "logic-build" } = {}) {
	const goalDoc = goal === void 0 ? null : typeof goal === "string" ? presetDoc(goal) : goal;
	const [doc, setDoc] = useState(() => doc0 ?? (goalDoc ? seedFromGoal(goalDoc) : {
		size: SIZE,
		inputs: [],
		gates: [],
		outputs: []
	}));
	const inputLabels = goalDoc ? goalDoc.inputs.map(labelOf) : [];
	const targets = goalDoc ? goalDoc.outputs.map((o) => ({
		label: labelOf(o),
		col: columnByLabels(goalDoc, inputLabels, labelOf(o))
	})) : [];
	const matchedSame = goalDoc ? doc.inputs.length === goalDoc.inputs.length : false;
	const perOutput = targets.map((t) => ({
		label: t.label,
		ok: matchedSame && eqCol(columnByLabels(doc, inputLabels, t.label), t.col)
	}));
	const solved = !!goalDoc && perOutput.length > 0 && perOutput.every((p) => p.ok);
	useCheckpoint({
		solved,
		activity
	});
	const targetTable = goalDoc ? /* @__PURE__ */ jsx("div", {
		style: { overflowX: "auto" },
		children: /* @__PURE__ */ jsxs("table", {
			style: {
				borderCollapse: "collapse",
				fontSize: 12,
				fontVariantNumeric: "tabular-nums"
			},
			children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [inputLabels.map((l) => /* @__PURE__ */ jsx("th", {
				style: {
					padding: "3px 7px",
					color: "var(--stage-fg)",
					borderBottom: "1px solid var(--stage-grid)"
				},
				children: l
			}, l)), perOutput.map((p) => /* @__PURE__ */ jsxs("th", {
				style: {
					padding: "3px 7px",
					color: p.ok ? "var(--stage-good)" : "var(--stage-accent)",
					borderBottom: "1px solid var(--stage-grid)"
				},
				children: [p.label, p.ok ? " ✓" : ""]
			}, p.label))] }) }), /* @__PURE__ */ jsx("tbody", { children: Array.from({ length: 1 << inputLabels.length }, (_, m) => /* @__PURE__ */ jsxs("tr", { children: [inputLabels.map((_l, k) => /* @__PURE__ */ jsx("td", {
				style: {
					padding: "3px 7px",
					textAlign: "center",
					color: "var(--stage-muted)"
				},
				children: m >> inputLabels.length - 1 - k & 1
			}, k)), targets.map((t) => /* @__PURE__ */ jsx("td", {
				style: {
					padding: "3px 7px",
					textAlign: "center",
					fontWeight: 700,
					color: t.col?.[m] ? "var(--stage-good)" : "var(--stage-fg)"
				},
				children: t.col?.[m] ? 1 : 0
			}, t.label))] }, m)) })]
		})
	}) : null;
	return /* @__PURE__ */ jsxs(LabFrame, {
		title,
		prompt: prompt ?? (goalDoc ? "Drag gates from the palette and wire them so each LED follows the target column for every input." : "Build any circuit: drop sources, gates, and LEDs, wire them up, and flip the switches to watch the signal flow."),
		children: [goalDoc && /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexWrap: "wrap",
				gap: 16,
				alignItems: "flex-start",
				marginBottom: 14
			},
			children: [/* @__PURE__ */ jsx("div", {
				className: "lab-pill",
				"data-state": solved ? "ok" : "no",
				role: "status",
				children: solved ? "✓ your circuit matches the target" : "wire gates so each output matches its column"
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 4
				},
				children: [/* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: "target truth table (build a circuit that does this)"
				}), targetTable]
			})]
		}), /* @__PURE__ */ jsx(LogicEditor, {
			value: doc,
			onChange: setDoc
		})]
	});
}

//#endregion
export { LogicBuildLab };