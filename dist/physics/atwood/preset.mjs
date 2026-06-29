'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Chip, Slider, StatusPill } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick, useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Label, Polygon, Segment, Stage, useInView } from "@classytic/stage";

//#region src/physics/atwood/preset.tsx
/**
* AtwoodLab, "Which way, and how fast?", two masses over a pulley.
*
* The classic Atwood machine: link two masses over a frictionless pulley and the
* WHOLE system shares one acceleration. Gravity pulls each side (m·g), but only
* the DIFFERENCE drives the motion while the TOTAL mass resists it:
*
*     a = (m₁ − m₂)·g / (m₁ + m₂)        tension  T = 2·m₁·m₂·g / (m₁ + m₂)
*
* Equal masses → balance (a = 0). A tiny difference on big masses → a gentle a,
* which is exactly how Atwood measured g. Predict which side drops, then release.
*
* Tokenized SVG; time-dependent integrator here; honours reduced-motion.
*/
const G = 9.8;
const Y0 = .6;
const TRAVEL = 2.6;
function AtwoodLab({ m1 = 3, m2 = 2, title = "Atwood machine: which way, and how fast?", prompt = "Two masses share one rope over a pulley. Only the difference in weight drives them, while the total mass resists: a = (m₁ − m₂)g / (m₁ + m₂). Predict which side falls, then release.", objectives, controlConfig }) {
	const [ma, setMa] = useState(m1);
	const [mb, setMb] = useState(m2);
	const [running, setRunning] = useState(false);
	const [finished, setFinished] = useState(false);
	const tRef = useRef(0);
	const reduce = useReducedMotion();
	const { ref: viewRef, inView } = useInView();
	useCheckpoint({
		solved: finished,
		activity: "atwood"
	});
	const a = (ma - mb) * G / (ma + mb);
	const tension = 2 * ma * mb * G / (ma + mb);
	const balanced = Math.abs(ma - mb) < 1e-9;
	const repaint = useFrameTick(running && inView && !balanced, (f) => {
		tRef.current += Math.min(.05, f.dtMs / 1e3);
		if (.5 * Math.abs(a) * tRef.current * tRef.current >= TRAVEL) {
			setRunning(false);
			setFinished(true);
		}
	});
	const release = () => {
		tRef.current = 0;
		setFinished(false);
		if (reduce) {
			tRef.current = Math.sqrt(2 * TRAVEL / Math.max(.01, Math.abs(a)));
			setFinished(true);
			repaint();
			return;
		}
		setRunning(true);
	};
	const onParam = (set) => (n) => {
		set(n);
		setRunning(false);
		setFinished(false);
		tRef.current = 0;
	};
	const t = tRef.current;
	const s = clamp(.5 * Math.abs(a) * t * t, 0, TRAVEL);
	const v = Math.abs(a) * t;
	const dirL = a > 0 ? -1 : 1;
	const yL = Y0 + dirL * s;
	const yR = Y0 - dirL * s;
	const PY = 3.4, PR = .95;
	const LX = -.95, RX = PR;
	const box = (cx, top, mass, tint) => {
		const w = .32 + mass * .05, h = .5 + mass * .08;
		return /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: cx,
					y: PY
				},
				to: {
					x: cx,
					y: top
				},
				color: "var(--stage-fg)",
				opacity: .5,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					{
						x: cx - w,
						y: top - h
					},
					{
						x: cx + w,
						y: top - h
					},
					{
						x: cx + w,
						y: top
					},
					{
						x: cx - w,
						y: top
					}
				],
				color: `color-mix(in oklab, ${tint} 60%, black)`,
				fill: tint,
				fillOpacity: .85,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Label, {
				x: cx,
				y: top - h / 2,
				text: `${mass}kg`,
				color: "var(--stage-bg)",
				size: 12
			})
		] });
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -3.4,
				xMax: 3.4,
				yMin: -3,
				yMax: 4.6
			},
			height: 300,
			preserveAspect: true,
			ariaLabel: `Atwood machine, ${ma} kg versus ${mb} kg, acceleration ${Math.abs(a).toFixed(2)} m/s²`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: -2,
						y: 4.1
					},
					to: {
						x: 2,
						y: 4.1
					},
					color: "var(--stage-fg)",
					opacity: .6,
					weight: 3
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 4.1
					},
					to: {
						x: 0,
						y: 4.35
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: 0,
						y: PY
					},
					r: PR,
					color: "var(--stage-fg)",
					fill: "var(--stage-muted)",
					fillOpacity: .4,
					weight: 2
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: 0,
						y: PY
					},
					r: .12,
					color: "var(--stage-fg)",
					fill: "var(--stage-fg)",
					fillOpacity: .7,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: LX,
						y: PY
					},
					to: {
						x: RX,
						y: PY
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 1.5
				}),
				box(LX, yL, ma, "var(--stage-accent)"),
				box(RX, yR, mb, "var(--stage-accent-2)"),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: -3.4,
						y: -2.6
					},
					to: {
						x: 3.4,
						y: -2.6
					},
					color: "var(--stage-fg)",
					opacity: .35,
					weight: 1.2
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [
				/* @__PURE__ */ jsx(Callout, {
					tone: "result",
					children: /* @__PURE__ */ jsxs("span", {
						style: {
							display: "grid",
							gap: 4,
							fontVariantNumeric: "tabular-nums"
						},
						children: [
							/* @__PURE__ */ jsxs("span", { children: ["acceleration a = ", /* @__PURE__ */ jsxs("strong", { children: [Math.abs(a).toFixed(2), " m/s²"] })] }),
							/* @__PURE__ */ jsxs("span", { children: ["tension T = ", /* @__PURE__ */ jsxs("strong", { children: [tension.toFixed(1), " N"] })] }),
							/* @__PURE__ */ jsxs("span", { children: ["speed now = ", /* @__PURE__ */ jsxs("strong", { children: [v.toFixed(1), " m/s"] })] })
						]
					})
				}),
				/* @__PURE__ */ jsx(StatusPill, {
					ok: !balanced,
					children: balanced ? "balanced, no motion" : `${ma > mb ? "left" : "right"} side falls`
				}),
				/* @__PURE__ */ jsxs("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: [
						"Only the ",
						/* @__PURE__ */ jsx("strong", { children: "difference" }),
						" (m₁−m₂)g drives it; the ",
						/* @__PURE__ */ jsx("strong", { children: "total" }),
						" (m₁+m₂) resists. Big equal masses with a tiny difference give a slow, measurable a, how Atwood weighed gravity."
					]
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: balanced ? "Balanced, no motion." : `${ma > mb ? "Left" : "Right"} side falls at ${Math.abs(a).toFixed(2)} metres per second squared.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: release,
				children: "▶ Release"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: () => {
					setRunning(false);
					setFinished(false);
					tRef.current = 0;
					repaint();
				},
				children: "Reset"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "m₁ (left)",
				value: `${ma} kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: ma,
					min: 1,
					max: 8,
					step: .5,
					onChange: onParam(setMa),
					ariaLabel: "left mass (kg)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "m₂ (right)",
				value: `${mb} kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: mb,
					min: 1,
					max: 8,
					step: .5,
					onChange: onParam(setMb),
					ariaLabel: "right mass (kg)"
				})
			})
		] }),
		controlConfig,
		children: figure
	});
}

//#endregion
export { AtwoodLab };