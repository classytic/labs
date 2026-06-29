'use client';

import { Callout, LabFrame } from "../../kit/frame.mjs";
import { RightAngleMark } from "../../kit/diagram.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane, GradientTriangle, distance, interceptTex, intersectLines, lineFrom, lineTex, lineThrough, midpoint, num, parallelThrough, perpThrough, snapPoint } from "../../kit/coords.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Line, MovableDot } from "@classytic/stage";

//#region src/math/straight-line/preset.tsx
/**
* StraightLineLab, one authorable lab that covers the whole Edexcel/IGCSE
* "equation of a straight line" spine, switched by `mode`:
*
*   two-point          drag A and B → the line through them, with the gradient
*                      shown as a rise/run triangle and the live y = m·x + c.
*   gradient-intercept drag the y-intercept (on the y-axis) and a slope handle , 
*                      feel how m tilts and c slides the line.
*   intercept-form     drag the x- and y-intercepts → x/a + y/b = 1.
*   parallel           a FIXED given line; drag a point P; the parallel line
*                      through P is built live (same gradient).
*   perpendicular      same, but the ⊥ line (gradient −1/m); the right angle at
*                      the crossing is marked and m₁·m₂ = −1 is shown.
*
* Direct manipulation on a CoordPlane + an optional checked question (AskBox).
* A creator authors a real exam question by setting the mode, the given line /
* starting points, and the answer to check, no code.
*/
const C_LINE = "var(--stage-accent)";
const C_GIVEN = "var(--stage-accent-2)";
const C_A = "var(--stage-good)";
const C_B = "var(--stage-accent)";
const DEFAULT_VIEW = {
	xMin: -8,
	xMax: 8,
	yMin: -6,
	yMax: 6
};
const DEFAULTS = {
	"two-point": {
		a: {
			x: -3,
			y: -2
		},
		b: {
			x: 4,
			y: 3
		}
	},
	"gradient-intercept": {
		a: {
			x: 0,
			y: 1
		},
		b: {
			x: 3,
			y: 3
		}
	},
	"intercept-form": {
		a: {
			x: 4,
			y: 0
		},
		b: {
			x: 0,
			y: 3
		}
	},
	parallel: {
		a: {
			x: 2,
			y: -3
		},
		b: {
			x: 0,
			y: 0
		}
	},
	perpendicular: {
		a: {
			x: 2,
			y: -3
		},
		b: {
			x: 0,
			y: 0
		}
	}
};
const PROMPTS = {
	"two-point": "Drag A and B. The gradient is the rise over the run; the equation is y = m·x + c.",
	"gradient-intercept": "Drag the y-intercept up the y-axis, and the handle to tilt the gradient.",
	"intercept-form": "Drag where the line cuts each axis. Intercept form: x/a + y/b = 1.",
	parallel: "Drag P. The new line stays parallel to the given one, same gradient, different intercept.",
	perpendicular: "Drag P. The new line is perpendicular to the given one: its gradient is −1/m, so m₁·m₂ = −1."
};
function StraightLineLab(props = {}) {
	const mode = props.mode ?? "two-point";
	const { given = {
		m: .5,
		c: 2
	}, view = DEFAULT_VIEW, height = 380, snap = 1, showDistance = false, title = "The straight line", prompt = PROMPTS[mode], ask, activity = `straight-line-${mode}` } = props;
	const def = DEFAULTS[mode];
	const [A, setA] = useState(props.pointA ?? def.a);
	const [B, setB] = useState(props.pointB ?? def.b);
	const [P, setP] = useState(props.through ?? {
		x: -2,
		y: 2
	});
	const snapP = (p) => snapPoint(p, snap);
	const givenLine = lineFrom(given.m, {
		x: 0,
		y: given.c
	});
	let line;
	let scene;
	const readouts = [];
	if (mode === "parallel" || mode === "perpendicular") {
		line = mode === "parallel" ? parallelThrough(givenLine, P) : perpThrough(givenLine, P);
		const cross = intersectLines(givenLine, line);
		readouts.push({
			label: "given line",
			value: lineTex(givenLine)
		});
		readouts.push({
			label: "new line",
			value: lineTex(line)
		});
		if (mode === "parallel") readouts.push({
			label: "gradients",
			value: `both m = ${num(given.m)}`
		});
		else readouts.push({
			label: "m₁ · m₂",
			value: `${num(given.m)} · ${num(line.m)} = ${num(given.m * (Number.isFinite(line.m) ? line.m : 0))}${Number.isFinite(line.m) ? "" : " (⊥ vertical)"}`
		});
		scene = /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Line, {
				from: {
					x: 0,
					y: givenLine.c
				},
				to: {
					x: 1,
					y: givenLine.c + givenLine.m
				},
				color: C_GIVEN,
				weight: 2.5
			}),
			line.vertical !== void 0 ? /* @__PURE__ */ jsx(Line, {
				from: {
					x: line.vertical,
					y: 0
				},
				to: {
					x: line.vertical,
					y: 1
				},
				color: C_LINE,
				weight: 3
			}) : /* @__PURE__ */ jsx(Line, {
				from: {
					x: 0,
					y: line.c
				},
				to: {
					x: 1,
					y: line.c + line.m
				},
				color: C_LINE,
				weight: 3
			}),
			cross && mode === "perpendicular" && /* @__PURE__ */ jsx(RightAngleMark, {
				at: cross,
				u: {
					x: 1,
					y: givenLine.m
				},
				v: line.vertical !== void 0 ? {
					x: 0,
					y: 1
				} : {
					x: 1,
					y: line.m
				}
			}),
			cross && /* @__PURE__ */ jsx(Dot, {
				x: cross.x,
				y: cross.y,
				r: 4,
				color: "var(--stage-muted)"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: P,
				onMove: (p) => setP(snapP(p)),
				snap,
				color: C_A,
				ariaLabel: "point P, drag it"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: P.x,
				y: P.y,
				text: `P (${num(P.x)}, ${num(P.y)})`,
				color: C_A,
				size: 12,
				weight: 700,
				dx: 12,
				dy: -8,
				anchor: "start"
			})
		] });
	} else if (mode === "intercept-form") {
		const a = A.x, b = B.y;
		line = lineThrough(A, B);
		readouts.push({
			label: "x-intercept a",
			value: num(a)
		});
		readouts.push({
			label: "y-intercept b",
			value: num(b)
		});
		readouts.push({
			label: "intercept form",
			value: interceptTex(a, b)
		});
		readouts.push({
			label: "gradient form",
			value: lineTex(line)
		});
		scene = /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Line, {
				from: A,
				to: B,
				color: C_LINE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(Label, {
				x: a,
				y: 0,
				text: `a = ${num(a)}`,
				color: C_A,
				size: 12,
				weight: 700,
				dy: a >= 0 ? 16 : 16,
				dx: a >= 0 ? 6 : -6,
				anchor: a >= 0 ? "start" : "end"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: b,
				text: `b = ${num(b)}`,
				color: C_B,
				size: 12,
				weight: 700,
				dx: 10,
				anchor: "start"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: A,
				onMove: (p) => setA({
					x: snapPoint(p, snap).x || .001,
					y: 0
				}),
				snap,
				constrain: "horizontal",
				color: C_A,
				ariaLabel: "x-intercept a, drag along the x-axis"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: B,
				onMove: (p) => setB({
					x: 0,
					y: snapPoint(p, snap).y || .001
				}),
				snap,
				constrain: "vertical",
				color: C_B,
				ariaLabel: "y-intercept b, drag along the y-axis"
			})
		] });
	} else {
		const pinA = mode === "gradient-intercept";
		line = lineThrough(A, B);
		readouts.push({
			label: "gradient m",
			value: num(line.m)
		});
		readouts.push({
			label: "y-intercept c",
			value: num(line.c)
		});
		readouts.push({
			label: "equation",
			value: lineTex(line)
		});
		if (showDistance && mode === "two-point") {
			readouts.push({
				label: "|AB|",
				value: num(distance(A, B))
			});
			const mid = midpoint(A, B);
			readouts.push({
				label: "midpoint",
				value: `(${num(mid.x)}, ${num(mid.y)})`
			});
		}
		scene = /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Line, {
				from: A,
				to: B,
				color: C_LINE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(GradientTriangle, {
				a: A.x <= B.x ? A : B,
				b: A.x <= B.x ? B : A
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: A,
				onMove: (p) => setA(pinA ? {
					x: 0,
					y: snapPoint(p, snap).y
				} : snapP(p)),
				snap,
				color: C_A,
				ariaLabel: pinA ? "y-intercept, drag up the y-axis" : "point A, drag it"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: B,
				onMove: (p) => setB(snapP(p)),
				snap,
				color: C_B,
				ariaLabel: "point B, drag it"
			})
		] });
	}
	const figure = /* @__PURE__ */ jsx(CoordPlane, {
		view,
		height,
		ariaLabel: `${title}: ${lineTex(line)}`,
		children: scene
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: readouts.map((r, i) => /* @__PURE__ */ jsxs("span", { children: [
					r.label,
					": ",
					/* @__PURE__ */ jsx("strong", { children: r.value })
				] }, i))
			})
		}),
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: figure
	});
}

//#endregion
export { StraightLineLab };