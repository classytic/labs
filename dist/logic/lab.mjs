'use client';

import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { useCheckpoint } from "../kit/pedagogy.mjs";
import { LabAsk } from "../kit/ask.mjs";
import { evaluate, truthTable } from "./evaluate.mjs";
import { LogicScene } from "./LogicScene.mjs";
import { presetDoc } from "./presets.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/logic/lab.tsx
/**
* LogicGateLab — the authorable digital-logic lesson. It renders a LogicDoc with the engine
* (live wires show the propagating signal), lets the learner toggle inputs, and runs in two
* modes: EXPLORE (drive the inputs to meet a goal) or PREDICT (the output is hidden behind a
* '?', tap to guess 0/1, green ring + checkpoint when right). An optional step control lights
* the signal up one propagation level at a time. A live truth table sits alongside.
*/
const cycle = (g) => g === "?" ? "1" : g === "1" ? "0" : "1";
function LogicGateLab({ doc: doc0, preset = "and", mode = "explore", steps = false, showTable = true, title = "Logic gates: follow the signal", prompt, ask, activity = "logic-gate" } = {}) {
	const [doc, setDoc] = useState(() => doc0 ?? presetDoc(preset));
	const [guess, setGuess] = useState({});
	const [step, setStep] = useState(steps ? 0 : void 0);
	const sol = evaluate(doc);
	const hasGoal = doc.outputs.some((o) => o.goal !== void 0);
	const predicting = mode === "predict";
	const allPredicted = predicting && doc.outputs.every((o) => guess[o.id] && guess[o.id] !== "?" && guess[o.id] === "1" === (sol.outputs[o.id] ?? false));
	const solved = predicting ? allPredicted : hasGoal ? sol.allGoalsMet : false;
	useCheckpoint({
		solved,
		activity
	});
	const toggleInput = (id) => setDoc((d) => ({
		...d,
		inputs: d.inputs.map((i) => i.id === id ? {
			...i,
			value: !i.value
		} : i)
	}));
	const figure = /* @__PURE__ */ jsx(LogicScene, {
		doc,
		onToggleInput: predicting ? void 0 : toggleInput,
		onOutputClick: predicting ? (id) => setGuess((g) => ({
			...g,
			[id]: cycle(g[id] ?? "?")
		})) : void 0,
		outputText: predicting ? (id, actual) => guess[id] && guess[id] !== "?" ? guess[id] : "?" : void 0,
		outputState: predicting ? (id, actual) => {
			const g = guess[id];
			return !g || g === "?" ? void 0 : g === "1" === actual ? "ok" : "no";
		} : void 0,
		reveal: predicting && !solved ? 0 : step,
		showValues: !predicting,
		ariaLabel: `logic circuit, ${predicting ? "predict the output" : "toggle the inputs"}`
	});
	const rows = showTable ? truthTable(doc) : [];
	const curKey = doc.inputs.map((i) => i.value ? 1 : 0).join("");
	const table = showTable ? /* @__PURE__ */ jsx("div", {
		style: { overflowX: "auto" },
		children: /* @__PURE__ */ jsxs("table", {
			style: {
				borderCollapse: "collapse",
				fontSize: 12,
				fontVariantNumeric: "tabular-nums"
			},
			children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [doc.inputs.map((i) => /* @__PURE__ */ jsx("th", {
				style: {
					padding: "3px 7px",
					color: "var(--stage-fg)",
					borderBottom: "1px solid var(--stage-grid)"
				},
				children: i.label ?? i.id
			}, i.id)), doc.outputs.map((o) => /* @__PURE__ */ jsx("th", {
				style: {
					padding: "3px 7px",
					color: "var(--stage-accent)",
					borderBottom: "1px solid var(--stage-grid)"
				},
				children: o.label ?? o.id
			}, o.id))] }) }), /* @__PURE__ */ jsx("tbody", { children: rows.map((r, ri) => {
				return /* @__PURE__ */ jsxs("tr", {
					style: { background: r.inputs.map((b) => b ? 1 : 0).join("") === curKey ? "color-mix(in oklab, var(--stage-accent) 14%, transparent)" : "transparent" },
					children: [r.inputs.map((b, k) => /* @__PURE__ */ jsx("td", {
						style: {
							padding: "3px 7px",
							textAlign: "center",
							color: "var(--stage-muted)"
						},
						children: b ? 1 : 0
					}, k)), doc.outputs.map((o) => /* @__PURE__ */ jsx("td", {
						style: {
							padding: "3px 7px",
							textAlign: "center",
							fontWeight: 700,
							color: r.outputs[o.id] ? "var(--stage-good)" : "var(--stage-fg)"
						},
						children: r.outputs[o.id] ? 1 : 0
					}, o.id))]
				}, ri);
			}) })]
		})
	}) : null;
	const controls = steps && !predicting ? /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: "propagation step",
		value: `${step ?? 0} / ${sol.levels.length - 1}`,
		children: /* @__PURE__ */ jsx("input", {
			type: "range",
			min: 0,
			max: sol.levels.length - 1,
			step: 1,
			value: step ?? 0,
			onChange: (e) => setStep(Number(e.target.value)),
			"aria-label": "propagation step"
		})
	}) }) : void 0;
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: prompt ?? (predicting ? "Work out the output for these inputs, then tap the LED to check." : "Tap the input switches. A wire glows when it carries a 1, so you can watch the signal flow through the gates."),
		controls,
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx("div", {
				className: "lab-pill",
				"data-state": solved ? "ok" : "no",
				role: "status",
				style: { alignSelf: "flex-start" },
				children: predicting ? solved ? "✓ correct — that is the output" : "tap the output LED to predict 0 or 1" : hasGoal ? solved ? "✓ goal met" : "toggle the inputs to reach the goal" : "toggle the inputs and watch the signal"
			}), showTable && /* @__PURE__ */ jsx(Callout, {
				tone: "result",
				children: /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 6
					},
					children: [/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 12,
							color: "var(--stage-muted)"
						},
						children: "truth table (current row highlighted)"
					}), table]
				})
			})]
		}),
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: figure
	});
}

//#endregion
export { LogicGateLab };