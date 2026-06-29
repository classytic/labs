'use client';

import { num, toRad } from "../core/util.mjs";
import { CheckButton, Slider, StatusPill } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, Polyline, Segment, Stage, StageAssetDefs, fmt, useCoords, useFrameLoop, useInView } from "@classytic/stage";

//#region src/physics/projectile-lab.tsx
/**
* ProjectileLab, tune launch angle + speed, land the shot on the target. Now on
* the @classytic/stage engine (SVG, accessible): the ground, cannon, predicted
* arc, target, and ball are real primitives in a metre coordinate system; the
* flight animates on the engine clock.
*/
/**
* A field cannon anchored at the launch point (math origin), elevated to
* `angle`. Drawn in a LOCAL pixel frame with STATIC coordinates and rotated via
* an SVG transform, so no transcendental-derived coordinate is ever serialized
* into an attribute (SSR-deterministic, per the engine's `fmt` rule). Sized in
* world units (px-per-metre) so it tracks pan/zoom like the rest of the scene.
*/
function CannonGlyph({ angle }) {
	const c = useCoords();
	const [ox, oy] = c.toPx(0, 0);
	const s = c.sx(1);
	const L = 13 * s, hw = 1.7 * s;
	const grad = "url(#stage-grad-metal)";
	const metal = "var(--stage-metal)";
	const edge = "color-mix(in oklab, var(--stage-metal) 60%, black)";
	const dark = "color-mix(in oklab, var(--stage-metal) 42%, black)";
	const sheen = "color-mix(in oklab, var(--stage-sheen) 45%, transparent)";
	const T = `translate(${fmt(ox)},${fmt(oy)})`;
	const spokes = Array.from({ length: 6 }, (_, i) => {
		const a = i * Math.PI / 3;
		return {
			x: fmt(s * 2.2 * Math.cos(a)),
			y: fmt(s * 2.2 * Math.sin(a))
		};
	});
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx(StageAssetDefs, {}),
		/* @__PURE__ */ jsxs("g", {
			transform: `${T} rotate(${fmt(-angle)})`,
			children: [
				/* @__PURE__ */ jsx("circle", {
					cx: -s * 1.3,
					cy: 0,
					r: hw * 1.15,
					fill: grad,
					stroke: edge,
					strokeWidth: .7
				}),
				/* @__PURE__ */ jsx("path", {
					d: `M 0 ${-hw * .92} L ${L * .84} ${-hw * .78} L ${L * .84} ${-hw} L ${L} ${-hw} L ${L} ${hw} L ${L * .84} ${hw} L ${L * .84} ${hw * .78} L 0 ${hw * .92} Z`,
					fill: grad,
					stroke: edge,
					strokeWidth: .7,
					strokeLinejoin: "round"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: L * .4,
					y1: -hw * .95,
					x2: L * .4,
					y2: hw * .95,
					stroke: dark,
					strokeWidth: 1.6
				}),
				/* @__PURE__ */ jsx("line", {
					x1: L * .72,
					y1: -hw,
					x2: L * .72,
					y2: hw,
					stroke: dark,
					strokeWidth: 1.6
				}),
				/* @__PURE__ */ jsx("line", {
					x1: s * .4,
					y1: -hw * .5,
					x2: L * .8,
					y2: -hw * .5,
					stroke: sheen,
					strokeWidth: 1.2,
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ jsx("ellipse", {
					cx: L,
					cy: 0,
					rx: hw * .22,
					ry: hw * .9,
					fill: dark
				})
			]
		}),
		/* @__PURE__ */ jsxs("g", {
			transform: T,
			children: [
				/* @__PURE__ */ jsx("circle", {
					cx: 0,
					cy: 0,
					r: s * 2.2,
					fill: "var(--stage-bg)",
					stroke: metal,
					strokeWidth: 2
				}),
				spokes.map((p, i) => /* @__PURE__ */ jsx("line", {
					x1: 0,
					y1: 0,
					x2: p.x,
					y2: p.y,
					stroke: metal,
					strokeWidth: 1.2
				}, i)),
				/* @__PURE__ */ jsx("circle", {
					cx: 0,
					cy: 0,
					r: s * .7,
					fill: metal
				})
			]
		})
	] });
}
const WORLD_W = 130;
function ProjectileLab(props) {
	const target = num(props.targetMeters, 70);
	const G = num(props.g, 9.8);
	const [angle, setAngle] = useState(45);
	const [speed, setSpeed] = useState(28);
	const [phase, setPhase] = useState("idle");
	const [t, setT] = useState(0);
	const startRef = useRef(null);
	const { ref: viewRef, inView } = useInView();
	const vx = speed * Math.cos(toRad(angle));
	const vy = speed * Math.sin(toRad(angle));
	const range = vx * (2 * vy) / G;
	const peak = vy * vy / (2 * G);
	const tof = 2 * vy / G;
	useFrameLoop((f) => {
		if (startRef.current === null) startRef.current = f.timeMs;
		const tt = (f.timeMs - startRef.current) / 1e3;
		setT(tt);
		if (tt >= tof) {
			const landed = vx * tof;
			setPhase(Math.abs(landed - target) <= 4 ? "hit" : "miss");
		}
	}, { running: phase === "flying" && inView });
	const fire = () => {
		startRef.current = null;
		setT(0);
		setPhase("flying");
	};
	const reset = (label, set) => (v) => {
		set(v);
		setPhase("idle");
		setT(0);
	};
	const arc = [];
	const ds = tof / 60 || 1;
	for (let s = 0; s <= tof + 1e-9; s += ds) arc.push({
		x: vx * s,
		y: Math.max(vy * s - .5 * G * s * s, 0)
	});
	const tt = Math.min(t, tof);
	const ball = {
		x: vx * tt,
		y: Math.max(vy * tt - .5 * G * tt * tt, 0)
	};
	const view = {
		xMin: -5,
		xMax: WORLD_W,
		yMin: -4,
		yMax: Math.max(40, peak + 12)
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height: 300,
			ariaLabel: `Projectile launched at ${angle}° and ${speed} m/s; target at ${target} m`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: view.xMin,
						y: 0
					},
					to: {
						x: WORLD_W,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 1.5
				}),
				[
					0,
					20,
					40,
					60,
					80,
					100,
					120
				].map((m) => /* @__PURE__ */ jsx(Label, {
					x: m,
					y: 0,
					text: `${m}m`,
					color: "var(--stage-fg)",
					size: 10,
					dy: 14
				}, m)),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: target,
						y: 2.6
					},
					r: 2.6,
					color: "var(--stage-accent-2)",
					fill: "none",
					weight: 2
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: target,
						y: 2.6
					},
					r: 1.1,
					color: "var(--stage-accent-2)",
					fill: "var(--stage-accent-2)",
					fillOpacity: .9,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Label, {
					x: target,
					y: 2.6,
					text: "target",
					color: "var(--stage-accent-2)",
					size: 11,
					dy: -22
				}),
				/* @__PURE__ */ jsx(CannonGlyph, { angle }),
				/* @__PURE__ */ jsx(Polyline, {
					points: arc,
					color: "var(--stage-accent)",
					opacity: .55,
					weight: 1.5,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: ball,
					r: 1.4,
					color: "var(--stage-good)",
					fill: "var(--stage-good)",
					fillOpacity: .25,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: ball.x,
					y: ball.y,
					r: 5,
					color: "var(--stage-good)"
				})
			]
		})
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsx(Field, {
			label: "angle",
			value: `${angle}°`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: angle,
				min: 10,
				max: 80,
				step: 1,
				onChange: reset(angle, setAngle),
				ariaLabel: "launch angle",
				style: { width: 110 }
			})
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "speed",
			value: `${speed} m/s`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: speed,
				min: 10,
				max: 36,
				step: 1,
				onChange: reset(speed, setSpeed),
				ariaLabel: "launch speed",
				style: { width: 110 }
			})
		}),
		/* @__PURE__ */ jsx(CheckButton, {
			onClick: fire,
			children: "Fire"
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Projectile Lab",
		prompt: "Tune the angle and speed, can you land the shot on the target?",
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			(phase === "hit" || phase === "miss") && /* @__PURE__ */ jsx(StatusPill, {
				ok: phase === "hit",
				children: phase === "hit" ? "🎯 Direct hit!" : "So close, adjust and retry"
			}),
			/* @__PURE__ */ jsx(Callout, {
				tone: "result",
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "grid",
						gap: 4,
						fontVariantNumeric: "tabular-nums"
					},
					children: [
						/* @__PURE__ */ jsxs("span", { children: [
							"range ",
							range.toFixed(0),
							" m"
						] }),
						/* @__PURE__ */ jsxs("span", { children: [
							"peak ",
							peak.toFixed(0),
							" m"
						] }),
						/* @__PURE__ */ jsxs("span", { children: [
							"time ",
							tof.toFixed(1),
							" s"
						] })
					]
				})
			}),
			/* @__PURE__ */ jsxs("p", {
				style: {
					fontSize: 11,
					opacity: .6,
					margin: "4px 2px 0"
				},
				children: [
					"target at ",
					target,
					" m · g = ",
					G,
					" m/s²"
				]
			})
		] }),
		controls,
		children: figure
	});
}

//#endregion
export { ProjectileLab };