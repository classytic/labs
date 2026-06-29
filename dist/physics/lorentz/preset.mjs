'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { useFrameTick, useReducedMotion } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, Stage, Vector, useControlSurface } from "@classytic/stage";

//#region src/physics/lorentz/preset.tsx
/**
* LorentzForceLab, the magnetic force on a moving charge, F = q·v×B, made visible.
* A charge fired into a uniform field (into ⊗ or out ⊙ of the page) feels a force
* ALWAYS PERPENDICULAR to its velocity, so it curves into a circle (cyclotron
* motion). The lab draws the three perpendicular players live, v (green, tangent),
* B (the field symbols), F (orange, toward the centre), and the right-hand rule
* spelled out. Flip the charge sign OR the field direction and the curve reverses;
* F⟂v means the speed never changes (no work). Radius r = mv/(qB); the period is
* independent of speed, the trick behind the cyclotron, mass spectrometer, and the
* aurora (solar particles spiralling in Earth's field).
*/
const R = 5;
const view = {
	xMin: -5,
	xMax: R,
	yMin: -5,
	yMax: R
};
const GREEN = "var(--stage-good)", ORANGE = "var(--stage-warn)", POS = "#e03131", NEG = "#1c7ed6";
const LORENTZ_CHALLENGE = [{
	id: "speed",
	prompt: "The magnetic force on a moving charge does what to its SPEED?",
	choices: [
		{
			value: "none",
			label: "nothing: speed stays constant"
		},
		{
			value: "up",
			label: "speeds it up"
		},
		{
			value: "down",
			label: "slows it down"
		}
	],
	answer: "none",
	explain: "F = qv×B is always ⟂ to v, so it does no work, only the direction turns, the speed is constant."
}, {
	id: "radius",
	prompt: "Crank up the field B (same charge and speed). The circle becomes…",
	choices: [
		{
			value: "tighter",
			label: "tighter (smaller radius)"
		},
		{
			value: "wider",
			label: "wider (larger radius)"
		},
		{
			value: "same",
			label: "the same size"
		}
	],
	answer: "tighter",
	explain: "r = mv/(qB): a bigger B in the denominator shrinks the radius, so the charge curls tighter."
}];
function LorentzForceLab({ charge = 1, fieldOut = true, B: B0 = 1.4, speed: v0 = 2, title = "Magnetic force on a moving charge", prompt, objectives, hints: hintList, controlId, height = 330 }) {
	const [q, setQ] = useState(charge);
	const [out, setOut] = useState(fieldOut);
	const [B, setB] = useState(B0);
	const [v, setV] = useState(v0);
	const theta = useRef(-Math.PI / 2);
	const reduce = useReducedMotion();
	const [mounted, setMounted] = useState(false);
	const hints = useHints(hintList);
	const gate = usePlayGate();
	const challenge = useChallenge(LORENTZ_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "lorentz"
	});
	useEffect(() => {
		setMounted(true);
	}, []);
	const sense = (q > 0 ? 1 : -1) * (out ? 1 : -1);
	useFrameTick(gate.running && mounted && !reduce, (f) => {
		theta.current += sense * B * (f.dtMs / 1e3) * .9;
	});
	const r = Math.max(.7, Math.min(4.2, v / B));
	const pos = {
		x: r * Math.cos(theta.current),
		y: r * Math.sin(theta.current)
	};
	const vDir = {
		x: -Math.sin(theta.current) * sense,
		y: Math.cos(theta.current) * sense
	};
	const fDir = {
		x: -Math.cos(theta.current),
		y: -Math.sin(theta.current)
	};
	const vTip = {
		x: pos.x + vDir.x * 1.5,
		y: pos.y + vDir.y * 1.5
	};
	const fTip = {
		x: pos.x + fDir.x * 1.2,
		y: pos.y + fDir.y * 1.2
	};
	const grid = [];
	for (let gx = -4; gx <= 4; gx += 2) for (let gy = -4; gy <= 4; gy += 2) grid.push({
		x: gx,
		y: gy
	});
	useControlSurface(controlId, {
		charge: {
			type: "enum",
			label: "charge",
			options: ["+", "−"],
			get: () => q > 0 ? "+" : "−",
			set: (s) => setQ(s === "+" ? 1 : -1)
		},
		field: {
			type: "enum",
			label: "field",
			options: ["out", "in"],
			get: () => out ? "out" : "in",
			set: (s) => setOut(s === "out")
		},
		B: {
			type: "number",
			label: "field strength B",
			min: .6,
			max: 3,
			step: .1,
			get: () => B,
			set: setB
		},
		speed: {
			type: "number",
			label: "speed v",
			min: .6,
			max: 4,
			step: .1,
			get: () => v,
			set: setV
		}
	});
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				overflow: "hidden",
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)"
			},
			children: /* @__PURE__ */ jsxs(Stage, {
				view,
				height,
				ariaLabel: `charge ${q > 0 ? "positive" : "negative"} curving in a field ${out ? "out of" : "into"} the page`,
				children: [
					grid.map((g, i) => /* @__PURE__ */ jsx(Label, {
						x: g.x,
						y: g.y,
						text: out ? "⊙" : "⊗",
						color: "var(--stage-muted)",
						size: 15
					}, i)),
					/* @__PURE__ */ jsx(Circle, {
						center: {
							x: 0,
							y: 0
						},
						r,
						fill: "none",
						color: "var(--stage-grid)",
						weight: 1.5,
						dashed: true
					}),
					/* @__PURE__ */ jsx(Vector, {
						tail: pos,
						tip: fTip,
						color: ORANGE,
						weight: 3
					}),
					/* @__PURE__ */ jsx(Vector, {
						tail: pos,
						tip: vTip,
						color: GREEN,
						weight: 3
					}),
					/* @__PURE__ */ jsx(Label, {
						x: (pos.x + vTip.x) / 2,
						y: (pos.y + vTip.y) / 2,
						text: "v",
						color: GREEN,
						size: 13,
						dy: -8
					}),
					/* @__PURE__ */ jsx(Label, {
						x: (pos.x + fTip.x) / 2,
						y: (pos.y + fTip.y) / 2,
						text: "F",
						color: ORANGE,
						size: 13,
						dx: 8
					}),
					/* @__PURE__ */ jsx(Dot, {
						x: pos.x,
						y: pos.y,
						r: 8,
						color: q > 0 ? POS : NEG
					}),
					/* @__PURE__ */ jsx(Label, {
						x: pos.x,
						y: pos.y,
						text: q > 0 ? "+" : "−",
						color: "white",
						size: 12
					})
				]
			})
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsxs(Callout, {
				tone: "result",
				children: [
					/* @__PURE__ */ jsx("div", {
						style: { fontSize: 16 },
						children: /* @__PURE__ */ jsx(Tex$1, { tex: "F = q\\,v \\times B" })
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: 14,
							fontWeight: 600
						},
						children: ["curves ", sense > 0 ? "counter-clockwise" : "clockwise"]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: 12,
							color: "var(--stage-muted)"
						},
						children: [
							"radius ",
							/* @__PURE__ */ jsx(Tex$1, { tex: "r = \\tfrac{mv}{qB}" }),
							" = ",
							r.toFixed(2)
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "lab-prompt",
				style: { fontSize: 13 },
				children: [
					/* @__PURE__ */ jsx("b", { children: "Right-hand rule:" }),
					" fingers point along ",
					/* @__PURE__ */ jsx("b", {
						style: { color: GREEN },
						children: "v"
					}),
					", curl toward ",
					/* @__PURE__ */ jsx("b", { children: "B" }),
					" (",
					out ? "out ⊙" : "in ⊗",
					"), thumb = ",
					/* @__PURE__ */ jsx("b", {
						style: { color: ORANGE },
						children: "F"
					}),
					" (for +q; reverse for −q). F always ⟂ v, so it only turns the charge, the speed never changes."
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "lab-prompt",
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "Same idea runs the cyclotron, the mass spectrometer, and the aurora, charged particles from the Sun spiralling in Earth's field."
			})
		] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "charge",
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "flex",
						gap: 6
					},
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: q > 0,
						onClick: () => setQ(1),
						children: "+ positive"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: q < 0,
						onClick: () => setQ(-1),
						children: "− negative"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "field",
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "flex",
						gap: 6
					},
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: out,
						onClick: () => setOut(true),
						children: "⊙ out"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: !out,
						onClick: () => setOut(false),
						children: "⊗ in"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "B strength",
				value: B.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: B,
					min: .6,
					max: 3,
					step: .1,
					onChange: setB,
					ariaLabel: "field strength"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "speed v",
				value: v.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: v,
					min: .6,
					max: 4,
					step: .1,
					onChange: setV,
					ariaLabel: "speed"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(HintLadder, { hints }), /* @__PURE__ */ jsx(ChallengeCard, {
			questions: LORENTZ_CHALLENGE,
			state: challenge,
			title: "Predict"
		})] }),
		children: figure
	});
}

//#endregion
export { LorentzForceLab };