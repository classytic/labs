'use client';

import { clamp } from "../../core/util.mjs";
import { Slider, StatusPill } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { ReactionFlow } from "../../kit/reaction.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Label, Polyline, Segment, Stage } from "@classytic/stage";

//#region src/biology/photosynthesis-factors/preset.tsx
/**
* PhotosynthesisFactorsLab, limiting factors: the slowest worker sets the pace.
*
* Sliders for light, CO₂ and temperature. The rate climbs with light then
* PLATEAUS at whichever factor is in shortest supply, raise CO₂ and the SAME
* light curve climbs to a higher plateau, proving light was no longer limiting.
* Temperature is different: it gives a PEAK (optimum) not a plateau, because past
* the optimum enzymes denature. "Freeze curve" overlays a faint copy so two CO₂
* settings compare side by side.
*
* Reuses Stage/Polyline + core/util + kit/controls; tokenized; reduced-motion safe.
* The mirror photosynthesis ⇌ respiration equation belongs in a paired MathDerivation.
*/
const CLIFF = 14;
const FACTORS_CHALLENGE = [{
	id: "plateau",
	prompt: "Raising light further does nothing, the rate-vs-light curve has flattened. What sets the height of that plateau?",
	choices: [
		{
			value: "factor",
			label: "another factor (CO₂ or temperature)"
		},
		{
			value: "colour",
			label: "the colour of the light"
		},
		{
			value: "random",
			label: "nothing: it’s random"
		}
	],
	answer: "factor",
	explain: "Where the curve flattens, some OTHER factor (CO₂ supply or temperature) is now the bottleneck, the slowest worker sets the pace."
}, {
	id: "cliff",
	prompt: "Push temperature well ABOVE the optimum and the rate CRASHES, not just plateaus. Why?",
	choices: [
		{
			value: "denature",
			label: "enzymes denature"
		},
		{
			value: "co2",
			label: "more CO₂ dissolves"
		},
		{
			value: "light",
			label: "the light weakens"
		}
	],
	answer: "denature",
	explain: "Past the optimum the enzymes lose their shape (denature), that destroys capacity, unlike a mere limiting factor."
}];
function PhotosynthesisFactorsLab({ light = 70, co2 = 50, temperature = 25, tempOptimum = 28, title = "Limiting factors: the slowest worker sets the pace", prompt = "Raise light: the rate plateaus where another factor (CO₂ or temperature) takes over.", height = 240, objectives }) {
	const [l, setL] = useState(light);
	const [c, setC] = useState(co2);
	const [t, setT] = useState(temperature);
	const [frozen, setFrozen] = useState([]);
	const challenge = useChallenge(FACTORS_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "photosynthesis-factors"
	});
	const tempFactor = (temp) => temp <= tempOptimum ? clamp(temp / tempOptimum, 0, 1) : clamp(1 - (temp - tempOptimum) / CLIFF, 0, 1);
	const rateAt = (lightV, co2V, tempV) => Math.min(lightV / 100, co2V / 100) * tempFactor(tempV);
	const rate = rateAt(l, c, t);
	const tooHot = t > tempOptimum && tempFactor(t) < .95;
	const limiting = tooHot ? "temperature (too hot)" : l / 100 <= c / 100 + 1e-9 ? "light" : "CO₂";
	const curve = (co2V, tempV) => {
		const out = [];
		for (let x = 0; x <= 100; x += 4) out.push({
			x,
			y: rateAt(x, co2V, tempV)
		});
		return out;
	};
	const pts = curve(c, t);
	const view = {
		xMin: -6,
		xMax: 104,
		yMin: -.1,
		yMax: 1.1
	};
	const freeze = () => {
		setFrozen((f) => [...f.slice(-2), {
			co2: c,
			temp: t,
			pts
		}]);
	};
	const bubbles = Math.round(rate * 7);
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx(ReactionFlow, {
			reactants: [
				{
					kind: "co2",
					coef: 6
				},
				{
					kind: "h2o",
					coef: 6
				},
				{ kind: "light" }
			],
			products: [{ kind: "glucose" }, {
				kind: "o2",
				coef: 6
			}],
			height: 76,
			molSize: 26,
			ariaLabel: "6 CO2 + 6 H2O + light gives glucose + 6 O2"
		}),
		/* @__PURE__ */ jsxs("p", {
			style: {
				textAlign: "center",
				margin: "0 0 8px",
				color: "var(--stage-good)",
				fontSize: 12
			},
			children: ["•".repeat(bubbles), /* @__PURE__ */ jsx("span", {
				style: { color: "var(--stage-muted)" },
				children: " O₂ rate"
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				overflow: "hidden",
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)"
			},
			children: /* @__PURE__ */ jsxs(Stage, {
				view,
				height,
				preserveAspect: false,
				ariaLabel: `Photosynthesis rate vs light; limiting factor ${limiting}`,
				children: [
					/* @__PURE__ */ jsx(Axes, { ticks: false }),
					/* @__PURE__ */ jsx(Label, {
						x: 50,
						y: -.06,
						text: "light intensity →",
						color: "var(--stage-muted)",
						size: 11
					}),
					/* @__PURE__ */ jsx(Label, {
						x: 0,
						y: .55,
						text: "rate",
						color: "var(--stage-muted)",
						size: 11,
						dx: -6
					}),
					frozen.map((fr, i) => /* @__PURE__ */ jsx(Polyline, {
						points: fr.pts,
						color: "var(--stage-muted)",
						weight: 1.5,
						opacity: .45,
						dashed: true
					}, i)),
					/* @__PURE__ */ jsx(Polyline, {
						points: pts,
						color: "var(--stage-good)",
						weight: 2.5
					}),
					/* @__PURE__ */ jsx(Dot, {
						x: l,
						y: rate,
						r: 6,
						color: tooHot ? "var(--stage-danger)" : "var(--stage-good)"
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: l,
							y: 0
						},
						to: {
							x: l,
							y: rate
						},
						color: "var(--stage-fg)",
						weight: 1,
						dashed: true,
						opacity: .35
					})
				]
			})
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Callout, { children: [/* @__PURE__ */ jsxs("div", {
			style: {
				fontVariantNumeric: "tabular-nums",
				fontWeight: 600
			},
			children: ["rate ", (rate * 100).toFixed(0)]
		}), /* @__PURE__ */ jsxs(StatusPill, {
			ok: false,
			children: ["limiting: ", limiting]
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "light",
				value: l,
				children: /* @__PURE__ */ jsx(Slider, {
					value: l,
					min: 0,
					max: 100,
					step: 2,
					onChange: setL,
					ariaLabel: "light intensity"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "CO₂",
				value: c,
				children: /* @__PURE__ */ jsx(Slider, {
					value: c,
					min: 0,
					max: 100,
					step: 2,
					onChange: setC,
					ariaLabel: "carbon dioxide concentration"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "temp",
				value: `${t}°C`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: t,
					min: 0,
					max: 50,
					step: 1,
					onChange: setT,
					ariaLabel: "temperature"
				})
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-chip",
				onClick: freeze,
				children: "📌 freeze this curve"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: FACTORS_CHALLENGE,
			state: challenge,
			title: "Explain the curve"
		}), /* @__PURE__ */ jsx(LiveRegion, { children: `Light ${l}, CO₂ ${c}, temperature ${t}. Rate ${(rate * 100).toFixed(0)}. Limiting factor: ${limiting}.` })] }),
		children: figure
	});
}

//#endregion
export { PhotosynthesisFactorsLab };