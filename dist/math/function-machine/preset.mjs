'use client';

import { CheckButton, Chip, LabStyles, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Label, Polygon, Segment, Stage } from "@classytic/stage";

//#region src/math/function-machine/preset.tsx
/**
* Function machine, a "predict the rule" interactive (Brilliant-style), built
* on @classytic/stage: inputs → outputs with index-matched connectors, a rule
* chip, multiple-choice rules, and a Check that reports to the learner seam. A
* GENERAL tool: a creator passes any inputs/outputs/choices/answer.
*/
function rect(x0, y0, x1, y1) {
	return [
		{
			x: x0,
			y: y0
		},
		{
			x: x1,
			y: y0
		},
		{
			x: x1,
			y: y1
		},
		{
			x: x0,
			y: y1
		}
	];
}
function FunctionMachineLab({ prompt = "Which rule produces these outputs?", inputs, outputs, choices, answer, height = 340 }) {
	const [sel, setSel] = useState(null);
	const [result, setResult] = useState(null);
	useCheckpoint({
		solved: result === "correct",
		activity: `predict-rule-${answer}`,
		response: sel ?? ""
	});
	const n = Math.max(inputs.length, outputs.length);
	const ys = n === 1 ? [0] : Array.from({ length: n }, (_, i) => 2.3 - 4.6 * i / (n - 1));
	const glow = result === "correct" ? "var(--stage-good)" : result === "wrong" ? "var(--stage-danger)" : "var(--stage-accent)";
	const check = () => {
		setResult(sel === answer ? "correct" : "wrong");
	};
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabStyles, {}), /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -7,
			xMax: 7,
			yMin: -3.6,
			yMax: 4.4
		},
		height,
		ariaLabel: prompt,
		children: [
			/* @__PURE__ */ jsx(Polygon, {
				points: rect(-3.2, -3, 3.2, 3),
				color: "transparent",
				fill: glow,
				fillOpacity: .14,
				weight: 0
			}),
			/* @__PURE__ */ jsx(Polygon, {
				points: rect(-1.5, 3.3, 1.5, 4.2),
				color: glow,
				fill: glow,
				fillOpacity: .28,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: 3.75,
				text: sel ?? "?",
				size: 14,
				color: "var(--stage-fg)"
			}),
			/* @__PURE__ */ jsx(Polygon, {
				points: rect(-6, -3, -3.4, 3),
				color: "var(--stage-muted)",
				fill: "var(--stage-bg)",
				fillOpacity: .5,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Polygon, {
				points: rect(3.4, -3, 6, 3),
				color: "var(--stage-muted)",
				fill: "var(--stage-bg)",
				fillOpacity: .5,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Label, {
				x: -4.7,
				y: 3.35,
				text: "inputs",
				size: 11,
				color: "var(--stage-muted)"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 4.7,
				y: 3.35,
				text: "outputs",
				size: 11,
				color: "var(--stage-muted)"
			}),
			ys.map((y, i) => /* @__PURE__ */ jsxs("g", { children: [
				inputs[i] != null && /* @__PURE__ */ jsx(Label, {
					x: -4.7,
					y,
					text: String(inputs[i]),
					size: 15
				}),
				outputs[i] != null && /* @__PURE__ */ jsx(Label, {
					x: 4.7,
					y,
					text: String(outputs[i]),
					size: 15
				}),
				inputs[i] != null && outputs[i] != null && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: -3.4,
						y
					},
					to: {
						x: 3.4,
						y
					},
					color: glow,
					weight: 2,
					dashed: true
				})
			] }, i))
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 8
				},
				children: choices.map((ch) => /* @__PURE__ */ jsx(Chip, {
					selected: sel === ch,
					onClick: () => {
						setSel(ch);
						setResult(null);
					},
					children: ch
				}, ch))
			}),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: check,
				disabled: !sel,
				children: "Check"
			}),
			result === "correct" && /* @__PURE__ */ jsx(StatusPill, {
				ok: true,
				children: "✓ Correct!"
			}),
			result === "wrong" && /* @__PURE__ */ jsx(StatusPill, {
				ok: false,
				children: "Not quite, try another rule"
			})
		] }),
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: result === "correct" ? "Correct." : result === "wrong" ? "Incorrect, try again." : "" }),
		children: figure
	});
}

//#endregion
export { FunctionMachineLab };