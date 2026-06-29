'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { RATE_PROCESS_ASSET } from "./asset.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Scene, registerAsset } from "@classytic/stage";

//#region src/physics/exponential/preset.tsx
/**
* DecayCoolingLab, exponential relaxation made tangible, the standard data-driven
* way: one SceneDoc + one `rate` sim, two skins via the rate-process asset. Same
* law (dy/dt = (target−y)/τ) tells two stories, radioactive atoms decaying to 0,
* and a hot drink cooling to room temperature. Press Play; it stops once relaxed.
*/
registerAsset("rate-process", RATE_PROCESS_ASSET);
const EXPONENTIAL_CHALLENGE = [{
	id: "two-halflives",
	prompt: "After two half-lives, the fraction of atoms remaining is…",
	choices: [
		{
			value: "half",
			label: "one-half"
		},
		{
			value: "quarter",
			label: "one-quarter"
		},
		{
			value: "zero",
			label: "none"
		}
	],
	answer: "quarter",
	explain: "Each half-life removes HALF of what remains: ½ then ½ of that = ¼."
}, {
	id: "cools-fastest",
	prompt: "A hot drink cools fastest…",
	choices: [
		{
			value: "start",
			label: "at the start"
		},
		{
			value: "end",
			label: "near room temperature"
		},
		{
			value: "steady",
			label: "at a steady rate throughout"
		}
	],
	answer: "start",
	explain: "The rate tracks the gap to the surroundings, biggest at the start, easing to zero as it nears room temperature."
}];
function DecayCoolingLab({ mode: mode0 = "decay", title = "Exponential change: decay & cooling", prompt = "Same law, two stories: atoms decay and a hot drink cools, each relaxes toward a baseline at a rate set by τ. Press Play.", objectives = [
	"See exponential relaxation toward a baseline",
	"Read a half-life (decay halves every t½)",
	"Recognise the SAME curve behind decay and cooling"
] } = {}) {
	const [mode, setMode] = useState(mode0);
	const [tau, setTau] = useState(1.4);
	const challenge = useChallenge(EXPONENTIAL_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "exponential"
	});
	const decay = mode === "decay";
	const value0 = decay ? 100 : 90;
	const target = decay ? 0 : 20;
	const doc = useMemo(() => ({
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: 0,
			xMax: 720,
			yMin: 0,
			yMax: 320
		},
		elements: [{
			id: "fig",
			kind: "asset",
			def: {
				op: "asset",
				asset: "rate-process",
				params: {
					kind: decay ? 0 : 1,
					value0,
					tau
				},
				bind: {},
				simBind: {
					value: {
						sim: "r",
						field: "value"
					},
					target: {
						sim: "r",
						field: "target"
					},
					samples: {
						sim: "r",
						field: "samples"
					},
					tSec: {
						sim: "r",
						field: "tSec"
					},
					done: {
						sim: "r",
						field: "done"
					}
				}
			}
		}],
		bindings: [],
		meta: { sims: [{
			id: "r",
			core: "rate",
			params: {
				value0,
				target,
				tau,
				maxTime: 6 * tau
			},
			drives: {}
		}] }
	}), [
		decay,
		value0,
		target,
		tau
	]);
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "process",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: decay,
					onClick: () => setMode("decay"),
					children: "☢ decay"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: !decay,
					onClick: () => setMode("cooling"),
					children: "☕ cooling"
				})]
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "time constant τ",
			value: decay ? `t½ ${(tau * Math.LN2).toFixed(1)}s` : `τ ${tau.toFixed(1)}s`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: tau,
				min: .5,
				max: 3,
				step: .1,
				onChange: setTau,
				ariaLabel: "time constant"
			})
		})] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: EXPONENTIAL_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: /* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			ariaLabel: "Exponential decay or cooling curve with a live skin"
		}, `${mode}:${tau}`)
	});
}

//#endregion
export { DecayCoolingLab };