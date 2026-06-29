'use client';

import { clamp } from "../../core/util.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, Control, ControlBar, Field, LabFrame, LiveRegion, MeterBar } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, Polyline, Segment, Stage, Vector } from "@classytic/stage";

//#region src/physics/shm/preset.tsx
/**
* SimpleHarmonicLab, "The same swing", where a spring and a pendulum turn out to
* be the SAME motion, and where a wave comes from.
*
* One SHM kernel, two skins. A restoring force pulls back in proportion to the
* displacement (spring: F = −kx; pendulum, small angle: F ≈ −mg·x/L), which forces
* a = −ω²x and the solution x(t) = A·cos(ωt). The mass oscillates while a pen
* traces x against time, and the trace IS a sine curve, the very shape of the
* waves lessons (a wave is SHM spread through space). Energy sloshes between
* elastic/PE and KE, summing to a constant (ties to the energy-skate lab).
*
*   ω = √(k/m)  (spring)        T = 2π√(m/k)     , heavier or softer ⇒ slower
*   ω = √(g/L)  (pendulum)      T = 2π√(L/g)     , independent of mass AND amplitude
*
* Ambient PlayWrap gate (pause to read the force arrow). Tokenized SVG.
*/
const SHM_CHALLENGE = [{
	id: "fastest",
	prompt: "In SHM the speed is greatest…",
	choices: [
		{
			value: "centre",
			label: "at the centre (equilibrium)"
		},
		{
			value: "extreme",
			label: "at the extremes"
		},
		{
			value: "even",
			label: "the same everywhere"
		}
	],
	answer: "centre",
	explain: "All the energy is kinetic at the centre; at the extremes the mass stops and turns around."
}, {
	id: "amplitude",
	prompt: "Doubling the amplitude changes the period…",
	choices: [
		{
			value: "none",
			label: "not at all"
		},
		{
			value: "double",
			label: "doubles it"
		},
		{
			value: "half",
			label: "halves it"
		}
	],
	answer: "none",
	explain: "For ideal SHM the period depends only on k & m (or L & g), never on amplitude."
}];
const G = 9.8;
const WIN = 6;
function SimpleHarmonicLab({ mode = "spring", k = 8, length = 2, mass = 1, amplitude, title = "The same swing: spring, pendulum, and where a wave comes from", prompt = "A restoring force pulls back in proportion to displacement, so a = −ω²x and the motion is x(t) = A·cos(ωt). Watch the pen trace a sine, that’s the shape of a wave. Swap to a pendulum: its period ignores both mass and amplitude.", objectives, controlConfig }) {
	const [md, setMd] = useState(mode);
	const [kk, setKk] = useState(k);
	const [L, setL] = useState(length);
	const [m, setM] = useState(mass);
	const isSpring = md === "spring";
	const [ampM, setAmpM] = useState(amplitude ?? 2.4);
	const [ampDeg, setAmpDeg] = useState(amplitude ?? 28);
	const gate = usePlayGate();
	const tRef = useRef(0);
	const challenge = useChallenge(SHM_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "shm"
	});
	const omega = isSpring ? Math.sqrt(kk / m) : Math.sqrt(G / L);
	const T = 2 * Math.PI / omega;
	const f = 1 / T;
	useFrameTick(gate.running, (fr) => {
		tRef.current += Math.min(.05, fr.dtMs / 1e3);
	});
	const t = tRef.current;
	const u = Math.cos(omega * t);
	-Math.sin(omega * t);
	const peFrac = u * u;
	const keFrac = 1 - peFrac;
	const scene = isSpring ? (() => {
		const wallX = -6.2, eqX = .4;
		const x = eqX + ampM * u;
		const half = .7;
		const coils = 14;
		const pts = [{
			x: wallX,
			y: 0
		}];
		for (let i = 1; i <= coils; i++) {
			const fx = wallX + (x - half - wallX) * i / 15;
			pts.push({
				x: fx,
				y: i % 2 === 0 ? .45 : -.45
			});
		}
		pts.push({
			x: x - half,
			y: 0
		});
		const Fx = -kk * ampM * u;
		return /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -7,
				xMax: 7,
				yMin: -2.4,
				yMax: 2.4
			},
			height: 170,
			preserveAspect: false,
			ariaLabel: `Mass on a spring oscillating, displacement ${(ampM * u).toFixed(2)} m`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: -7,
						y: -1.4
					},
					to: {
						x: 7,
						y: -1.4
					},
					color: "var(--stage-fg)",
					opacity: .35,
					weight: 1.2
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: wallX,
						y: -1.4
					},
					to: {
						x: wallX,
						y: 1.4
					},
					color: "var(--stage-fg)",
					opacity: .6,
					weight: 3
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: eqX,
						y: -1.2
					},
					to: {
						x: eqX,
						y: 1.2
					},
					color: "var(--stage-muted)",
					opacity: .6,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Label, {
					x: eqX,
					y: -1.2,
					text: "x=0",
					color: "var(--stage-muted)",
					size: 10,
					dy: 14
				}),
				/* @__PURE__ */ jsx(Polyline, {
					points: pts,
					color: "var(--stage-fg)",
					weight: 1.8,
					opacity: .8
				}),
				/* @__PURE__ */ jsx(Polyline, {
					points: [
						{
							x: x - half,
							y: -.7
						},
						{
							x: x + half,
							y: -.7
						},
						{
							x: x + half,
							y: half
						},
						{
							x: x - half,
							y: half
						},
						{
							x: x - half,
							y: -.7
						}
					],
					color: "color-mix(in oklab, var(--stage-accent) 60%, black)",
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x,
					y: 0,
					text: `${m}kg`,
					color: "var(--stage-accent)",
					size: 12
				}),
				Math.abs(Fx) > .5 && /* @__PURE__ */ jsx(Vector, {
					tail: {
						x,
						y: 1.5
					},
					tip: {
						x: x + clamp(Fx * .04, -3, 3),
						y: 1.5
					},
					color: "var(--stage-warn)",
					weight: 3
				}),
				/* @__PURE__ */ jsx(Label, {
					x,
					y: 1.5,
					text: "F = −kx",
					color: "var(--stage-warn)",
					size: 11,
					dy: -6
				})
			]
		});
	})() : (() => {
		const pivot = {
			x: 0,
			y: 1.8
		};
		const th = ampDeg * Math.PI / 180 * u;
		const Ls = clamp(L, 1, 3.2);
		const bob = {
			x: pivot.x + Ls * Math.sin(th),
			y: pivot.y - Ls * Math.cos(th)
		};
		return /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -4,
				xMax: 4,
				yMin: -2.2,
				yMax: 2.4
			},
			height: 170,
			preserveAspect: true,
			ariaLabel: `Pendulum swinging, angle ${(ampDeg * u).toFixed(0)} degrees`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: -1.4,
						y: pivot.y
					},
					to: {
						x: 1.4,
						y: pivot.y
					},
					color: "var(--stage-fg)",
					opacity: .6,
					weight: 3
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: pivot,
					to: {
						x: pivot.x,
						y: pivot.y - Ls
					},
					color: "var(--stage-muted)",
					opacity: .5,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: pivot,
					to: bob,
					color: "var(--stage-fg)",
					opacity: .6,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: pivot.x,
					y: pivot.y,
					r: 3,
					color: "var(--stage-fg)"
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: bob,
					r: .32,
					color: "color-mix(in oklab, var(--stage-accent) 60%, black)",
					fill: "var(--stage-accent)",
					fillOpacity: .9,
					weight: 1.5
				}),
				Math.abs(th) > .02 && /* @__PURE__ */ jsx(Vector, {
					tail: bob,
					tip: {
						x: bob.x - Math.cos(th) * Math.sign(th) * .9,
						y: bob.y - Math.sin(th) * Math.sign(th) * .9
					},
					color: "var(--stage-warn)",
					weight: 3
				}),
				/* @__PURE__ */ jsx(Label, {
					x: bob.x,
					y: bob.y,
					text: `${m}kg`,
					color: "var(--stage-accent)",
					size: 10,
					dy: 20
				})
			]
		});
	})();
	const A_PX = 1;
	const curve = [];
	for (let i = 0; i <= 120; i++) {
		const tau = t - WIN + i / 120 * WIN;
		curve.push({
			x: i / 120,
			y: A_PX * Math.cos(omega * tau)
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
					xMax: 1,
					yMin: -1.4,
					yMax: 1.4
				},
				height: 130,
				preserveAspect: false,
				ariaLabel: "Displacement traced against time, a sine curve",
				children: [
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: 0,
							y: 0
						},
						to: {
							x: 1,
							y: 0
						},
						color: "var(--stage-fg)",
						opacity: .4,
						weight: 1
					}),
					/* @__PURE__ */ jsx(Label, {
						x: 0,
						y: 1.4,
						text: "displacement x(t)",
						color: "var(--stage-fg)",
						size: 10,
						anchor: "start",
						dy: -2
					}),
					/* @__PURE__ */ jsx(Label, {
						x: 1,
						y: 0,
						text: "time →",
						color: "var(--stage-fg)",
						size: 10,
						anchor: "end",
						dy: 14
					}),
					/* @__PURE__ */ jsx(Polyline, {
						points: curve,
						color: "var(--stage-accent)",
						weight: 2.5
					}),
					/* @__PURE__ */ jsx(Dot, {
						x: 1,
						y: A_PX * u,
						r: 4,
						color: "var(--stage-accent)"
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
				gap: 8
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
								"ω = ",
								isSpring ? "√(k/m)" : "√(g/L)",
								" = ",
								/* @__PURE__ */ jsxs("strong", { children: [omega.toFixed(2), " rad/s"] })
							] }),
							/* @__PURE__ */ jsxs("span", { children: ["period T = ", /* @__PURE__ */ jsxs("strong", { children: [T.toFixed(2), " s"] })] }),
							/* @__PURE__ */ jsxs("span", { children: ["frequency f = ", /* @__PURE__ */ jsxs("strong", { children: [f.toFixed(2), " Hz"] })] })
						]
					})
				}),
				/* @__PURE__ */ jsx(MeterBar, {
					label: isSpring ? "elastic PE = ½kx²" : "gravitational PE",
					frac: peFrac,
					color: "var(--stage-accent-2)",
					value: `${Math.round(peFrac * 100)}%`
				}),
				/* @__PURE__ */ jsx(MeterBar, {
					label: "kinetic KE = ½mv²",
					frac: keFrac,
					color: "var(--stage-good)",
					value: `${Math.round(keFrac * 100)}%`
				}),
				/* @__PURE__ */ jsxs("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: [
						"The trace is a ",
						/* @__PURE__ */ jsx("strong", { children: "sine" }),
						", a wave is just this swing spread through space (v = fλ in the waves lab). ",
						isSpring ? "Heavier or softer spring ⇒ slower (T = 2π√(m/k))." : "Notice: change the mass or the amplitude and T doesn’t move, a pendulum’s period is T = 2π√(L/g)."
					]
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: `${isSpring ? "Spring" : "Pendulum"} oscillator. Angular frequency ${omega.toFixed(2)}, period ${T.toFixed(2)} seconds.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsxs(Control, {
			name: "mode",
			children: [/* @__PURE__ */ jsx(Chip, {
				selected: isSpring,
				onClick: () => setMd("spring"),
				children: "spring"
			}), /* @__PURE__ */ jsx(Chip, {
				selected: !isSpring,
				onClick: () => setMd("pendulum"),
				children: "pendulum"
			})]
		}), isSpring ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "stiffness k",
				value: `${kk} N/m`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: kk,
					min: 2,
					max: 30,
					step: 1,
					onChange: setKk,
					ariaLabel: "spring stiffness (N/m)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "mass m",
				value: `${m} kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: m,
					min: .5,
					max: 5,
					step: .5,
					onChange: setM,
					ariaLabel: "mass (kg)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "amplitude",
				value: `${ampM.toFixed(1)} m`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: ampM,
					min: .8,
					max: 3,
					step: .2,
					onChange: setAmpM,
					ariaLabel: "amplitude (m)"
				})
			})
		] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "length L",
				value: `${L.toFixed(1)} m`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: L,
					min: 1,
					max: 3.2,
					step: .2,
					onChange: setL,
					ariaLabel: "pendulum length (m)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "mass m",
				value: `${m} kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: m,
					min: .5,
					max: 5,
					step: .5,
					onChange: setM,
					ariaLabel: "bob mass (kg): does not change the period"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "amplitude",
				value: `${ampDeg}°`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: ampDeg,
					min: 6,
					max: 40,
					step: 2,
					onChange: setAmpDeg,
					ariaLabel: "amplitude (degrees)"
				})
			})
		] })] }),
		controlConfig,
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: SHM_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { SimpleHarmonicLab };