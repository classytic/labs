'use client';

import { CheckButton, Slider, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion, MeterBar } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick, useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Polygon, Segment, Stage, Vector, useInView } from "@classytic/stage";

//#region src/physics/collision-track/preset.tsx
/**
* CollisionTrackLab, "Sticky or Bouncy?", momentum always survives, KE doesn't.
*
* Two carts collide on a frictionless track. ONE elasticity slider morphs
* continuously from perfectly inelastic (e=0, stick + KE drops) to perfectly
* elastic (e=1, bounce, KE held). A momentum bar stays FULL through the collision
* while the KE bar visibly leaks when e<1, and a constant-velocity centre-of-mass
* marker sails dead-straight through the impact, the single-image proof that
* momentum is conserved no matter what. Kills the "momentum is lost" misconception.
*
* Tokenized SVG; time-dependent so the integrator lives here; honours reduced-motion.
*/
const CART_W = 1.8, X0 = -9, X1 = 9;
const PREDICT_Q = [{
	id: "collision-track-conserved",
	prompt: "These carts collide and BOUNCE apart (elastic, e = 1). After the crash, which is conserved — total momentum, total kinetic energy, both, or neither?",
	choices: [
		{
			value: "momentum",
			label: "momentum only"
		},
		{
			value: "both",
			label: "both"
		},
		{
			value: "ke",
			label: "kinetic energy only"
		},
		{
			value: "neither",
			label: "neither"
		}
	],
	answer: "both",
	explain: "Momentum is always conserved in a collision (no external force). In a perfectly elastic collision (e = 1) the carts bounce with no energy lost to heat or deformation, so kinetic energy is conserved too — hence both. Slide elasticity below 1 and the KE bar will start to leak."
}];
function CollisionTrackLab({ m1 = 1, m2 = 1, u1 = 4, u2 = -2, elasticity = 1, showCenterOfMass = true, title = "Sticky or Bouncy?: momentum always survives", prompt = "Set the elasticity, launch, and watch: the momentum bar stays full; the KE bar leaks when sticky.", objectives }) {
	const [ma, setMa] = useState(m1);
	const [mb, setMb] = useState(m2);
	const [ua, setUa] = useState(u1);
	const [ub, setUb] = useState(u2);
	const [e, setE] = useState(elasticity);
	const [running, setRunning] = useState(false);
	const [collided, setCollided] = useState(false);
	const [stopped, setStopped] = useState(false);
	const xa = useRef(-6), xb = useRef(2);
	const phase = useRef("approach");
	const startedRef = useRef(false);
	const reduce = useReducedMotion();
	const { ref: viewRef, inView } = useInView();
	const ch = useChallenge(PREDICT_Q);
	useCheckpoint({
		solved: ch.allCorrect && stopped,
		activity: "collision-track"
	});
	const M = ma + mb;
	const va = (ma * ua + mb * ub + mb * e * (ub - ua)) / M;
	const vb = (ma * ua + mb * ub + ma * e * (ua - ub)) / M;
	(ma * ua + mb * ub) / M;
	const pInit = ma * ua + mb * ub;
	const keInit = .5 * ma * ua * ua + .5 * mb * ub * ub;
	const after = collided;
	const v1 = after ? va : ua, v2 = after ? vb : ub;
	const pNow = ma * v1 + mb * v2;
	const keNow = .5 * ma * v1 * v1 + .5 * mb * v2 * v2;
	const keFrac = keInit > 1e-9 ? keNow / keInit : 1;
	useFrameTick(running && inView, (f) => {
		const dt = Math.min(.05, f.dtMs / 1e3);
		if (phase.current === "approach") {
			xa.current += ua * dt;
			xb.current += ub * dt;
			if (xb.current - xa.current <= CART_W) {
				const overlap = CART_W - (xb.current - xa.current);
				xa.current -= overlap / 2;
				xb.current += overlap / 2;
				phase.current = "after";
				setCollided(true);
			}
		} else {
			xa.current += va * dt;
			xb.current += vb * dt;
			if (e < .02) {
				const mid = (xa.current + xb.current) / 2;
				xa.current = mid - CART_W / 2;
				xb.current = mid + CART_W / 2;
			}
		}
		if (xa.current <= -8.1 || xb.current >= X1 - CART_W / 2 || phase.current === "after" && Math.abs(va) < .001 && Math.abs(vb) < .001) {
			setRunning(false);
			setStopped(true);
		}
	});
	const reset = () => {
		xa.current = -6;
		xb.current = 2;
		phase.current = "approach";
		setCollided(false);
		setStopped(false);
	};
	const launch = () => {
		reset();
		if (reduce) {
			phase.current = "after";
			setCollided(true);
			return;
		}
		startedRef.current = true;
		setRunning(true);
	};
	const onParam = (set) => (n) => {
		set(n);
		setRunning(false);
		reset();
	};
	const xcom = (ma * xa.current + mb * xb.current) / M;
	const view = {
		xMin: X0,
		xMax: X1,
		yMin: -2,
		yMax: 5
	};
	const Cart = (x, w, vel, tint, name) => {
		const hw = CART_W / 2;
		return /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					{
						x: x - hw,
						y: .15
					},
					{
						x: x + hw,
						y: .15
					},
					{
						x: x + hw,
						y: 1.3499999999999999
					},
					{
						x: x - hw,
						y: 1.3499999999999999
					}
				],
				color: `color-mix(in oklab, ${tint} 60%, black)`,
				fill: tint,
				fillOpacity: .85,
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: x - hw * .55,
				y: .15,
				r: 4,
				color: "var(--stage-metal)"
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: x + hw * .55,
				y: .15,
				r: 4,
				color: "var(--stage-metal)"
			}),
			/* @__PURE__ */ jsx(Label, {
				x,
				y: .75,
				text: `${w}kg`,
				color: "var(--stage-bg)",
				size: 12
			}),
			Math.abs(vel) > .05 && /* @__PURE__ */ jsx(Vector, {
				tail: {
					x,
					y: 1.9499999999999997
				},
				tip: {
					x: x + vel * .5,
					y: 1.9499999999999997
				},
				color: tint,
				weight: 3
			})
		] });
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height: 210,
			preserveAspect: false,
			ariaLabel: `Two carts colliding, elasticity ${e.toFixed(2)}`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: X0,
						y: 0
					},
					to: {
						x: X1,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2
				}),
				[
					-8,
					-4,
					0,
					4,
					8
				].map((mk) => /* @__PURE__ */ jsx(Segment, {
					from: {
						x: mk,
						y: -.2
					},
					to: {
						x: mk,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .3,
					weight: 1
				}, mk)),
				Cart(xa.current, ma, v1, "var(--stage-accent)", "A"),
				Cart(xb.current, mb, v2, "var(--stage-accent-2)", "B"),
				showCenterOfMass && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: xcom,
							y: -1.4
						},
						to: {
							x: xcom,
							y: 4.4
						},
						color: "var(--stage-good)",
						weight: 1.5,
						dashed: true,
						opacity: .8
					}),
					/* @__PURE__ */ jsx(Dot, {
						x: xcom,
						y: 4.4,
						r: 5,
						color: "var(--stage-good)"
					}),
					/* @__PURE__ */ jsx(Label, {
						x: xcom,
						y: 4.4,
						text: "COM",
						color: "var(--stage-good)",
						size: 10,
						dy: -10
					})
				] })
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
				gap: 12
			},
			children: [
				/* @__PURE__ */ jsx(MeterBar, {
					label: "momentum p",
					frac: pInit !== 0 ? pNow / pInit : Math.abs(pNow) < 1e-6 ? 1 : 0,
					color: "var(--stage-good)",
					value: `${pNow.toFixed(1)} kg·m/s`
				}),
				/* @__PURE__ */ jsx(MeterBar, {
					label: "kinetic energy",
					frac: keFrac,
					color: keFrac > .99 ? "var(--stage-good)" : "var(--stage-warn)",
					value: `${keNow.toFixed(1)} J${after && keFrac < .99 ? ` · ${Math.round((1 - keFrac) * 100)}% → heat 🔥` : ""}`
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: `Elasticity ${e.toFixed(2)}. Momentum ${pNow.toFixed(1)} conserved; kinetic energy ${after ? `${Math.round(keFrac * 100)} percent remaining` : "full before impact"}.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: launch,
				children: "▶ Launch"
			}),
			/* @__PURE__ */ jsx(StatusPill, {
				ok: e > .98,
				children: e > .98 ? "elastic · KE conserved" : e < .02 ? "perfectly inelastic · stick" : "inelastic · KE lost"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "elasticity e",
				value: e.toFixed(2),
				children: /* @__PURE__ */ jsx(Slider, {
					value: e,
					min: 0,
					max: 1,
					step: .05,
					onChange: onParam(setE),
					ariaLabel: "coefficient of restitution"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "m₁",
				value: `${ma}kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: ma,
					min: 1,
					max: 6,
					step: .5,
					onChange: onParam(setMa),
					ariaLabel: "mass of cart A (kg)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "u₁",
				value: `${ua}m/s`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: ua,
					min: 0,
					max: 8,
					step: .5,
					onChange: onParam(setUa),
					ariaLabel: "initial velocity of cart A (m/s)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "m₂",
				value: `${mb}kg`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: mb,
					min: 1,
					max: 6,
					step: .5,
					onChange: onParam(setMb),
					ariaLabel: "mass of cart B (kg)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "u₂",
				value: `${ub}m/s`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: ub,
					min: -8,
					max: 0,
					step: .5,
					onChange: onParam(setUb),
					ariaLabel: "initial velocity of cart B (m/s)"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: PREDICT_Q,
			state: ch,
			title: "Predict first"
		}),
		children: figure
	});
}

//#endregion
export { CollisionTrackLab };