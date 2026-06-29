'use client';

import { clamp, num } from "../core/util.mjs";
import { Chip, Slider } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../kit/pedagogy.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, Polyline, Segment, Stage } from "@classytic/stage";

//#region src/chem/reaction-profile.tsx
/**
* ReactionProfile, an energy vs. reaction-coordinate diagram.
*
* Reactants plateau → activation-energy hump (transition state) → products
* plateau. Tune ΔH (exothermic vs endothermic) and the activation energy Eₐ; flip
* the catalyst to lower the hump (a faster route, same ΔH).
*
* Now on the @classytic/stage engine (SVG curves + labels, accessible, themed).
*/
/** y(t) for t∈[0,1]: flat reactants → peak → flat products. */
function profile(reactE, prodE, peakE) {
	return (t) => {
		if (t < .25) return reactE;
		if (t > .75) return prodE;
		const u = (t - .25) / .5;
		return reactE + (prodE - reactE) * u + (peakE - Math.max(reactE, prodE)) * Math.sin(u * Math.PI);
	};
}
function sample(f) {
	const pts = [];
	for (let i = 0; i <= 120; i++) {
		const t = i / 120;
		pts.push({
			x: t,
			y: f(t)
		});
	}
	return pts;
}
/** The predict/classify activity, read straight off the diagram the learner just tuned. */
const CHALLENGE = [{
	id: "type",
	prompt: "When the products end up LOWER in energy than the reactants, the reaction is…",
	choices: [{
		value: "exo",
		label: "exothermic"
	}, {
		value: "endo",
		label: "endothermic"
	}],
	answer: "exo",
	explain: "Energy is released to the surroundings, so ΔH is negative."
}, {
	id: "catalyst",
	prompt: "A catalyst opens the lower (green) path. What does it actually change?",
	choices: [
		{
			value: "ea",
			label: "lowers Eₐ only"
		},
		{
			value: "dh",
			label: "lowers ΔH"
		},
		{
			value: "both",
			label: "both"
		}
	],
	answer: "ea",
	explain: "The reactant and product levels are unchanged, only the hump (Eₐ) drops, so ΔH is the same."
}];
function ReactionProfile({ deltaH, activationEnergy, catalyst: catalystInit = false, title = "Reaction energy profile", height = 320 } = {}) {
	const [dH, setDH] = useState(clamp(num(deltaH, -40), -80, 80));
	const [ea, setEa] = useState(clamp(num(activationEnergy, 60), 5, 120));
	const [catalyst, setCatalyst] = useState(catalystInit);
	useEffect(() => {
		setDH(clamp(num(deltaH, -40), -80, 80));
	}, [deltaH]);
	useEffect(() => {
		setEa(clamp(num(activationEnergy, 60), 5, 120));
	}, [activationEnergy]);
	useEffect(() => {
		setCatalyst(catalystInit);
	}, [catalystInit]);
	const challenge = useChallenge(CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "reaction-profile"
	});
	const reactE = 0, prodE = dH;
	const peakE = Math.max(reactE, prodE) + ea;
	const peakCat = Math.max(reactE, prodE) + ea * .45;
	const lo = Math.min(reactE, prodE) - 15;
	const hi = peakE + 15;
	const view = {
		xMin: 0,
		xMax: 1,
		yMin: lo,
		yMax: hi
	};
	const exo = dH < 0;
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "stretch",
			gap: 4
		},
		children: [/* @__PURE__ */ jsx("span", {
			style: {
				writingMode: "vertical-rl",
				transform: "rotate(180deg)",
				fontSize: 11,
				opacity: .6,
				padding: "4px 0"
			},
			children: "energy →"
		}), /* @__PURE__ */ jsxs("div", {
			style: { flex: 1 },
			children: [/* @__PURE__ */ jsxs(Stage, {
				view,
				height,
				preserveAspect: false,
				ariaLabel: `Energy profile, ΔH ${dH} kJ, activation ${ea} kJ${catalyst ? ", catalysed" : ""}`,
				children: [
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: 0,
							y: lo
						},
						to: {
							x: 0,
							y: hi
						},
						color: "var(--stage-fg)",
						opacity: .4,
						weight: 1.5
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: 0,
							y: lo
						},
						to: {
							x: 1,
							y: lo
						},
						color: "var(--stage-fg)",
						opacity: .4,
						weight: 1.5
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: .25,
							y: reactE
						},
						to: {
							x: 1,
							y: reactE
						},
						color: "var(--stage-fg)",
						opacity: .35,
						weight: 1,
						dashed: true
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: .75,
							y: prodE
						},
						to: {
							x: 1,
							y: prodE
						},
						color: "var(--stage-fg)",
						opacity: .35,
						weight: 1,
						dashed: true
					}),
					catalyst && /* @__PURE__ */ jsx(Polyline, {
						points: sample(profile(reactE, prodE, peakCat)),
						color: "var(--stage-good)",
						weight: 2.5,
						dashed: true
					}),
					/* @__PURE__ */ jsx(Polyline, {
						points: sample(profile(reactE, prodE, peakE)),
						color: "var(--stage-accent)",
						weight: 2.5
					}),
					/* @__PURE__ */ jsx(Label, {
						x: .02,
						y: reactE,
						text: "reactants",
						color: "var(--stage-fg)",
						anchor: "start",
						dy: -8,
						size: 11
					}),
					/* @__PURE__ */ jsx(Label, {
						x: .78,
						y: prodE,
						text: "products",
						color: "var(--stage-fg)",
						anchor: "start",
						dy: -8,
						size: 11
					})
				]
			}), /* @__PURE__ */ jsx("p", {
				style: {
					textAlign: "center",
					fontSize: 11,
					opacity: .6,
					margin: "2px 0 0"
				},
				children: "reaction coordinate →"
			})]
		})]
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsx(Field, {
			label: "ΔH",
			children: /* @__PURE__ */ jsx(Slider, {
				value: dH,
				min: -80,
				max: 80,
				step: 1,
				onChange: setDH,
				ariaLabel: "enthalpy change",
				style: { width: 110 }
			})
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "Eₐ",
			children: /* @__PURE__ */ jsx(Slider, {
				value: ea,
				min: 5,
				max: 120,
				step: 1,
				onChange: setEa,
				ariaLabel: "activation energy",
				style: { width: 110 }
			})
		}),
		/* @__PURE__ */ jsx(Chip, {
			selected: catalyst,
			onClick: () => setCatalyst((c) => !c),
			children: "catalyst"
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: "Tune ΔH and the activation energy. A catalyst lowers the hump (green), a faster path, same ΔH.",
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "grid",
					gap: 4,
					fontVariantNumeric: "tabular-nums",
					fontWeight: 600
				},
				children: [/* @__PURE__ */ jsxs("span", { children: [
					"ΔH ",
					dH > 0 ? "+" : "",
					dH.toFixed(0),
					" kJ"
				] }), /* @__PURE__ */ jsx("span", {
					style: { color: exo ? "var(--stage-good)" : "var(--stage-warn)" },
					children: exo ? "exothermic" : "endothermic"
				})]
			})
		}),
		controls,
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { ReactionProfile };