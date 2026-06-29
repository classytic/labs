'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Chip, Slider } from "../../kit/controls.mjs";
import { Callout, Control, ControlBar, Field, LabFrame, LiveRegion, MeterBar } from "../../kit/frame.mjs";
import { useFrameTick, useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, Polyline, Segment, Stage, useInView } from "@classytic/stage";

//#region src/physics/energy-skate/preset.tsx
/**
* EnergySkateLab, "Where did the energy go?", KE ⇄ PE on a ramp, with friction
* bleeding the total into heat.
*
* A skater is released from a height on a parabolic ramp. Three stacked bars , 
* potential, kinetic, and thermal, ALWAYS sum to the same total: as the skater
* drops, the PE bar empties into the KE bar and back on the way up. Turn friction
* on and a THERMAL bar grows each pass, so the skater can never climb as high
* again, mechanical energy isn't destroyed, it's moved to heat. (The "LOL" energy
* bar chart, animated.)
*
* This complements WorkEnergyLab (work = area under F–x): here the spotlight is
* CONVERSION and conservation, not the definition of work.
*
* Tokenized SVG; energy-method integrator here; honours reduced-motion.
*/
const G = 9.8;
const X = 6;
const H = 5;
const MU = .08;
const yAt = (x) => H * (x / X) * (x / X);
function EnergySkateLab({ startHeight = 4, friction = false, mass = 1, title = "Where did the energy go?: KE ⇄ PE (and heat)", prompt = "Release the skater and watch potential energy pour into kinetic and back. The three bars always add to the same total, unless friction is on, then a heat bar grows and the skater can’t climb as high again.", objectives, controlConfig }) {
	const [h0, setH0] = useState(clamp(startHeight, 1, H));
	const [fric, setFric] = useState(friction);
	const [m] = useState(mass);
	const [running, setRunning] = useState(false);
	const x0 = -6 * Math.sqrt(h0 / H);
	const E0 = m * G * h0;
	const xRef = useRef(x0);
	const dirRef = useRef(1);
	const qRef = useRef(0);
	const reduce = useReducedMotion();
	const { ref: viewRef, inView } = useInView();
	const SCALE = .5;
	const repaint = useFrameTick(running && inView, (f) => {
		const dt = Math.min(.03, f.dtMs / 1e3);
		let x = xRef.current;
		const y = yAt(x);
		let ke = E0 - m * G * y - qRef.current;
		if (fric && E0 - qRef.current <= m * G * .03) {
			xRef.current = 0;
			setRunning(false);
			return;
		}
		if (ke <= 0) {
			dirRef.current = -dirRef.current;
			ke = 0;
		}
		const v = Math.sqrt(Math.max(0, 2 * ke / m));
		const dx = dirRef.current * v * SCALE * dt;
		x = clamp(x + dx, -6, X);
		if (Math.abs(x) >= X) dirRef.current = -dirRef.current;
		if (fric) qRef.current = Math.min(E0, qRef.current + MU * m * G * Math.abs(dx));
		xRef.current = x;
	});
	const release = () => {
		xRef.current = x0;
		dirRef.current = 1;
		qRef.current = 0;
		if (reduce) {
			xRef.current = 0;
			repaint();
			return;
		}
		setRunning(true);
	};
	const onH0 = (n) => {
		setH0(clamp(n, 1, H));
		setRunning(false);
		xRef.current = -6 * Math.sqrt(clamp(n, 1, H) / H);
		dirRef.current = 1;
		qRef.current = 0;
	};
	const x = xRef.current;
	const y = yAt(x);
	const pe = m * G * y;
	const ke = Math.max(0, E0 - pe - qRef.current);
	const q = qRef.current;
	const track = [];
	for (let i = -6; i <= 6.000000001; i += .25) track.push({
		x: i,
		y: yAt(i)
	});
	const view = {
		xMin: -7,
		xMax: 7,
		yMin: -1,
		yMax: 6
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height: 240,
			preserveAspect: false,
			ariaLabel: `Skater on a ramp released from ${h0.toFixed(1)} m${fric ? ", with friction" : ""}`,
			children: [
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
					opacity: .3,
					weight: 1
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: view.xMin,
						y: h0
					},
					to: {
						x: view.xMax,
						y: h0
					},
					color: "var(--stage-muted)",
					opacity: .5,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Label, {
					x: view.xMin,
					y: h0,
					text: `release ${h0.toFixed(1)} m`,
					color: "var(--stage-muted)",
					size: 10,
					anchor: "start",
					dy: -3
				}),
				/* @__PURE__ */ jsx(Polyline, {
					points: track,
					color: "var(--stage-fg)",
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x,
					y: y + .4,
					text: "🛹",
					color: "var(--stage-fg)",
					size: 30
				})
			]
		})
	});
	const ebar = E0 > 0 ? 1 / E0 : 0;
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 8
			},
			children: [
				/* @__PURE__ */ jsx(MeterBar, {
					label: "potential PE = mgh",
					frac: pe * ebar,
					color: "var(--stage-accent-2)",
					value: `${pe.toFixed(1)} J`
				}),
				/* @__PURE__ */ jsx(MeterBar, {
					label: "kinetic KE = ½mv²",
					frac: ke * ebar,
					color: "var(--stage-good)",
					value: `${ke.toFixed(1)} J`
				}),
				fric && /* @__PURE__ */ jsx(MeterBar, {
					label: "thermal (friction) 🔥",
					frac: q * ebar,
					color: "var(--stage-warn)",
					value: `${q.toFixed(1)} J`
				}),
				/* @__PURE__ */ jsx(Callout, {
					tone: "result",
					children: /* @__PURE__ */ jsxs("span", {
						style: { fontVariantNumeric: "tabular-nums" },
						children: [
							"PE + KE",
							fric ? " + heat" : "",
							" = ",
							/* @__PURE__ */ jsxs("strong", { children: [(pe + ke + (fric ? q : 0)).toFixed(1), " J"] }),
							" ",
							"= constant total ",
							E0.toFixed(1),
							" J"
						]
					})
				}),
				/* @__PURE__ */ jsx("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: "Friction off → the skater returns to the same height forever (mechanical energy conserved). Friction on → the heat bar climbs and every peak is lower: energy moved, not lost."
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: `Potential ${pe.toFixed(1)}, kinetic ${ke.toFixed(1)}${fric ? `, heat ${q.toFixed(1)}` : ""} joules; total ${E0.toFixed(1)}.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: release,
				children: "▶ Release"
			}),
			/* @__PURE__ */ jsx(Control, {
				name: "friction",
				children: /* @__PURE__ */ jsxs(Chip, {
					selected: fric,
					onClick: () => {
						setFric((c) => !c);
						setRunning(false);
						qRef.current = 0;
					},
					children: ["friction ", fric ? "on 🔥" : "off"]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "start height",
				value: `${h0.toFixed(1)} m`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: h0,
					min: 1,
					max: H,
					step: .5,
					onChange: onH0,
					ariaLabel: "release height (m)"
				})
			})
		] }),
		controlConfig,
		children: figure
	});
}

//#endregion
export { EnergySkateLab };