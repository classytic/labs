'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Slider, StatusPill } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useFrameTick, useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, Polygon, Polyline, Segment, Stage, useInView, useLearner } from "@classytic/stage";

//#region src/physics/impulse/preset.tsx
/**
* ImpulseLab, "Catch the egg", why a long contact time saves you.
*
* The SAME ball at the SAME speed is brought to rest, so the impulse it delivers
* is FIXED: J = Δp = m·v. You only change HOW LONG the stop takes (a hard wall vs
* a soft glove / airbag). The force–time pulse is modelled as a half-sine,
* F(t) = F_peak·sin(πt/Δt), whose area ∫F dt = F_peak·(2Δt/π) is pinned to Δp , 
* so as Δt grows the curve morphs from a tall-thin SPIKE (hard, big peak force)
* to a low-wide BUMP (soft), the two shaded areas staying equal on FIXED axes:
* the single-image proof that impulse is conserved while peak force is not.
*
* A fragile target (egg) cracks if the peak force tops its limit, so "bend your
* knees / airbags / follow-through" stops being a slogan and becomes a number.
*
* Tokenized SVG; time-dependent (integrator here); honours reduced-motion.
*/
const T_MAX = .34;
const F_MAX = 360;
const DT_MIN = .02, DT_MAX = .3;
/** Half-sine pulse pinned to area = dp:  F_peak = π·dp / (2·Δt). */
function peakForce(dp, dt) {
	return Math.PI * dp / (2 * dt);
}
function pulse(dp, dt) {
	const fp = peakForce(dp, dt);
	const pts = [];
	for (let i = 0; i <= 60; i++) {
		const t = i / 60 * dt;
		pts.push({
			x: t,
			y: fp * Math.sin(Math.PI * t / dt)
		});
	}
	return pts;
}
function ImpulseLab({ mass = .5, speed = 8, contact = .05, crackForce = 120, title = "Catch the egg: stretch the stop, shrink the force", prompt = "Same ball, same speed, so the impulse J = m·v is fixed. Drag the contact time: a softer, slower stop keeps the same area but a much smaller peak force.", objectives, controlConfig }) {
	const [m, setM] = useState(mass);
	const [v, setV] = useState(speed);
	const [dt, setDt] = useState(clamp(contact, DT_MIN, DT_MAX));
	const [running, setRunning] = useState(false);
	const tRef = useRef(0);
	const reduce = useReducedMotion();
	const learner = useLearner();
	const { ref: viewRef, inView } = useInView();
	const dp = m * v;
	const fpeak = peakForce(dp, dt);
	const cracks = fpeak > crackForce;
	const curve = pulse(dp, dt);
	const hard = pulse(dp, DT_MIN);
	const APPROACH = .6;
	const TOTAL = APPROACH + dt + .5;
	const repaint = useFrameTick(running && inView, (f) => {
		tRef.current += Math.min(.05, f.dtMs / 1e3);
		if (tRef.current >= TOTAL) {
			setRunning(false);
			learner?.report({
				activity: "impulse",
				correct: !cracks,
				score: {
					raw: cracks ? 0 : 1,
					max: 1
				},
				completion: true
			});
		}
	});
	const launch = () => {
		tRef.current = 0;
		if (reduce) {
			tRef.current = TOTAL;
			repaint();
			return;
		}
		setRunning(true);
	};
	const onParam = (set) => (n) => {
		set(n);
		setRunning(false);
		tRef.current = 0;
	};
	const t = tRef.current;
	const wallX = 6;
	const restX = wallX - .9;
	const startX = -6;
	const phase = t < APPROACH ? 0 : t < APPROACH + dt ? (t - APPROACH) / dt : 1;
	const give = .4 + 2.6 * ((dt - DT_MIN) / (DT_MAX - DT_MIN));
	const compress = Math.sin(phase * Math.PI) * give;
	const settled = t >= APPROACH + dt;
	const ballX = t < APPROACH ? startX + (restX - give - startX) * (t / APPROACH) : restX - compress;
	const cushionFace = wallX - 1.4 - compress;
	t >= APPROACH && t < APPROACH + dt && fpeak * Math.sin(Math.PI * (t - APPROACH) / dt);
	const scene = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -6.5,
			xMax: 7.5,
			yMin: -2.2,
			yMax: 2.6
		},
		height: 150,
		preserveAspect: false,
		ariaLabel: `A ${m} kg ball at ${v} m/s stopped over ${(dt * 1e3).toFixed(0)} ms`,
		children: [
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: -6.5,
					y: -1.6
				},
				to: {
					x: 7.5,
					y: -1.6
				},
				color: "var(--stage-fg)",
				opacity: .4,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					{
						x: wallX,
						y: -1.6
					},
					{
						x: 7.2,
						y: -1.6
					},
					{
						x: 7.2,
						y: 2.2
					},
					{
						x: wallX,
						y: 2.2
					}
				],
				color: "var(--stage-fg)",
				fill: "var(--stage-muted)",
				fillOpacity: .5,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					{
						x: cushionFace,
						y: -1.2
					},
					{
						x: wallX,
						y: -1.2
					},
					{
						x: wallX,
						y: 1.8
					},
					{
						x: cushionFace,
						y: 1.8
					}
				],
				color: cracks ? "var(--stage-warn)" : "var(--stage-good)",
				fill: cracks ? "var(--stage-warn)" : "var(--stage-good)",
				fillOpacity: .25,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Label, {
				x: (cushionFace + wallX) / 2,
				y: 1.8,
				text: dt > .16 ? "soft glove" : dt < .06 ? "hard wall" : "cushion",
				color: "var(--stage-fg)",
				size: 10,
				dy: -6
			}),
			/* @__PURE__ */ jsx(Label, {
				x: ballX,
				y: 0,
				text: cracks && settled ? "💥" : "🥚",
				color: "var(--stage-fg)",
				size: 34
			}),
			t < APPROACH && /* @__PURE__ */ jsx(Label, {
				x: ballX,
				y: 1.2,
				text: `${v} m/s →`,
				color: "var(--stage-accent)",
				size: 11,
				dy: -4
			})
		]
	});
	const gv = {
		xMin: 0,
		xMax: T_MAX,
		yMin: 0,
		yMax: F_MAX
	};
	const playT = clamp(t - APPROACH, 0, dt);
	const filled = curve.filter((p) => p.x <= playT);
	const figure = /* @__PURE__ */ jsxs("div", {
		ref: viewRef,
		className: "lab-playwrap",
		style: {
			display: "grid",
			gap: 8
		},
		children: [scene, /* @__PURE__ */ jsxs(Stage, {
			view: gv,
			height: 150,
			preserveAspect: false,
			ariaLabel: `Force versus time. Peak force ${fpeak.toFixed(0)} newtons over ${(dt * 1e3).toFixed(0)} milliseconds`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: {
						x: T_MAX,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: {
						x: 0,
						y: F_MAX
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x: T_MAX,
					y: 0,
					text: "time",
					color: "var(--stage-fg)",
					size: 10,
					dy: 14,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 0,
					y: F_MAX,
					text: "force (N)",
					color: "var(--stage-fg)",
					size: 10,
					dy: -4,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: crackForce
					},
					to: {
						x: T_MAX,
						y: crackForce
					},
					color: "var(--stage-warn)",
					opacity: .7,
					weight: 1.2,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Label, {
					x: T_MAX,
					y: crackForce,
					text: "egg cracks",
					color: "var(--stage-warn)",
					size: 9,
					dy: -3,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx(Polyline, {
					points: hard,
					color: "var(--stage-muted)",
					weight: 1,
					opacity: .5,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: 0,
							y: 0
						},
						...curve,
						{
							x: dt,
							y: 0
						}
					],
					color: "none",
					fill: "var(--stage-accent)",
					fillOpacity: .18,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Polyline, {
					points: curve,
					color: "var(--stage-accent)",
					weight: 2.5
				}),
				running && filled.length > 1 && /* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: 0,
							y: 0
						},
						...filled,
						{
							x: playT,
							y: 0
						}
					],
					color: "none",
					fill: "var(--stage-accent)",
					fillOpacity: .4,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: dt / 2,
						y: 0
					},
					to: {
						x: dt / 2,
						y: fpeak
					},
					color: "var(--stage-accent)",
					opacity: .5,
					weight: 1,
					dashed: true
				})
			]
		})]
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
							/* @__PURE__ */ jsxs("span", { children: [
								"impulse J = Δp = ",
								/* @__PURE__ */ jsxs("strong", { children: [dp.toFixed(1), " kg·m/s"] }),
								" (fixed)"
							] }),
							/* @__PURE__ */ jsxs("span", { children: ["contact Δt = ", /* @__PURE__ */ jsxs("strong", { children: [(dt * 1e3).toFixed(0), " ms"] })] }),
							/* @__PURE__ */ jsxs("span", {
								style: { color: cracks ? "var(--stage-warn)" : "var(--stage-good)" },
								children: ["peak force ≈ ", /* @__PURE__ */ jsxs("strong", { children: [fpeak.toFixed(0), " N"] })]
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(StatusPill, {
					ok: !cracks,
					children: cracks ? "💥 Too hard, the egg cracks" : "✓ Gentle enough, egg survives"
				}),
				/* @__PURE__ */ jsxs("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: [
						"Same area under both curves = same impulse. Spreading the stop over more time is exactly why",
						/* @__PURE__ */ jsx("strong", { children: " airbags, crumple zones, knee-bending landings" }),
						" and ",
						/* @__PURE__ */ jsx("strong", { children: "following through" }),
						" work."
					]
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: `Impulse ${dp.toFixed(1)}, contact ${(dt * 1e3).toFixed(0)} milliseconds, peak force ${fpeak.toFixed(0)} newtons. Egg ${cracks ? "cracks" : "survives"}.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: launch,
				children: "▶ Drop it"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "contact Δt",
				value: `${(dt * 1e3).toFixed(0)} ms`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: dt,
					min: DT_MIN,
					max: DT_MAX,
					step: .005,
					onChange: onParam(setDt),
					ariaLabel: "contact time (seconds)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "mass",
				value: `${m} kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: m,
					min: .2,
					max: 1.5,
					step: .1,
					onChange: onParam(setM),
					ariaLabel: "ball mass (kg)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "speed",
				value: `${v} m/s`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: v,
					min: 2,
					max: 12,
					step: .5,
					onChange: onParam(setV),
					ariaLabel: "impact speed (m/s)"
				})
			})
		] }),
		controlConfig,
		children: figure
	});
}

//#endregion
export { ImpulseLab };