'use client';

import { clamp } from "../../core/util.mjs";
import { Tex as Tex$1 } from "../../core/tex.mjs";
import { LabStyles, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useEffect, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Grid, MovableDot, Plot, Segment, Stage, compileExpr, differentiate, evaluate, simplify, toLatex } from "@classytic/stage";

//#region src/math/derivative-explorer/preset.tsx
/**
* DerivativeExplorer, "the derivative is a slope," on the @classytic/stage
* engine. Plot f(x); drag the point along the curve and shrink the gap h to
* watch the SECANT collapse onto the TANGENT (exact f'(x) from the shared expr
* engine's symbolic `differentiate`, numerical fallback). Replaces the canvas
* version, now SVG, accessible, themed, KaTeX formulas via the Tex primitive.
*/
const numericSlope = (f, x) => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;
function autoY(f, xMin, xMax) {
	const ys = [];
	for (let i = 0; i <= 200; i++) {
		const y = f(xMin + (xMax - xMin) * i / 200);
		if (Number.isFinite(y)) ys.push(y);
	}
	if (!ys.length) return [-1, 1];
	ys.sort((a, b) => a - b);
	let lo = Math.min(ys[Math.floor(ys.length * .02)] ?? -1, 0);
	let hi = Math.max(ys[Math.floor(ys.length * .98)] ?? 1, 0);
	if (lo === hi) {
		lo -= 1;
		hi += 1;
	}
	const pad = (hi - lo) * .15;
	return [lo - pad, hi + pad];
}
function DerivativeExplorer({ equation = "0.15*x^3 - x", xRange = [-4, 4], startX = 1, title = "The derivative is a slope", height = 340 } = {}) {
	const [xMin, xMax] = xRange;
	const [x0, setX0] = useState(clamp(startX, xMin, xMax));
	const [h, setH] = useState(1.2);
	useEffect(() => {
		setX0(clamp(startX, xMin, xMax));
	}, [
		startX,
		xMin,
		xMax
	]);
	const model = useMemo(() => {
		const res = compileExpr(equation);
		if (!res.ast) return {
			ok: false,
			error: res.error ?? "Invalid expression"
		};
		const ast = res.ast;
		const f = (x) => evaluate(ast, { x });
		let dNode = null;
		try {
			const d = differentiate(ast, "x");
			dNode = d ? simplify(d) : null;
		} catch {
			dNode = null;
		}
		const slopeAt = dNode ? (x) => evaluate(dNode, { x }) : (x) => numericSlope(f, x);
		return {
			ok: true,
			f,
			fLatex: toLatex(ast),
			dfLatex: dNode ? toLatex(dNode) : null,
			slopeAt
		};
	}, [equation]);
	if (!model.ok) return /* @__PURE__ */ jsxs("div", {
		className: "not-prose",
		children: [/* @__PURE__ */ jsx("p", {
			style: { fontWeight: 600 },
			children: title
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				padding: 12,
				fontSize: 13,
				color: "var(--stage-danger)"
			},
			children: [
				"“",
				equation,
				"”, ",
				model.error
			]
		})]
	});
	const { f, slopeAt, fLatex, dfLatex } = model;
	const [yMin, yMax] = autoY(f, xMin, xMax);
	const y0 = f(x0);
	const x1 = x0 + h;
	const y1 = f(x1);
	const secant = (y1 - y0) / (x1 - x0);
	const m = slopeAt(x0);
	const lineY = (slope, atX) => y0 + slope * (atX - x0);
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabStyles, {}), /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin,
			xMax,
			yMin,
			yMax
		},
		height,
		ariaLabel: `Tangent to ${equation} at x = ${x0.toFixed(2)}`,
		children: [
			/* @__PURE__ */ jsx(Grid, {}),
			/* @__PURE__ */ jsx(Axes, {}),
			/* @__PURE__ */ jsx(Plot.OfX, {
				y: f,
				domain: [xMin, xMax],
				color: "var(--stage-accent)",
				weight: 3
			}),
			Number.isFinite(y0) && Number.isFinite(y1) && /* @__PURE__ */ jsx(Segment, {
				from: {
					x: xMin,
					y: lineY(secant, xMin)
				},
				to: {
					x: xMax,
					y: lineY(secant, xMax)
				},
				color: "var(--stage-accent-2)",
				weight: 2
			}),
			Number.isFinite(y0) && Number.isFinite(m) && /* @__PURE__ */ jsx(Segment, {
				from: {
					x: xMin,
					y: lineY(m, xMin)
				},
				to: {
					x: xMax,
					y: lineY(m, xMax)
				},
				color: "var(--stage-good)",
				weight: 2,
				dashed: true
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: x0,
					y: y0
				},
				onMove: (p) => setX0(clamp(p.x, xMin, xMax)),
				color: "var(--stage-fg)",
				ariaLabel: "point on the curve"
			})
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "gap h",
				children: /* @__PURE__ */ jsx(Slider, {
					value: h,
					min: .05,
					max: 3,
					step: .05,
					onChange: setH,
					ariaLabel: "secant gap h"
				})
			}),
			/* @__PURE__ */ jsxs("span", {
				style: { opacity: .8 },
				children: ["x = ", /* @__PURE__ */ jsx("strong", { children: x0.toFixed(2) })]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: { opacity: .8 },
				children: ["secant slope ", /* @__PURE__ */ jsx("strong", { children: Number.isFinite(secant) ? secant.toFixed(2) : ", " })]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					color: "var(--stage-good)",
					fontWeight: 600
				},
				children: ["f′(x) = ", Number.isFinite(m) ? m.toFixed(2) : ", "]
			})
		] }),
		footer: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexWrap: "wrap",
				gap: "4px 18px",
				padding: "8px 2px 0",
				fontSize: 14
			},
			children: [/* @__PURE__ */ jsxs("span", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 6
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: { opacity: .6 },
						children: "f(x) ="
					}),
					" ",
					/* @__PURE__ */ jsx(Tex$1, { tex: fLatex })
				]
			}), dfLatex && /* @__PURE__ */ jsxs("span", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 6,
					color: "var(--stage-good)"
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: { opacity: .7 },
						children: "f′(x) ="
					}),
					" ",
					/* @__PURE__ */ jsx(Tex$1, { tex: dfLatex })
				]
			})]
		}),
		children: figure
	});
}

//#endregion
export { DerivativeExplorer };