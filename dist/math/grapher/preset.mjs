'use client';

import { LabStyles, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useEffect, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Label, Plot, Segment, Stage, compileExpr } from "@classytic/stage";

//#region src/math/grapher/preset.tsx
/**
* Grapher, a creator-authored equation/function plotter on the @classytic/stage
* engine. A creator types one or more formulas in `x` (and named params), optionally
* exposes params as sliders, and gets a clean auto-scaled multi-curve plot.
*
* Framed, labelled axes (NOT through-origin) so it reads cleanly for ANY window , 
* including off-origin ranges like x∈[250,400] where a 0-axis would sit off-screen.
* Supports a LOG y-scale: essential for exponentials (e.g. Arrhenius rate ∝ e^(−Eₐ/RT)),
* where a linear axis collapses the curve onto the baseline but a log axis makes it a
* clean straight-ish line. Accessible (SVG + aria), themeable.
*/
const PALETTE = [
	"var(--stage-accent)",
	"var(--stage-accent-2)",
	"var(--stage-good)",
	"var(--stage-warn)"
];
function normalizeEquations(input) {
	const eqs = (Array.isArray(input) ? input : typeof input === "string" ? [input] : []).map((e) => typeof e === "string" ? { expr: e } : e).filter((e) => !!e && typeof e.expr === "string" && e.expr.trim().length > 0);
	return eqs.length ? eqs : [{ expr: "sin(x)" }];
}
/** Nice round linear tick values across [min,max]. */
function niceTicks(min, max, target = 6) {
	const span = max - min;
	if (!(span > 0) || !Number.isFinite(span)) return [];
	const raw = span / target;
	const mag = Math.pow(10, Math.floor(Math.log10(raw)));
	const norm = raw / mag;
	const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
	const out = [];
	for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
	return out;
}
/** Integer (decade) ticks for a log axis, falls back to nice ticks for a sub-decade window. */
function decadeTicks(min, max) {
	const lo = Math.ceil(min - 1e-9), hi = Math.floor(max + 1e-9);
	const out = [];
	for (let v = lo; v <= hi; v++) out.push(v);
	return out.length >= 2 ? out : niceTicks(min, max, 5);
}
const fmtNum = (v) => {
	if (v === 0) return "0";
	const a = Math.abs(v);
	if (a >= 1e4 || a < .001) return v.toExponential(0).replace("e+", "e");
	return String(+v.toFixed(a < 1 ? 3 : a < 10 ? 2 : a < 100 ? 1 : 0));
};
/** Auto window in DISPLAY space (after the y-transform), trimmed so spikes don't flatten the curve. */
function autoRange(curves, scope, xMin, xMax, disp) {
	const ys = [];
	const probe = { ...scope };
	for (const cu of curves) {
		if (!cu.compiled) continue;
		for (let i = 0; i <= 240; i++) {
			probe.x = xMin + (xMax - xMin) * i / 240;
			const d = disp(cu.compiled.fn(probe));
			if (Number.isFinite(d)) ys.push(d);
		}
	}
	if (!ys.length) return [0, 1];
	ys.sort((a, b) => a - b);
	let lo = ys[Math.floor(ys.length * .01)] ?? ys[0];
	let hi = ys[Math.min(ys.length - 1, Math.ceil(ys.length * .99))] ?? ys[ys.length - 1];
	if (lo === hi) {
		lo -= 1;
		hi += 1;
	}
	const pad = (hi - lo) * .08;
	return [lo - pad, hi + pad];
}
function Grapher({ equations, params = [], xRange = [-6.5, 6.5], yRange = "auto", yScale = "linear", title = "Graph", subtitle, height = 320, grid = true } = {}) {
	const isLog = yScale === "log";
	const disp = (y) => isLog ? y > 0 ? Math.log10(y) : NaN : y;
	const curves = useMemo(() => normalizeEquations(equations).map((eq, i) => {
		const res = compileExpr(eq.expr);
		const compiled = typeof res.fn === "function" ? res : null;
		return {
			expr: eq.expr,
			color: eq.color ?? PALETTE[i % PALETTE.length],
			compiled,
			error: res.error
		};
	}), [equations]);
	const [values, setValues] = useState(() => Object.fromEntries(params.map((p) => [p.name, p.value])));
	useEffect(() => {
		setValues(Object.fromEntries(params.map((p) => [p.name, p.value])));
	}, [params.map((p) => `${p.name}:${p.value}`).join("|")]);
	const [xMin, xMax] = xRange;
	const [dispMin, dispMax] = yRange === "auto" ? autoRange(curves, values, xMin, xMax, disp) : isLog ? [Math.log10(Math.max(1e-300, yRange[0])), Math.log10(Math.max(1e-300, yRange[1]))] : yRange;
	const spanX = xMax - xMin, spanD = dispMax - dispMin;
	const view = {
		xMin: xMin - spanX * .13,
		xMax: xMax + spanX * .02,
		yMin: dispMin - spanD * .15,
		yMax: dispMax + spanD * .05
	};
	const xTicks = niceTicks(xMin, xMax, 6);
	const yTicks = isLog ? decadeTicks(dispMin, dispMax) : niceTicks(dispMin, dispMax, 5);
	const yLabel = (d) => isLog ? Number.isInteger(d) ? `1e${d}` : `1e${d.toFixed(1)}` : fmtNum(d);
	const errors = curves.filter((c) => c.error);
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx(LabStyles, {}),
		/* @__PURE__ */ jsxs(Stage, {
			view,
			height,
			preserveAspect: false,
			ariaLabel: `Graph of ${curves.map((c) => c.expr).join(", ")}${isLog ? ", log scale" : ""}`,
			children: [
				grid && yTicks.map((y) => /* @__PURE__ */ jsx(Segment, {
					from: {
						x: xMin,
						y
					},
					to: {
						x: xMax,
						y
					},
					color: "var(--stage-grid)",
					opacity: .6,
					weight: 1
				}, `gy${y}`)),
				grid && xTicks.map((x) => /* @__PURE__ */ jsx(Segment, {
					from: {
						x,
						y: dispMin
					},
					to: {
						x,
						y: dispMax
					},
					color: "var(--stage-grid)",
					opacity: .6,
					weight: 1
				}, `gx${x}`)),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: xMin,
						y: dispMin
					},
					to: {
						x: xMax,
						y: dispMin
					},
					color: "var(--stage-fg)",
					opacity: .55,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: xMin,
						y: dispMin
					},
					to: {
						x: xMin,
						y: dispMax
					},
					color: "var(--stage-fg)",
					opacity: .55,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: xMin,
						y: dispMax
					},
					to: {
						x: xMax,
						y: dispMax
					},
					color: "var(--stage-fg)",
					opacity: .16,
					weight: 1
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: xMax,
						y: dispMin
					},
					to: {
						x: xMax,
						y: dispMax
					},
					color: "var(--stage-fg)",
					opacity: .16,
					weight: 1
				}),
				xTicks.map((x) => /* @__PURE__ */ jsx(Label, {
					x,
					y: dispMin,
					text: fmtNum(x),
					dy: 15,
					anchor: "middle",
					size: 11,
					color: "var(--stage-muted)"
				}, `lx${x}`)),
				yTicks.map((y) => /* @__PURE__ */ jsx(Label, {
					x: xMin,
					y,
					text: yLabel(y),
					dx: -7,
					anchor: "end",
					baseline: "middle",
					size: 11,
					color: "var(--stage-muted)"
				}, `ly${y}`)),
				isLog && /* @__PURE__ */ jsx(Label, {
					x: xMin,
					y: dispMax,
					text: "log scale",
					dx: 4,
					dy: -4,
					anchor: "start",
					size: 10,
					color: "var(--stage-muted)"
				}),
				curves.map((cu, i) => cu.compiled ? /* @__PURE__ */ jsx(Plot.OfX, {
					y: (x) => disp(cu.compiled.fn({
						...values,
						x
					})),
					domain: [xMin, xMax],
					color: cu.color,
					weight: 3
				}, i) : null)
			]
		}),
		subtitle && /* @__PURE__ */ jsx("p", {
			style: {
				textAlign: "center",
				fontSize: 12,
				color: "var(--stage-muted)",
				margin: "4px 0 0"
			},
			children: subtitle
		})
	] });
	const controls = params.length > 0 ? /* @__PURE__ */ jsx(ControlBar, { children: params.map((p) => /* @__PURE__ */ jsx(Field, {
		label: p.name,
		value: /* @__PURE__ */ jsx("strong", {
			style: { fontVariantNumeric: "tabular-nums" },
			children: (values[p.name] ?? p.value).toFixed(2)
		}),
		children: /* @__PURE__ */ jsx(Slider, {
			value: values[p.name] ?? p.value,
			min: p.min,
			max: p.max,
			step: p.step ?? .1,
			onChange: (v) => setValues((prev) => ({
				...prev,
				[p.name]: v
			})),
			ariaLabel: `parameter ${p.name}`
		})
	}, p.name)) }) : void 0;
	const footer = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			flexWrap: "wrap",
			gap: "4px 16px",
			padding: "6px 2px",
			fontSize: 13
		},
		children: curves.map((cu, i) => /* @__PURE__ */ jsxs("span", {
			style: {
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				fontFamily: "ui-monospace, monospace",
				opacity: .85
			},
			children: [
				/* @__PURE__ */ jsx("span", { style: {
					display: "inline-block",
					width: 10,
					height: 10,
					borderRadius: 2,
					background: cu.color
				} }),
				"y = ",
				cu.expr
			]
		}, i))
	}), errors.length > 0 && /* @__PURE__ */ jsx("div", {
		style: {
			padding: "2px",
			fontSize: 12,
			color: "var(--stage-danger)"
		},
		children: errors.map((e, i) => /* @__PURE__ */ jsxs("div", { children: [
			"“",
			e.expr,
			"”, ",
			e.error
		] }, i))
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: title || void 0,
		controls,
		footer,
		children: figure
	});
}

//#endregion
export { Grapher };