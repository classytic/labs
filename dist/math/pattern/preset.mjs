'use client';

import { CheckButton, Chip, LabStyles, StatusPill, Stepper } from "../../kit/controls.mjs";
import { ControlBar, ControlExpr, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { PATTERN_FIGURE_ASSET } from "./asset.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Scene, controlsFromScene, registerAsset, resolve, useControlSurface, useEditor } from "@classytic/stage";

//#region src/math/pattern/preset.tsx
/**
* Growing pattern → formula, a SceneDoc FACTORY (Brilliant-style visual
* algebra), built on @classytic/stage. A creator declares the linear rule
* count(n) = a·n + b; the template GENERATES the figures for n = 1..k and asks
* the learner to find the rule. A linear rule is fixed by any two points, so
* agreement on the shown n PLUS a hidden "predict" row (n = k+1) forces the
* learner to extrapolate the real rule, not memorise the visible counts.
*/
registerAsset("pattern-figure", PATTERN_FIGURE_ASSET);
const CELL = .5;
const ruleLabel = (a, b) => `${a === 1 ? "n" : `${a}n`}${b ? ` + ${b}` : ""}`;
function growingPatternDoc({ a = 2, b = 3, steps = 4 }) {
	const figW = Math.max(a, b, 1) * CELL;
	const gap = CELL * 2;
	const pitch = figW + gap;
	const predictN = steps + 1;
	const ns = Array.from({ length: steps }, (_, i) => i + 1);
	const elements = [{
		id: "aGuess",
		kind: "scalar",
		label: "a",
		a11y: { label: "coefficient a" },
		free: {
			value: 1,
			min: 0,
			max: 9,
			step: 1
		}
	}, {
		id: "bGuess",
		kind: "scalar",
		label: "b",
		a11y: { label: "constant b" },
		free: {
			value: 0,
			min: 0,
			max: 9,
			step: 1
		}
	}];
	for (const step of ns) elements.push({
		id: `fig${step}`,
		kind: "asset",
		def: {
			op: "asset",
			asset: "pattern-figure",
			params: {
				n: step,
				a,
				b,
				cell: CELL,
				origin: {
					x: (step - 1) * pitch,
					y: 0
				}
			},
			bind: {}
		}
	});
	for (const step of [...ns, predictN]) elements.push({
		id: `guess${step}`,
		kind: "scalar",
		def: {
			op: "linop",
			terms: [{
				coef: step,
				in: { ref: "aGuess" }
			}, {
				coef: 1,
				in: { ref: "bGuess" }
			}]
		}
	});
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: -.6,
			xMax: steps * pitch - gap + .6,
			yMin: -2.1,
			yMax: steps * CELL + .8
		},
		elements,
		bindings: []
	};
}
function GrowingPatternLab({ a = 2, b = 3, steps = 4, prompt = "Find the rule for the number of tiles.", check = "steppers", choices, controlId, height = 320 }) {
	const { editor, doc } = useEditor(useMemo(() => growingPatternDoc({
		a,
		b,
		steps
	}), [
		a,
		b,
		steps
	]));
	const resolved = resolve(doc);
	const aGuess = Number(resolved.values.get("aGuess") ?? 1);
	const bGuess = Number(resolved.values.get("bGuess") ?? 0);
	const predictN = steps + 1;
	const ns = Array.from({ length: steps }, (_, i) => i + 1);
	const truth = (k) => a * k + b;
	useControlSurface(controlId, useMemo(() => controlsFromScene(editor, [{
		id: "aGuess",
		name: "a",
		min: 0,
		max: 9,
		step: 1
	}, {
		id: "bGuess",
		name: "b",
		min: 0,
		max: 9,
		step: 1
	}]), [editor]));
	const setScalar = (id, v) => {
		editor.dispatch({
			op: "mutate",
			id,
			patch: { free: { value: Math.max(0, v) } }
		});
	};
	const [sel, setSel] = useState(null);
	const [result, setResult] = useState(null);
	const answer = ruleLabel(a, b);
	const steppersSolved = [...ns, predictN].every((k) => aGuess * k + bGuess === truth(k));
	const matchRow = (k) => aGuess * k + bGuess === truth(k);
	useCheckpoint({
		solved: result === "correct",
		activity: `pattern-${answer}`,
		response: check === "mcq" ? sel ?? "" : `${aGuess}n+${bGuess}`
	});
	const check_ = () => {
		setResult((check === "mcq" ? sel === answer : steppersSolved) ? "correct" : "wrong");
	};
	const cellStyle = (ok) => ({
		padding: "4px 10px",
		textAlign: "center",
		color: ok === null ? "inherit" : ok ? "var(--stage-good)" : "var(--stage-warn)",
		fontWeight: ok ? 700 : 400
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx(LabStyles, {}),
		/* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			height,
			ariaLabel: prompt
		}),
		/* @__PURE__ */ jsxs("table", {
			style: {
				borderCollapse: "collapse",
				margin: "8px 0",
				fontSize: 14
			},
			children: [/* @__PURE__ */ jsx("caption", {
				style: {
					textAlign: "left",
					opacity: .75,
					marginBottom: 4
				},
				children: "step n → number of tiles"
			}), /* @__PURE__ */ jsxs("tbody", { children: [/* @__PURE__ */ jsxs("tr", { children: [
				/* @__PURE__ */ jsx("th", {
					style: {
						textAlign: "right",
						padding: "4px 10px",
						opacity: .7
					},
					children: "n"
				}),
				ns.map((k) => /* @__PURE__ */ jsx("td", {
					style: cellStyle(check === "steppers" ? matchRow(k) : null),
					children: k
				}, k)),
				/* @__PURE__ */ jsx("td", {
					style: {
						...cellStyle(null),
						opacity: .7
					},
					children: predictN
				})
			] }), /* @__PURE__ */ jsxs("tr", { children: [
				/* @__PURE__ */ jsx("th", {
					style: {
						textAlign: "right",
						padding: "4px 10px",
						opacity: .7
					},
					children: "tiles"
				}),
				ns.map((k) => /* @__PURE__ */ jsx("td", {
					style: cellStyle(check === "steppers" ? matchRow(k) : null),
					children: truth(k)
				}, k)),
				/* @__PURE__ */ jsx("td", {
					style: {
						...cellStyle(null),
						opacity: .7
					},
					children: "?"
				})
			] })] })]
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			check === "steppers" ? /* @__PURE__ */ jsxs(ControlExpr, { children: [
				/* @__PURE__ */ jsx("span", { children: "Your rule:" }),
				/* @__PURE__ */ jsx(Stepper, {
					label: "a",
					value: aGuess,
					min: 0,
					max: 9,
					onChange: (v) => {
						setScalar("aGuess", v);
						setResult(null);
					}
				}),
				/* @__PURE__ */ jsx("span", { children: "· n\xA0+" }),
				/* @__PURE__ */ jsx(Stepper, {
					label: "b",
					value: bGuess,
					min: 0,
					max: 9,
					onChange: (v) => {
						setScalar("bGuess", v);
						setResult(null);
					}
				}),
				/* @__PURE__ */ jsxs("span", {
					style: { opacity: .7 },
					children: ["→ ", /* @__PURE__ */ jsx("strong", { children: ruleLabel(aGuess, bGuess) })]
				})
			] }) : /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 8
				},
				children: (choices ?? []).map((ch) => /* @__PURE__ */ jsx(Chip, {
					selected: sel === ch,
					onClick: () => {
						setSel(ch);
						setResult(null);
					},
					children: ch
				}, ch))
			}),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: check_,
				disabled: check === "mcq" && !sel,
				children: "Check"
			}),
			result === "correct" && /* @__PURE__ */ jsxs(StatusPill, {
				ok: true,
				children: [
					"✓ Correct, predicts n = ",
					predictN,
					" too!"
				]
			}),
			result === "wrong" && /* @__PURE__ */ jsx(StatusPill, {
				ok: false,
				children: "Not quite, match every step"
			})
		] }),
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: result === "correct" ? `Correct. The rule is ${answer}.` : "" }),
		children: figure
	});
}

//#endregion
export { GrowingPatternLab, growingPatternDoc };