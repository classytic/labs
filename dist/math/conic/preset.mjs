'use client';

import { Callout, LabFrame } from "../../kit/frame.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane, num, snapTo } from "../../kit/coords.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Ellipse, Label, Line, MovableDot, Plot } from "@classytic/stage";

//#region src/math/conic/preset.tsx
/**
* ConicLab, the non-circle conics on the coordinate plane, dragged into shape:
*
*   parabola     y² = 4a·x  , drag the FOCUS along the axis; the focus (a, 0)
*                and directrix x = −a move together (every point stays equidistant
*                from them, the defining property).
*   hyperbola    x²/a² − y²/b² = 1, drag the vertex (sets a) and the conjugate
*                handle (sets b); the asymptotes y = ±(b/a)x are drawn.
*   rectangular  x·y = c, the reciprocal graph; drag a point on a branch to set c.
*
* Built on the same CoordPlane + Plot.Parametric the rest of the geometry labs
* use (parametric so the vertical-tangent vertex and the two branches draw
* cleanly). Authorable via props + an optional checked answer.
*/
const C_CURVE = "var(--stage-accent)";
const C_AUX = "var(--stage-accent-2)";
const DEFAULT_VIEW = {
	xMin: -8,
	xMax: 8,
	yMin: -6,
	yMax: 6
};
const PROMPTS = {
	parabola: "Drag the focus along the axis. The directrix mirrors it: every point on the curve is the same distance from both. y² = 4a·x.",
	ellipse: "Drag the two axis handles to set the semi-axes a and b. The foci sit on the longer axis. x²/a² + y²/b² = 1.",
	hyperbola: "Drag the vertex (sets a) and the conjugate handle (sets b). The curve hugs the asymptotes y = ±(b/a)x.",
	rectangular: "Drag the point on the branch. x·y stays constant, that constant is c."
};
function ConicLab(props = {}) {
	const kind = props.kind ?? "parabola";
	const { view = DEFAULT_VIEW, height = 400, snap = 1, showFocusDirectrix = true, showAsymptotes = true, title = kind === "parabola" ? "The parabola" : kind === "ellipse" ? "The ellipse" : kind === "hyperbola" ? "The hyperbola" : "The reciprocal graph", prompt = PROMPTS[kind], ask, activity = `conic-${kind}` } = props;
	const [a, setA] = useState(Math.max(.3, props.a ?? (kind === "ellipse" ? 4 : kind === "hyperbola" ? 2 : 1)));
	const [b, setB] = useState(Math.max(.3, props.b ?? (kind === "ellipse" ? 2.5 : 1.5)));
	const [cc, setCc] = useState(props.c ?? 6);
	const sp = (v) => snapTo(v, snap);
	let scene;
	const readouts = [];
	if (kind === "parabola") {
		const T = Math.sqrt(Math.max(.1, view.xMax) / a);
		scene = /* @__PURE__ */ jsxs(Fragment$1, { children: [
			showFocusDirectrix && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Line, {
					from: {
						x: -a,
						y: 0
					},
					to: {
						x: -a,
						y: 1
					},
					color: C_AUX,
					weight: 2,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Label, {
					x: -a,
					y: view.yMin,
					text: `directrix x = ${num(-a)}`,
					color: C_AUX,
					size: 11,
					dy: -6
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: a,
					y: 0,
					r: 4,
					color: C_AUX
				}),
				/* @__PURE__ */ jsx(Label, {
					x: a,
					y: 0,
					text: "focus",
					color: C_AUX,
					size: 11,
					dy: -10
				})
			] }),
			/* @__PURE__ */ jsx(Plot.Parametric, {
				xy: (t) => [a * t * t, 2 * a * t],
				domain: [-T, T],
				color: C_CURVE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: a,
					y: 0
				},
				onMove: (p) => setA(Math.max(.3, sp(p.x))),
				snap,
				constrain: "horizontal",
				color: C_CURVE,
				ariaLabel: "focus, drag along the axis to set a"
			})
		] });
		readouts.push({
			label: "a",
			value: num(a)
		}, {
			label: "equation",
			value: `y² = ${num(4 * a)}x`
		}, {
			label: "focus / directrix",
			value: `(${num(a)}, 0) / x = ${num(-a)}`
		});
	} else if (kind === "ellipse") {
		const cFoc = Math.sqrt(Math.abs(a * a - b * b));
		const foci = a >= b ? [{
			x: cFoc,
			y: 0
		}, {
			x: -cFoc,
			y: 0
		}] : [{
			x: 0,
			y: cFoc
		}, {
			x: 0,
			y: -cFoc
		}];
		scene = /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Ellipse, {
				center: {
					x: 0,
					y: 0
				},
				rx: a,
				ry: b,
				color: C_CURVE,
				fill: C_CURVE,
				fillOpacity: .06,
				weight: 3
			}),
			cFoc > .05 && foci.map((f, i) => /* @__PURE__ */ jsx(Dot, {
				x: f.x,
				y: f.y,
				r: 4,
				color: C_AUX
			}, i)),
			cFoc > .05 && /* @__PURE__ */ jsx(Label, {
				x: foci[0].x,
				y: foci[0].y,
				text: "focus",
				color: C_AUX,
				size: 11,
				dy: -10
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: a,
					y: 0
				},
				onMove: (p) => setA(Math.max(.3, sp(p.x))),
				snap,
				constrain: "horizontal",
				color: C_CURVE,
				ariaLabel: "semi-axis a, drag along the x-axis"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: 0,
					y: b
				},
				onMove: (p) => setB(Math.max(.3, sp(p.y))),
				color: C_AUX,
				ariaLabel: "semi-axis b, drag along the y-axis"
			})
		] });
		readouts.push({
			label: "a, b",
			value: `${num(a)}, ${num(b)}`
		}, {
			label: "equation",
			value: `x²/${num(a * a)} + y²/${num(b * b)} = 1`
		});
		if (cFoc > .05) readouts.push({
			label: "foci",
			value: a >= b ? `(±${num(cFoc)}, 0)` : `(0, ±${num(cFoc)})`
		});
	} else if (kind === "hyperbola") {
		const Tt = Math.asinh((Math.abs(view.yMax) + 2) / b);
		const slope = b / a;
		scene = /* @__PURE__ */ jsxs(Fragment$1, { children: [
			showAsymptotes && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Line, {
				from: {
					x: 0,
					y: 0
				},
				to: {
					x: 1,
					y: slope
				},
				color: C_AUX,
				weight: 1.5,
				dashed: true
			}), /* @__PURE__ */ jsx(Line, {
				from: {
					x: 0,
					y: 0
				},
				to: {
					x: 1,
					y: -slope
				},
				color: C_AUX,
				weight: 1.5,
				dashed: true
			})] }),
			/* @__PURE__ */ jsx(Plot.Parametric, {
				xy: (t) => [a * Math.cosh(t), b * Math.sinh(t)],
				domain: [-Tt, Tt],
				color: C_CURVE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(Plot.Parametric, {
				xy: (t) => [-a * Math.cosh(t), b * Math.sinh(t)],
				domain: [-Tt, Tt],
				color: C_CURVE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: a,
					y: 0
				},
				onMove: (p) => setA(Math.max(.3, sp(p.x))),
				color: C_CURVE,
				ariaLabel: "vertex, drag to set a"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: 0,
					y: b
				},
				onMove: (p) => setB(Math.max(.3, sp(p.y))),
				color: C_AUX,
				ariaLabel: "conjugate handle, drag to set b"
			})
		] });
		readouts.push({
			label: "a, b",
			value: `${num(a)}, ${num(b)}`
		}, {
			label: "equation",
			value: `x²/${num(a * a)} − y²/${num(b * b)} = 1`
		}, {
			label: "asymptotes",
			value: `y = ±${num(slope)}x`
		});
	} else {
		const x0 = 2;
		const handle = {
			x: x0,
			y: cc / x0
		};
		const xm = Math.max(Math.abs(view.xMin), view.xMax);
		scene = /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Plot.Parametric, {
				xy: (t) => [t, cc / t],
				domain: [.001, xm],
				color: C_CURVE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(Plot.Parametric, {
				xy: (t) => [t, cc / t],
				domain: [-xm, -.001],
				color: C_CURVE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: handle,
				onMove: (p) => {
					setCc(sp((Math.abs(p.x) < .4 ? .4 : p.x) * p.y) || 1);
				},
				color: C_CURVE,
				ariaLabel: "point on the curve, drag to set c"
			})
		] });
		readouts.push({
			label: "c",
			value: num(cc)
		}, {
			label: "equation",
			value: `x·y = ${num(cc)}`
		}, {
			label: "as a function",
			value: `y = ${num(cc)}/x`
		});
	}
	const figure = /* @__PURE__ */ jsx(CoordPlane, {
		view,
		height,
		ariaLabel: `${title}: ${readouts[1]?.value ?? ""}`,
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
export { ConicLab };