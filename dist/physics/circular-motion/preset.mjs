'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, Segment, Stage, Vector } from "@classytic/stage";

//#region src/physics/circular-motion/preset.tsx
/**
* CircularMotionLab, "Whirl & cut", where centripetal force points and where the
* ball REALLY goes when you let go.
*
* A ball on a string whirls at constant speed. The velocity arrow is always
* TANGENT; the tension (centripetal force F = mv²/r) always points to the centre , 
* it changes the direction of v, never its size. Then CUT THE STRING: the ball
* flies off along the tangent in a straight line, NOT radially outward, the
* single most common misconception. Tune v, r, m and read F live (hammer throw,
* a car cornering, the spin cycle).
*
* Uses the ambient PlayWrap gate (pause to study the vectors). Tokenized SVG.
*/
const PREDICT = [{
	id: "release",
	prompt: "You’re whirling a ball on a string in a circle. At the instant you LET GO, which way does the ball fly?",
	choices: [
		{
			value: "tangent",
			label: "straight, along the tangent (the way it was moving)"
		},
		{
			value: "radial",
			label: "straight outward, away from the centre"
		},
		{
			value: "curve",
			label: "it keeps curving for a bit"
		}
	],
	answer: "tangent",
	explain: "No force acts after release, so by Newton’s first law it travels in a straight line along its velocity — the tangent. It does NOT fly radially outward (that’s the common misconception) and does not keep curving."
}];
function CircularMotionLab({ speed = 6, radius = 3, mass = 1, title = "Whirl & cut: where does it really go?", prompt = "The string’s tension is the centripetal force F = mv²/r, always toward the centre, bending the path without changing the speed. Cut the string and the ball leaves along the tangent, not outward.", objectives, controlConfig }) {
	const [v, setV] = useState(speed);
	const [r, setR] = useState(radius);
	const [m, setM] = useState(mass);
	const [cut, setCut] = useState(false);
	const gate = usePlayGate();
	const ch = useChallenge(PREDICT);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "circular-motion-predict"
	});
	const ang = useRef(0);
	const fly = useRef(null);
	const omega = v / r;
	const F = m * v * v / r;
	useFrameTick(gate.running, (f) => {
		const dt = Math.min(.04, f.dtMs / 1e3);
		if (!cut) ang.current = (ang.current + omega * dt) % (Math.PI * 2);
		else if (fly.current) {
			fly.current.x += fly.current.vx * dt;
			fly.current.y += fly.current.vy * dt;
			if (Math.hypot(fly.current.x, fly.current.y) > 8.5) gate.setPlaying(false);
		}
	});
	const ballPos = () => ({
		x: r * Math.cos(ang.current),
		y: r * Math.sin(ang.current)
	});
	const tangent = () => ({
		x: -Math.sin(ang.current),
		y: Math.cos(ang.current)
	});
	function startFly() {
		const p = ballPos();
		const tg = tangent();
		fly.current = {
			x: p.x,
			y: p.y,
			vx: tg.x * v,
			vy: tg.y * v
		};
	}
	const doCut = () => {
		startFly();
		setCut(true);
		gate.setPlaying(true);
	};
	const retie = () => {
		setCut(false);
		fly.current = null;
	};
	const onParam = (set) => (n) => {
		set(n);
		retie();
	};
	const VSCALE = .45;
	const FSCALE = .1;
	const p = cut && fly.current ? {
		x: fly.current.x,
		y: fly.current.y
	} : ballPos();
	const tg = tangent();
	const span = Math.max(6, r + 3);
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -span,
				xMax: span,
				yMin: -span,
				yMax: span
			},
			height: 300,
			ariaLabel: `Ball whirling at ${v} m/s on a ${r} m string, centripetal force ${F.toFixed(0)} newtons${cut ? "; string cut, flying off tangentially" : ""}`,
			children: [
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: 0,
						y: 0
					},
					r,
					color: "var(--stage-fg)",
					opacity: .3,
					weight: 1.2,
					fill: "none"
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: 0,
					y: 0,
					r: 5,
					color: "var(--stage-fg)",
					opacity: .7
				}),
				!cut && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: p,
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 1.5
				}),
				!cut && /* @__PURE__ */ jsx(Vector, {
					tail: p,
					tip: {
						x: p.x - Math.cos(ang.current) * F * FSCALE,
						y: p.y - Math.sin(ang.current) * F * FSCALE
					},
					color: "var(--stage-warn)",
					weight: 3
				}),
				!cut && /* @__PURE__ */ jsx(Label, {
					x: p.x - Math.cos(ang.current) * F * FSCALE,
					y: p.y - Math.sin(ang.current) * F * FSCALE,
					text: "F",
					color: "var(--stage-warn)",
					size: 12,
					dy: -4
				}),
				/* @__PURE__ */ jsx(Vector, {
					tail: p,
					tip: {
						x: p.x + tg.x * v * VSCALE,
						y: p.y + tg.y * v * VSCALE
					},
					color: "var(--stage-good)",
					weight: 3
				}),
				/* @__PURE__ */ jsx(Label, {
					x: p.x + tg.x * v * VSCALE,
					y: p.y + tg.y * v * VSCALE,
					text: "v",
					color: "var(--stage-good)",
					size: 12,
					dy: -4
				}),
				cut && fly.current && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: fly.current.x - tg.x * 12,
						y: fly.current.y - tg.y * 12
					},
					to: {
						x: fly.current.x + tg.x * 12,
						y: fly.current.y + tg.y * 12
					},
					color: "var(--stage-good)",
					opacity: .3,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: p,
					r: .45,
					color: "var(--stage-accent)",
					fill: "var(--stage-accent)",
					fillOpacity: .9,
					weight: 1.5
				})
			]
		}) })
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
							/* @__PURE__ */ jsxs("span", { children: ["centripetal F = mv²/r = ", /* @__PURE__ */ jsxs("strong", { children: [F.toFixed(0), " N"] })] }),
							/* @__PURE__ */ jsxs("span", { children: ["angular speed ω = v/r = ", /* @__PURE__ */ jsxs("strong", { children: [omega.toFixed(2), " rad/s"] })] }),
							/* @__PURE__ */ jsxs("span", { children: ["period T = 2πr/v = ", /* @__PURE__ */ jsxs("strong", { children: [(2 * Math.PI * r / v).toFixed(2), " s"] })] })
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
						/* @__PURE__ */ jsx("span", {
							style: {
								color: "var(--stage-good)",
								fontWeight: 700
							},
							children: "v"
						}),
						" is tangent;",
						/* @__PURE__ */ jsx("span", {
							style: {
								color: "var(--stage-warn)",
								fontWeight: 700
							},
							children: " F"
						}),
						" points to the centre. Cut the string → no inward pull → straight-line tangent flight (Newton’s 1st law). Hammer throw, a car cornering, the spin cycle."
					]
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: cut ? "String cut, the ball travels in a straight line along the tangent." : `Centripetal force ${F.toFixed(0)} newtons toward the centre.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			cut ? /* @__PURE__ */ jsx(CheckButton, {
				onClick: retie,
				children: "↺ Re-tie"
			}) : /* @__PURE__ */ jsx(CheckButton, {
				onClick: doCut,
				children: "✂ Cut string"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: cut,
				onClick: () => cut ? retie() : doCut(),
				children: cut ? "flying free" : "on the string"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "speed v",
				value: `${v} m/s`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: v,
					min: 2,
					max: 12,
					step: .5,
					onChange: onParam(setV),
					ariaLabel: "speed (m/s)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "radius r",
				value: `${r} m`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: r,
					min: 1.5,
					max: 5,
					step: .5,
					onChange: onParam((n) => setR(clamp(n, 1.5, 5))),
					ariaLabel: "radius (m)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "mass m",
				value: `${m} kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: m,
					min: .5,
					max: 4,
					step: .5,
					onChange: onParam(setM),
					ariaLabel: "mass (kg)"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: PREDICT,
			state: ch,
			title: "Predict first"
		}),
		controlConfig,
		children: figure
	});
}

//#endregion
export { CircularMotionLab };