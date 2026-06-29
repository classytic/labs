'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { solveStoichiometry } from "@classytic/stage/chem";

//#region src/chem/stoichiometry/preset.tsx
/**
* StoichiometryLab, the limiting reagent, seen as a recipe. A balanced reaction is
* a recipe (2 H₂ + O₂ → 2 H₂O = "2 hydrogens and 1 oxygen make 2 waters"); given how
* much of each reactant you have, the one that runs out first caps how much product
* you can make, and the rest is left over.
*
* Each reactant is a tray of molecule tokens: the part CONSUMED is solid, the
* LEFTOVER fades out, so the limiting reagent is the tray that empties completely
* (highlighted), and the excess shows as faded tokens. The product tray fills with
* what's formed. Backed by `solveStoichiometry` (@classytic/stage/chem): extent,
* limiting reagent, product moles/grams and leftovers. Drag the amounts, pick a
* reaction (or author your own); interactive, no loop.
*/
const PRESETS = {
	water: {
		reactants: [{
			name: "H₂",
			coeff: 2,
			color: "var(--stage-accent, #3b82f6)"
		}, {
			name: "O₂",
			coeff: 1,
			color: "var(--stage-danger, #e03131)"
		}],
		products: [{
			name: "H₂O",
			coeff: 2,
			molarMass: 18,
			color: "rgb(40,160,200)"
		}],
		defaults: [4, 3]
	},
	ammonia: {
		reactants: [{
			name: "N₂",
			coeff: 1,
			color: "rgb(70,110,210)"
		}, {
			name: "H₂",
			coeff: 3,
			color: "var(--stage-accent, #3b82f6)"
		}],
		products: [{
			name: "NH₃",
			coeff: 2,
			molarMass: 17,
			color: "var(--stage-good, #16a34a)"
		}],
		defaults: [2, 5]
	},
	methane: {
		reactants: [{
			name: "CH₄",
			coeff: 1,
			color: "rgb(120,130,150)"
		}, {
			name: "O₂",
			coeff: 2,
			color: "var(--stage-danger, #e03131)"
		}],
		products: [{
			name: "CO₂",
			coeff: 1,
			molarMass: 44,
			color: "rgb(90,90,110)"
		}, {
			name: "H₂O",
			coeff: 2,
			molarMass: 18,
			color: "rgb(40,160,200)"
		}],
		defaults: [3, 5]
	},
	rust: {
		reactants: [{
			name: "Fe",
			coeff: 4,
			color: "rgb(150,110,70)"
		}, {
			name: "O₂",
			coeff: 3,
			color: "var(--stage-danger, #e03131)"
		}],
		products: [{
			name: "Fe₂O₃",
			coeff: 2,
			molarMass: 160,
			color: "rgb(170,80,40)"
		}],
		defaults: [8, 5]
	}
};
const ORDER = [
	"water",
	"ammonia",
	"methane",
	"rust"
];
const LABEL = {
	water: "Water",
	ammonia: "Ammonia (Haber)",
	methane: "Methane burning",
	rust: "Rusting"
};
const W = 720, H = 330;
const STOICH_CHALLENGE = [{
	id: "which",
	prompt: "The limiting reagent is the reactant that…",
	choices: [
		{
			value: "runsout",
			label: "runs out first (smallest moles ÷ coefficient)"
		},
		{
			value: "least",
			label: "you simply have the fewest moles of"
		},
		{
			value: "smallcoeff",
			label: "has the smallest coefficient"
		}
	],
	answer: "runsout",
	explain: "Compare moles ÷ coefficient for each reactant, the smallest is the limiting one. Raw moles or the coefficient alone can mislead."
}, {
	id: "excess",
	prompt: "Adding MORE of the reactant that is already in excess changes the product made by…",
	choices: [
		{
			value: "none",
			label: "nothing: it just piles up as leftover"
		},
		{
			value: "more",
			label: "making proportionally more product"
		},
		{
			value: "less",
			label: "making less product"
		}
	],
	answer: "none",
	explain: "Only the limiting reagent caps the yield. Excess reactant can’t react without more of the limiting one, so it’s left over."
}];
const co = (n) => n === 1 ? "" : `${n} `;
const eqn = (rx) => `${rx.reactants.map((s) => co(s.coeff) + s.name).join(" + ")}  →  ${rx.products.map((s) => co(s.coeff) + s.name).join(" + ")}`;
const fmt = (n) => Math.abs(n - Math.round(n)) < 1e-6 ? Math.round(n).toString() : n.toFixed(2);
function StoichiometryLab({ reaction = "water", amounts: amounts0, reactants: customR, products: customP, title = "Stoichiometry: the limiting reagent", prompt = "A balanced equation is a recipe. Whichever reactant runs out first limits how much product you can make, the rest is left over. Drag the amounts and watch.", objectives = [
	"Read a balanced equation as a mole ratio (a recipe)",
	"Find the limiting reagent: the one that runs out first (smallest moles ÷ coeff)",
	"Work out the product formed and the reactant left in excess"
] } = {}) {
	const [preset, setPreset] = useState(reaction);
	const rx = customR && customP ? {
		reactants: customR,
		products: customP,
		defaults: customR.map(() => 4)
	} : PRESETS[preset];
	const [amounts, setAmounts] = useState(amounts0 ?? rx.defaults);
	const amt = rx.reactants.map((_, i) => amounts[i] ?? rx.defaults[i] ?? 4);
	const res = useMemo(() => solveStoichiometry(rx.reactants, rx.products, amt), [rx, amt.join(",")]);
	const switchPreset = (p) => {
		setPreset(p);
		setAmounts(PRESETS[p].defaults);
	};
	const challenge = useChallenge(STOICH_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "stoichiometry"
	});
	const setAmt = (i, v) => setAmounts((a) => {
		const n = [...a.length ? a : rx.defaults];
		n[i] = v;
		return n;
	});
	const tray = (cx, top, count, solidUpto, color, max = 12) => {
		const n = Math.min(max, Math.ceil(count - 1e-9));
		return Array.from({ length: n }, (_, k) => {
			const opacity = .2 + .8 * Math.max(0, Math.min(1, solidUpto - k));
			const col = k % 3, row = Math.floor(k / 3);
			return /* @__PURE__ */ jsx("circle", {
				cx: cx - 22 + col * 22,
				cy: top + row * 22,
				r: 9,
				fill: color,
				opacity,
				stroke: "var(--stage-bg)",
				strokeWidth: 1.5
			}, k);
		});
	};
	const nR = rx.reactants.length, nP = rx.products.length;
	const rXs = nR === 1 ? [150] : [105, 235];
	const arrowX = 350;
	const pXs = nP === 1 ? [520] : [475, 605];
	const top = 90;
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				textAlign: "center",
				fontSize: 17,
				fontWeight: 700,
				padding: "12px 8px 4px",
				letterSpacing: .3
			},
			children: eqn(rx)
		}), /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `limiting reagent ${res.limiting.join(" and ")}, ${fmt(res.products[0].moles)} mol product`,
			children: [
				rx.reactants.map((s, i) => {
					const isLim = res.limiting.includes(s.name);
					return /* @__PURE__ */ jsxs("g", { children: [
						isLim && /* @__PURE__ */ jsx("rect", {
							x: rXs[i] - 42,
							y: top - 30,
							width: 84,
							height: 132,
							rx: 8,
							fill: "none",
							stroke: "var(--stage-danger, #e03131)",
							strokeWidth: 2,
							strokeDasharray: "5 3"
						}),
						/* @__PURE__ */ jsxs("text", {
							x: rXs[i],
							y: top - 14,
							textAnchor: "middle",
							fontSize: 13,
							fontWeight: 700,
							fill: "var(--stage-fg)",
							children: [co(s.coeff), s.name]
						}),
						tray(rXs[i], 94, amt[i], res.consumed[i], s.color),
						/* @__PURE__ */ jsx("text", {
							x: rXs[i],
							y: 206,
							textAnchor: "middle",
							fontSize: 11,
							fill: isLim ? "var(--stage-danger, #e03131)" : "var(--stage-muted)",
							children: isLim ? "limiting" : `${fmt(res.leftover[i])} left`
						})
					] }, s.name);
				}),
				/* @__PURE__ */ jsx("line", {
					x1: arrowX - 24,
					y1: 130,
					x2: 374,
					y2: 130,
					stroke: "var(--stage-fg)",
					strokeWidth: 2.5
				}),
				/* @__PURE__ */ jsx("polygon", {
					points: `374,130 364,124 364,136`,
					fill: "var(--stage-fg)"
				}),
				rx.products.map((s, j) => /* @__PURE__ */ jsxs("g", { children: [
					/* @__PURE__ */ jsxs("text", {
						x: pXs[j],
						y: top - 14,
						textAnchor: "middle",
						fontSize: 13,
						fontWeight: 700,
						fill: "var(--stage-fg)",
						children: [co(s.coeff), s.name]
					}),
					tray(pXs[j], 94, res.products[j].moles, res.products[j].moles, s.color),
					/* @__PURE__ */ jsxs("text", {
						x: pXs[j],
						y: 206,
						textAnchor: "middle",
						fontSize: 11,
						fill: "var(--stage-good, #16a34a)",
						children: [fmt(res.products[j].moles), " mol"]
					})
				] }, s.name))
			]
		})]
	});
	const p0 = res.products[0];
	const aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: /* @__PURE__ */ jsxs("span", {
			style: {
				display: "grid",
				gap: 2,
				fontVariantNumeric: "tabular-nums"
			},
			children: [/* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 800,
					fontSize: 15
				},
				children: ["limiting: ", res.limiting.join(" & ")]
			}), /* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 13,
					color: "var(--stage-muted)"
				},
				children: [
					fmt(p0.moles),
					" mol ",
					p0.name,
					p0.grams != null ? ` (${fmt(p0.grams)} g)` : ""
				]
			})]
		})
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 6,
			padding: "8px 2px 0",
			fontSize: 13,
			color: "var(--stage-muted)"
		},
		children: [/* @__PURE__ */ jsxs("span", { children: [
			"The ",
			/* @__PURE__ */ jsx("strong", {
				style: { color: "var(--stage-danger, #e03131)" },
				children: res.limiting.join(" & ")
			}),
			" runs out first (smallest moles ÷ coefficient), so it caps the yield. Add more of it to make more product; add more of the other and it just piles up as excess."
		] }), rx.reactants.some((s, i) => !res.limiting.includes(s.name) && res.leftover[i] > 1e-6) && /* @__PURE__ */ jsxs("span", { children: [
			"Left over: ",
			rx.reactants.map((s, i) => res.leftover[i] > 1e-6 && !res.limiting.includes(s.name) ? `${fmt(res.leftover[i])} mol ${s.name}` : null).filter(Boolean).join(", "),
			"."
		] })]
	})] });
	const footer = /* @__PURE__ */ jsx(ChallengeCard, {
		questions: STOICH_CHALLENGE,
		state: challenge,
		title: "Predict first"
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "reaction",
				children: /* @__PURE__ */ jsx("span", {
					className: "lab-field-row",
					style: { flexWrap: "wrap" },
					children: ORDER.map((p) => /* @__PURE__ */ jsx(Chip, {
						selected: !customR && preset === p,
						onClick: () => switchPreset(p),
						children: LABEL[p]
					}, p))
				})
			}) }), /* @__PURE__ */ jsx(ControlBar, { children: rx.reactants.map((s, i) => /* @__PURE__ */ jsx(Field, {
				label: `${s.name}`,
				value: `${fmt(amt[i])} mol`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: amt[i],
					min: 1,
					max: 10,
					step: 1,
					onChange: (v) => setAmt(i, v),
					ariaLabel: `amount of ${s.name} in moles`
				})
			}, s.name)) })]
		}),
		footer,
		children: figure
	});
}

//#endregion
export { StoichiometryLab };