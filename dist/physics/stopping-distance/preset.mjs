'use client';

import { CheckButton, Chip, Slider, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, MovableDot, Polygon, Polyline, Segment, Stage, fmt, useCoords, useFrameLoop, useInView } from "@classytic/stage";

//#region src/physics/stopping-distance/preset.tsx
/**
* StoppingDistanceLab, "Drive & Brake", the two-distance stopping tape.
*
* A car cruises at v; a hazard appears; the driver REACTS (constant speed for
* t_react → a blue THINKING stripe), then BRAKES at a (→ a red BRAKING stripe)
* to a stop. The road paints the two stripes as the car passes, and stacked v–t
* and s–t graphs draw underneath sharing ONE playhead with the car, so the
* v–t area visibly IS the distance. "Double the speed" keeps a ghost of the last
* run so the learner sees thinking double (linear) while braking quadruples (v²).
*
* The single biggest exam-killer (s–t vs v–t, and stopping distance as one black
* box) dies on screen. Time-dependent, so the integrator lives here (frame loop);
* tokenized SVG; honours prefers-reduced-motion (jumps to the end + scrub).
*/
/** A compact tokenized side-view car centred on the road point (x, 0). */
function Car({ x }) {
	const c = useCoords();
	const [px, py] = c.toPx(x, 0);
	const s = c.sx(1);
	const u = Math.max(.6, s);
	const edge = "color-mix(in oklab, var(--stage-accent-2) 58%, black)";
	const glass = "color-mix(in oklab, var(--stage-accent-2) 30%, var(--stage-bg))";
	return /* @__PURE__ */ jsxs("g", {
		transform: `translate(${fmt(px)},${fmt(py)})`,
		children: [
			/* @__PURE__ */ jsx("ellipse", {
				cx: 0,
				cy: -.2 * u,
				rx: 3.4 * u,
				ry: .5 * u,
				fill: "#000",
				opacity: .14
			}),
			/* @__PURE__ */ jsx("path", {
				d: `M ${-3.2 * u} ${-1.2 * u} Q ${-3.5 * u} ${-1.2 * u} ${-3.5 * u} ${-1.9 * u} L ${-3.5 * u} ${-2.2 * u} Q ${-3.5 * u} ${-2.9 * u} ${-2.9 * u} ${-3 * u} L ${2.8 * u} ${-3 * u} Q ${3.5 * u} ${-2.9 * u} ${3.5 * u} ${-2.05 * u} L ${3.5 * u} ${-1.5 * u} Q ${3.5 * u} ${-1.2 * u} ${3.1 * u} ${-1.2 * u} Z`,
				fill: "var(--stage-accent-2)",
				stroke: edge,
				strokeWidth: 1.2,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: `M ${-1.9 * u} ${-3 * u} Q ${-1.6 * u} ${-4.3 * u} ${-.4 * u} ${-4.3 * u} L ${1.2 * u} ${-4.3 * u} Q ${2.1 * u} ${-4.3 * u} ${2.5 * u} ${-3 * u} Z`,
				fill: "var(--stage-accent-2)",
				stroke: edge,
				strokeWidth: 1.2,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: `M ${-1.6 * u} ${-3.1 * u} Q ${-1.4 * u} ${-4 * u} ${-.4 * u} ${-4 * u} L ${0 * u} ${-4 * u} L ${0 * u} ${-3.1 * u} Z`,
				fill: glass
			}),
			/* @__PURE__ */ jsx("path", {
				d: `M ${.3 * u} ${-3.1 * u} L ${.3 * u} ${-4 * u} L ${1.1 * u} ${-4 * u} Q ${1.9 * u} ${-4 * u} ${2.2 * u} ${-3.1 * u} Z`,
				fill: glass
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: 3.35 * u,
				cy: -1.9 * u,
				r: .42 * u,
				fill: "#ffd36b"
			}),
			[-1.9, 2].map((wx) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
				cx: wx * u,
				cy: -.6 * u,
				r: .95 * u,
				fill: "#2b2b2b"
			}), /* @__PURE__ */ jsx("circle", {
				cx: wx * u,
				cy: -.6 * u,
				r: .45 * u,
				fill: "var(--stage-metal)"
			})] }, wx))
		]
	});
}
function StoppingDistanceLab({ speed = 20, reactionTime = .7, deceleration = 6, maxSpeed = 40, predict = false, showGraphs = false, title = "Drive & Brake: the two-distance stopping tape", prompt = "A hazard appears: react, then brake. Watch the road paint thinking (blue) + braking (red).", objectives, hints = [] }) {
	const [v, setV] = useState(speed);
	const [tr, setTr] = useState(reactionTime);
	const [a, setA] = useState(deceleration);
	const [t, setT] = useState(0);
	const [driving, setDriving] = useState(false);
	const [graphs, setGraphs] = useState(showGraphs);
	const [revealed, setRevealed] = useState(!predict);
	const [finished, setFinished] = useState(false);
	const [ghost, setGhost] = useState(null);
	const [guess, setGuess] = useState(40);
	const startRef = useRef(null);
	const reduce = useReducedMotion();
	const { ref: viewRef, inView } = useInView();
	const hl = useHints(hints);
	useCheckpoint({
		solved: finished,
		activity: "stopping-distance",
		hintsUsed: hl.count
	});
	const tThink = tr;
	const tBrake = a > 0 ? v / a : 0;
	const tTotal = tThink + tBrake;
	const dThink = v * tr;
	const dBrake = a > 0 ? v * v / (2 * a) : 0;
	const dTotal = dThink + dBrake;
	const posAt = (tt) => {
		if (tt <= tThink) return v * tt;
		const tb = Math.min(tt - tThink, tBrake);
		return dThink + v * tb - .5 * a * tb * tb;
	};
	const velAt = (tt) => {
		if (tt <= tThink) return v;
		const tb = Math.min(tt - tThink, tBrake);
		return Math.max(0, v - a * tb);
	};
	useFrameLoop((f) => {
		if (startRef.current === null) startRef.current = f.timeMs;
		const tt = (f.timeMs - startRef.current) / 1e3;
		if (tt >= tTotal) {
			setT(tTotal);
			setDriving(false);
			setRevealed(true);
			setFinished(true);
		} else setT(tt);
	}, { running: driving && inView });
	const drive = () => {
		startRef.current = null;
		if (reduce) {
			setT(tTotal);
			setRevealed(true);
			setFinished(true);
			return;
		}
		setT(0);
		setFinished(false);
		setDriving(true);
	};
	const change = (set) => (n) => {
		set(n);
		setDriving(false);
		setT(0);
		setFinished(false);
		setRevealed(!predict);
	};
	const doubleSpeed = () => {
		setGhost({
			v,
			dThink,
			dBrake,
			dTotal
		});
		change(setV)(Math.min(maxSpeed, v * 2));
	};
	const carX = posAt(t);
	const showRed = carX > dThink + 1e-6;
	const band = (x0, x1, color, op = .5) => x1 > x0 + 1e-6 ? /* @__PURE__ */ jsx(Polygon, {
		points: [
			{
				x: x0,
				y: 0
			},
			{
				x: x1,
				y: 0
			},
			{
				x: x1,
				y: 1.4
			},
			{
				x: x0,
				y: 1.4
			}
		],
		color,
		fill: color,
		fillOpacity: op,
		weight: 0
	}) : null;
	const sceneMax = Math.max(dTotal * 1.18, (ghost?.dTotal ?? 0) * 1.18, 30);
	const sceneView = {
		xMin: -3,
		xMax: sceneMax,
		yMin: -2,
		yMax: 9
	};
	const vtArea = [
		{
			x: 0,
			y: 0
		},
		{
			x: 0,
			y: v
		},
		{
			x: tThink,
			y: v
		},
		{
			x: tTotal,
			y: 0
		}
	];
	const stPts = [];
	{
		const N = 60;
		for (let i = 0; i <= N; i++) {
			const tt = tTotal * i / N;
			stPts.push({
				x: tt,
				y: posAt(tt)
			});
		}
	}
	const vGraphView = {
		xMin: -tTotal * .06,
		xMax: tTotal * 1.08,
		yMin: -v * .12,
		yMax: v * 1.18
	};
	const sGraphView = {
		xMin: -tTotal * .06,
		xMax: tTotal * 1.08,
		yMin: -dTotal * .1,
		yMax: dTotal * 1.15
	};
	const figure = /* @__PURE__ */ jsxs("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				overflow: "hidden",
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)"
			},
			children: /* @__PURE__ */ jsxs(Stage, {
				view: sceneView,
				height: 170,
				preserveAspect: false,
				ariaLabel: `Car at ${v} m/s; thinking ${dThink.toFixed(0)} m, braking ${dBrake.toFixed(0)} m`,
				children: [
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: sceneView.xMin,
							y: 0
						},
						to: {
							x: sceneMax,
							y: 0
						},
						color: "var(--stage-fg)",
						opacity: .5,
						weight: 2
					}),
					ghost && /* @__PURE__ */ jsx(Polygon, {
						points: [
							{
								x: 0,
								y: 1.55
							},
							{
								x: ghost.dTotal,
								y: 1.55
							},
							{
								x: ghost.dTotal,
								y: 2
							},
							{
								x: 0,
								y: 2
							}
						],
						color: "var(--stage-muted)",
						fill: "var(--stage-muted)",
						fillOpacity: .25,
						weight: 0
					}),
					ghost && /* @__PURE__ */ jsx(Label, {
						x: ghost.dTotal / 2,
						y: 2,
						text: `last run: ${ghost.dTotal.toFixed(0)} m`,
						color: "var(--stage-muted)",
						size: 10,
						dy: -8
					}),
					revealed && band(0, Math.min(carX, dThink), "var(--stage-accent)"),
					revealed && showRed && band(dThink, carX, "var(--stage-warn)"),
					revealed && t >= tTotal && /* @__PURE__ */ jsx(Label, {
						x: dThink / 2,
						y: .7,
						text: `think ${dThink.toFixed(0)} m`,
						color: "var(--stage-accent)",
						size: 11
					}),
					revealed && t >= tTotal && dBrake > 0 && /* @__PURE__ */ jsx(Label, {
						x: dThink + dBrake / 2,
						y: .7,
						text: `brake ${dBrake.toFixed(0)} m`,
						color: "var(--stage-warn)",
						size: 11
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: dTotal,
							y: 0
						},
						to: {
							x: dTotal,
							y: 3
						},
						color: "var(--stage-danger)",
						weight: 2,
						dashed: true
					}),
					predict && !revealed && /* @__PURE__ */ jsx(MovableDot, {
						value: {
							x: guess,
							y: 3
						},
						onMove: (p) => setGuess(Math.max(0, p.x)),
						constrain: "horizontal",
						range: {
							min: 0,
							max: sceneMax
						},
						color: "var(--stage-accent)",
						ariaLabel: "your stopping-distance guess"
					}),
					predict && !revealed && /* @__PURE__ */ jsx(Label, {
						x: guess,
						y: 3,
						text: "your guess",
						color: "var(--stage-accent)",
						size: 11,
						dy: -14
					}),
					/* @__PURE__ */ jsx(Car, { x: carX })
				]
			})
		}), graphs && /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "1fr",
				gap: 10,
				marginTop: 8
			},
			children: [/* @__PURE__ */ jsxs("div", {
				style: {
					borderRadius: 10,
					background: "var(--stage-bg)",
					border: "1px solid var(--stage-grid)",
					padding: 4
				},
				children: [/* @__PURE__ */ jsx("p", {
					style: {
						margin: "2px 0 0 8px",
						fontSize: 11,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: "v–t · area = distance"
				}), /* @__PURE__ */ jsxs(Stage, {
					view: vGraphView,
					height: 130,
					preserveAspect: false,
					ariaLabel: "velocity-time graph",
					children: [
						/* @__PURE__ */ jsx(Segment, {
							from: {
								x: 0,
								y: 0
							},
							to: {
								x: tTotal * 1.05,
								y: 0
							},
							color: "var(--stage-axis)",
							weight: 1.5
						}),
						/* @__PURE__ */ jsx(Segment, {
							from: {
								x: 0,
								y: 0
							},
							to: {
								x: 0,
								y: v * 1.12
							},
							color: "var(--stage-axis)",
							weight: 1.5
						}),
						/* @__PURE__ */ jsx(Polygon, {
							points: [
								{
									x: 0,
									y: 0
								},
								{
									x: 0,
									y: v
								},
								{
									x: tThink,
									y: v
								},
								{
									x: tThink,
									y: 0
								}
							],
							color: "var(--stage-accent)",
							fill: "var(--stage-accent)",
							fillOpacity: .22,
							weight: 0
						}),
						/* @__PURE__ */ jsx(Polygon, {
							points: [
								{
									x: tThink,
									y: 0
								},
								{
									x: tThink,
									y: v
								},
								{
									x: tTotal,
									y: 0
								}
							],
							color: "var(--stage-warn)",
							fill: "var(--stage-warn)",
							fillOpacity: .22,
							weight: 0
						}),
						/* @__PURE__ */ jsx(Polyline, {
							points: vtArea.slice(1),
							color: "var(--stage-fg)",
							weight: 2
						}),
						/* @__PURE__ */ jsx(Segment, {
							from: {
								x: t,
								y: 0
							},
							to: {
								x: t,
								y: v * 1.1
							},
							color: "var(--stage-good)",
							weight: 1.5,
							opacity: .7
						}),
						/* @__PURE__ */ jsx(Dot, {
							x: t,
							y: velAt(t),
							r: 5,
							color: "var(--stage-good)"
						})
					]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					borderRadius: 10,
					background: "var(--stage-bg)",
					border: "1px solid var(--stage-grid)",
					padding: 4
				},
				children: [/* @__PURE__ */ jsx("p", {
					style: {
						margin: "2px 0 0 8px",
						fontSize: 11,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: "s–t · slope = speed"
				}), /* @__PURE__ */ jsxs(Stage, {
					view: sGraphView,
					height: 130,
					preserveAspect: false,
					ariaLabel: "distance-time graph",
					children: [
						/* @__PURE__ */ jsx(Segment, {
							from: {
								x: 0,
								y: 0
							},
							to: {
								x: tTotal * 1.05,
								y: 0
							},
							color: "var(--stage-axis)",
							weight: 1.5
						}),
						/* @__PURE__ */ jsx(Segment, {
							from: {
								x: 0,
								y: 0
							},
							to: {
								x: 0,
								y: dTotal * 1.1
							},
							color: "var(--stage-axis)",
							weight: 1.5
						}),
						/* @__PURE__ */ jsx(Polyline, {
							points: stPts,
							color: "var(--stage-accent-2)",
							weight: 2.5
						}),
						/* @__PURE__ */ jsx(Segment, {
							from: {
								x: t,
								y: 0
							},
							to: {
								x: t,
								y: dTotal * 1.08
							},
							color: "var(--stage-good)",
							weight: 1.5,
							opacity: .7
						}),
						/* @__PURE__ */ jsx(Dot, {
							x: t,
							y: posAt(t),
							r: 5,
							color: "var(--stage-good)"
						})
					]
				})]
			})]
		})]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: drive,
				children: "▶ Drive"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: doubleSpeed,
				children: "×2 speed"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: graphs,
				onClick: () => setGraphs((g) => !g),
				children: "v–t / s–t graphs"
			}),
			!driving && tTotal > 0 && /* @__PURE__ */ jsx(Field, {
				label: "scrub",
				children: /* @__PURE__ */ jsx(Slider, {
					value: Math.min(t, tTotal),
					min: 0,
					max: tTotal,
					step: tTotal / 120,
					onChange: (x) => {
						setRevealed(true);
						setT(x);
					},
					ariaLabel: "scrub time"
				})
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					marginLeft: "auto",
					display: "inline-flex",
					gap: 14,
					fontVariantNumeric: "tabular-nums",
					fontWeight: 600
				},
				children: [
					/* @__PURE__ */ jsxs("span", {
						style: { color: "var(--stage-accent)" },
						children: [
							"think ",
							dThink.toFixed(0),
							" m"
						]
					}),
					/* @__PURE__ */ jsxs("span", {
						style: { color: "var(--stage-warn)" },
						children: [
							"brake ",
							dBrake.toFixed(0),
							" m"
						]
					}),
					/* @__PURE__ */ jsxs("span", { children: [
						"stop ",
						dTotal.toFixed(0),
						" m"
					] })
				]
			})
		] }), /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "speed",
				value: `${v} m/s`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: v,
					min: 5,
					max: maxSpeed,
					step: 1,
					onChange: change(setV),
					ariaLabel: "cruising speed (m/s)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "reaction",
				value: `${tr.toFixed(1)} s`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: tr,
					min: .2,
					max: 2,
					step: .1,
					onChange: change(setTr),
					ariaLabel: "reaction time (s)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "brake",
				value: `${a} m/s²`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: a,
					min: 2,
					max: 10,
					step: .5,
					onChange: change(setA),
					ariaLabel: "braking deceleration (m/s²)"
				})
			})
		] })] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			predict && revealed && t >= tTotal && /* @__PURE__ */ jsx(StatusPill, {
				ok: Math.abs(guess - dTotal) <= Math.max(3, dTotal * .1),
				children: Math.abs(guess - dTotal) <= Math.max(3, dTotal * .1) ? `✓ Close! Actual ${dTotal.toFixed(0)} m` : `Actual ${dTotal.toFixed(0)} m (you guessed ${guess.toFixed(0)})`
			}),
			/* @__PURE__ */ jsx(HintLadder, { hints: hl }),
			/* @__PURE__ */ jsx(LiveRegion, { children: `At ${v} metres per second: thinking ${dThink.toFixed(0)} metres, braking ${dBrake.toFixed(0)} metres, total ${dTotal.toFixed(0)} metres.` })
		] }),
		children: figure
	});
}

//#endregion
export { StoppingDistanceLab };