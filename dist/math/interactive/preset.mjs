'use client';

import { Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { AskBox } from "../../kit/pedagogy.mjs";
import { checkAnswer } from "../../kit/answer-check.mjs";
import { areaBetween, intersections, normalAt, roots, tangentAt } from "../../kit/expr-analysis.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Grid, Plot, Stage, compileExpr } from "@classytic/stage";

//#region src/math/interactive/preset.tsx
/**
* InteractiveProblem, the authorable engine: a CREATOR writes a config (equations,
* params, derived quantities, an optional ask+check) and gets a live, graded
* interactive graph. No bespoke component per question, the same engine plots any
* equations, exposes params as sliders, DERIVES what the question needs (roots,
* intersections, tangent/normal, area) from the symbolic engine, and CHECKS the
* student's answer symbolically + numerically.
*
* This is the spine that makes exam questions AUTHORED CONFIGS, not code. Things a
* plotter can't draw (phasors, triangles, 3D) are separate authorable representations.
*/
const PALETTE = [
	"var(--stage-accent)",
	"var(--stage-accent-2)",
	"var(--stage-good)",
	"var(--stage-warn)"
];
const C_DERIVED = "var(--stage-good)";
function autoY(curves, xMin, xMax) {
	const ys = [];
	for (const cu of curves) {
		if (!cu.compiled) continue;
		for (let i = 0; i <= 200; i++) {
			const y = cu.fn(xMin + (xMax - xMin) * i / 200);
			if (Number.isFinite(y)) ys.push(y);
		}
	}
	if (!ys.length) return [-10, 10];
	ys.sort((a, b) => a - b);
	const lo = ys[Math.floor(ys.length * .02)] ?? 0;
	const hi = ys[Math.floor(ys.length * .98)] ?? 0;
	let min = Math.min(lo, 0), max = Math.max(hi, 0);
	if (min === max) {
		min -= 1;
		max += 1;
	}
	const pad = (max - min) * .12;
	return [min - pad, max + pad];
}
function InteractiveProblem({ equations, params = [], xRange = [-6.5, 6.5], yRange = "auto", derive = [], ask, title = "Interactive problem", prompt, height = 340, activity = "interactive-problem" }) {
	const [vals, setVals] = useState(() => Object.fromEntries(params.map((p) => [p.name, p.value])));
	const resolve = (v) => typeof v === "number" ? v : vals[v] ?? NaN;
	const curves = useMemo(() => {
		return equations.map((e, i) => {
			const eq = typeof e === "string" ? { expr: e } : e;
			const c = compileExpr(eq.expr);
			const compiled = c.error !== void 0 ? null : c;
			const fn = (x) => compiled ? compiled.fn({
				...vals,
				x
			}) : NaN;
			return {
				expr: eq.expr,
				color: eq.color ?? PALETTE[i % PALETTE.length],
				fn,
				compiled
			};
		});
	}, [equations, vals]);
	const [xMin, xMax] = xRange;
	const [yMin, yMax] = yRange === "auto" ? autoY(curves, xMin, xMax) : yRange;
	const overlays = [];
	const readouts = [];
	derive.forEach((d, di) => {
		if (d.kind === "intersections") {
			const [i, j] = d.of;
			const pts = intersections(curves[i].fn, curves[j].fn, xMin, xMax);
			pts.forEach((p, k) => overlays.push(/* @__PURE__ */ jsx(Dot, {
				x: p.x,
				y: p.y,
				r: 5,
				color: C_DERIVED
			}, `x${di}-${k}`)));
			readouts.push({
				label: d.label ?? "intersection points",
				value: String(pts.length)
			});
		} else if (d.kind === "roots") {
			const rs = roots(curves[d.of].fn, xMin, xMax);
			rs.forEach((x, k) => overlays.push(/* @__PURE__ */ jsx(Dot, {
				x,
				y: 0,
				r: 5,
				color: C_DERIVED
			}, `r${di}-${k}`)));
			readouts.push({
				label: d.label ?? "roots",
				value: rs.map((x) => x.toFixed(2)).join(", ") || "none"
			});
		} else if (d.kind === "tangent" || d.kind === "normal") {
			const c = curves[d.of];
			if (c.compiled) {
				const line = (d.kind === "tangent" ? tangentAt : normalAt)(c.compiled.ast, resolve(d.at), "x", vals);
				if (line) {
					overlays.push(/* @__PURE__ */ jsx(Plot.OfX, {
						y: line.f,
						color: C_DERIVED,
						weight: 2,
						dashed: true
					}, `l${di}`));
					overlays.push(/* @__PURE__ */ jsx(Dot, {
						x: line.at.x,
						y: line.at.y,
						r: 5,
						color: C_DERIVED
					}, `lp${di}`));
					readouts.push({
						label: d.kind,
						value: `y = ${line.m.toFixed(2)}x ${line.c < 0 ? "−" : "+"} ${Math.abs(line.c).toFixed(2)}`
					});
				}
			}
		} else if (d.kind === "area") {
			const [i, j] = d.between;
			const A = areaBetween(curves[i].fn, curves[j].fn, resolve(d.from), resolve(d.to));
			readouts.push({
				label: d.label ?? "area",
				value: A.toFixed(3)
			});
		}
	});
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin,
			xMax,
			yMin,
			yMax
		},
		height,
		preserveAspect: false,
		ariaLabel: title,
		children: [
			/* @__PURE__ */ jsx(Grid, {}),
			/* @__PURE__ */ jsx(Axes, {}),
			curves.map((cu, i) => cu.compiled && /* @__PURE__ */ jsx(Plot.OfX, {
				y: cu.fn,
				color: cu.color,
				weight: 2.5
			}, i)),
			overlays
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: readouts.length ? /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums"
				},
				children: readouts.map((r, i) => /* @__PURE__ */ jsxs("span", {
					style: { fontSize: 13 },
					children: [
						r.label,
						": ",
						/* @__PURE__ */ jsx("strong", { children: r.value })
					]
				}, i))
			})
		}) : void 0,
		controls: params.length ? /* @__PURE__ */ jsx(ControlBar, { children: params.map((p) => /* @__PURE__ */ jsx(Field, {
			label: p.label ?? p.name,
			value: (vals[p.name] ?? p.value).toFixed(p.step && p.step < 1 ? 2 : 0),
			children: /* @__PURE__ */ jsx(Slider, {
				value: vals[p.name] ?? p.value,
				min: p.min,
				max: p.max,
				step: p.step ?? 1,
				onChange: (n) => setVals((v) => ({
					...v,
					[p.name]: n
				})),
				ariaLabel: p.label ?? p.name
			})
		}, p.name)) }) : void 0,
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
export { InteractiveProblem };