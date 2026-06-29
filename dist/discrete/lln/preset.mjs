'use client';

import { Chip } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { LLN_ASSET } from "./asset.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Scene, registerAsset } from "@classytic/stage";

//#region src/discrete/lln/preset.tsx
/**
* LawOfLargeNumbersLab, the `sampler` core made tangible, the STANDARD data-driven
* way: a SceneDoc with one `sampler` sim (meta.sims) + the `lln` asset reading it
* live via simBind. Flip a coin / roll a die thousands of times and watch the
* frequencies settle onto the true probability. Coin vs die is just `weights` , 
* the general tool, not a one-off widget.
*
* Changing the experiment or hitting "new run" re-keys <Scene> so the sampler
* re-seeds (fresh counts); "speed" (draws/frame) merges live without a restart.
*/
registerAsset("lln", LLN_ASSET);
function LawOfLargeNumbersLab({ experiment: exp0 = "coin", title = "The law of large numbers", prompt = "Flip a coin (or roll a die) over and over, the running frequencies settle onto the true probability.", objectives } = {}) {
	const [experiment, setExperiment] = useState(exp0);
	const [perStep, setPerStep] = useState(1);
	const [resetN, setResetN] = useState(0);
	const doc = useMemo(() => {
		return {
			schemaVersion: 2,
			type: "stage-scene",
			view: {
				xMin: 0,
				xMax: 720,
				yMin: 0,
				yMax: 300
			},
			elements: [{
				id: "fig",
				kind: "asset",
				def: {
					op: "asset",
					asset: "lln",
					params: { kind: experiment === "coin" ? 0 : 1 },
					bind: {},
					simBind: {
						p: {
							sim: "mc",
							field: "p"
						},
						p0: {
							sim: "mc",
							field: "p0"
						},
						samples: {
							sim: "mc",
							field: "samples"
						},
						n: {
							sim: "mc",
							field: "n"
						},
						last: {
							sim: "mc",
							field: "last"
						},
						done: {
							sim: "mc",
							field: "done"
						}
					}
				}
			}],
			bindings: [],
			meta: { sims: [{
				id: "mc",
				core: "sampler",
				params: {
					weights: experiment === "coin" ? [1, 1] : [
						1,
						1,
						1,
						1,
						1,
						1
					],
					perStep,
					seed: 1 + resetN,
					maxDraws: experiment === "coin" ? 4e3 : 12e3
				},
				drives: {}
			}] }
		};
	}, [
		experiment,
		perStep,
		resetN
	]);
	const { totalSamples, estimates, trueProbs } = useMemo(() => {
		const weights = experiment === "coin" ? [1, 1] : [
			1,
			1,
			1,
			1,
			1,
			1
		];
		const maxDraws = experiment === "coin" ? 4e3 : 12e3;
		const total = weights.reduce((a, b) => a + b, 0) || 1;
		const trueP = weights.map((w) => w / total);
		const counts = new Array(weights.length).fill(0);
		let a = 1 + resetN | 0;
		for (let n = 0; n < maxDraws; n++) {
			a = a + 1831565813 | 0;
			let t = Math.imul(a ^ a >>> 15, 1 | a);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			let x = ((t ^ t >>> 14) >>> 0) / 4294967296 * total;
			let idx = weights.length - 1;
			for (let i = 0; i < weights.length - 1; i++) {
				const w = weights[i] ?? 0;
				if (x < w) {
					idx = i;
					break;
				}
				x -= w;
			}
			counts[idx] = (counts[idx] ?? 0) + 1;
		}
		return {
			totalSamples: maxDraws,
			estimates: counts.map((c) => c / maxDraws),
			trueProbs: trueP
		};
	}, [experiment, resetN]);
	useCheckpoint({
		solved: totalSamples >= 300 && estimates.every((est, i) => Math.abs(est - (trueProbs[i] ?? 0)) <= .02),
		activity: `lln:${title}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "experiment",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: experiment === "coin",
						onClick: () => setExperiment("coin"),
						children: "coin"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: experiment === "die",
						onClick: () => setExperiment("die"),
						children: "die"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "speed (draws / frame)",
				children: /* @__PURE__ */ jsx("span", {
					className: "lab-field-row",
					children: [
						1,
						10,
						100
					].map((sp) => /* @__PURE__ */ jsxs(Chip, {
						selected: perStep === sp,
						onClick: () => setPerStep(sp),
						children: [sp, "×"]
					}, sp))
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "reset",
				children: /* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => setResetN((n) => n + 1),
					children: "↻ new run"
				})
			})
		] }),
		children: /* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			ariaLabel: "Law of large numbers: a coin or die sampled repeatedly, frequencies converging onto the true probability"
		}, `${experiment}:${resetN}`)
	});
}

//#endregion
export { LawOfLargeNumbersLab };