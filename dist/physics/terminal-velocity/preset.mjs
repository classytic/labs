'use client';

import { clamp } from "../../core/util.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, Control, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, Polyline, Segment, Stage, Vector } from "@classytic/stage";

//#region src/physics/terminal-velocity/preset.tsx
/**
* TerminalVelocityLab, "The skydiver", why falling things stop speeding up.
*
* A real fall isn't free fall: air pushes back with a drag that grows with speed
* (∝ v²). Gravity (mg, constant) wins at first, but as v rises the drag catches
* up until the two BALANCE, net force zero, acceleration zero, and the speed
* levels off at the terminal velocity:
*
*     m·dv/dt = mg − b·v²        ⟹        v(t) = v_t·tanh(g·t / v_t),   v_t = √(mg/b)
*
* The weight arrow stays fixed while the drag arrow grows to meet it; the v–t
* curve flattens onto its asymptote. Pop the parachute (huge b) and v_t collapses
* to a survivable speed.
*
* Ambient PlayWrap gate. Analytic (exact tanh solution) → no drift. Tokenized SVG.
*/
const TERMINAL_CHALLENGE = [{
	id: "accel",
	prompt: "At terminal velocity the acceleration is…",
	choices: [
		{
			value: "zero",
			label: "zero"
		},
		{
			value: "g",
			label: "still g (9.8 m/s²)"
		},
		{
			value: "max",
			label: "at its maximum"
		}
	],
	answer: "zero",
	explain: "Drag balances weight, so net force is zero, the speed is constant, not the position."
}, {
	id: "when",
	prompt: "Terminal velocity happens when air resistance…",
	choices: [
		{
			value: "equals",
			label: "equals the weight"
		},
		{
			value: "zero",
			label: "drops to zero"
		},
		{
			value: "exceeds",
			label: "exceeds the weight"
		}
	],
	answer: "equals",
	explain: "Drag grows with v² until it matches mg; then the forces cancel and v levels off."
}];
const G = 9.8;
const WIN = 14;
const VMAX = 65;
const CHUTE = 70;
function TerminalVelocityLab({ mass = 80, drag = .4, parachute = false, title = "The skydiver: why you stop speeding up", prompt = "Air drag grows with speed until it balances gravity; then the net force is zero and the speed levels off at the terminal velocity v_t = √(mg/b). Watch the drag arrow rise to meet the weight, and the v–t curve flatten. Pop the parachute to crash v_t.", objectives, controlConfig }) {
	const [m, setM] = useState(mass);
	const [d, setD] = useState(drag);
	const [chute, setChute] = useState(parachute);
	const gate = usePlayGate();
	const challenge = useChallenge(TERMINAL_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "terminal-velocity"
	});
	const tRef = useRef(0);
	const b = d * (chute ? CHUTE : 1);
	const vt = Math.sqrt(m * G / b);
	const tau = vt / G;
	useFrameTick(gate.running, (f) => {
		tRef.current += Math.min(.05, f.dtMs / 1e3);
		if (tRef.current > 16) tRef.current = 0;
	});
	const t = tRef.current;
	const v = vt * Math.tanh(t / tau);
	const dragFrac = v / vt * (v / vt);
	const fallDist = vt * vt / G * Math.log(Math.cosh(t / tau));
	const WLEN = 1.5;
	const scroll = fallDist * .25 % 1.6;
	const marks = [];
	for (let i = -1; i <= 4; i++) marks.push(2.2 - i * 1.6 + scroll);
	const scene = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -3,
			xMax: 3,
			yMin: -2.6,
			yMax: 2.6
		},
		height: 180,
		preserveAspect: false,
		ariaLabel: `Skydiver falling at ${v.toFixed(0)} m/s of terminal ${vt.toFixed(0)}`,
		children: [
			marks.map((y, i) => y > -2.4 && y < 2.4 ? /* @__PURE__ */ jsx(Segment, {
				from: {
					x: -2.7,
					y
				},
				to: {
					x: -2.1,
					y
				},
				color: "var(--stage-muted)",
				opacity: .5,
				weight: 2
			}, i) : null),
			marks.map((y, i) => y > -2.4 && y < 2.4 ? /* @__PURE__ */ jsx(Segment, {
				from: {
					x: 2.1,
					y
				},
				to: {
					x: 2.7,
					y
				},
				color: "var(--stage-muted)",
				opacity: .5,
				weight: 2
			}, `r${i}`) : null),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: .1,
				text: chute ? "🪂" : "🧍",
				color: "var(--stage-fg)",
				size: chute ? 40 : 32
			}),
			/* @__PURE__ */ jsx(Vector, {
				tail: {
					x: -.9,
					y: 0
				},
				tip: {
					x: -.9,
					y: -1.5
				},
				color: "var(--stage-fg)",
				weight: 3
			}),
			/* @__PURE__ */ jsx(Label, {
				x: -.9,
				y: -1.5,
				text: "mg",
				color: "var(--stage-fg)",
				size: 11,
				dy: 14
			}),
			dragFrac > .01 && /* @__PURE__ */ jsx(Vector, {
				tail: {
					x: .9,
					y: 0
				},
				tip: {
					x: .9,
					y: WLEN * dragFrac
				},
				color: "var(--stage-warn)",
				weight: 3
			}),
			/* @__PURE__ */ jsx(Label, {
				x: .9,
				y: WLEN * Math.max(dragFrac, .12),
				text: "drag ∝ v²",
				color: "var(--stage-warn)",
				size: 11,
				dy: -6
			})
		]
	});
	const curve = [];
	for (let i = 0; i <= 120; i++) {
		const tau2 = i / 120 * WIN;
		curve.push({
			x: tau2,
			y: vt * Math.tanh(tau2 / tau)
		});
	}
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8
			},
			children: [scene, /* @__PURE__ */ jsxs(Stage, {
				view: {
					xMin: 0,
					xMax: WIN,
					yMin: 0,
					yMax: VMAX
				},
				height: 150,
				preserveAspect: false,
				ariaLabel: `Speed versus time approaching terminal velocity ${vt.toFixed(0)} m/s`,
				children: [
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: 0,
							y: 0
						},
						to: {
							x: WIN,
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
							y: VMAX
						},
						color: "var(--stage-fg)",
						opacity: .5,
						weight: 1.5
					}),
					/* @__PURE__ */ jsx(Label, {
						x: 0,
						y: VMAX,
						text: "speed (m/s)",
						color: "var(--stage-fg)",
						size: 10,
						anchor: "start",
						dy: -2
					}),
					/* @__PURE__ */ jsx(Label, {
						x: WIN,
						y: 0,
						text: "time →",
						color: "var(--stage-fg)",
						size: 10,
						anchor: "end",
						dy: 14
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: 0,
							y: vt
						},
						to: {
							x: WIN,
							y: vt
						},
						color: "var(--stage-good)",
						opacity: .7,
						weight: 1.2,
						dashed: true
					}),
					/* @__PURE__ */ jsx(Label, {
						x: WIN,
						y: vt,
						text: `v_t ${vt.toFixed(0)}`,
						color: "var(--stage-good)",
						size: 10,
						anchor: "end",
						dy: -3
					}),
					/* @__PURE__ */ jsx(Polyline, {
						points: curve,
						color: "var(--stage-accent)",
						weight: 2.5
					}),
					/* @__PURE__ */ jsx(Polyline, {
						points: [{
							x: clamp(t, 0, WIN),
							y: 0
						}, {
							x: clamp(t, 0, WIN),
							y: v
						}],
						color: "var(--stage-accent)",
						opacity: .5,
						weight: 1,
						dashed: true
					}),
					/* @__PURE__ */ jsx(Label, {
						x: clamp(t, 0, WIN),
						y: v,
						text: `${v.toFixed(0)}`,
						color: "var(--stage-accent)",
						size: 11,
						dy: -4
					})
				]
			})]
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
							/* @__PURE__ */ jsxs("span", { children: ["terminal v_t = √(mg/b) = ", /* @__PURE__ */ jsxs("strong", { children: [vt.toFixed(0), " m/s"] })] }),
							/* @__PURE__ */ jsxs("span", { children: [
								"speed now = ",
								/* @__PURE__ */ jsxs("strong", { children: [v.toFixed(0), " m/s"] }),
								" (",
								Math.round(v / vt * 100),
								"% of v_t)"
							] }),
							/* @__PURE__ */ jsxs("span", { children: [
								"drag = ",
								/* @__PURE__ */ jsxs("strong", { children: [Math.round(dragFrac * 100), "%"] }),
								" of weight"
							] })
						]
					})
				}),
				/* @__PURE__ */ jsxs("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: [
						"At v_t the drag exactly cancels the weight, zero net force, zero acceleration, constant speed. A parachute multiplies the drag, so v_t drops from a deadly ~",
						Math.round(Math.sqrt(m * G / d)),
						" m/s to a soft landing."
					]
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: `Falling at ${v.toFixed(0)} of terminal ${vt.toFixed(0)} metres per second; drag is ${Math.round(dragFrac * 100)} percent of weight.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Control, {
				name: "parachute",
				children: /* @__PURE__ */ jsxs(Chip, {
					selected: chute,
					onClick: () => setChute((c) => !c),
					children: ["parachute ", chute ? "🪂 open" : "closed"]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "mass",
				value: `${m} kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: m,
					min: 40,
					max: 120,
					step: 5,
					onChange: setM,
					ariaLabel: "mass (kg)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "air drag",
				value: d.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: d,
					min: .2,
					max: 1.2,
					step: .1,
					onChange: setD,
					ariaLabel: "drag factor"
				})
			})
		] }),
		controlConfig,
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: TERMINAL_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { TerminalVelocityLab };