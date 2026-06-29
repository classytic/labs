'use client';

import { CrossGrid } from "./grid.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useLearner } from "@classytic/stage";

//#region src/biology/genetic-cross/sex-linked.tsx
/**
* SexLinkedCrossLab, an X-linked gene cross (colour blindness, haemophilia…) on
* the shared CrossGrid. The biology that's special, the Y carries no allele, so
* males are HEMIZYGOUS (a single recessive X shows), lives here; the grid/tally/
* predict UI is reused. The payoff: affected sons from a carrier mother, while
* daughters are carriers, not affected.
*/
const SUP = {
	A: "ᴬ",
	B: "ᴮ",
	C: "ᶜ",
	D: "ᴰ",
	G: "ᴳ",
	H: "ᴴ",
	N: "ᴺ",
	R: "ᴿ",
	a: "ᵃ",
	b: "ᵇ",
	c: "ᶜ",
	d: "ᵈ",
	g: "ᵍ",
	h: "ʰ",
	n: "ⁿ",
	r: "ʳ"
};
const xTok = (letter) => `X${SUP[letter] ?? `^${letter}`}`;
const COL = {
	domF: "var(--stage-good)",
	recF: "var(--stage-danger)",
	domM: "var(--stage-accent)",
	recM: "var(--stage-warn)"
};
function SexLinkedCrossLab({ allele = "B", dominant = "normal", recessive = "colour-blind", mother = ["B", "b"], father = "B", predictFirst = true, title, prompt, objectives }) {
	const L = allele;
	const XD = xTok(L.toUpperCase());
	const Xr = xTok(L.toLowerCase());
	const learner = useLearner();
	const reported = useRef(false);
	const toTok = (letter) => letter.toUpperCase() === letter ? XD : Xr;
	const [mom, setMom] = useState([toTok(mother[0]), toTok(mother[1])]);
	const [dad, setDad] = useState(toTok(father));
	const gametes1 = [[mom[0]], [mom[1]]];
	const gametes2 = [[dad], ["Y"]];
	const isDom = (t) => t === XD;
	const combine = (g1, g2) => {
		const mx = g1[0], fx = g2[0];
		if (fx === "Y") {
			const affected = !isDom(mx);
			return {
				genotype: `${mx}Y`,
				phenotype: {
					label: `${affected ? recessive : dominant} ♂`,
					color: affected ? COL.recM : COL.domM
				},
				note: `: males are hemizygous: one ${Xr} is enough to show ${recessive}`
			};
		}
		const xs = [mx, fx].sort((a, b) => (isDom(a) ? -1 : 1) - (isDom(b) ? -1 : 1));
		const domPresent = isDom(mx) || isDom(fx);
		const carrier = domPresent && (!isDom(mx) || !isDom(fx));
		return {
			genotype: `${xs[0]}${xs[1]}`,
			phenotype: {
				label: `${domPresent ? dominant : recessive} ♀`,
				color: domPresent ? COL.domF : COL.recF
			},
			note: carrier ? `: a carrier (one ${Xr}), ${dominant} herself but can pass it on` : ""
		};
	};
	const cycleMom = (i) => setMom((m) => m.map((t, j) => j === i ? t === XD ? Xr : XD : t));
	const cycleDad = () => setDad((d) => d === XD ? Xr : XD);
	const tokStyle = (t) => ({
		color: isDom(t) ? "var(--stage-good)" : "var(--stage-danger)",
		fontWeight: 800
	});
	const header = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 16,
			marginBottom: 12,
			flexWrap: "wrap",
			alignItems: "center"
		},
		children: [
			/* @__PURE__ */ jsxs("span", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 4
				},
				children: [
					"Mother ♀:",
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lab-chip",
						style: {
							minWidth: 34,
							...tokStyle(mom[0])
						},
						onClick: () => cycleMom(0),
						"aria-label": "mother first X allele",
						children: mom[0]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lab-chip",
						style: {
							minWidth: 34,
							...tokStyle(mom[1])
						},
						onClick: () => cycleMom(1),
						"aria-label": "mother second X allele",
						children: mom[1]
					})
				]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 4
				},
				children: [
					"Father ♂:",
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lab-chip",
						style: {
							minWidth: 34,
							...tokStyle(dad)
						},
						onClick: cycleDad,
						"aria-label": "father X allele",
						children: dad
					}),
					/* @__PURE__ */ jsx("span", {
						style: {
							fontWeight: 800,
							color: "var(--stage-muted)"
						},
						children: "Y"
					})
				]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: [
					"(tap an X allele to switch ",
					XD,
					"/",
					Xr,
					")"
				]
			})
		]
	});
	const legend = /* @__PURE__ */ jsxs("p", {
		style: {
			fontSize: 12,
			color: "var(--stage-muted)",
			margin: "0 0 8px"
		},
		children: [
			"X-linked gene: ",
			/* @__PURE__ */ jsx("b", {
				style: { color: "var(--stage-good)" },
				children: XD
			}),
			"=",
			dominant,
			" (dominant), ",
			/* @__PURE__ */ jsx("b", {
				style: { color: "var(--stage-danger)" },
				children: Xr
			}),
			"=",
			recessive,
			" (recessive). The ",
			/* @__PURE__ */ jsx("b", { children: "Y" }),
			" carries no copy."
		]
	});
	return /* @__PURE__ */ jsx(CrossGrid, {
		gametes1,
		gametes2,
		gameteLabel: (g) => g[0],
		combine,
		traitLabel: "phenotype & sex",
		resetKey: JSON.stringify([mom, dad]),
		predictFirst,
		header,
		legend,
		title: title ?? "Sex linkage, why mostly sons are affected",
		prompt: prompt ?? "The gene rides on the X. A carrier mother passes it to half her sons, who, with no second X, show it.",
		objectives,
		showGenotypeTally: true,
		onReveal: () => {
			if (!reported.current) {
				reported.current = true;
				learner?.report({
					activity: "sex-linked-cross",
					correct: true,
					score: {
						raw: 1,
						max: 1
					},
					completion: true
				});
			}
		}
	});
}

//#endregion
export { SexLinkedCrossLab };