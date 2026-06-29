'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { AngleArc, RightAngleMark } from "../../kit/diagram.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Grid, Label, Plot, Segment, Stage, Vector } from "@classytic/stage";

//#region src/math/harmonic-form/preset.tsx
/**
* HarmonicFormLab, "two waves are secretly one": a cos x + b sin x = R cos(x + α).
*
* The whole insight is that adding a cosine and a sine of the SAME frequency gives
* a SINGLE shifted cosine, and you can SEE why with phasors. The cos term is a
* vector of length a along the axis; the sin term is a vector of length b at a
* right angle to it (sin lags cos by 90°). Add them tip-to-tail and the resultant
* has length R = √(a²+b²) at angle α, exactly the amplitude and phase of the one
* combined wave. Drag a and b: the phasor triangle and the three waves update live,
* and the messy two-wave sum visibly collapses onto one clean R cos(x + α).
*
* This builds the INTUITION for the auxiliary-angle form (Edexcel "express in the
* form R cos(x+α)"). The exact R and α arithmetic is left to written working / a
* paired derivation, the lab is the picture, not the algebra.
*
* Convention: a cos x + b sin x = R cos(x + α) ⇒ a = R cos α, b = −R sin α, so
* α = atan2(−b, a) and the resultant phasor is (a, −b). Tokenized SVG; accessible.
*/
const LIM = 8;
const PHV = 9;
const WAV = 12;
const C_COS = "var(--stage-accent-2)";
const C_SIN = "var(--stage-warn)";
const C_R = "var(--stage-good)";
const HARMONIC_CHALLENGE = [{
	id: "shape",
	prompt: "a cos x + b sin x (same frequency) always combines into…",
	choices: [
		{
			value: "one",
			label: "one shifted cosine wave"
		},
		{
			value: "two",
			label: "two separate waves"
		},
		{
			value: "double",
			label: "a wave of double the frequency"
		}
	],
	answer: "one",
	explain: "Same frequency in → same frequency out: only the amplitude (R) and the phase (α) change."
}, {
	id: "amp",
	prompt: "Keep a fixed and increase |b|. The amplitude R of the combined wave…",
	choices: [
		{
			value: "up",
			label: "increases"
		},
		{
			value: "down",
			label: "decreases"
		},
		{
			value: "same",
			label: "stays the same"
		}
	],
	answer: "up",
	explain: "R = √(a² + b²) is the hypotenuse, growing either coefficient lengthens it."
}];
/** LaTeX for "a cos x ± b sin x", tidy for ±1 / 0 coefficients. */
function lhsTex(a, b) {
	const cosPart = `${a === 1 ? "" : a === -1 ? "-" : a}\\cos x`;
	const bAbs = Math.abs(b);
	const sinPart = `${bAbs === 1 ? "" : bAbs}\\sin x`;
	return `${cosPart} ${b < 0 ? "-" : "+"} ${sinPart}`;
}
function HarmonicFormLab({ a: a0 = 4, b: b0 = -3, title = "Express a cos x + b sin x as one wave R cos(x + α)", prompt = "A cosine plus a sine of the same frequency is secretly a single shifted cosine. Drag a and b and watch the phasors add up.", objectives } = {}) {
	const [a, setA] = useState(a0);
	const [b, setB] = useState(b0);
	const [showComp, setShowComp] = useState(true);
	const challenge = useChallenge(HARMONIC_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "harmonic-form"
	});
	const R = Math.hypot(a, b);
	const alpha = Math.atan2(-b, a);
	const sum = (x) => a * Math.cos(x) + b * Math.sin(x);
	const O = {
		x: 0,
		y: 0
	};
	const corner = {
		x: a,
		y: 0
	};
	const tip = {
		x: a,
		y: -b
	};
	const peakX = -alpha;
	const phasor = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -9,
			xMax: PHV,
			yMin: -9,
			yMax: PHV
		},
		height: 280,
		ariaLabel: `Phasor diagram: cosine component ${a}, sine component ${b}, resultant length ${R.toFixed(2)}`,
		children: [
			/* @__PURE__ */ jsx(Grid, { step: 3 }),
			/* @__PURE__ */ jsx(Axes, {}),
			showComp && a !== 0 && /* @__PURE__ */ jsx(Vector, {
				tail: O,
				tip: corner,
				color: C_COS,
				weight: 2.5
			}),
			showComp && b !== 0 && /* @__PURE__ */ jsx(Vector, {
				tail: corner,
				tip,
				color: C_SIN,
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(Vector, {
				tail: O,
				tip,
				color: C_R,
				weight: 3.5
			}),
			a !== 0 && b !== 0 && /* @__PURE__ */ jsx(RightAngleMark, {
				at: corner,
				u: {
					x: -1,
					y: 0
				},
				v: {
					x: 0,
					y: -b
				}
			}),
			R > .5 && /* @__PURE__ */ jsx(AngleArc, {
				at: O,
				from: {
					x: 1,
					y: 0
				},
				to: tip,
				rPx: 28,
				label: "α"
			}),
			showComp && a !== 0 && /* @__PURE__ */ jsx(Label, {
				x: a / 2,
				y: 0,
				text: "a",
				color: C_COS,
				size: 13,
				dy: 16
			}),
			showComp && b !== 0 && /* @__PURE__ */ jsx(Label, {
				x: a,
				y: -b / 2,
				text: "b",
				color: C_SIN,
				size: 13,
				dx: 14
			}),
			/* @__PURE__ */ jsx(Label, {
				x: tip.x / 2,
				y: tip.y / 2,
				text: "R",
				color: C_R,
				size: 14,
				dx: -12,
				dy: -6
			})
		]
	});
	const waves = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -Math.PI,
			xMax: 2 * Math.PI,
			yMin: -12,
			yMax: WAV
		},
		height: 280,
		preserveAspect: false,
		ariaLabel: "The cosine term, the sine term, and their combined single wave",
		children: [
			/* @__PURE__ */ jsx(Grid, {}),
			/* @__PURE__ */ jsx(Axes, {}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: -Math.PI,
					y: R
				},
				to: {
					x: 2 * Math.PI,
					y: R
				},
				color: C_R,
				weight: 1,
				dashed: true,
				opacity: .4
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: -Math.PI,
					y: -R
				},
				to: {
					x: 2 * Math.PI,
					y: -R
				},
				color: C_R,
				weight: 1,
				dashed: true,
				opacity: .4
			}),
			showComp && /* @__PURE__ */ jsx(Plot.OfX, {
				y: (x) => a * Math.cos(x),
				color: C_COS,
				weight: 1.5
			}),
			showComp && /* @__PURE__ */ jsx(Plot.OfX, {
				y: (x) => b * Math.sin(x),
				color: C_SIN,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Plot.OfX, {
				y: sum,
				color: C_R,
				weight: 3
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: peakX,
					y: 0
				},
				to: {
					x: peakX,
					y: R
				},
				color: "var(--stage-fg)",
				weight: 1,
				dashed: true,
				opacity: .4
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: peakX,
				y: R,
				r: 5,
				color: C_R
			}),
			/* @__PURE__ */ jsx(Label, {
				x: peakX,
				y: R,
				text: "R",
				color: C_R,
				size: 13,
				dy: -10
			}),
			/* @__PURE__ */ jsx(Label, {
				x: peakX,
				y: 0,
				text: "x = −α",
				color: "var(--stage-muted)",
				size: 11,
				dy: 16
			})
		]
	});
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexWrap: "wrap",
			gap: 12,
			alignItems: "stretch"
		},
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				flex: "1 1 240px",
				minWidth: 240
			},
			children: phasor
		}), /* @__PURE__ */ jsx("div", {
			style: {
				flex: "2 1 320px",
				minWidth: 300
			},
			children: waves
		})]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 8,
					fontVariantNumeric: "tabular-nums"
				},
				children: [
					/* @__PURE__ */ jsx(Tex$1, { tex: lhsTex(a, b) }),
					/* @__PURE__ */ jsx(Tex$1, { tex: `= ${R.toFixed(2)}\\cos(x ${alpha < 0 ? "-" : "+"} ${Math.abs(alpha).toFixed(3)})` }),
					/* @__PURE__ */ jsxs("span", {
						style: { fontSize: 13 },
						children: ["R = √(a² + b²) = ", /* @__PURE__ */ jsx("strong", { children: R.toFixed(3) })]
					}),
					/* @__PURE__ */ jsxs("span", {
						style: { fontSize: 13 },
						children: [
							"α = ",
							/* @__PURE__ */ jsx("strong", { children: alpha.toFixed(3) }),
							" rad = ",
							(alpha * 180 / Math.PI).toFixed(1),
							"°"
						]
					})
				]
			})
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "a (cos x)",
				value: a,
				children: /* @__PURE__ */ jsx(Slider, {
					value: a,
					min: -8,
					max: LIM,
					step: 1,
					onChange: setA,
					ariaLabel: "coefficient of cosine"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "b (sin x)",
				value: b,
				children: /* @__PURE__ */ jsx(Slider, {
					value: b,
					min: -8,
					max: LIM,
					step: 1,
					onChange: setB,
					ariaLabel: "coefficient of sine"
				})
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: showComp,
				onClick: () => setShowComp((v) => !v),
				children: "show components"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsxs("p", {
				className: "lab-prompt",
				children: [
					"The two coloured waves add to the bold one. Its height is ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "R=\\sqrt{a^2+b^2}" }),
					" and it peaks at ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "x=-\\alpha" }),
					", the phasor's length and angle."
				]
			}),
			/* @__PURE__ */ jsx(ChallengeCard, {
				questions: HARMONIC_CHALLENGE,
				state: challenge,
				title: "Predict"
			}),
			/* @__PURE__ */ jsx(LiveRegion, { children: `${a} cos x ${b < 0 ? "minus" : "plus"} ${Math.abs(b)} sin x equals ${R.toFixed(2)} cos(x ${alpha < 0 ? "minus" : "plus"} ${Math.abs(alpha).toFixed(3)}).` })
		] }),
		children: figure
	});
}

//#endregion
export { HarmonicFormLab };