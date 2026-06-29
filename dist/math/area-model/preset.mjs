'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { CheckButton, LabStyles, Slider, StatusPill, Stepper } from "../../kit/controls.mjs";
import { ControlBar, ControlExpr, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { AREA_MODEL_ASSET } from "./asset.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Scene, controlsFromScene, registerAsset, resolve, useControlSurface, useEditor } from "@classytic/stage";

//#region src/math/area-model/preset.tsx
/**
* Area-model algebra tiles, a SceneDoc FACTORY for (x+a)(x+b), built on
* @classytic/stage. Two modes share ONE asset:
*  - EXPAND: drag x and watch x² + (a+b)x + ab; strips grow with x, the
*    constant block does not, the multiplication made visible.
*  - FACTOR: given x² + px + q, find a and b (steppers + Check). The unique
*    positive factor pair {a,b} makes the check unambiguous (swap accepted).
*/
registerAsset("area-model", AREA_MODEL_ASSET);
const MAX_X = 3.5;
function areaModelDoc({ a = 3, b = 2, mode = "expand", unit = 1 }) {
	const factor = mode === "factor";
	const totalW = MAX_X + a * unit;
	const totalH = MAX_X + b * unit;
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: -1.4,
			xMax: totalW + 1,
			yMin: -1.6,
			yMax: totalH + .8
		},
		elements: [
			{
				id: "x",
				kind: "scalar",
				label: "x",
				a11y: { label: "side length x" },
				free: {
					value: 2,
					min: .5,
					max: MAX_X,
					step: .25
				}
			},
			{
				id: "revealed",
				kind: "scalar",
				free: { value: factor ? 0 : 1 }
			},
			{
				id: "solved",
				kind: "scalar",
				free: { value: 0 }
			},
			{
				id: "area",
				kind: "asset",
				def: {
					op: "asset",
					asset: "area-model",
					params: {
						origin: {
							x: 0,
							y: 0
						},
						a,
						b,
						unit,
						mode: factor ? 1 : 0
					},
					bind: {
						x: { ref: "x" },
						revealed: { ref: "revealed" },
						solved: { ref: "solved" }
					}
				}
			}
		],
		bindings: []
	};
}
const expandLabel = (a, b) => `(x + ${a})(x + ${b}) = x² + ${a + b}x + ${a * b}`;
const trinomialLabel = (a, b) => `x² + ${a + b}x + ${a * b}`;
function AreaModelLab({ a = 3, b = 2, mode = "expand", unit = 1, controlId, height = 380 }) {
	const { editor, doc } = useEditor(useMemo(() => areaModelDoc({
		a,
		b,
		mode,
		unit
	}), [
		a,
		b,
		mode,
		unit
	]));
	const resolved = resolve(doc);
	const x = Number(resolved.values.get("x") ?? 2);
	useControlSurface(controlId, useMemo(() => controlsFromScene(editor, [{
		id: "x",
		name: "x",
		min: .5,
		max: MAX_X,
		step: .25
	}]), [editor]));
	const setX = (v) => {
		editor.dispatch({
			op: "mutate",
			id: "x",
			patch: { free: { value: v } }
		});
	};
	const [ga, setGa] = useState(1);
	const [gb, setGb] = useState(1);
	const [result, setResult] = useState(null);
	const p = a + b;
	const q = a * b;
	const predictQ = useMemo(() => {
		const sum = a + b;
		const product = a * b;
		const lure = sum + 1;
		const values = Array.from(new Set([
			sum,
			product,
			lure
		])).sort((m, n) => m - n);
		return [{
			id: "middle-coeff",
			prompt: `(x + ${a})(x + ${b}) expands to x² + ?x + ?. What is the MIDDLE coefficient?`,
			choices: values.map((v) => ({
				value: String(v),
				label: String(v)
			})),
			answer: String(sum),
			explain: `The middle term is a+b=${sum} (the sum), and the constant is a·b=${product} (the product) — the area-model's two off-diagonal tiles vs the corner tile.`
		}];
	}, [a, b]);
	const ch = useChallenge(predictQ);
	useCheckpoint({
		solved: result === "correct" && ch.allCorrect,
		activity: `factor-x2+${p}x+${q}`,
		response: `(x+${ga})(x+${gb})`
	});
	const check = () => {
		const ok = ga + gb === p && ga * gb === q;
		setResult(ok ? "correct" : "wrong");
		editor.dispatch({
			op: "mutate",
			id: "revealed",
			patch: { free: { value: ok ? 1 : 0 } }
		});
		editor.dispatch({
			op: "mutate",
			id: "solved",
			patch: { free: { value: ok ? 1 : 0 } }
		});
	};
	if (mode === "factor") {
		const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabStyles, {}), /* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			height,
			ariaLabel: `Area model to factor ${trinomialLabel(a, b)}`
		})] });
		const controlBar = /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsxs(ControlExpr, { children: [
				/* @__PURE__ */ jsx("span", { children: "(x +" }),
				/* @__PURE__ */ jsx(Stepper, {
					label: "a",
					value: ga,
					min: 0,
					max: 12,
					onChange: (v) => {
						setGa(v);
						setResult(null);
					}
				}),
				/* @__PURE__ */ jsx("span", { children: ")(x +" }),
				/* @__PURE__ */ jsx(Stepper, {
					label: "b",
					value: gb,
					min: 0,
					max: 12,
					onChange: (v) => {
						setGb(v);
						setResult(null);
					}
				}),
				/* @__PURE__ */ jsx("span", { children: ")" }),
				/* @__PURE__ */ jsx("span", {
					style: {
						opacity: .7,
						marginLeft: 4
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\to x^2 + ${ga + gb}x + ${ga * gb}` })
				})
			] }),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: check,
				children: "Check"
			}),
			result === "correct" && /* @__PURE__ */ jsx(StatusPill, {
				ok: true,
				children: "✓ Correct!"
			}),
			result === "wrong" && /* @__PURE__ */ jsxs(StatusPill, {
				ok: false,
				children: [
					"Not yet, match ",
					p,
					"x and ",
					q
				]
			})
		] });
		const footer = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: predictQ,
			state: ch,
			title: "Predict first"
		}), /* @__PURE__ */ jsx(LiveRegion, { children: result === "correct" ? `Correct. The factors are x plus ${a} and x plus ${b}.` : "" })] });
		return /* @__PURE__ */ jsx(LabFrame, {
			title: "Area-model factoring",
			prompt: `Factor ${trinomialLabel(a, b)}: find the two side lengths.`,
			controls: controlBar,
			footer,
			children: figure
		});
	}
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabStyles, {}), /* @__PURE__ */ jsx(Scene, {
		doc,
		interactive: false,
		showGrid: false,
		showAxes: false,
		height,
		ariaLabel: `Area model for (x + ${a})(x + ${b})`
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Area-model expansion",
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: expandLabel(a, b),
			value: /* @__PURE__ */ jsxs("strong", { children: ["x = ", x] }),
			children: /* @__PURE__ */ jsx(Slider, {
				value: x,
				min: .5,
				max: MAX_X,
				step: .25,
				onChange: setX,
				ariaLabel: "side length x"
			})
		}), /* @__PURE__ */ jsxs("span", {
			style: { opacity: .75 },
			children: ["area = ", ((x + a) * (x + b)).toFixed(2)]
		})] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: predictQ,
			state: ch,
			title: "Predict first"
		}),
		children: figure
	});
}

//#endregion
export { AreaModelLab, areaModelDoc };