'use client';

import { BALANCE_LEVER_ASSET } from "./asset.mjs";
import { LabStyles, Slider, StatusPill } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useMemo } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Scene, controlsFromScene, registerAsset, resolve, useControlSurface, useEditor } from "@classytic/stage";

//#region src/physics/lever/preset.tsx
/**
* Balance-lever (torque), a SceneDoc FACTORY, built on @classytic/stage. A
* creator places weights at distances along an arm; exactly one is unknown, and
* the learner sets it so the lever balances (net torque zero). Physics is typed
* derivations that evaluate: torque_i = w_i·d_i (linop, fixed distance), net =
* ΣL − ΣR, tilt = clamp(gain·net), balanced = (net == 0). v1 ships solveFor:
* 'weight' (one unknown mass, fixed slots), single-DOF, uniquely solvable.
*/
registerAsset("balance-lever", BALANCE_LEVER_ASSET);
const UNIT_GAP = .9;
const GAIN = 2;
const DEFAULT_ITEMS = [{
	side: "L",
	dist: 3,
	weight: 4
}, {
	side: "R",
	dist: 2,
	weight: "unknown"
}];
function leverBalanceDoc({ items = DEFAULT_ITEMS, start = 1, maxWeight = 12 }) {
	const arm = (items.reduce((mx, it) => Math.max(mx, it.dist), 1) + .7) * UNIT_GAP;
	const pivot = {
		x: 0,
		y: .7
	};
	const elements = [];
	const leftTorques = [];
	const rightTorques = [];
	const bind = {};
	const assetParams = {
		pivot,
		arm,
		unitGap: UNIT_GAP,
		count: items.length
	};
	items.forEach((it, i) => {
		const unknown = it.weight === "unknown";
		const wId = unknown ? "w" : `wt${i}`;
		if (unknown) elements.push({
			id: wId,
			kind: "scalar",
			label: "x",
			a11y: { label: "unknown weight" },
			free: {
				value: start,
				min: 0,
				max: maxWeight,
				step: 1
			}
		});
		else elements.push({
			id: wId,
			kind: "scalar",
			def: {
				op: "linop",
				terms: [],
				const: it.weight
			}
		});
		const tId = `tq${i}`;
		elements.push({
			id: tId,
			kind: "scalar",
			def: {
				op: "linop",
				terms: [{
					coef: it.dist * UNIT_GAP,
					in: { ref: wId }
				}]
			}
		});
		(it.side === "L" ? leftTorques : rightTorques).push({ ref: tId });
		bind[`w${i}`] = { ref: wId };
		assetParams[`s${i}`] = it.side === "L" ? -1 : 1;
		assetParams[`d${i}`] = it.dist;
		assetParams[`k${i}`] = unknown ? 1 : 0;
	});
	elements.push({
		id: "leftSum",
		kind: "scalar",
		def: {
			op: "reduce",
			inputs: leftTorques,
			reducer: "sum"
		}
	});
	elements.push({
		id: "rightSum",
		kind: "scalar",
		def: {
			op: "reduce",
			inputs: rightTorques,
			reducer: "sum"
		}
	});
	elements.push({
		id: "net",
		kind: "scalar",
		def: {
			op: "linop",
			terms: [{
				coef: 1,
				in: { ref: "leftSum" }
			}, {
				coef: -1,
				in: { ref: "rightSum" }
			}]
		}
	});
	elements.push({
		id: "tiltRaw",
		kind: "scalar",
		def: {
			op: "linop",
			terms: [{
				coef: GAIN,
				in: { ref: "net" }
			}]
		}
	});
	elements.push({
		id: "tilt",
		kind: "scalar",
		def: {
			op: "clamp",
			in: { ref: "tiltRaw" },
			min: -14,
			max: 14
		}
	});
	elements.push({
		id: "balanced",
		kind: "boolean",
		def: {
			op: "compare",
			a: { ref: "net" },
			b: 0,
			cmp: "eq",
			eps: .001
		}
	});
	elements.push({
		id: "lever",
		kind: "asset",
		def: {
			op: "asset",
			asset: "balance-lever",
			params: assetParams,
			bind: {
				...bind,
				tilt: { ref: "tilt" },
				balanced: { ref: "balanced" }
			}
		}
	});
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: -(arm + .7),
			xMax: arm + .7,
			yMin: -1.1,
			yMax: 1.5
		},
		elements,
		bindings: []
	};
}
function LeverBalanceLab({ items = DEFAULT_ITEMS, start = 1, maxWeight = 12, controlId, height = 280 }) {
	const { editor, doc } = useEditor(useMemo(() => leverBalanceDoc({
		items,
		start,
		maxWeight
	}), [
		items,
		start,
		maxWeight
	]));
	const resolved = resolve(doc);
	const w = Number(resolved.values.get("w") ?? start);
	const leftSum = Number(resolved.values.get("leftSum") ?? 0);
	const rightSum = Number(resolved.values.get("rightSum") ?? 0);
	const balanced = resolved.values.get("balanced") === true;
	useControlSurface(controlId, useMemo(() => controlsFromScene(editor, [{
		id: "w",
		name: "weight",
		min: 0,
		max: maxWeight,
		step: 1
	}]), [editor, maxWeight]));
	const setW = (v) => {
		editor.dispatch({
			op: "mutate",
			id: "w",
			patch: { free: { value: v } }
		});
	};
	useCheckpoint({
		solved: balanced,
		activity: "balance-lever",
		response: String(w)
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx(LabStyles, {}),
		/* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			height,
			ariaLabel: "Balance the lever by setting the unknown weight"
		}),
		/* @__PURE__ */ jsx(LiveRegion, { children: balanced ? `Balanced. The unknown weight is ${w}.` : `Left turning effect ${leftSum.toFixed(1)}, right ${rightSum.toFixed(1)}.` })
	] });
	const controlsUi = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: "unknown weight",
		value: `x = ${w}`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: w,
			min: 0,
			max: maxWeight,
			step: 1,
			onChange: setW,
			ariaLabel: "unknown weight",
			style: { flex: "1 1 160px" }
		})
	}) });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Balance the lever",
		prompt: "Set the unknown weight so the lever balances (net turning effect zero).",
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(StatusPill, {
			ok: balanced,
			children: balanced ? "✓ Balanced!" : "Not balanced"
		}), /* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				"turning effect, left ",
				leftSum.toFixed(1),
				" · right ",
				rightSum.toFixed(1)
			]
		})] }),
		controls: controlsUi,
		children: figure
	});
}

//#endregion
export { LeverBalanceLab, leverBalanceDoc };