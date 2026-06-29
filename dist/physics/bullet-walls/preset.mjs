'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Slider, StatusPill, Stepper } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion, MeterBar } from "../../kit/frame.mjs";
import { useFrameTick, useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, Polygon, Segment, Stage, useInView, useLearner } from "@classytic/stage";

//#region src/physics/bullet-walls/preset.tsx
/**
* BulletWallsLab, "How many planks?", the classic penetration problem made
* watchable and PREDICT-FIRST.
*
* A bullet fires into a stack of identical planks. Each plank pushes back with a
* constant retarding force over its thickness, so it drains a FIXED chunk of
* kinetic energy, equivalently a fixed Δ(v²) per plank. The bullet free-flies
* between planks (constant v) and decelerates linearly in v² while inside one
* (v²(x) = v²ₑ − (cost/width)·depth), the textbook v² = u² − 2as. It stops the
* instant its kinetic energy runs out, embedding partway through a plank.
*
* The learner GUESSES how many planks it punches through, then fires and watches
* it slow plank-by-plank while the KE bar drains, turning "N = u²/(2as)" from a
* formula into a bet you can win.
*
* Tokenized SVG; time-dependent integrator here; honours reduced-motion.
*/
const PLANK_W = .7;
const START_X = -4;
const STACK_X0 = 0;
function BulletWallsLab({ speed = 30, toughness = 160, planks = 6, mass = .02, title = "How many planks?: bet, then fire", prompt = "Each plank steals the same chunk of energy. Guess how many the bullet smashes through, then fire and watch the speed (and the energy bar) drain plank by plank.", objectives, controlConfig }) {
	const [v0, setV0] = useState(speed);
	const [cost, setCost] = useState(toughness);
	const [n, setN] = useState(planks);
	const [guess, setGuess] = useState(2);
	const [running, setRunning] = useState(false);
	const [fired, setFired] = useState(false);
	const xRef = useRef(START_X);
	const v2Ref = useRef(v0 * v0);
	const reduce = useReducedMotion();
	const learner = useLearner();
	const { ref: viewRef, inView } = useInView();
	const faceX = (i) => STACK_X0 + i * 1.7;
	const ke0 = .5 * mass * v0 * v0;
	const fullPenetrated = Math.min(n, Math.floor(v0 * v0 / cost + 1e-9));
	const stopsInsideStack = v0 * v0 / cost < n;
	const remV2 = v0 * v0 - fullPenetrated * cost;
	const lodgeDepth = stopsInsideStack ? clamp(remV2 / cost, 0, 1) * PLANK_W : 0;
	const SPEED_SCALE = .25;
	const repaint = useFrameTick(running && inView, (f) => {
		const dt = Math.min(.04, f.dtMs / 1e3);
		let x = xRef.current;
		let v2 = v2Ref.current;
		let dx = Math.sqrt(Math.max(0, v2)) * SPEED_SCALE * dt;
		let inside = false;
		for (let i = 0; i < n; i++) {
			const a = faceX(i), b = a + PLANK_W;
			if (x >= a && x < b) {
				inside = true;
				break;
			}
		}
		if (inside) {
			const dV2 = cost / PLANK_W * dx;
			if (dV2 >= v2) {
				const allowed = v2 / cost * PLANK_W;
				x += allowed;
				v2 = 0;
			} else {
				x += dx;
				v2 -= dV2;
			}
		} else x += dx;
		xRef.current = x;
		v2Ref.current = v2;
		const exited = x >= faceX(n - 1) + PLANK_W + .5;
		if (v2 <= 0 || exited) {
			setRunning(false);
			learner?.report({
				activity: "bullet-walls",
				correct: guess === fullPenetrated,
				score: {
					raw: guess === fullPenetrated ? 1 : 0,
					max: 1
				},
				response: String(guess),
				completion: true
			});
		}
	});
	const fire = () => {
		xRef.current = START_X;
		v2Ref.current = v0 * v0;
		setFired(true);
		if (reduce) {
			xRef.current = stopsInsideStack ? faceX(fullPenetrated) + lodgeDepth : faceX(n - 1) + PLANK_W + .5;
			v2Ref.current = stopsInsideStack ? 0 : v0 * v0 - n * cost;
			repaint();
			return;
		}
		setRunning(true);
	};
	const onParam = (set) => (x) => {
		set(x);
		setRunning(false);
		setFired(false);
		xRef.current = START_X;
		v2Ref.current = (set === setV0 ? x : v0) ** 2;
	};
	const bx = xRef.current;
	const vNow = Math.sqrt(Math.max(0, v2Ref.current));
	const keNow = .5 * mass * v2Ref.current;
	let broken = 0;
	for (let i = 0; i < n; i++) if (bx >= faceX(i) + PLANK_W) broken++;
	const settled = fired && !running;
	const stackEnd = faceX(n - 1) + PLANK_W;
	const view = {
		xMin: START_X - 1.3,
		xMax: stackEnd + 1.5,
		yMin: -2.4,
		yMax: 2.4
	};
	const Plank = (i) => {
		const a = faceX(i);
		const shattered = bx >= a + PLANK_W;
		const col = shattered ? "var(--stage-muted)" : settled && stopsInsideStack && i === fullPenetrated ? "var(--stage-warn)" : "var(--stage-good)";
		return /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					{
						x: a,
						y: -1.6
					},
					{
						x: a + PLANK_W,
						y: -1.6
					},
					{
						x: a + PLANK_W,
						y: 1.6
					},
					{
						x: a,
						y: 1.6
					}
				],
				color: `color-mix(in oklab, ${col} 60%, black)`,
				fill: col,
				fillOpacity: shattered ? .18 : .7,
				weight: 1.2
			}),
			shattered && /* @__PURE__ */ jsx(Segment, {
				from: {
					x: a,
					y: .7
				},
				to: {
					x: a + PLANK_W,
					y: -.5
				},
				color: "var(--stage-fg)",
				opacity: .35,
				weight: .8
			}),
			shattered && /* @__PURE__ */ jsx(Segment, {
				from: {
					x: a,
					y: -.6
				},
				to: {
					x: a + PLANK_W,
					y: .8
				},
				color: "var(--stage-fg)",
				opacity: .35,
				weight: .8
			})
		] }, `p${i}`);
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height: 230,
			preserveAspect: false,
			ariaLabel: `A bullet at ${v0} m/s fired into ${n} planks`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: view.xMin,
						y: -1.6
					},
					to: {
						x: view.xMax,
						y: -1.6
					},
					color: "var(--stage-fg)",
					opacity: .4,
					weight: 1.5
				}),
				Array.from({ length: n }, (_, i) => Plank(i)),
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: bx - 1,
							y: -.22
						},
						{
							x: bx - .32,
							y: -.22
						},
						{
							x: bx,
							y: 0
						},
						{
							x: bx - .32,
							y: .22
						},
						{
							x: bx - 1,
							y: .22
						}
					],
					color: "color-mix(in oklab, var(--stage-metal) 55%, black)",
					fill: "var(--stage-metal)",
					fillOpacity: 1,
					weight: 1
				}),
				running && vNow > .5 && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: bx - 1.1 - Math.min(2, vNow * .08),
						y: 0
					},
					to: {
						x: bx - 1,
						y: 0
					},
					color: "var(--stage-metal)",
					opacity: .4,
					weight: 3
				}),
				/* @__PURE__ */ jsx(Label, {
					x: bx - .5,
					y: .22,
					text: `${vNow.toFixed(0)} m/s`,
					color: "var(--stage-fg)",
					size: 11,
					dy: -6
				})
			]
		})
	});
	const verdict = settled ? guess === fullPenetrated ? `🎯 Spot on, ${fullPenetrated} planks` : `It broke ${fullPenetrated}, you guessed ${guess}` : null;
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
							/* @__PURE__ */ jsxs("span", { children: ["start KE = ½mv² = ", /* @__PURE__ */ jsxs("strong", { children: [ke0.toFixed(1), " J"] })] }),
							/* @__PURE__ */ jsxs("span", { children: ["cost per plank ≈ ", /* @__PURE__ */ jsxs("strong", { children: [(.5 * mass * cost).toFixed(1), " J"] })] }),
							/* @__PURE__ */ jsxs("span", { children: ["broken so far: ", /* @__PURE__ */ jsxs("strong", { children: [
								broken,
								" / ",
								n
							] })] })
						]
					})
				}),
				/* @__PURE__ */ jsx(MeterBar, {
					label: "kinetic energy",
					frac: ke0 > 0 ? keNow / ke0 : 0,
					color: "var(--stage-accent)",
					value: `${keNow.toFixed(1)} J`
				}),
				verdict && /* @__PURE__ */ jsx(StatusPill, {
					ok: guess === fullPenetrated,
					children: verdict
				}),
				/* @__PURE__ */ jsxs("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: [
						"Predict with ",
						/* @__PURE__ */ jsx("strong", { children: "N = u² / (Δv² per plank)" }),
						", then watch v² fall by the same step each plank (v² = u² − 2as). It lodges when the energy hits zero."
					]
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: settled ? `The bullet broke ${fullPenetrated} of ${n} planks. You guessed ${guess}.` : "" })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "your guess",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: guess,
					min: 0,
					max: n,
					onChange: setGuess,
					label: "planks you think it breaks"
				})
			}),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: fire,
				children: "▶ Fire"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "muzzle speed",
				value: `${v0} m/s`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: v0,
					min: 10,
					max: 60,
					step: 1,
					onChange: onParam(setV0),
					ariaLabel: "muzzle speed (m/s)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "plank toughness",
				value: `Δv² ${cost}`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: cost,
					min: 40,
					max: 400,
					step: 10,
					onChange: onParam(setCost),
					ariaLabel: "energy each plank absorbs"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "planks",
				value: `${n}`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: n,
					min: 1,
					max: 10,
					step: 1,
					onChange: (x) => {
						onParam(setN)(x);
						setGuess((g) => Math.min(g, x));
					},
					ariaLabel: "number of planks"
				})
			})
		] }),
		controlConfig,
		children: figure
	});
}

//#endregion
export { BulletWallsLab };