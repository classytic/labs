'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { pHAt, titrationCurve } from "@classytic/stage/chem";

//#region src/chem/titration/preset.tsx
/**
* TitrationLab, add base to an acid drop by drop and watch the pH curve build, on
* the shared `@classytic/stage/chem` acid–base kernel (pH solved exactly from the
* charge balance at every volume).
*
* A burette of strong base drips into a flask of acid; the phenolphthalein indicator
* stays colourless and flips pink past pH ≈ 8.3. The curve on the right shows the
* signature shape: a gentle start, then for a WEAK acid a flat BUFFER region whose
* midpoint sits at pH = pKa, a steep jump through the equivalence point, and a
* levelling-off in excess base. A strong acid skips the buffer and crosses pH 7 at
* equivalence; a weak acid's equivalence point is basic (pH > 7). Interactive, drag
* the volume, no simulation loop.
*/
const W = 720, H = 400;
const PINK = "rgb(214,51,132)";
/** Predict the two facts the curve hides: pKa lives at the half-equivalence point, and a weak acid's equivalence point is basic. */
const TITRATION_CHALLENGE = [{
	id: "half-eq",
	prompt: "At the half-equivalence point of a WEAK acid, the pH equals…",
	choices: [
		{
			value: "pka",
			label: "pKa"
		},
		{
			value: "seven",
			label: "7"
		},
		{
			value: "pkw",
			label: "14 − pKa"
		}
	],
	answer: "pka",
	explain: "Half-neutralised means [A⁻] = [HA], so the Henderson–Hasselbalch log term is zero and pH = pKa."
}, {
	id: "equiv",
	prompt: "The equivalence point of a WEAK acid titrated with strong base is…",
	choices: [
		{
			value: "acidic",
			label: "acidic (pH < 7)"
		},
		{
			value: "neutral",
			label: "neutral (pH = 7)"
		},
		{
			value: "basic",
			label: "basic (pH > 7)"
		}
	],
	answer: "basic",
	explain: "All acid is now its conjugate base, which hydrolyses water to give pH > 7. (A strong acid would cross pH 7.)"
}];
function TitrationLab({ analyte: analyte0 = "weak-acid", concAcid = .1, volAcidMl = 25, concBase = .1, pKa: pKa0 = 4.76, title = "Acid–base titration: build the pH curve", prompt = "Drip strong base into the acid and track the pH. Watch the buffer region, the steep jump at the equivalence point, and the indicator flip pink.", objectives = [
	"Read a titration curve: start, buffer, equivalence jump, excess base",
	"For a weak acid, see the half-equivalence pH equals the pKa",
	"See the equivalence pH is 7 for a strong acid but >7 for a weak acid"
] } = {}) {
	const Ca = concAcid, Va = volAcidMl / 1e3, Cb = concBase;
	const [analyte, setAnalyte] = useState(analyte0);
	const [pKa, setPKa] = useState(pKa0);
	const [vAddedMl, setVAddedMl] = useState(12);
	const challenge = useChallenge(TITRATION_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "titration"
	});
	const spec = useMemo(() => ({
		analyte,
		Ca,
		Va,
		Cb,
		pKa
	}), [
		analyte,
		Ca,
		Va,
		Cb,
		pKa
	]);
	const curve = useMemo(() => titrationCurve(spec), [spec]);
	const weak = analyte === "weak-acid";
	const vEqMl = curve.vEq * 1e3;
	const vMaxMl = vEqMl * 2;
	const pH = pHAt(spec, Math.min(vAddedMl, vMaxMl) / 1e3);
	const GX0 = 360, GX1 = 700, GY0 = 30, GY1 = 330;
	const PXv = (ml) => GX0 + ml / vMaxMl * (GX1 - GX0);
	const PYp = (p) => GY1 - p / 14 * (GY1 - GY0);
	const path = curve.points.map((pt) => `${PXv(pt.v * 1e3).toFixed(1)},${PYp(pt.pH).toFixed(1)}`).join(" ");
	const pink = Math.max(0, Math.min(1, (pH - 8.3) / 1.7));
	vAddedMl / vEqMl;
	const region = vAddedMl < vEqMl * .04 ? "initial acid" : Math.abs(vAddedMl - vEqMl) < vEqMl * .04 ? "equivalence point" : vAddedMl > vEqMl ? "excess base" : weak ? "buffer region" : "before equivalence";
	const burX = 120, burTop = 40, burH = 150, burW = 26;
	const titTop = burTop + Math.min(1, vAddedMl / vMaxMl) * (burH - 20);
	const flaskCx = burX, flaskTop = 250, flaskBot = 348;
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `Titration, ${vAddedMl.toFixed(1)} millilitres added, pH ${pH.toFixed(2)}, ${region}`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: burX - burW / 2,
					y: burTop,
					width: burW,
					height: burH,
					rx: 4,
					fill: "var(--stage-bg)",
					stroke: "var(--stage-metal)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("rect", {
					x: 109,
					y: titTop,
					width: burW - 4,
					height: 190 - titTop - 2,
					fill: "color-mix(in oklab, var(--stage-accent) 30%, transparent)"
				}),
				[
					.25,
					.5,
					.75
				].map((t) => /* @__PURE__ */ jsx("line", {
					x1: 133,
					y1: burTop + t * burH,
					x2: 138,
					y2: burTop + t * burH,
					stroke: "var(--stage-muted)",
					strokeWidth: 1
				}, t)),
				/* @__PURE__ */ jsx("text", {
					x: 141,
					y: 50,
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: "NaOH"
				}),
				/* @__PURE__ */ jsx("path", {
					d: `M ${burX - 4} 190 L 124 190 L ${burX} 200 Z`,
					fill: "var(--stage-metal)"
				}),
				vAddedMl < vMaxMl && /* @__PURE__ */ jsx("circle", {
					cx: burX,
					cy: 214,
					r: 3,
					fill: "color-mix(in oklab, var(--stage-accent) 40%, transparent)"
				}),
				/* @__PURE__ */ jsx("path", {
					d: `M ${flaskCx - 10} ${flaskTop} L ${flaskCx - 10} 264 L ${flaskCx - 44} ${flaskBot - 6} Q ${flaskCx - 46} ${flaskBot} ${flaskCx - 40} ${flaskBot} L 160 ${flaskBot} Q 166 ${flaskBot} 164 ${flaskBot - 6} L 130 264 L 130 ${flaskTop} Z`,
					fill: `color-mix(in oklab, ${PINK} ${(pink * 70).toFixed(0)}%, color-mix(in oklab, var(--stage-accent) 8%, var(--stage-bg)))`,
					stroke: "var(--stage-metal)",
					strokeWidth: 2,
					strokeLinejoin: "round"
				}),
				/* @__PURE__ */ jsx("text", {
					x: flaskCx,
					y: 364,
					textAnchor: "middle",
					fontSize: 11,
					fill: "var(--stage-muted)",
					children: pink > .5 ? "pink, past end point" : "colourless"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: GX0,
					y1: GY0,
					x2: GX0,
					y2: GY1,
					stroke: "var(--stage-fg)",
					strokeWidth: 1.5
				}),
				/* @__PURE__ */ jsx("line", {
					x1: GX0,
					y1: GY1,
					x2: GX1,
					y2: GY1,
					stroke: "var(--stage-fg)",
					strokeWidth: 1.5
				}),
				[
					0,
					7,
					14
				].map((p) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
					x1: GX0 - 4,
					y1: PYp(p),
					x2: GX0,
					y2: PYp(p),
					stroke: "var(--stage-muted)",
					strokeWidth: 1
				}), /* @__PURE__ */ jsx("text", {
					x: GX0 - 7,
					y: PYp(p) + 3,
					textAnchor: "end",
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: p
				})] }, p)),
				/* @__PURE__ */ jsx("text", {
					x: GX0 - 7,
					y: GY0 - 4,
					textAnchor: "end",
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: "pH"
				}),
				/* @__PURE__ */ jsx("text", {
					x: GX1,
					y: 348,
					textAnchor: "end",
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: "base added (mL) →"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: GX0,
					y1: PYp(7),
					x2: GX1,
					y2: PYp(7),
					stroke: "var(--stage-grid)",
					strokeWidth: 1,
					strokeDasharray: "3 4"
				}),
				weak && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx("rect", {
						x: PXv(vEqMl * .15),
						y: GY0,
						width: PXv(vEqMl * .85) - PXv(vEqMl * .15),
						height: GY1 - GY0,
						fill: "var(--stage-good)",
						opacity: .08
					}),
					/* @__PURE__ */ jsx("line", {
						x1: PXv(vEqMl / 2),
						y1: PYp(curve.pHHalf),
						x2: PXv(vEqMl / 2),
						y2: GY1,
						stroke: "var(--stage-good)",
						strokeWidth: 1,
						strokeDasharray: "3 3"
					}),
					/* @__PURE__ */ jsx("text", {
						x: PXv(vEqMl / 2),
						y: PYp(curve.pHHalf) - 6,
						textAnchor: "middle",
						fontSize: 9.5,
						fontWeight: 700,
						fill: "var(--stage-good)",
						children: "½eq · pH=pKa"
					})
				] }),
				/* @__PURE__ */ jsx("circle", {
					cx: PXv(vEqMl),
					cy: PYp(curve.pHEq),
					r: 4,
					fill: "var(--stage-warn)"
				}),
				/* @__PURE__ */ jsxs("text", {
					x: PXv(vEqMl),
					y: PYp(curve.pHEq) - 8,
					textAnchor: "middle",
					fontSize: 9.5,
					fontWeight: 700,
					fill: "var(--stage-warn)",
					children: [
						"equiv. ",
						vEqMl.toFixed(0),
						" mL"
					]
				}),
				/* @__PURE__ */ jsx("polyline", {
					points: path,
					fill: "none",
					stroke: "var(--stage-accent)",
					strokeWidth: 3,
					strokeLinejoin: "round",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: PXv(vAddedMl),
					cy: PYp(pH),
					r: 6,
					fill: pink > .5 ? PINK : "var(--stage-fg)",
					stroke: "var(--stage-bg)",
					strokeWidth: 2
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
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
						fontSize: 18
					},
					children: ["pH ", pH.toFixed(2)]
				}), /* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 13,
						color: "var(--stage-muted)"
					},
					children: [
						vAddedMl.toFixed(1),
						" mL added · ",
						region
					]
				})]
			})
		}), /* @__PURE__ */ jsx("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: weak ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\text{pH} = \\text{p}K_a + \\log\\dfrac{[\\mathrm{A^-}]}{[\\mathrm{HA}]}",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"In the buffer region the pH barely moves, at the half-equivalence point [A⁻] = [HA] so ",
					/* @__PURE__ */ jsxs("strong", {
						style: { color: "var(--stage-fg)" },
						children: ["pH = pKa = ", pKa.toFixed(2)]
					}),
					". The equivalence point is ",
					/* @__PURE__ */ jsxs("strong", {
						style: { color: "var(--stage-fg)" },
						children: [
							"basic (pH ",
							curve.pHEq.toFixed(1),
							")"
						]
					}),
					" because the conjugate base hydrolyses."
				]
			})] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\text{pH} = -\\log[\\mathrm{H^+}]",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"A strong acid is fully dissociated, so the pH climbs slowly then leaps through ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "pH 7"
					}),
					" at the equivalence point and levels off in excess base."
				]
			})] })
		})] }),
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "acid in the flask",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: !weak,
						onClick: () => setAnalyte("strong-acid"),
						children: "strong acid (HCl)"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: weak,
						onClick: () => setAnalyte("weak-acid"),
						children: "weak acid (CH₃COOH)"
					})]
				})
			}), weak && /* @__PURE__ */ jsx(Field, {
				label: "pKa",
				value: pKa.toFixed(2),
				children: /* @__PURE__ */ jsx(Slider, {
					value: pKa,
					min: 3,
					max: 6,
					step: .1,
					onChange: setPKa,
					ariaLabel: "acid pKa"
				})
			})] }), /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "base added",
				value: `${vAddedMl.toFixed(1)} mL`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: vAddedMl,
					min: 0,
					max: vMaxMl,
					step: .5,
					onChange: setVAddedMl,
					ariaLabel: "volume of base added (mL)"
				})
			}) })]
		}),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: TITRATION_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { TitrationLab };