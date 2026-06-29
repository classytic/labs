'use client';

import { Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { BulbGlyph, CellGlyph, FlowDots, MosfetGlyph, Tag, Wire } from "../../kit/electronics.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane } from "../../kit/coords.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Polyline, Segment, useFrameLoop } from "@classytic/stage";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/transistor/preset.tsx
/**
* TransistorLab — an NMOS as the thing that lets a tiny input steer a big current.
* Drawn with the shared electronics glyphs (CellGlyph / BulbGlyph / MosfetGlyph) on
* a real schematic: a supply lights a lamp through the transistor, and the GATE
* voltage decides whether the channel conducts. Below the threshold the lamp is
* dark; past it the gate opens a much larger drain current and the lamp glows. The
* transfer curve and operating point are swept straight from the circuit engine.
*/
const PREDICT_Q = [{
	id: "on",
	prompt: "A MOSFET conducts only when the gate voltage exceeds its threshold Vₜₕ. With the gate held BELOW Vₜₕ, is the transistor ON or OFF?",
	choices: [{
		value: "on",
		label: "ON (lamp lit, drain current flows)"
	}, {
		value: "off",
		label: "OFF (lamp dark, no drain current)"
	}],
	answer: "off",
	explain: "Below threshold the channel never forms, so no drain current flows and the lamp stays dark. The transistor only turns ON once the gate climbs past Vₜₕ, opening a much larger drain current."
}];
const K = .02;
const C_OK = "var(--stage-good)";
const C_BAD = "var(--stage-danger, #e03131)";
const W = 520, H = 210, xL = 55, xR = 430, yT = 48, yB = 172, HALF = 28;
const CELL_X = 120, LAMP_X = 250;
const MCX = xR - 9, MCY = 220 / 2, MHALF = (yB - yT) / 2;
const GATE_TERM = MCX - 13 - 24;
const LOOP = [
	[xL, yT],
	[xR, yT],
	[xR, yB],
	[xL, yB],
	[xL, yT]
];
function TransistorLab({ supply = 5, vth = 2, loadK = 1, show = "both", title = "The transistor: a small input controls a big current", prompt = "Turn the gate voltage. Below the threshold the channel is shut and the lamp is dark; past it, the gate opens a much larger drain current.", ask, activity = "transistor" } = {}) {
	const [Vg, setVg] = useState(3);
	const [Rk, setRk] = useState(loadK);
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const ch = useChallenge(PREDICT_Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: `${activity}:predict`
	});
	const R = Rk * 1e3;
	const mk = (vg) => [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: supply
		},
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: vg
		},
		{
			kind: "R",
			n1: 1,
			n2: 2,
			value: R,
			id: "load"
		},
		{
			kind: "M",
			n1: 2,
			n2: 0,
			n3: 3,
			value: 0,
			vth,
			k: K,
			id: "q"
		}
	];
	const sol = solveDC(mk(Vg));
	const Id = (sol.current["q"] ?? 0) * 1e3;
	const Vdrain = sol.nodeV[2] ?? 0;
	const maxId = supply / R * 1e3;
	const on = Id > .05;
	const brightness = Math.max(0, Math.min(1, Id / maxId));
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1e3 * (.1 + .4 * brightness)) % 1), { running: on && !reduce });
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `NMOS circuit, ${on ? "on, lamp lit" : "off, lamp dark"}`,
			children: [
				/* @__PURE__ */ jsx(Wire, {
					points: LOOP,
					live: on
				}),
				on && /* @__PURE__ */ jsx(FlowDots, {
					points: LOOP,
					phase
				}),
				/* @__PURE__ */ jsx(CellGlyph, {
					cx: CELL_X,
					cy: yT,
					half: HALF,
					live: on,
					label: `${supply} V`
				}),
				/* @__PURE__ */ jsx(BulbGlyph, {
					cx: LAMP_X,
					cy: yT,
					half: HALF,
					live: on,
					brightness,
					label: "lamp"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: MCX,
					cy: MCY,
					half: MHALF,
					on,
					live: on
				}),
				/* @__PURE__ */ jsx("line", {
					x1: GATE_TERM - 48,
					y1: MCY,
					x2: GATE_TERM,
					y2: MCY,
					stroke: "var(--stage-wire)",
					strokeWidth: 2.5,
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: GATE_TERM - 48,
					cy: MCY,
					r: 3,
					fill: "var(--stage-metal)"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: GATE_TERM - 52,
					y: MCY - 8,
					text: "gate",
					color: "var(--stage-fg)",
					size: 11,
					weight: 600,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: GATE_TERM - 52,
					y: 124,
					text: `${Vg.toFixed(1)} V`,
					color: on ? C_OK : C_BAD,
					size: 11,
					weight: 700,
					anchor: "end"
				})
			]
		})
	});
	const pts = [];
	for (let vg = 0; vg <= 5.0001; vg += .1) pts.push({
		x: vg,
		y: (solveDC(mk(vg)).current["q"] ?? 0) * 1e3
	});
	const gview = {
		xMin: 0,
		xMax: 5,
		yMin: 0,
		yMax: Math.max(2, Math.ceil(maxId * 1.1))
	};
	const graph = /* @__PURE__ */ jsxs(CoordPlane, {
		view: gview,
		height: 150,
		preserveAspect: false,
		step: 1,
		ariaLabel: "NMOS transfer curve",
		children: [
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: vth,
					y: 0
				},
				to: {
					x: vth,
					y: gview.yMax
				},
				color: "var(--stage-muted)",
				weight: 1,
				dashed: true
			}),
			/* @__PURE__ */ jsx(Label, {
				x: vth,
				y: gview.yMax,
				text: `Vₜₕ = ${vth} V`,
				color: "var(--stage-muted)",
				size: 10,
				dy: -4,
				dx: 4,
				anchor: "start"
			}),
			/* @__PURE__ */ jsx(Polyline, {
				points: pts,
				color: "var(--stage-accent)",
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: Vg,
				y: Math.max(0, Math.min(gview.yMax, Id)),
				r: 5,
				color: on ? C_OK : C_BAD
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 5,
				y: gview.yMax * .95,
				text: "drain current (mA) vs gate (V)",
				color: "var(--stage-muted)",
				size: 10,
				anchor: "end"
			})
		]
	});
	const figure = show === "circuit" ? scene : show === "graph" ? graph : /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [scene, graph]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "gate voltage",
			value: `${Vg.toFixed(1)} V`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: Vg,
				min: 0,
				max: 5,
				step: .1,
				onChange: setVg,
				ariaLabel: "gate voltage"
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "load R",
			value: `${Rk.toFixed(1)} kΩ`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: Rk,
				min: .5,
				max: 5,
				step: .1,
				onChange: setRk,
				ariaLabel: "load resistance"
			})
		})] }),
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx("div", {
				className: "lab-pill",
				"data-state": on ? "ok" : "no",
				role: "status",
				style: { alignSelf: "flex-start" },
				children: on ? `✓ ON, lamp ${Math.round(brightness * 100)}% bright` : "✗ OFF, gate below threshold, lamp dark"
			}), /* @__PURE__ */ jsx(Callout, {
				tone: "result",
				children: /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gap: 6,
						fontVariantNumeric: "tabular-nums",
						fontSize: 13
					},
					children: [
						/* @__PURE__ */ jsxs("span", { children: [
							"gate V",
							/* @__PURE__ */ jsx("sub", { children: "gs" }),
							" = ",
							/* @__PURE__ */ jsxs("strong", { children: [Vg.toFixed(1), " V"] }),
							" (threshold ",
							vth,
							" V)"
						] }),
						/* @__PURE__ */ jsxs("span", { children: ["drain current = ", /* @__PURE__ */ jsx("strong", { children: Math.abs(Id) < .001 ? "≈ 0" : Id.toFixed(2) + " mA" })] }),
						/* @__PURE__ */ jsxs("span", { children: ["drain voltage = ", /* @__PURE__ */ jsxs("strong", { children: [Vdrain.toFixed(2), " V"] })] }),
						/* @__PURE__ */ jsx("span", {
							style: { color: "var(--stage-muted)" },
							children: "a small gate voltage steers a much larger drain current, switch or amplifier"
						})
					]
				})
			})]
		}),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: PREDICT_Q,
			state: ch,
			title: "Predict first"
		}), ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : null] }),
		children: figure
	});
}

//#endregion
export { TransistorLab };