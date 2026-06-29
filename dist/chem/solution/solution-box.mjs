'use client';

import { clamp } from "../../core/util.mjs";
import { Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { SolutionField } from "./field.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/chem/solution/solution-box.tsx
/**
* SolutionBoxLab, molarity is a CROWD: particles per litre, seen.
*
* Solute shown as discrete dots in a transparent box. Add solute (more dots =
* more moles, the numerator) or add water (the box widens so the SAME dots spread
* apart, the denominator), and M = n/V is read off as both a number AND the
* colour intensity. A draggable probe counts dots in a fixed region, proving
* molarity is a LOCAL density, not a whole-apparatus label. Composes the shared
* SolutionField (single source of truth for the dot engine).
*
* The unit-bridging algebra (mol↔g via molar mass, mol↔particles via Nₐ) belongs
* in a paired MathDerivation, this lab only makes density-vs-amount felt.
*/
const DOTS_PER_MOL = 200;
/** Predict how M = n/V responds to changing the numerator vs the denominator, the core molarity misconception. */
const SOLUTION_CHALLENGE = [{
	id: "add-water",
	prompt: "Add water (more volume, same solute). The molarity M = n/V…",
	choices: [
		{
			value: "falls",
			label: "falls"
		},
		{
			value: "rises",
			label: "rises"
		},
		{
			value: "same",
			label: "stays the same"
		}
	],
	answer: "falls",
	explain: "The same dots spread through a bigger box, n is fixed, V grows, so the density n/V drops."
}, {
	id: "add-solute",
	prompt: "Add more solute at the same volume. The molarity…",
	choices: [
		{
			value: "rises",
			label: "rises"
		},
		{
			value: "falls",
			label: "falls"
		},
		{
			value: "same",
			label: "stays the same"
		}
	],
	answer: "rises",
	explain: "More dots in the same box, n grows, V is fixed, so n/V climbs."
}];
function SolutionBoxLab({ moles = .5, volume = .5, maxMolarity = 4, hue = 178, showProbe = true, title = "Molarity is a crowd: particles per litre", prompt = "Add solute (more dots) or add water (same dots, bigger box). M = n / V is the dot density.", height = 230, objectives }) {
	const [n, setN] = useState(clamp(moles, .1, 1));
	const [v, setV] = useState(clamp(volume, .2, 1));
	const M = n / v;
	const challenge = useChallenge(SOLUTION_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "solution-box"
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsx(SolutionField, {
			dots: Math.round(n * DOTS_PER_MOL),
			fill: v,
			tint: M / maxMolarity,
			hue,
			height,
			showProbe,
			ariaLabel: `solution: ${n.toFixed(1)} moles in ${v.toFixed(1)} litres, ${M.toFixed(2)} molar`
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `${n.toFixed(2)} moles in ${v.toFixed(2)} litres is ${M.toFixed(2)} molar.` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "solute (mol)",
				value: `${n.toFixed(2)} mol`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: n,
					min: .1,
					max: 1,
					step: .05,
					onChange: setN,
					ariaLabel: "moles of solute"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "water → volume (L)",
				value: `${v.toFixed(2)} L`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: v,
					min: .2,
					max: 1,
					step: .05,
					onChange: setV,
					ariaLabel: "solution volume in litres"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "M = n/V",
				value: /* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-accent)" },
					children: [M.toFixed(2), " mol·L⁻¹"]
				}),
				children: /* @__PURE__ */ jsx("span", {})
			})
		] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: SOLUTION_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { SolutionBoxLab };