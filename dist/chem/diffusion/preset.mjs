'use client';

import { Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { DIFFUSION_ASSET } from "./asset.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Scene, registerAsset } from "@classytic/stage";

//#region src/chem/diffusion/preset.tsx
/**
* DiffusionLab, two gases, one box: the `particles` core made tangible. The blue
* and red particles start on opposite sides; press Play and they random-walk into a
* uniform mix, diffusion, and why it never spontaneously un-mixes. Hotter (faster)
* particles mix sooner. SceneDoc + particles sim + the diffusion asset (sim ≠ render).
*/
registerAsset("diffusion", DIFFUSION_ASSET);
const W = 12, H = 6;
const DIFFUSION_CHALLENGE = [{
	id: "unmix",
	prompt: "Once the two gases are fully mixed, can they spontaneously separate back to opposite sides on their own?",
	choices: [
		{
			value: "no",
			label: "No: mixing is one-way"
		},
		{
			value: "wait",
			label: "Yes, if you wait long enough"
		},
		{
			value: "cool",
			label: "Only if you cool it"
		}
	],
	answer: "no",
	explain: "There are overwhelmingly more mixed arrangements than separated ones, so random motion never un-mixes by itself (entropy increases)."
}, {
	id: "temp",
	prompt: "Raising the temperature (particle speed) makes the gases mix…",
	choices: [
		{
			value: "faster",
			label: "faster"
		},
		{
			value: "slower",
			label: "slower"
		},
		{
			value: "same",
			label: "no change"
		}
	],
	answer: "faster",
	explain: "Faster particles travel and collide more, so the uniform mix is reached sooner."
}];
function DiffusionLab({ title = "Diffusion: why things mix", prompt = "Blue and red gas start apart. Press Play: random collisions spread them into a uniform mix, and it never un-mixes on its own.", objectives = [
	"See diffusion as random motion, not a force",
	"Watch two gases mix to uniform (the \"mixed %\" climbs)",
	"Hotter (faster) particles mix sooner"
] } = {}) {
	const [speed, setSpeed] = useState(3);
	const [n, setN] = useState(120);
	const [resetN, setResetN] = useState(0);
	const challenge = useChallenge(DIFFUSION_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "diffusion"
	});
	const doc = useMemo(() => ({
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: 0,
			xMax: W,
			yMin: 0,
			yMax: H
		},
		elements: [{
			id: "fig",
			kind: "asset",
			def: {
				op: "asset",
				asset: "diffusion",
				params: {
					w: W,
					h: H
				},
				bind: {},
				simBind: {
					px: {
						sim: "g",
						field: "px"
					},
					py: {
						sim: "g",
						field: "py"
					},
					group: {
						sim: "g",
						field: "group"
					},
					mixed: {
						sim: "g",
						field: "mixed"
					}
				}
			}
		}],
		bindings: [],
		meta: { sims: [{
			id: "g",
			core: "particles",
			params: {
				n,
				box: {
					w: W,
					h: H
				},
				speed,
				split: true,
				seed: 1 + resetN
			},
			drives: {}
		}] }
	}), [
		n,
		speed,
		resetN
	]);
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "temperature (speed)",
				value: `${speed.toFixed(1)}`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: speed,
					min: 1,
					max: 6,
					step: .5,
					onChange: setSpeed,
					ariaLabel: "temperature"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "particles",
				value: `${n}`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: n,
					min: 40,
					max: 200,
					step: 20,
					onChange: setN,
					ariaLabel: "particle count"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "reset",
				children: /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lab-chip",
					onClick: () => setResetN((k) => k + 1),
					children: "↻ re-separate"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: DIFFUSION_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: /* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			ariaLabel: "Two gases diffusing and mixing in a box"
		}, `${n}:${speed}:${resetN}`)
	});
}

//#endregion
export { DiffusionLab };