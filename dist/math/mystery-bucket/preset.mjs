'use client';

import { clamp } from "../../core/util.mjs";
import { StatusPill, Stepper } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { MYSTERY_BUCKET_ASSET } from "./asset.mjs";
import { useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Scene, registerAsset } from "@classytic/stage";

//#region src/math/mystery-bucket/preset.tsx
/**
* MysteryBucket, the essentials opener. A sealed bucket of hidden weight sits
* on a balance; the learner adds 1-unit weights to the other pan until the beam
* is level. When it balances, the bucket's weight is revealed, they've "weighed
* the unknown" with no symbols at all. This is the concrete ground the letter x
* (and coefficients, and equations) is built on in later lessons.
*
* A SceneDoc factory + a thin interactive shell (add/remove a unit) on the
* mystery-bucket asset. Solve reports to the learner seam.
*/
registerAsset("mystery-bucket", MYSTERY_BUCKET_ASSET);
/** Params → a portable SceneDoc (the asset self-registers on import). */
function mysteryBucketDoc(params) {
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: -5,
			xMax: 5,
			yMin: -2.4,
			yMax: 3.4
		},
		elements: [{
			id: "scale",
			kind: "asset",
			def: {
				op: "asset",
				asset: "mystery-bucket",
				params: {
					bucketWeight: params.bucketWeight,
					bucketCount: params.bucketCount ?? 1,
					count: params.count
				},
				bind: {}
			}
		}],
		bindings: []
	};
}
function MysteryBucketLab({ bucketWeight = 5, bucketCount = 1, maxWeights = 12, start = 0, title = "The mystery bucket", prompt = "Add weights until the scale is level, then you’ve weighed the mystery.", height = 340 } = {}) {
	const buckets = Math.max(1, Math.round(bucketCount));
	const per = clamp(Math.round(bucketWeight), 1, maxWeights);
	const total = per * buckets;
	const cap = Math.max(maxWeights, total + 2);
	const [count, setCount] = useState(clamp(Math.round(start), 0, cap));
	useEffect(() => {
		setCount(clamp(Math.round(start), 0, cap));
	}, [start, cap]);
	const balanced = count === total;
	const doc = useMemo(() => mysteryBucketDoc({
		bucketWeight: per,
		bucketCount: buckets,
		count,
		maxWeights: cap
	}), [
		per,
		buckets,
		count,
		cap
	]);
	useCheckpoint({
		solved: balanced,
		activity: "mystery-bucket"
	});
	const reveal = buckets === 1 ? `The bucket weighs ${per}.` : `${buckets} buckets balance ${total}, so each bucket weighs ${per}.`;
	const status = balanced ? `Level! ${reveal}` : count < total ? "The bucket side is heavier, add more weights." : "Too heavy now, take some off.";
	const figure = /* @__PURE__ */ jsx(Scene, {
		doc,
		interactive: false,
		showGrid: false,
		showAxes: false,
		height,
		ariaLabel: `Balance: a mystery bucket against ${count} unit weights, ${balanced ? "level" : "tipping"}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "weights",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: count,
					min: 0,
					max: cap,
					onChange: setCount,
					label: "unit weights"
				})
			}),
			/* @__PURE__ */ jsx("span", {
				style: { opacity: .85 },
				children: status
			}),
			/* @__PURE__ */ jsx(StatusPill, {
				ok: balanced,
				children: balanced ? "✓ Balanced" : "Not level"
			})
		] }),
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: status }),
		children: figure
	});
}

//#endregion
export { MysteryBucketLab, mysteryBucketDoc };