'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Grid, Label, Polygon, Segment, Stage } from "@classytic/stage";

//#region src/physics/work-energy/preset.tsx
/**
* WorkEnergyLab, "work done" you can SEE: work is the AREA under the force–distance
* graph. Two situations on one figure, a SPRING (F = kx, so W = ½kx², the triangle)
* and a CONSTANT force (W = Fx, the rectangle). Drag the distance and the shaded area
* (the work) grows with it; the equation updates in real maths (KaTeX). Interactive,
* not a timed sim, the graph recomputes as you drag.
*/
const X_MAX = 4;
const ACCENT = "var(--stage-accent)";
/** A little spring (stretching) or a box pushed by a constant force, displaced by x. */
function Picture({ mode, x }) {
	const W = 360, H = 64, x0 = 14, rest = 90;
	const frac = x / X_MAX;
	if (mode === "spring") {
		const len = rest + frac * 120;
		const coils = 9, step = (len - 20) / coils;
		let d = `M ${x0} ${H / 2} l 10 0`;
		for (let i = 0; i < coils; i++) d += ` l ${step / 2} -12 l ${step / 2} 12`;
		d += ` l 10 0`;
		const bx = 34 + len;
		return /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			style: {
				maxWidth: 360,
				display: "block",
				margin: "0 auto 6px"
			},
			role: "img",
			"aria-label": "a spring stretched by x",
			children: [
				/* @__PURE__ */ jsx("line", {
					x1: x0,
					y1: 6,
					x2: x0,
					y2: H - 6,
					stroke: "var(--stage-metal)",
					strokeWidth: 4
				}),
				/* @__PURE__ */ jsx("path", {
					d,
					fill: "none",
					stroke: ACCENT,
					strokeWidth: 2.5,
					strokeLinejoin: "round"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: bx,
					y: H / 2 - 14,
					width: 26,
					height: 28,
					rx: 3,
					fill: "color-mix(in oklab, var(--stage-accent) 30%, var(--stage-bg))",
					stroke: ACCENT,
					strokeWidth: 2
				})
			]
		});
	}
	const bx = 44 + frac * 150;
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: `0 0 ${W} ${H}`,
		width: "100%",
		style: {
			maxWidth: 360,
			display: "block",
			margin: "0 auto 6px"
		},
		role: "img",
		"aria-label": "a box pushed by a constant force over distance x",
		children: [
			/* @__PURE__ */ jsx("line", {
				x1: 4,
				y1: H - 10,
				x2: W - 4,
				y2: H - 10,
				stroke: "var(--stage-grid)",
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsx("rect", {
				x: bx,
				y: H - 38,
				width: 28,
				height: 28,
				rx: 3,
				fill: "color-mix(in oklab, var(--stage-accent) 30%, var(--stage-bg))",
				stroke: ACCENT,
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsx("line", {
				x1: bx - 30,
				y1: H - 24,
				x2: bx - 4,
				y2: H - 24,
				stroke: "var(--stage-warn)",
				strokeWidth: 3,
				markerEnd: "url(#stage-arrow)"
			}),
			/* @__PURE__ */ jsx("text", {
				x: bx - 17,
				y: H - 30,
				textAnchor: "middle",
				fontSize: 11,
				fontWeight: 700,
				fill: "var(--stage-warn)",
				children: "F"
			})
		]
	});
}
function WorkEnergyLab({ mode: mode0 = "spring", title = "Work done: it’s the area under the force", prompt = "Pull the distance up and watch the work (the shaded area) grow. A spring fights back harder the further you go, so its work grows as x².", objectives = [
	"Read work as the area under a force–distance graph",
	"Spring: W = ½kx² (the triangle)",
	"Constant force: W = Fx (the rectangle)"
] } = {}) {
	const [mode, setMode] = useState(mode0);
	const [k, setK] = useState(3);
	const [force, setForce] = useState(8);
	const [x, setX] = useState(2.5);
	const spring = mode === "spring";
	const Fx = spring ? k * x : force;
	const W = spring ? .5 * k * x * x : force * x;
	const yTop = (spring ? k * X_MAX : force) * 1.15 + 1;
	const view = {
		xMin: -.55,
		xMax: 4.4,
		yMin: -yTop * .12,
		yMax: yTop
	};
	const area = spring ? [
		{
			x: 0,
			y: 0
		},
		{
			x,
			y: 0
		},
		{
			x,
			y: Fx
		}
	] : [
		{
			x: 0,
			y: 0
		},
		{
			x,
			y: 0
		},
		{
			x,
			y: force
		},
		{
			x: 0,
			y: force
		}
	];
	const fullFrom = spring ? {
		x: 0,
		y: 0
	} : {
		x: 0,
		y: force
	};
	const fullTo = spring ? {
		x: X_MAX,
		y: k * X_MAX
	} : {
		x: X_MAX,
		y: force
	};
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Picture, {
		mode,
		x
	}), /* @__PURE__ */ jsxs(Stage, {
		view,
		height: 300,
		preserveAspect: false,
		ariaLabel: "Force versus displacement; work is the shaded area under the line",
		children: [
			/* @__PURE__ */ jsx(Grid, {}),
			/* @__PURE__ */ jsx(Axes, { ticks: true }),
			/* @__PURE__ */ jsx(Polygon, {
				points: area,
				fill: "color-mix(in oklab, var(--stage-accent) 22%, transparent)",
				color: "transparent"
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: fullFrom,
				to: fullTo,
				color: "var(--stage-metal)",
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: spring ? {
					x: 0,
					y: 0
				} : {
					x: 0,
					y: force
				},
				to: {
					x,
					y: Fx
				},
				color: ACCENT,
				weight: 3
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x,
					y: 0
				},
				to: {
					x,
					y: Fx
				},
				color: "var(--stage-grid)",
				weight: 1,
				dashed: true
			}),
			/* @__PURE__ */ jsx(Dot, {
				x,
				y: Fx,
				r: 5,
				color: ACCENT
			}),
			/* @__PURE__ */ jsx(Label, {
				x: X_MAX / 2,
				y: -yTop * .07,
				text: "distance x (m)",
				color: "var(--stage-muted)"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: .05,
				y: yTop * .95,
				text: "force F (N)",
				color: "var(--stage-muted)",
				anchor: "start"
			})
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [/* @__PURE__ */ jsx("div", {
				className: "lab-field-label",
				style: { marginBottom: 4 },
				children: "work done"
			}), /* @__PURE__ */ jsx("span", {
				className: "lab-callout-big",
				children: /* @__PURE__ */ jsx(Tex$1, { tex: spring ? `W=\\tfrac12 k x^{2}=${W.toFixed(1)}\\,\\mathrm{J}` : `W=Fx=${W.toFixed(1)}\\,\\mathrm{J}` })
			})]
		}), /* @__PURE__ */ jsxs("p", {
			className: "lab-prompt",
			children: [
				"Work = the ",
				/* @__PURE__ */ jsx("b", { children: "area under the force–distance graph" }),
				".",
				" ",
				spring ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
					"A spring pulls back harder the further it stretches, so the area is a triangle and W grows as ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "x^2" }),
					"."
				] }) : "A steady force gives a rectangle, so W is simply force × distance."
			]
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "situation",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: spring,
						onClick: () => setMode("spring"),
						children: "spring (F = kx)"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: !spring,
						onClick: () => setMode("constant"),
						children: "constant force"
					})]
				})
			}),
			spring ? /* @__PURE__ */ jsx(Field, {
				label: "spring constant k",
				value: `${k} N/m`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: k,
					min: 1,
					max: 6,
					step: .5,
					onChange: setK,
					ariaLabel: "spring constant"
				})
			}) : /* @__PURE__ */ jsx(Field, {
				label: "force F",
				value: `${force} N`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: force,
					min: 2,
					max: 14,
					step: 1,
					onChange: setForce,
					ariaLabel: "force"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "distance x",
				value: `${x.toFixed(1)} m`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: x,
					min: 0,
					max: X_MAX,
					step: .1,
					onChange: setX,
					ariaLabel: "distance pulled"
				})
			})
		] }),
		children: figure
	});
}

//#endregion
export { WorkEnergyLab };