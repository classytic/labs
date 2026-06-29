'use client';

import { Callout, LabFrame } from "../../kit/frame.mjs";
import { RevealSolution } from "../../kit/pedagogy.mjs";
import { Blank, SlotTray, useSlotFill } from "../../kit/slot-fill.mjs";
import { ClueScene, UnknownChip, clueTotal } from "../../kit/clue-scene.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/math/system-solve/preset.tsx
/**
* SystemSolveLab, two unknowns, two clues, solved by ELIMINATION, not just "drag to the
* crossing point". The existing linear-system lab only shows the graph; this teaches the
* method: line the clues up, cancel the matching column, read one unknown, back-substitute.
*
* The point the brief asked for: it's CONCRETE and SWAPPABLE. The maths is data (each clue
* is coefficients over the unknowns), and the scene that renders a clue is pluggable, a
* shop receipt, a bucket balance, or bare tiles, all from one config. A creator sets the
* unknowns (with their hidden values), the clue coefficients, and picks a scene, no code; the
* totals are computed so the puzzle is always consistent, and the worked method is generated.
*/
const DEFAULT_UNKNOWNS = [{
	sym: "🍍",
	label: "Pineapple",
	color: "var(--stage-warn)",
	answer: 5
}, {
	sym: "🥭",
	label: "Mango",
	color: "var(--stage-good)",
	answer: 2
}];
const DEFAULT_CLUES = [{ coeffs: [2, 1] }, { coeffs: [1, 1] }];
/** Generate a concrete elimination walkthrough for the 2×2 case (else a generic hint). */
function eliminationSteps(unknowns, clues) {
	if (unknowns.length !== 2 || clues.length !== 2) return ["Line the clues up, scale one so a column matches, then subtract to cancel an unknown and back-substitute."];
	const [c0, c1] = clues;
	const t0 = clueTotal(c0, unknowns), t1 = clueTotal(c1, unknowns);
	const keep = c0.coeffs[0] === c1.coeffs[0] ? 1 : c0.coeffs[1] === c1.coeffs[1] ? 0 : -1;
	if (keep < 0) return ["Scale one clue so a column matches the other, then subtract to cancel that unknown and back-substitute."];
	const cancel = keep === 0 ? 1 : 0;
	const kU = unknowns[keep], cU = unknowns[cancel];
	const diffCoeff = c0.coeffs[keep] - c1.coeffs[keep];
	const diffTotal = t0 - t1;
	const kVal = diffTotal / diffCoeff;
	return [
		/* @__PURE__ */ jsxs(Fragment$1, { children: [
			"Both clues have the same number of ",
			cU.sym,
			", so subtract them: ",
			t0,
			" − ",
			t1,
			" = ",
			diffTotal,
			", and the ",
			cU.sym,
			" cancels."
		] }),
		/* @__PURE__ */ jsxs(Fragment$1, { children: [
			"That leaves ",
			diffCoeff === 1 ? "" : diffCoeff,
			kU.sym,
			" = ",
			diffTotal,
			", so ",
			/* @__PURE__ */ jsxs("strong", { children: [
				kU.sym,
				" = ",
				kVal
			] }),
			"."
		] }),
		/* @__PURE__ */ jsxs(Fragment$1, { children: [
			"Put ",
			kU.sym,
			" = ",
			kVal,
			" back into a clue to get ",
			/* @__PURE__ */ jsxs("strong", { children: [
				cU.sym,
				" = ",
				cU.answer
			] }),
			"."
		] })
	];
}
function SystemSolveLab(props = {}) {
	const { unknowns = DEFAULT_UNKNOWNS, clues = DEFAULT_CLUES, scene = "receipt", currency, unit, store, distractors = [], title = "Two clues, two unknowns", prompt = "Each clue gives a total. Use both to find the value of each item.", activity = "system-solve" } = props;
	const slots = unknowns.map((u, i) => ({
		id: `u${i}`,
		answer: u.answer,
		label: /* @__PURE__ */ jsx(UnknownChip, {
			u,
			size: 22
		})
	}));
	const pool = new Set(distractors);
	unknowns.forEach((u) => {
		pool.add(u.answer);
		pool.add(u.answer + 1);
		pool.add(Math.max(0, u.answer - 1));
		pool.add(u.answer + 2);
	});
	clues.forEach((c) => pool.add(clueTotal(c, unknowns)));
	const tiles = [...pool].filter((v) => v >= 0).sort((a, b) => a - b);
	const [revealed, setRevealed] = useState(false);
	const fill = useSlotFill(slots, tiles, activity, () => setRevealed(true));
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			gap: 16,
			justifyContent: "center",
			flexWrap: "wrap",
			alignItems: "center"
		},
		children: clues.map((clue, i) => /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 4,
				justifyItems: "center"
			},
			children: [/* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 11,
					fontWeight: 700,
					color: "var(--stage-muted)"
				},
				children: ["Clue ", i + 1]
			}), /* @__PURE__ */ jsx(ClueScene, {
				kind: scene,
				clue,
				unknowns,
				currency,
				unit,
				store
			})]
		}, i))
	});
	const steps = eliminationSteps(unknowns, clues);
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		footer: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 14,
				justifyItems: "center",
				marginTop: 4
			},
			children: [
				/* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						gap: 18,
						flexWrap: "wrap",
						justifyContent: "center",
						fontSize: 17,
						fontWeight: 700
					},
					children: unknowns.map((u, i) => /* @__PURE__ */ jsxs("span", {
						style: {
							display: "inline-flex",
							alignItems: "center",
							gap: 6
						},
						children: [
							/* @__PURE__ */ jsx(UnknownChip, {
								u,
								size: 26
							}),
							" = ",
							/* @__PURE__ */ jsx(Blank, {
								fill,
								id: `u${i}`
							})
						]
					}, i))
				}),
				/* @__PURE__ */ jsx(SlotTray, { fill }),
				fill.solved ? /* @__PURE__ */ jsx("p", {
					role: "status",
					style: {
						margin: 0,
						color: "var(--stage-good)",
						fontWeight: 700
					},
					children: "✓ Both clues check out."
				}) : /* @__PURE__ */ jsx(RevealSolution, {
					buttonLabel: "How do I solve it?",
					note: "A worked method, try the elimination yourself first.",
					solution: /* @__PURE__ */ jsx("ol", {
						style: {
							margin: 0,
							paddingLeft: 18,
							display: "grid",
							gap: 6,
							fontSize: 14
						},
						children: steps.map((s, i) => /* @__PURE__ */ jsx("li", { children: s }, i))
					})
				}),
				revealed && /* @__PURE__ */ jsx(Callout, {
					tone: "result",
					children: /* @__PURE__ */ jsxs("span", {
						style: { fontSize: 13 },
						children: [
							"Solved: ",
							unknowns.map((u, i) => /* @__PURE__ */ jsxs("span", { children: [
								i > 0 ? ", " : "",
								u.sym,
								" = ",
								/* @__PURE__ */ jsx("strong", { children: u.answer })
							] }, i)),
							"."
						]
					})
				})
			]
		}),
		children: figure
	});
}

//#endregion
export { SystemSolveLab };