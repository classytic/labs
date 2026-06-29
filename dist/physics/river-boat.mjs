'use client';

import { clamp, num, toDeg, toRad } from "../core/util.mjs";
import { Tex as Tex$1 } from "../core/tex.mjs";
import { Chip, Slider } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { LabeledVector } from "../kit/diagram.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Grid, Label, Polygon, Segment, Stage, fmt, useControlSurface, useCoords } from "@classytic/stage";

//#region src/physics/river-boat.tsx
/**
* RiverBoat, the classic "boat crossing a flowing river" vector problem, the one
* that trips students on component resolution. A boat aims across the current at a
* heading θ; the river carries it downstream. Walk the steps to SEE why you add
* the boat and current velocities tip-to-tail, then resolve the resultant into
* an "across" component (v_b·cosθ, sets crossing time) and a "downstream"
* component (v_c − v_b·sinθ, sets the drift). Aim upstream at θ = arcsin(v_c/v_b)
* and the drift cancels, you land straight across.
*
* Now on the @classytic/stage engine (SVG vectors via the shared `LabeledVector`
* helper, accessible, themed); keeps the agent `useControlSurface` seam.
*/
/**
* A small boat anchored at the launch point (math origin), heading `thetaDeg`
* upstream from straight-across. Fixed on-screen size (a constant glyph, like an
* angle mark), rotated via a transform with static local coordinates, nose
* points along +across, so rotate(−θ) aims it upstream. SSR-safe: no
* transcendental-derived coordinate is serialized.
*/
function BoatGlyph({ thetaDeg }) {
	const [ox, oy] = useCoords().toPx(0, 0);
	const hull = "var(--stage-metal)";
	const edge = "color-mix(in oklab, var(--stage-metal) 60%, black)";
	const sheen = "color-mix(in oklab, var(--stage-sheen) 50%, transparent)";
	return /* @__PURE__ */ jsxs("g", {
		transform: `translate(${fmt(ox)},${fmt(oy)}) rotate(${fmt(-thetaDeg)})`,
		children: [
			/* @__PURE__ */ jsx("path", {
				d: "M -2.4 10 L -3.6 18 M 2.4 10 L 3.6 18",
				fill: "none",
				stroke: sheen,
				strokeWidth: 1.1,
				strokeDasharray: "2 3",
				opacity: .6,
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("ellipse", {
				cx: 0,
				cy: 2,
				rx: 6.5,
				ry: 9,
				fill: "color-mix(in oklab, black 60%, transparent)",
				opacity: .12
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M 0 -12 C 4.6 -5 5.6 4 4 10 L -4 10 C -5.6 4 -4.6 -5 0 -12 Z",
				fill: hull,
				stroke: edge,
				strokeWidth: 1,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M -3.2 7 C -4.4 2 -3.4 -3 0 -8.5",
				fill: "none",
				stroke: sheen,
				strokeWidth: .9,
				opacity: .55
			}),
			/* @__PURE__ */ jsx("rect", {
				x: -2.6,
				y: -1.5,
				width: 5.2,
				height: 4,
				rx: 1.2,
				fill: "var(--stage-bg)",
				stroke: edge,
				strokeWidth: .6
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: 0,
				cy: -9,
				r: 1.1,
				fill: "var(--stage-accent)"
			})
		]
	});
}
/**
* Wave streaks drifting downstream, illustrating the current. Drift speed scales
* with `current` (vᵧ), a still river is calm, a fast one streams. Animated with
* a CSS keyframe (declarative, SSR-safe, honours prefers-reduced-motion); the
* dash period equals the keyframe translate, so the loop is seamless.
*/
function RiverWaves({ view, W, current }) {
	const c = useCoords();
	if (current <= .01) return null;
	const leftX = c.toPx(view.xMin, 0)[0] - 40;
	const rightX = c.toPx(view.xMax, 0)[0] + 40;
	const speed = current * c.sx(1) * .3;
	const dur = Math.max(1.2, Math.min(14, 28 / speed));
	const ys = [
		.16,
		.38,
		.6,
		.82,
		.96
	].map((f) => c.toPx(0, f * W)[1]);
	return /* @__PURE__ */ jsx("g", {
		className: "lab-river-wave",
		style: { animationDuration: `${dur}s` },
		children: ys.map((y, i) => /* @__PURE__ */ jsx("line", {
			x1: fmt(leftX),
			y1: fmt(y),
			x2: fmt(rightX),
			y2: fmt(y),
			stroke: "var(--stage-accent)",
			strokeWidth: 1.4,
			strokeLinecap: "round",
			strokeDasharray: "10 18",
			strokeDashoffset: i % 2 ? 9 : 0,
			opacity: .42
		}, i))
	});
}
const STEPS = [
	"Aim the boat across, this is its velocity through the water.",
	"The river flows, pushing the boat downstream at vᵧ.",
	"Add them tip-to-tail: the resultant is the boat’s true path over the ground.",
	"Resolve the resultant: across = vᵦ·cos θ, downstream = vᵧ − vᵦ·sin θ.",
	"Across speed sets the crossing time; the leftover downstream speed is the drift."
];
function RiverBoat({ boatSpeed, current, riverWidth, title = "Crossing a flowing river", height = 360, controlId } = {}) {
	const W = clamp(num(riverWidth, 8), 3, 14);
	const [vb, setVb] = useState(clamp(num(boatSpeed, 4), .5, 10));
	const [vc, setVc] = useState(clamp(num(current, 2), 0, 8));
	const [theta, setTheta] = useState(0);
	const [step, setStep] = useState(0);
	useEffect(() => {
		setVb(clamp(num(boatSpeed, 4), .5, 10));
	}, [boatSpeed]);
	useEffect(() => {
		setVc(clamp(num(current, 2), 0, 8));
	}, [current]);
	useControlSurface(controlId, {
		heading: {
			type: "number",
			label: "heading θ (° upstream)",
			min: -60,
			max: 60,
			get: () => theta,
			set: setTheta
		},
		boatSpeed: {
			type: "number",
			label: "boat speed",
			min: .5,
			max: 10,
			unit: "m/s",
			get: () => vb,
			set: setVb
		},
		current: {
			type: "number",
			label: "current",
			min: 0,
			max: 8,
			unit: "m/s",
			get: () => vc,
			set: setVc
		},
		step: {
			type: "number",
			label: "walkthrough step",
			min: 0,
			max: STEPS.length - 1,
			get: () => step,
			set: (v) => setStep(Math.round(v))
		},
		aimStraight: {
			type: "action",
			label: "aim to land straight across",
			invoke: () => setTheta(toDeg(Math.asin(clamp(vc / vb, -1, 1))))
		}
	});
	const rad = toRad(theta);
	const across = vb * Math.cos(rad);
	const downstream = vc - vb * Math.sin(rad);
	const cross = across > .001;
	const tCross = cross ? W / across : Infinity;
	const drift = cross ? downstream * tCross : Infinity;
	const view = {
		xMin: -3,
		xMax: 15,
		yMin: -2,
		yMax: W + 3
	};
	const boatV = {
		x: -vb * Math.sin(rad),
		y: vb * Math.cos(rad)
	};
	const curV = {
		x: vc,
		y: 0
	};
	const resV = {
		x: boatV.x + curV.x,
		y: boatV.y + curV.y
	};
	const canLandStraight = vc <= vb;
	const aimStraight = () => setTheta(toDeg(Math.asin(clamp(vc / vb, -1, 1))));
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height,
			ariaLabel: `River-crossing vector diagram, step ${step + 1} of ${STEPS.length}`,
			children: [
				/* @__PURE__ */ jsx(Grid, {}),
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: view.xMin,
							y: 0
						},
						{
							x: view.xMax,
							y: 0
						},
						{
							x: view.xMax,
							y: W
						},
						{
							x: view.xMin,
							y: W
						}
					],
					color: "none",
					fill: "var(--stage-accent)",
					fillOpacity: .1
				}),
				/* @__PURE__ */ jsx(RiverWaves, {
					view,
					W,
					current: vc
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: view.xMin,
						y: 0
					},
					to: {
						x: view.xMax,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .4,
					weight: 2
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: view.xMin,
						y: W
					},
					to: {
						x: view.xMax,
						y: W
					},
					color: "var(--stage-fg)",
					opacity: .4,
					weight: 2
				}),
				/* @__PURE__ */ jsx(Label, {
					x: view.xMax - 1,
					y: 0,
					text: "start bank",
					color: "var(--stage-fg)",
					anchor: "end",
					dy: 14,
					size: 12
				}),
				/* @__PURE__ */ jsx(Label, {
					x: view.xMax - 1,
					y: W,
					text: "far bank",
					color: "var(--stage-fg)",
					anchor: "end",
					dy: -10,
					size: 12
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: 0,
					y: W,
					r: 4,
					color: "var(--stage-fg)",
					opacity: .5
				}),
				/* @__PURE__ */ jsx(LabeledVector, {
					tail: {
						x: 0,
						y: 0
					},
					comp: boatV,
					color: "var(--stage-accent)",
					label: "boat vᵦ"
				}),
				step >= 1 && /* @__PURE__ */ jsx(LabeledVector, {
					tail: {
						x: 0,
						y: 0
					},
					comp: curV,
					color: "var(--stage-accent-2)",
					label: "current vᵧ"
				}),
				step >= 2 && /* @__PURE__ */ jsx(LabeledVector, {
					tail: boatV,
					comp: curV,
					color: "var(--stage-accent-2)",
					weight: 1.5
				}),
				step >= 2 && /* @__PURE__ */ jsx(LabeledVector, {
					tail: {
						x: 0,
						y: 0
					},
					comp: resV,
					color: "var(--stage-good)",
					weight: 3,
					components: step >= 3,
					label: "resultant"
				}),
				step >= 4 && cross && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: {
						x: drift,
						y: W
					},
					color: "var(--stage-good)",
					weight: 1.5,
					dashed: true
				}),
				step >= 4 && cross && /* @__PURE__ */ jsx(Dot, {
					x: drift,
					y: W,
					r: 6,
					color: "var(--stage-good)"
				}),
				step >= 4 && cross && /* @__PURE__ */ jsx(Label, {
					x: drift,
					y: W,
					text: "lands here",
					color: "var(--stage-good)",
					dy: -12,
					size: 12
				}),
				/* @__PURE__ */ jsx(BoatGlyph, { thetaDeg: theta }),
				" "
			]
		})
	});
	const aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
		tone: "result",
		children: [
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)",
					fontWeight: 600
				},
				children: cross ? "crossing" : "no progress across"
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 15,
					fontWeight: 800,
					fontVariantNumeric: "tabular-nums"
				},
				children: cross ? `lands ${drift.toFixed(1)} m downstream` : ", "
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: cross ? `t = ${tCross.toFixed(1)} s` : "aim less upstream"
			})
		]
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 4,
			fontSize: 13
		},
		children: [
			/* @__PURE__ */ jsx(Tex$1, { tex: `v_{across} = v_b\\cos\\theta = ${across.toFixed(2)}` }),
			/* @__PURE__ */ jsx(Tex$1, { tex: `v_{down} = v_c - v_b\\sin\\theta = ${downstream.toFixed(2)}` }),
			cross && /* @__PURE__ */ jsx(Tex$1, { tex: `t = W/(v_b\\cos\\theta) = ${tCross.toFixed(1)}\\,\\text{s}` })
		]
	})] });
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsxs("span", {
			style: {
				gridColumn: "1 / -1",
				display: "inline-flex",
				gap: 6,
				alignItems: "center",
				flexWrap: "wrap"
			},
			children: [
				/* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => setStep((s) => Math.max(0, s - 1)),
					children: "← Back"
				}),
				/* @__PURE__ */ jsxs("span", {
					style: {
						fontVariantNumeric: "tabular-nums",
						opacity: .75,
						fontSize: 13
					},
					children: [
						"step ",
						step + 1,
						"/",
						STEPS.length
					]
				}),
				/* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => setStep((s) => Math.min(STEPS.length - 1, s + 1)),
					children: "Next →"
				}),
				canLandStraight && /* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: aimStraight,
					children: "aim straight"
				})
			]
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "boat vᵦ",
			value: vb.toFixed(1),
			children: /* @__PURE__ */ jsx(Slider, {
				value: vb,
				min: .5,
				max: 10,
				step: .1,
				onChange: setVb,
				ariaLabel: "boat speed"
			})
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "current vᵧ",
			value: vc.toFixed(1),
			children: /* @__PURE__ */ jsx(Slider, {
				value: vc,
				min: 0,
				max: 8,
				step: .1,
				onChange: setVc,
				ariaLabel: "current speed"
			})
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "θ (° up)",
			value: theta.toFixed(0),
			children: /* @__PURE__ */ jsx(Slider, {
				value: theta,
				min: -60,
				max: 60,
				step: 1,
				onChange: setTheta,
				ariaLabel: "heading upstream"
			})
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: STEPS[step],
		aside,
		controls,
		children: figure
	});
}

//#endregion
export { RiverBoat };