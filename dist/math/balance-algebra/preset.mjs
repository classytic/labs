'use client';

import { LabStyles, Slider, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { Feedback, useCheckpoint } from "../../kit/pedagogy.mjs";
import { BALANCE_ALGEBRA_ASSET } from "./asset.mjs";
import { useMemo } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Scene, controlsFromScene, registerAsset, resolve, useControlSurface, useEditor } from "@classytic/stage";

//#region src/math/balance-algebra/preset.tsx
/**
* Balance-scale algebra flagship, a SceneDoc FACTORY (a general tool for any
* a·x + b = c), built on @classytic/stage. All "logic" is typed numeric
* derivations that actually evaluate: L = a·x+b (linop), diff = L−R, tilt =
* clamp(3·diff), balanced = (diff == 0). Solving the equation == balancing.
*/
registerAsset("balance-algebra", BALANCE_ALGEBRA_ASSET);
function balanceAlgebraDoc(eq) {
	const maxX = Math.max(8, eq.answer + 2);
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: -5,
			xMax: 5,
			yMin: -1.55,
			yMax: 1.6
		},
		elements: [
			{
				id: "x",
				kind: "scalar",
				label: "x",
				a11y: { label: "unknown x" },
				free: {
					value: Math.min(maxX, Math.max(0, Math.round(eq.answer / 2) || 1)),
					min: 0,
					max: maxX,
					step: 1
				}
			},
			{
				id: "L",
				kind: "scalar",
				def: {
					op: "linop",
					terms: [{
						coef: eq.coef,
						in: { ref: "x" }
					}],
					const: eq.addend
				}
			},
			{
				id: "R",
				kind: "scalar",
				def: {
					op: "linop",
					terms: [],
					const: eq.rhs
				}
			},
			{
				id: "diff",
				kind: "scalar",
				def: {
					op: "linop",
					terms: [{
						coef: 1,
						in: { ref: "L" }
					}, {
						coef: -1,
						in: { ref: "R" }
					}]
				}
			},
			{
				id: "tiltRaw",
				kind: "scalar",
				def: {
					op: "linop",
					terms: [{
						coef: 3,
						in: { ref: "diff" }
					}]
				}
			},
			{
				id: "tilt",
				kind: "scalar",
				def: {
					op: "clamp",
					in: { ref: "tiltRaw" },
					min: -14,
					max: 14
				}
			},
			{
				id: "balanced",
				kind: "boolean",
				def: {
					op: "compare",
					a: { ref: "diff" },
					b: 0,
					cmp: "eq",
					eps: .001
				}
			},
			{
				id: "scale",
				kind: "asset",
				def: {
					op: "asset",
					asset: "balance-algebra",
					params: {
						pivot: {
							x: 0,
							y: .4
						},
						arm: 3.3,
						coef: eq.coef,
						addend: eq.addend,
						rhs: eq.rhs
					},
					bind: {
						x: { ref: "x" },
						tilt: { ref: "tilt" },
						balanced: { ref: "balanced" }
					}
				}
			}
		],
		bindings: [],
		meta: { pedagogy: {
			objectives: ["Solve a linear equation a·x + b = c by keeping a balance level"],
			misconceptions: [{
				trigger: "sets x so one side is heavier",
				note: "doing a thing to one side only, both sides must stay equal"
			}],
			hints: ["What single value of x makes both pans weigh the same?", `Try x = ${eq.answer}.`],
			difficulty: 2,
			successCriteria: "The beam is level (left load = right load)."
		} }
	};
}
function BalanceAlgebraLab({ coef = 2, addend = 1, rhs = 7, answer = 3, controlId, height = 280 }) {
	const { editor, doc } = useEditor(useMemo(() => balanceAlgebraDoc({
		coef,
		addend,
		rhs,
		answer
	}), [
		coef,
		addend,
		rhs,
		answer
	]));
	const resolved = resolve(doc);
	const x = Number(resolved.values.get("x") ?? 0);
	const L = Number(resolved.values.get("L") ?? 0);
	const R = Number(resolved.values.get("R") ?? 0);
	const balanced = resolved.values.get("balanced") === true;
	const maxX = Math.max(8, answer + 2);
	useControlSurface(controlId, useMemo(() => controlsFromScene(editor, [{
		id: "x",
		name: "x",
		min: 0,
		max: maxX,
		step: 1
	}]), [editor, maxX]));
	useCheckpoint({
		solved: balanced,
		activity: `solve-${coef}x+${addend}=${rhs}`,
		response: String(x)
	});
	const setX = (v) => {
		editor.dispatch({
			op: "mutate",
			id: "x",
			patch: { free: { value: v } }
		});
	};
	const eqLabel = `${coef === 1 ? "" : coef}x${addend ? ` + ${addend}` : ""} = ${rhs}`;
	const diff = L - R;
	const solution = coef !== 0 ? (rhs - addend) / coef : NaN;
	const solutionStr = Number.isInteger(solution) ? String(solution) : solution.toFixed(2);
	const hint = balanced ? `Solved. x = (c − b) / a = (${rhs} − ${addend}) / ${coef} = ${solutionStr}` : diff > 0 ? `Left side is heavier (${L} > ${R}): make x smaller.` : `Right side is heavier (${L} < ${R}): make x bigger.`;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabStyles, {}), /* @__PURE__ */ jsx(Scene, {
		doc,
		interactive: false,
		showGrid: false,
		showAxes: false,
		height,
		ariaLabel: `Balance scale for ${eqLabel}`
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Balance-scale algebra",
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: eqLabel,
				value: /* @__PURE__ */ jsxs("strong", { children: ["x = ", x] }),
				children: /* @__PURE__ */ jsx(Slider, {
					value: x,
					min: 0,
					max: maxX,
					step: 1,
					onChange: setX,
					ariaLabel: "value of x"
				})
			}),
			/* @__PURE__ */ jsxs("span", {
				style: { opacity: .75 },
				children: [
					"left ",
					L,
					" · right ",
					R
				]
			}),
			/* @__PURE__ */ jsx(StatusPill, {
				ok: balanced,
				children: balanced ? "✓ Balanced, solved!" : "Not balanced"
			}),
			/* @__PURE__ */ jsx(Feedback, {
				ok: balanced,
				okText: `Balanced. x = (c − b) / a = ${solutionStr}`,
				tryText: hint
			})
		] }),
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: balanced ? `Balanced. x equals ${x}. ${hint}` : `Left load ${L}, right load ${R}. ${hint}` }),
		children: figure
	});
}

//#endregion
export { BalanceAlgebraLab, balanceAlgebraDoc };