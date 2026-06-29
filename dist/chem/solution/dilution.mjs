'use client';

import { clamp } from "../../core/util.mjs";
import { Tex } from "../../core/tex.mjs";
import { Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { SolutionField } from "./field.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/chem/solution/dilution.tsx
/**
* DilutionLab, C₁V₁ = C₂V₂ is just: the dots don't leave.
*
* Take an aliquot of stock (V₁) and dilute it to a final volume (V₂). Two beakers
* show the SAME solute dots, concentrated in the small aliquot on the left,
* spread through the larger volume on the right, so the conserved quantity
* (moles = C·V) is SEEN, not memorized: same dots, bigger box, paler colour, lower
* C. Composes the shared SolutionField (single source of truth for the dots).
*
* Rearranging C₁V₁=C₂V₂ for an unknown / serial dilutions → a paired MathDerivation.
*/
const DOTS_PER_MOL = 200;
/** Predict the conserved quantity: moles (dots) don't change on dilution, so adding water lowers C. */
const DILUTION_CHALLENGE = [{
	id: "conserved",
	prompt: "You dilute the aliquot to a larger final volume. What stays the SAME?",
	choices: [
		{
			value: "moles",
			label: "the moles of solute (the dots)"
		},
		{
			value: "conc",
			label: "the concentration"
		},
		{
			value: "volume",
			label: "the volume"
		}
	],
	answer: "moles",
	explain: "Adding water never removes solute, n = C·V is conserved, which is exactly C₁V₁ = C₂V₂."
}, {
	id: "doubleV",
	prompt: "Keep the same aliquot but DOUBLE the final volume V₂. The final concentration C₂…",
	choices: [
		{
			value: "halves",
			label: "halves"
		},
		{
			value: "doubles",
			label: "doubles"
		},
		{
			value: "same",
			label: "is unchanged"
		}
	],
	answer: "halves",
	explain: "C₂ = n/V₂ with n fixed, twice the volume means half the concentration."
}];
function DilutionLab({ stockConcentration = 2, aliquotVolume = .25, finalVolume = 1, maxMolarity = 4, hue = 200, title = "Dilution: the dots don’t leave", prompt = "Take an aliquot of stock, add water to the final volume. Same dots, bigger box → lower concentration.", height = 180, objectives }) {
	const c1 = clamp(stockConcentration, .5, maxMolarity);
	const [v1, setV1] = useState(clamp(aliquotVolume, .1, .5));
	const [v2, setV2] = useState(clamp(finalVolume, .5, 1.5));
	const n = c1 * v1;
	const c2 = n / v2;
	const dots = Math.round(n * DOTS_PER_MOL);
	const challenge = useChallenge(DILUTION_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "dilution"
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gridTemplateColumns: "1fr auto 1fr",
			alignItems: "center",
			gap: 8
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					borderRadius: 12,
					overflow: "hidden",
					background: "var(--stage-bg)",
					border: "1px solid var(--stage-grid)"
				},
				children: [/* @__PURE__ */ jsx(SolutionField, {
					dots,
					fill: v1 / .5,
					tint: c1 / maxMolarity,
					hue,
					height,
					ariaLabel: `aliquot: ${n.toFixed(2)} moles, ${c1.toFixed(1)} molar`
				}), /* @__PURE__ */ jsxs("p", {
					style: {
						textAlign: "center",
						margin: "4px 0 6px",
						fontSize: 12,
						fontWeight: 700,
						fontVariantNumeric: "tabular-nums"
					},
					children: [
						"aliquot · C₁=",
						c1.toFixed(1),
						" · V₁=",
						v1.toFixed(2),
						" L"
					]
				})]
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 22,
					color: "var(--stage-muted)"
				},
				children: "→"
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					borderRadius: 12,
					overflow: "hidden",
					background: "var(--stage-bg)",
					border: "1px solid var(--stage-grid)"
				},
				children: [/* @__PURE__ */ jsx(SolutionField, {
					dots,
					fill: v2 / 1.5,
					tint: c2 / maxMolarity,
					hue,
					height,
					ariaLabel: `diluted: ${n.toFixed(2)} moles, ${c2.toFixed(2)} molar`
				}), /* @__PURE__ */ jsxs("p", {
					style: {
						textAlign: "center",
						margin: "4px 0 6px",
						fontSize: 12,
						fontWeight: 700,
						fontVariantNumeric: "tabular-nums"
					},
					children: [
						"diluted · C₂=",
						c2.toFixed(2),
						" · V₂=",
						v2.toFixed(2),
						" L"
					]
				})]
			})
		]
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `${c1.toFixed(1)} molar times ${v1.toFixed(2)} litres gives ${n.toFixed(2)} moles, diluted to ${v2.toFixed(2)} litres is ${c2.toFixed(2)} molar.` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "aliquot V₁ (L)",
			value: v1.toFixed(2),
			children: /* @__PURE__ */ jsx(Slider, {
				value: v1,
				min: .1,
				max: .5,
				step: .05,
				onChange: setV1,
				ariaLabel: "aliquot volume taken from stock"
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "final V₂ (L)",
			value: v2.toFixed(2),
			children: /* @__PURE__ */ jsx(Slider, {
				value: v2,
				min: .5,
				max: 1.5,
				step: .05,
				onChange: setV2,
				ariaLabel: "final volume after adding water"
			})
		})] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [/* @__PURE__ */ jsx("b", {
				style: { fontVariantNumeric: "tabular-nums" },
				children: /* @__PURE__ */ jsx(Tex, { tex: `C_1 V_1 = C_2 V_2 = ${n.toFixed(2)}\\ \\text{mol}` })
			}), " \xA0(the dots don’t leave)"]
		}), /* @__PURE__ */ jsx(ChallengeCard, {
			questions: DILUTION_CHALLENGE,
			state: challenge,
			title: "Predict"
		})] }),
		children: figure
	});
}

//#endregion
export { DilutionLab };