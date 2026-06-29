'use client';

import { toRad } from "../../core/util.mjs";
import { Tex as Tex$1 } from "../../core/tex.mjs";
import { evalTrig, exactTex, quadrant, sign } from "./core.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Circle, Dot, Label, Polyline, Segment, Stage, Vector } from "@classytic/stage";

//#region src/math/trig/diagrams.tsx
const SIGN_COLOR = (s) => s > 0 ? "var(--stage-good)" : s < 0 ? "var(--stage-danger)" : "var(--stage-muted)";
const CAST = [
	{
		q: 1,
		x: .55,
		y: .55,
		c: "A"
	},
	{
		q: 2,
		x: -.55,
		y: .55,
		c: "S"
	},
	{
		q: 3,
		x: -.55,
		y: -.55,
		c: "T"
	},
	{
		q: 4,
		x: .55,
		y: -.55,
		c: "C"
	}
];
function arc(thetaRad, r) {
	const n = 28;
	return Array.from({ length: 29 }, (_, i) => {
		const t = thetaRad * i / n;
		return {
			x: r * Math.cos(t),
			y: r * Math.sin(t)
		};
	});
}
/** A compact unit circle that turns with `deg`. The shared trig picture. */
function UnitCircleMini({ deg, showLegs = true, showValue = false, showCast = false, showHyp = false, size = 230 }) {
	const rad = toRad(deg);
	const P = {
		x: Math.cos(rad),
		y: Math.sin(rad)
	};
	const q = quadrant(deg);
	const sCos = sign("cos", deg), sSin = sign("sin", deg);
	const valOf = (fn) => exactTex(fn, deg) || (Math.round(evalTrig(fn, deg) * 100) / 100).toString().replace(/^-/, "−");
	return /* @__PURE__ */ jsxs("div", {
		style: {
			width: "100%",
			maxWidth: size
		},
		children: [/* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -1.35,
				xMax: 1.35,
				yMin: -1.3,
				yMax: 1.3
			},
			height: size,
			ariaLabel: `Unit circle at ${deg} degrees`,
			children: [
				/* @__PURE__ */ jsx(Axes, {}),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: 0,
						y: 0
					},
					r: 1,
					color: "var(--stage-fg)",
					opacity: .3,
					weight: 1.5,
					fill: "none"
				}),
				showCast && CAST.map(({ q: cq, x, y, c }) => /* @__PURE__ */ jsx(Label, {
					x,
					y,
					text: c,
					size: cq === q ? 18 : 13,
					weight: cq === q ? 800 : 600,
					color: cq === q ? "var(--stage-accent)" : "var(--stage-muted)"
				}, c)),
				/* @__PURE__ */ jsx(Polyline, {
					points: arc(rad, .3),
					color: "var(--stage-muted)",
					weight: 1.4
				}),
				showLegs && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: 0,
							y: 0
						},
						to: {
							x: P.x,
							y: 0
						},
						color: SIGN_COLOR(sCos),
						weight: 4
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: P.x,
							y: 0
						},
						to: {
							x: P.x,
							y: P.y
						},
						color: SIGN_COLOR(sSin),
						weight: 4
					}),
					/* @__PURE__ */ jsx(Label, {
						x: P.x / 2,
						y: 0,
						text: "cos",
						color: SIGN_COLOR(sCos),
						size: 10.5,
						dy: P.y >= 0 ? 13 : -7
					}),
					/* @__PURE__ */ jsx(Label, {
						x: P.x,
						y: P.y / 2,
						text: "sin",
						color: SIGN_COLOR(sSin),
						size: 10.5,
						dx: P.x >= 0 ? 7 : -7,
						anchor: P.x >= 0 ? "start" : "end"
					})
				] }),
				/* @__PURE__ */ jsx(Vector, {
					tail: {
						x: 0,
						y: 0
					},
					tip: P,
					color: "var(--stage-fg)",
					weight: 2
				}),
				showHyp && /* @__PURE__ */ jsx(Label, {
					x: P.x / 2,
					y: P.y / 2,
					text: "1",
					color: "var(--stage-fg)",
					size: 11,
					dx: -8
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: P.x,
					y: P.y,
					r: 5,
					color: "var(--stage-fg)"
				})
			]
		}), showValue && /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				justifyContent: "center",
				gap: 14,
				marginTop: 2,
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsxs("span", {
				style: { color: SIGN_COLOR(sCos) },
				children: ["cos = ", /* @__PURE__ */ jsx(Tex$1, { tex: valOf("cos") })]
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: SIGN_COLOR(sSin) },
				children: ["sin = ", /* @__PURE__ */ jsx(Tex$1, { tex: valOf("sin") })]
			})]
		})]
	});
}
/** The two triangles every exact value comes from: 45-45-90 and 30-60-90. */
function SpecialTriangles({ size = 300 }) {
	return /* @__PURE__ */ jsx("div", {
		style: {
			width: "100%",
			maxWidth: size
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -.2,
				xMax: 4.2,
				yMin: -.4,
				yMax: 2.2
			},
			height: size * .55,
			ariaLabel: "The 45-45-90 and 30-60-90 triangles",
			children: [
				/* @__PURE__ */ jsx(Polyline, {
					points: [
						{
							x: 0,
							y: 0
						},
						{
							x: 1.3,
							y: 0
						},
						{
							x: 1.3,
							y: 1.3
						},
						{
							x: 0,
							y: 0
						}
					],
					color: "var(--stage-accent)",
					weight: 2
				}),
				/* @__PURE__ */ jsx(Label, {
					x: .65,
					y: 0,
					text: "1",
					size: 12,
					dy: 14,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 1.3,
					y: .65,
					text: "1",
					size: 12,
					dx: 8,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: .6,
					y: .72,
					text: "√2",
					size: 12,
					dx: -6,
					color: "var(--stage-fg)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: .28,
					y: .04,
					text: "45°",
					size: 10,
					dy: 2,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Polyline, {
					points: [
						{
							x: 2.4,
							y: 0
						},
						{
							x: 3.9,
							y: 0
						},
						{
							x: 2.4,
							y: 1.6
						},
						{
							x: 2.4,
							y: 0
						}
					],
					color: "var(--stage-good)",
					weight: 2
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 3.15,
					y: 0,
					text: "√3",
					size: 12,
					dy: 14,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 2.4,
					y: .8,
					text: "1",
					size: 12,
					dx: -10,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 3.1799999999999997,
					y: .82,
					text: "2",
					size: 12,
					dx: 6,
					color: "var(--stage-fg)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 3.5999999999999996,
					y: .04,
					text: "30°",
					size: 10,
					dy: 2,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 2.42,
					y: 1.45,
					text: "60°",
					size: 10,
					dx: 6,
					color: "var(--stage-muted)"
				})
			]
		})
	});
}

//#endregion
export { SpecialTriangles, UnitCircleMini };