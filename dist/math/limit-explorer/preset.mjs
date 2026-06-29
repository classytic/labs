'use client';

import { clamp } from "../../core/util.mjs";
import { estimateOneSidedLimit } from "../../core/numeric.mjs";
import { Tex as Tex$1 } from "../../core/tex.mjs";
import { LabStyles } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Grid, MovableDot, Plot, Point, Segment, Stage, compileExpr, evaluate, toLatex } from "@classytic/stage";

//#region src/math/limit-explorer/preset.tsx
/**
* LimitExplorer, "what value does f approach as x → c?", on @classytic/stage.
* Plots f(x), drops a dashed line at x = c, and walks dots in from both sides
* (h = 1, 0.1, 0.01, 0.001). When the two sides converge to one value, that's
* the limit, even where f(c) itself is a hole. Reuses `estimateOneSidedLimit`.
*/
const STEPS = [
	1,
	.1,
	.01,
	.001
];
const fmt$1 = (v) => Number.isFinite(v) ? v.toFixed(4) : ", ";
function LimitExplorer({ equation = "(x^2 - 1)/(x - 1)", xRange = [-1, 3], c: cInit = 1, title = "Approaching a limit", height = 320 } = {}) {
	const [xMin, xMax] = xRange;
	const [c, setC] = useState(clamp(cInit, xMin, xMax));
	useEffect(() => {
		setC(clamp(cInit, xMin, xMax));
	}, [
		cInit,
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
		return {
			ok: true,
			f: (x) => evaluate(ast, { x }),
			fLatex: toLatex(ast)
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
	const { f, fLatex } = model;
	const ys = [];
	for (let i = 0; i <= 240; i++) {
		const y = f(xMin + (xMax - xMin) * i / 240);
		if (Number.isFinite(y)) ys.push(y);
	}
	ys.sort((p, q) => p - q);
	let yMin = ys[Math.floor(ys.length * .04)] ?? -1;
	let yMax = ys[Math.floor(ys.length * .96)] ?? 1;
	if (yMin === yMax) {
		yMin -= 1;
		yMax += 1;
	}
	const pad = (yMax - yMin) * .15;
	[yMin, yMax] = [yMin - pad, yMax + pad];
	const left = estimateOneSidedLimit(f, c, -1);
	const right = estimateOneSidedLimit(f, c, 1);
	const agrees = left.converging && right.converging && Math.abs(left.value - right.value) < .01 * (1 + Math.abs(left.value));
	const estimate = agrees ? (left.value + right.value) / 2 : NaN;
	const atC = f(c);
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabStyles, {}), /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin,
			xMax,
			yMin,
			yMax
		},
		height,
		ariaLabel: `Limit of ${equation} as x approaches ${c.toFixed(2)}`,
		children: [
			/* @__PURE__ */ jsx(Grid, {}),
			/* @__PURE__ */ jsx(Axes, {}),
			/* @__PURE__ */ jsx(Plot.OfX, {
				y: f,
				domain: [xMin, xMax],
				color: "var(--stage-accent)",
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: c,
					y: yMin
				},
				to: {
					x: c,
					y: yMax
				},
				color: "var(--stage-muted)",
				weight: 1,
				dashed: true
			}),
			STEPS.map((hstep, i) => {
				const r = 4 - i * .6;
				const yl = f(c - hstep);
				const yr = f(c + hstep);
				return /* @__PURE__ */ jsxs(Fragment, { children: [Number.isFinite(yl) && /* @__PURE__ */ jsx(Point, {
					x: c - hstep,
					y: yl,
					r,
					color: "var(--stage-accent-2)"
				}), Number.isFinite(yr) && /* @__PURE__ */ jsx(Point, {
					x: c + hstep,
					y: yr,
					r,
					color: "var(--stage-good)"
				})] }, hstep);
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: c,
					y: 0
				},
				onMove: (p) => setC(clamp(p.x, xMin, xMax)),
				constrain: "horizontal",
				color: "var(--stage-fg)",
				ariaLabel: "approach point c"
			})
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsxs("span", {
				style: { opacity: .8 },
				children: ["c = ", /* @__PURE__ */ jsx("strong", { children: c.toFixed(3) })]
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					color: "var(--stage-good)",
					fontWeight: 600
				},
				children: agrees ? /* @__PURE__ */ jsx(Tex$1, { tex: `\\text{limit} \\approx ${estimate.toFixed(3)}` }) : "limit DNE"
			}),
			!Number.isFinite(atC) && /* @__PURE__ */ jsxs("span", {
				style: { opacity: .65 },
				children: [
					"f(",
					+c.toFixed(2),
					") is a hole"
				]
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
			style: {
				padding: "8px 2px 0",
				fontSize: 14
			},
			children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\lim_{x \\to ${+c.toFixed(2)}} ${fLatex.includes("frac") ? fLatex : `\\left(${fLatex}\\right)`} ${agrees ? `\\approx ${+estimate.toFixed(3)}` : "\\text{ does not exist}"}` })
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "auto 1fr 1fr",
				gap: "1px 16px",
				padding: "6px 2px",
				fontFamily: "ui-monospace, monospace",
				fontSize: 12
			},
			children: [
				/* @__PURE__ */ jsx("span", {
					style: { opacity: .6 },
					children: /* @__PURE__ */ jsx(Tex$1, { tex: "h" })
				}),
				/* @__PURE__ */ jsx("span", {
					style: { opacity: .6 },
					children: /* @__PURE__ */ jsx(Tex$1, { tex: "f(c-h)" })
				}),
				/* @__PURE__ */ jsx("span", {
					style: { opacity: .6 },
					children: /* @__PURE__ */ jsx(Tex$1, { tex: "f(c+h)" })
				}),
				STEPS.map((h) => /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx("span", { children: h }),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-accent-2)" },
						children: fmt$1(f(c - h))
					}),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-good)" },
						children: fmt$1(f(c + h))
					})
				] }, h))
			]
		})] }),
		children: figure
	});
}

//#endregion
export { LimitExplorer };