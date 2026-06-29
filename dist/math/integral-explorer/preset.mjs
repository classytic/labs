'use client';

import { clamp } from "../../core/util.mjs";
import { integrate, riemannSum } from "../../core/numeric.mjs";
import { Tex as Tex$1 } from "../../core/tex.mjs";
import { LabStyles, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useEffect, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Grid, MovableDot, Plot, Polygon, Stage, compileExpr, evaluate, toLatex } from "@classytic/stage";

//#region src/math/integral-explorer/preset.tsx
/**
* IntegralExplorer, the integral as "area under the curve," on @classytic/stage.
* Shades f(x) over [a,b] with n Riemann rectangles (SVG Polygons); drag the
* endpoints, crank n, switch left/mid/right, and watch the estimate converge to
* the Simpson reference. Reuses the pure `riemannSum`/`integrate` helpers.
*/
const MODES = [
	"left",
	"mid",
	"right"
];
function IntegralExplorer({ equation = "0.4*x^2 + 0.5", xRange = [-1, 4], a: aInit = 0, b: bInit = 3, n: nInit = 8, title = "The integral is an area", height = 340 } = {}) {
	const [xMin, xMax] = xRange;
	const [a, setA] = useState(clamp(aInit, xMin, xMax));
	const [b, setB] = useState(clamp(bInit, xMin, xMax));
	const [n, setN] = useState(nInit);
	const [mode, setMode] = useState("mid");
	useEffect(() => {
		setA(clamp(aInit, xMin, xMax));
	}, [
		aInit,
		xMin,
		xMax
	]);
	useEffect(() => {
		setB(clamp(bInit, xMin, xMax));
	}, [
		bInit,
		xMin,
		xMax
	]);
	useEffect(() => {
		setN(nInit);
	}, [nInit]);
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
	for (let i = 0; i <= 200; i++) {
		const y = f(xMin + (xMax - xMin) * i / 200);
		if (Number.isFinite(y)) ys.push(y);
	}
	ys.sort((p, q) => p - q);
	let yMin = Math.min(ys[Math.floor(ys.length * .02)] ?? -1, 0);
	let yMax = Math.max(ys[Math.floor(ys.length * .98)] ?? 1, 0);
	if (yMin === yMax) {
		yMin -= 1;
		yMax += 1;
	}
	const pad = (yMax - yMin) * .12;
	[yMin, yMax] = [yMin - pad, yMax + pad];
	const lo = Math.min(a, b), hi = Math.max(a, b);
	const dx = n > 0 ? (hi - lo) / n : 0;
	const rects = [];
	for (let i = 0; i < n; i++) {
		const xl = lo + i * dx;
		const fy = f(mode === "left" ? xl : mode === "right" ? xl + dx : xl + dx / 2);
		if (!Number.isFinite(fy)) continue;
		rects.push({
			pts: [
				{
					x: xl,
					y: 0
				},
				{
					x: xl + dx,
					y: 0
				},
				{
					x: xl + dx,
					y: fy
				},
				{
					x: xl,
					y: fy
				}
			],
			pos: fy >= 0
		});
	}
	const approx = riemannSum(f, [lo, hi], n, mode);
	const reference = integrate(f, [lo, hi], 1e3);
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabStyles, {}), /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin,
			xMax,
			yMin,
			yMax
		},
		height,
		ariaLabel: `Riemann sum of ${equation} over [${lo.toFixed(1)}, ${hi.toFixed(1)}]`,
		children: [
			/* @__PURE__ */ jsx(Grid, {}),
			rects.map((r, i) => /* @__PURE__ */ jsx(Polygon, {
				points: r.pts,
				color: r.pos ? "var(--stage-accent)" : "var(--stage-danger)",
				fill: r.pos ? "var(--stage-accent)" : "var(--stage-danger)",
				fillOpacity: .26,
				weight: 1
			}, i)),
			/* @__PURE__ */ jsx(Axes, {}),
			/* @__PURE__ */ jsx(Plot.OfX, {
				y: f,
				domain: [xMin, xMax],
				color: "var(--stage-fg)",
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: a,
					y: 0
				},
				onMove: (p) => setA(clamp(p.x, xMin, xMax)),
				constrain: "horizontal",
				color: "var(--stage-good)",
				ariaLabel: "left endpoint a"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: b,
					y: 0
				},
				onMove: (p) => setB(clamp(p.x, xMin, xMax)),
				constrain: "horizontal",
				color: "var(--stage-good)",
				ariaLabel: "right endpoint b"
			})
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "rectangles n",
				value: /* @__PURE__ */ jsx("strong", { children: n }),
				children: /* @__PURE__ */ jsx(Slider, {
					value: n,
					min: 1,
					max: 80,
					step: 1,
					onChange: (v) => setN(Math.round(v)),
					ariaLabel: "number of rectangles"
				})
			}),
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "lab-chip",
				onClick: () => setMode((mm) => MODES[(MODES.indexOf(mm) + 1) % 3]),
				children: [mode, " sum"]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: { opacity: .8 },
				children: ["sum ", /* @__PURE__ */ jsx("strong", { children: approx.toFixed(3) })]
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					color: "var(--stage-good)",
					fontWeight: 600
				},
				children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\int \\approx ${reference.toFixed(3)}` })
			})
		] }),
		footer: /* @__PURE__ */ jsx("div", {
			style: {
				padding: "8px 2px 0",
				fontSize: 14
			},
			children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\int_{${lo.toFixed(1)}}^{${hi.toFixed(1)}}\\left(${fLatex}\\right)\\,dx \\approx ${approx.toFixed(3)}` })
		}),
		children: figure
	});
}

//#endregion
export { IntegralExplorer };