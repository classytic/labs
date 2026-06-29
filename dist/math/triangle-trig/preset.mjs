'use client';

import { Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { AskBox } from "../../kit/pedagogy.mjs";
import { AngleArc, RightAngleMark } from "../../kit/diagram.mjs";
import { checkAnswer } from "../../kit/answer-check.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Label, Segment, Stage } from "@classytic/stage";

//#region src/math/triangle-trig/preset.tsx
/**
* TriangleTrig, the first REPRESENTATION plug-in: a thing the graph engine can't
* draw (a labelled right triangle), authored by config and reusing the shared
* answer-check seam. Built for the angle-of-elevation/depression family, "from the
* top of a 15 m tower the angle of depression to a point is 31°, find the distance"
* (the user's "see the angle and the tree/pole distances"). A 2-D split is clearer
* (and cheaper) than pseudo-3-D.
*
* The creator gives an angle + ONE leg; the engine solves the rest (tan/sin/cos),
* draws the triangle with every side + the angle labelled, exposes chosen knobs as
* sliders for intuition, and, with `ask`, grades a typed answer via `checkAnswer`.
*/
const C_GIVEN = "var(--stage-accent)";
const C_HYP = "var(--stage-accent-2)";
const C_CALC = "var(--stage-fg)";
const fmt$1 = (n) => Number.isFinite(n) ? Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(2) : ", ";
function TriangleTrig({ angleDeg = 31, leg = 15, legKind = "opposite", mode = "depression", labels, drive = ["angle"], legMin = 1, legMax, ask, title = "Angle of depression: solve the right triangle", prompt = "The angle, the height and the ground distance are one right triangle: tan θ = opposite / adjacent.", height = 320, activity = "triangle-trig" } = {}) {
	const [deg, setDeg] = useState(angleDeg);
	const [len, setLen] = useState(leg);
	const lab = {
		opposite: "opposite",
		adjacent: "adjacent",
		hypotenuse: "hypotenuse",
		angle: "θ",
		...labels
	};
	const maxLeg = legMax ?? Math.max(20, Math.ceil(leg * 2));
	const th = deg * Math.PI / 180;
	const A = legKind === "adjacent" ? len : len / Math.tan(th);
	const O = legKind === "adjacent" ? len * Math.tan(th) : len;
	const H = Math.hypot(A, O);
	const givenIsOpp = legKind === "opposite";
	const Oc = {
		x: 0,
		y: 0
	};
	const B = {
		x: A,
		y: 0
	};
	const T = {
		x: A,
		y: O
	};
	const pad = Math.max(A, O, 1) * .18;
	const view = {
		xMin: -pad,
		xMax: A + pad * 2.2,
		yMin: -pad,
		yMax: O + pad * 1.6
	};
	const horiz = {
		x: A - Math.min(A * .55, O * .9 + 1),
		y: O
	};
	const sideLabel = (mid, name, value, color, given, off) => /* @__PURE__ */ jsx(Label, {
		x: mid.x,
		y: mid.y,
		text: `${name} = ${fmt$1(value)}`,
		color,
		size: 12,
		weight: given ? 700 : 600,
		dx: off.dx,
		dy: off.dy
	});
	const hyLen = H || 1;
	const hypOff = {
		dx: -O / hyLen * 18,
		dy: -A / hyLen * 18
	};
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view,
		height,
		ariaLabel: `Right triangle: ${lab.angle} ${deg} degrees, ${lab.opposite} ${fmt$1(O)}, ${lab.adjacent} ${fmt$1(A)}, hypotenuse ${fmt$1(H)}`,
		children: [
			/* @__PURE__ */ jsx(Segment, {
				from: Oc,
				to: B,
				color: !givenIsOpp ? C_GIVEN : C_CALC,
				weight: !givenIsOpp ? 3 : 2,
				opacity: !givenIsOpp ? 1 : .5
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: B,
				to: T,
				color: givenIsOpp ? C_GIVEN : C_CALC,
				weight: givenIsOpp ? 3 : 2,
				opacity: givenIsOpp ? 1 : .5
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: Oc,
				to: T,
				color: C_HYP,
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(RightAngleMark, {
				at: B,
				u: {
					x: -1,
					y: 0
				},
				v: {
					x: 0,
					y: 1
				}
			}),
			mode === "depression" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Segment, {
				from: T,
				to: horiz,
				color: "var(--stage-muted)",
				weight: 1.2,
				dashed: true,
				opacity: .7
			}), /* @__PURE__ */ jsx(AngleArc, {
				at: T,
				from: {
					x: horiz.x - T.x,
					y: 0
				},
				to: {
					x: Oc.x - T.x,
					y: Oc.y - T.y
				},
				rPx: 30,
				label: `${lab.angle}=${deg}°`
			})] }) : /* @__PURE__ */ jsx(AngleArc, {
				at: Oc,
				from: {
					x: 1,
					y: 0
				},
				to: {
					x: A,
					y: O
				},
				rPx: 30,
				label: `${lab.angle}=${deg}°`
			}),
			sideLabel({
				x: A / 2,
				y: 0
			}, lab.adjacent, A, !givenIsOpp ? C_GIVEN : C_CALC, !givenIsOpp, { dy: 16 }),
			sideLabel({
				x: A,
				y: O / 2
			}, lab.opposite, O, givenIsOpp ? C_GIVEN : C_CALC, givenIsOpp, { dx: 16 }),
			sideLabel({
				x: A / 2,
				y: O / 2
			}, lab.hypotenuse, H, C_HYP, false, hypOff)
		]
	});
	const aside = /* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 6,
				fontVariantNumeric: "tabular-nums",
				fontSize: 13
			},
			children: [
				/* @__PURE__ */ jsxs("span", { children: [
					lab.angle,
					" = ",
					/* @__PURE__ */ jsxs("strong", { children: [deg, "°"] })
				] }),
				/* @__PURE__ */ jsxs("span", { children: [
					lab.opposite,
					" = ",
					/* @__PURE__ */ jsx("strong", { children: fmt$1(O) })
				] }),
				/* @__PURE__ */ jsxs("span", { children: [
					lab.adjacent,
					" = ",
					/* @__PURE__ */ jsx("strong", { children: fmt$1(A) })
				] }),
				/* @__PURE__ */ jsxs("span", { children: ["hypotenuse = ", /* @__PURE__ */ jsx("strong", { children: fmt$1(H) })] }),
				/* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: [
						"tan ",
						lab.angle,
						" = ",
						fmt$1(O),
						"/",
						fmt$1(A),
						" = ",
						fmt$1(O / A)
					]
				})
			]
		})
	});
	const sliders = [];
	if (drive.includes("angle")) sliders.push(/* @__PURE__ */ jsx(Field, {
		label: lab.angle,
		value: `${deg}°`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: deg,
			min: 5,
			max: 85,
			step: 1,
			onChange: setDeg,
			ariaLabel: "angle in degrees"
		})
	}, "a"));
	if (drive.includes("leg")) sliders.push(/* @__PURE__ */ jsx(Field, {
		label: legKind,
		value: fmt$1(len),
		children: /* @__PURE__ */ jsx(Slider, {
			value: len,
			min: legMin,
			max: maxLeg,
			step: 1,
			onChange: setLen,
			ariaLabel: `${legKind} length`
		})
	}, "l"));
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside,
		controls: sliders.length ? /* @__PURE__ */ jsx(ControlBar, { children: sliders }) : void 0,
		footer: ask ? /* @__PURE__ */ jsx(AskBox, {
			prompt: ask.prompt,
			placeholder: ask.placeholder,
			activity,
			check: (r) => checkAnswer(ask.answer, r)
		}) : void 0,
		children: figure
	});
}

//#endregion
export { TriangleTrig };