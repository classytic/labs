'use client';

import { toDeg, toRad } from "../core/util.mjs";
import { Tex as Tex$1 } from "../core/tex.mjs";
import { CheckButton } from "../kit/controls.mjs";
import { ControlBar, LabFrame } from "../kit/frame.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Circle, Dot, Grid, MovableDot, Polyline, Segment, Stage, Vector, useFrameLoop, useInView } from "@classytic/stage";

//#region src/math/trig-explorer.tsx
/**
* TrigExplorer, the unit circle ↔ sine wave connection (3Blue1Brown style),
* but interactive: drag the angle (or press play) and watch sin/cos trace out.
*
* Now on the @classytic/stage engine (SVG, accessible, themed), the unit circle,
* radius, projections, and unrolled wave are real primitives, the angle handle is
* a `MovableDot` (keyboard + aria), and animation runs on the engine clock.
*
* Deliberately FOCUSED on one idea, "sin and cos are the shadows of a point
* going around a circle." Plotting arbitrary trig (tan, y=a·sin(b·x), …) is the
* job of the general `Grapher`; this widget stays clean. Configurable only in
* which of sin/cos to show.
*/
const TWO_PI = Math.PI * 2;
const VIEW = {
	xMin: -1.5,
	xMax: 5,
	yMin: -1.4,
	yMax: 1.4
};
const WAVE_X0 = 1.5;
const WAVE_W = 3.3;
const waveX = (theta) => WAVE_X0 + theta / TWO_PI * WAVE_W;
const TRIG_FNS = ["sin", "cos"];
const FN_COLOR = {
	sin: "var(--stage-accent)",
	cos: "var(--stage-good)"
};
const FN_EVAL = {
	sin: Math.sin,
	cos: Math.cos
};
function normalizeFns(input) {
	const picked = ((Array.isArray(input) ? input : typeof input === "string" ? input.split(",") : null) ?? []).map((s) => String(s).trim().toLowerCase()).filter((s) => TRIG_FNS.includes(s));
	return picked.length ? Array.from(new Set(picked)) : ["sin", "cos"];
}
function TrigExplorer({ functions, startDeg = 30 } = {}) {
	const fns = normalizeFns(functions);
	const [theta, setTheta] = useState(toRad(startDeg));
	const [playing, setPlaying] = useState(false);
	const { ref: viewRef, inView } = useInView();
	useEffect(() => {
		setTheta(toRad(startDeg));
	}, [startDeg]);
	useFrameLoop((f) => {
		setTheta((prev) => (prev + f.dtMs / 1e3 * .9) % TWO_PI);
	}, { running: playing && inView });
	const cosT = Math.cos(theta);
	const sinT = Math.sin(theta);
	const waveOf = (fn) => {
		const pts = [];
		for (let a = 0; a <= theta + 1e-6; a += TWO_PI / 240) pts.push({
			x: waveX(a),
			y: FN_EVAL[fn](a)
		});
		pts.push({
			x: waveX(theta),
			y: FN_EVAL[fn](theta)
		});
		return pts;
	};
	const lead = fns[0] ?? "sin";
	const deg = toDeg(theta);
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view: VIEW,
			height: 320,
			ariaLabel: `Unit circle and unrolled ${fns.join(" & ")} wave at θ = ${deg.toFixed(0)} degrees`,
			children: [
				/* @__PURE__ */ jsx(Grid, {}),
				/* @__PURE__ */ jsx(Axes, {}),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: 0,
						y: 0
					},
					r: 1,
					color: "var(--stage-fg)",
					opacity: .3,
					weight: 1.5
				}),
				fns.includes("cos") && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: {
						x: cosT,
						y: 0
					},
					color: FN_COLOR.cos,
					weight: 2.5
				}),
				fns.includes("sin") && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: cosT,
						y: sinT
					},
					to: {
						x: cosT,
						y: 0
					},
					color: FN_COLOR.sin,
					weight: 2.5,
					dashed: true
				}),
				fns.map((fn) => /* @__PURE__ */ jsx(Polyline, {
					points: waveOf(fn),
					color: FN_COLOR[fn],
					weight: 2.5
				}, fn)),
				fns.map((fn) => /* @__PURE__ */ jsx(Dot, {
					x: waveX(theta),
					y: FN_EVAL[fn](theta),
					r: 3.5,
					color: FN_COLOR[fn]
				}, `d-${fn}`)),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: cosT,
						y: lead === "cos" ? 0 : sinT
					},
					to: {
						x: waveX(theta),
						y: FN_EVAL[lead](theta)
					},
					color: "var(--stage-fg)",
					opacity: .4,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Vector, {
					tail: {
						x: 0,
						y: 0
					},
					tip: {
						x: cosT,
						y: sinT
					},
					color: "var(--stage-fg)",
					weight: 2
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: {
						x: cosT,
						y: sinT
					},
					onMove: (p) => {
						setPlaying(false);
						let a = Math.atan2(p.y, p.x);
						if (a < 0) a += TWO_PI;
						setTheta(a);
					},
					color: "var(--stage-fg)",
					ariaLabel: "angle on the unit circle"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Trig Explorer",
		prompt: "Drag the angle on the circle (or press play), sin and cos are just its shadows.",
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: () => setPlaying((p) => !p),
				children: playing ? "Pause" : "Play"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-chip",
				onClick: () => {
					setPlaying(false);
					setTheta(toRad(startDeg));
				},
				children: "Reset"
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					marginLeft: "auto",
					display: "inline-flex",
					gap: 16,
					fontVariantNumeric: "tabular-nums"
				},
				children: [/* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\theta\\ ${deg.toFixed(0)}^\\circ` }) }), fns.map((fn) => /* @__PURE__ */ jsx("span", {
					style: { color: FN_COLOR[fn] },
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\${fn}\\theta\\ ${FN_EVAL[fn](theta).toFixed(2)}` })
				}, fn))]
			})
		] }),
		children: figure
	});
}

//#endregion
export { TRIG_FNS, TrigExplorer };