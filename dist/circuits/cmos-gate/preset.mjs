'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { FlowDots, MosfetGlyph, ResistorGlyph, Tag, Wire } from "../../kit/electronics.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane } from "../../kit/coords.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Polyline, useFrameLoop } from "@classytic/stage";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/cmos-gate/preset.tsx
/**
* CmosInverterLab — the moment a pair of transistors BECOMES a logic gate. A PMOS
* pull-up (to VDD) and an NMOS pull-down (to GND) share one input A and one output
* Y. Drag the input: when A is LOW the PMOS conducts and pulls Y HIGH; when A is
* HIGH the NMOS conducts and pulls Y LOW. The output is the inverse of the input —
* a NOT gate — and the output voltage is SOLVED by the circuit engine (so the
* transfer curve shows the real, sharp analog-to-digital transition near VDD/2).
* Exactly one network conducts at the rails, which is why CMOS draws ~no static
* power. This is the bridge from the silicon to the truth table.
*/
const C_HI = "var(--stage-good)";
const C_LO = "var(--stage-danger)";
const K = .5;
const PREDICT_Q = [{
	id: "invert-high",
	prompt: "This is a CMOS inverter (NOT gate). What is the output Y when the input A is HIGH (1)?",
	choices: [{
		value: "0",
		label: "Y = 0 (LOW)"
	}, {
		value: "1",
		label: "Y = 1 (HIGH)"
	}],
	answer: "0",
	explain: "A HIGH input turns the NMOS pull-down ON and the PMOS pull-up OFF, so Y is pulled to GND: Y = 0. The output is the inverse of the input."
}];
const W = 460, H = 250;
const STK = 300;
const PCX = STK - 9, NCX = STK - 9;
const PCY = 82, NCY = 166, MHALF = 36;
const VDD_Y = 30, GND_Y = 220, Y_Y = (284 - MHALF) / 2;
const GATE_X = PCX - 13 - 24;
function CmosInverterLab({ vdd = 5, vth = 2, show = "both", title = "CMOS inverter: two transistors become a NOT gate", prompt = "Drag the input A. Low input: the top (PMOS) opens and pulls the output HIGH; high input: the bottom (NMOS) opens and pulls it LOW. The output is the inverse, a NOT gate.", ask, activity = "cmos-inverter" } = {}) {
	const [A, setA] = useState(0);
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const ch = useChallenge(PREDICT_Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "cmos-gate:predict"
	});
	const mk = (a) => [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: vdd
		},
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: a
		},
		{
			kind: "M",
			pmos: true,
			n1: 2,
			n2: 1,
			n3: 3,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			n1: 2,
			n2: 0,
			n3: 3,
			value: 0,
			vth,
			k: K
		}
	];
	const Y = solveDC(mk(A)).nodeV[2] ?? 0;
	const pmosOn = vdd - A > vth;
	const nmosOn = A > vth;
	const aHi = A > vdd / 2, yHi = Y > vdd / 2;
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1e3 * .4) % 1), { running: (pmosOn || nmosOn) && !reduce });
	const pTop = [STK, PCY - MHALF], pBot = [STK, 118];
	const nTop = [STK, NCY - MHALF], nBot = [STK, 202];
	const vddRail = [[200, VDD_Y], [360, VDD_Y]];
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
			"aria-label": `CMOS inverter, input ${aHi ? "high" : "low"}, output ${yHi ? "high" : "low"}`,
			children: [
				/* @__PURE__ */ jsx(Wire, {
					points: vddRail,
					live: pmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[200, GND_Y], [360, GND_Y]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[STK, VDD_Y], pTop],
					live: pmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [nBot, [STK, GND_Y]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [
						pBot,
						[STK, Y_Y],
						[430, Y_Y]
					],
					live: true
				}),
				/* @__PURE__ */ jsx(Wire, { points: [
					[GATE_X, PCY],
					[220, PCY],
					[220, NCY],
					[GATE_X, NCY]
				] }),
				/* @__PURE__ */ jsx(Wire, { points: [[110, Y_Y], [220, Y_Y]] }),
				pmosOn && /* @__PURE__ */ jsx(FlowDots, {
					points: [
						...vddRail.slice(1),
						pTop,
						pBot,
						[STK, Y_Y]
					],
					phase
				}),
				nmosOn && /* @__PURE__ */ jsx(FlowDots, {
					points: [
						[STK, Y_Y],
						nTop,
						nBot,
						[STK, GND_Y]
					],
					phase
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: PCX,
					cy: PCY,
					half: MHALF,
					pmos: true,
					on: pmosOn,
					live: pmosOn,
					label: "PMOS"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: NCX,
					cy: NCY,
					half: MHALF,
					on: nmosOn,
					live: nmosOn,
					label: "NMOS"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 365,
					y: 34,
					text: `VDD ${vdd}V`,
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 365,
					y: 224,
					text: "GND",
					color: "var(--stage-muted)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 104,
					y: Y_Y - 8,
					text: "A",
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 104,
					y: 134,
					text: aHi ? "1" : "0",
					color: aHi ? C_HI : C_LO,
					size: 12,
					weight: 700,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: 434,
					cy: Y_Y,
					r: 4,
					fill: yHi ? C_HI : C_LO
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 442,
					y: Y_Y - 8,
					text: "Y",
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 442,
					y: 134,
					text: yHi ? "1" : "0",
					color: yHi ? C_HI : C_LO,
					size: 12,
					weight: 700,
					anchor: "start"
				})
			]
		})
	});
	const pts = [];
	for (let a = 0; a <= vdd + 1e-6; a += vdd / 60) pts.push({
		x: a,
		y: solveDC(mk(a)).nodeV[2] ?? 0
	});
	const graph = /* @__PURE__ */ jsxs(CoordPlane, {
		view: {
			xMin: 0,
			xMax: vdd,
			yMin: 0,
			yMax: vdd
		},
		height: 150,
		preserveAspect: false,
		step: 1,
		ariaLabel: "CMOS transfer curve",
		children: [
			/* @__PURE__ */ jsx(Polyline, {
				points: pts,
				color: "var(--stage-accent)",
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: A,
				y: Math.max(0, Math.min(vdd, Y)),
				r: 5,
				color: yHi ? C_HI : C_LO
			}),
			/* @__PURE__ */ jsx(Label, {
				x: vdd,
				y: vdd * .96,
				text: "output Y (V) vs input A (V)",
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
			label: "input A",
			value: `${A.toFixed(1)} V`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: A,
				min: 0,
				max: vdd,
				step: .1,
				onChange: setA,
				ariaLabel: "input voltage"
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "quick set",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: A === 0,
					onClick: () => setA(0),
					children: "A = 0"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: A === vdd,
					onClick: () => setA(vdd),
					children: "A = 1"
				})]
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
				"data-state": pmosOn !== nmosOn ? "ok" : "no",
				role: "status",
				style: { alignSelf: "flex-start" },
				children: pmosOn && !nmosOn ? "✓ PMOS conducts, output pulled HIGH" : nmosOn && !pmosOn ? "✓ NMOS conducts, output pulled LOW" : "both partly on (the transition)"
			}), /* @__PURE__ */ jsxs(Callout, {
				tone: "result",
				children: [/* @__PURE__ */ jsxs("table", {
					style: {
						fontSize: 13,
						fontVariantNumeric: "tabular-nums",
						borderCollapse: "collapse"
					},
					children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", {
						style: {
							textAlign: "left",
							paddingRight: 18
						},
						children: "A"
					}), /* @__PURE__ */ jsx("th", {
						style: { textAlign: "left" },
						children: "Y = A′"
					})] }) }), /* @__PURE__ */ jsxs("tbody", { children: [/* @__PURE__ */ jsxs("tr", {
						style: { fontWeight: aHi ? 400 : 700 },
						children: [/* @__PURE__ */ jsx("td", { children: "0" }), /* @__PURE__ */ jsx("td", { children: "1" })]
					}), /* @__PURE__ */ jsxs("tr", {
						style: { fontWeight: aHi ? 700 : 400 },
						children: [/* @__PURE__ */ jsx("td", { children: "1" }), /* @__PURE__ */ jsx("td", { children: "0" })]
					})] })]
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						marginTop: 6,
						color: "var(--stage-muted)",
						fontSize: 12
					},
					children: [
						"output = ",
						Y.toFixed(2),
						" V (",
						yHi ? "logic 1" : "logic 0",
						")"
					]
				})]
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
const RN_W = 460, RN_H = 250;
function RNmosNotLab({ vdd = 5, vth = 2, rpull = 2e3, title = "A NOT gate from ONE transistor", prompt = "Flip the input. HIGH turns the transistor on and pulls the output LOW; LOW leaves it off, so the resistor pulls the output HIGH. One transistor inverts — that is a NOT gate.", ask, activity = "rnmos-not" } = {}) {
	const [A, setA] = useState(0);
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const ch = useChallenge(RN_PREDICT_Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "rnmos-not:predict"
	});
	const mk = (a) => [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: vdd
		},
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: a
		},
		{
			kind: "R",
			n1: 1,
			n2: 2,
			value: rpull
		},
		{
			kind: "M",
			n1: 2,
			n2: 0,
			n3: 3,
			value: 0,
			vth,
			k: K
		}
	];
	const Va = A ? vdd : 0;
	const Y = solveDC(mk(Va)).nodeV[2] ?? 0;
	const nmosOn = Va > vth;
	const yHi = Y > vdd / 2;
	const Iload = (vdd - Y) / rpull;
	const Pres = Math.max(0, Iload * (vdd - Y));
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1e3 * .4) % 1), { running: nmosOn && !reduce });
	const SX = 250, VDD_Y = 30, GND_Y = 220, Y_Y = 125;
	const RCY = 72, NCY = 168, NHALF = 32;
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 12,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			maxWidth: RN_W,
			margin: "0 auto"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${RN_W} ${RN_H}`,
			width: "100%",
			role: "img",
			"aria-label": `resistor-NMOS NOT gate, input ${A ? "high" : "low"}, output ${yHi ? "high" : "low"}`,
			children: [
				/* @__PURE__ */ jsx(Wire, {
					points: [[170, VDD_Y], [330, VDD_Y]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[170, GND_Y], [330, GND_Y]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[SX, VDD_Y], [SX, RCY - 30]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[SX, 102], [SX, Y_Y]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[SX, Y_Y], [SX, NCY - NHALF]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[SX, 200], [SX, GND_Y]],
					live: nmosOn
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[SX, Y_Y], [392, Y_Y]],
					live: yHi
				}),
				/* @__PURE__ */ jsx(Wire, { points: [[96, NCY], [SX - 37, NCY]] }),
				nmosOn && /* @__PURE__ */ jsx(FlowDots, {
					points: [
						[SX, VDD_Y],
						[SX, RCY],
						[SX, Y_Y],
						[SX, NCY],
						[SX, GND_Y]
					],
					phase
				}),
				/* @__PURE__ */ jsx("g", {
					transform: `rotate(90 ${SX} ${RCY})`,
					children: /* @__PURE__ */ jsx(ResistorGlyph, {
						cx: SX,
						cy: RCY,
						half: 30,
						live: nmosOn
					})
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: SX,
					cy: NCY,
					half: NHALF,
					on: nmosOn,
					live: nmosOn,
					label: "NMOS"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 335,
					y: 34,
					text: `VDD ${vdd}V`,
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 335,
					y: 224,
					text: "GND",
					color: "var(--stage-muted)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 90,
					y: NCY - 8,
					text: "A (in)",
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 90,
					y: 179,
					text: A ? "1" : "0",
					color: A ? C_HI : C_LO,
					size: 13,
					weight: 800,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: 396,
					cy: Y_Y,
					r: 4.5,
					fill: yHi ? C_HI : C_LO
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 404,
					y: Y_Y - 8,
					text: "Y (out)",
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 404,
					y: 136,
					text: yHi ? "1" : "0",
					color: yHi ? C_HI : C_LO,
					size: 13,
					weight: 800,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 272,
					y: 76,
					text: `${(rpull / 1e3).toFixed(rpull % 1e3 ? 1 : 0)}kΩ`,
					color: "var(--stage-muted)",
					size: 11,
					weight: 700,
					anchor: "start"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "input A",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: A === 0,
					onClick: () => setA(0),
					children: "A = 0"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: A === 1,
					onClick: () => setA(1),
					children: "A = 1"
				})]
			})
		}) }),
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "lab-pill",
					"data-state": yHi !== !!A ? "ok" : "no",
					role: "status",
					style: { alignSelf: "flex-start" },
					children: A ? "transistor ON → output pulled LOW" : "transistor OFF → resistor pulls output HIGH"
				}),
				/* @__PURE__ */ jsxs(Callout, {
					tone: "result",
					children: [/* @__PURE__ */ jsxs("table", {
						style: {
							fontSize: 13,
							fontVariantNumeric: "tabular-nums",
							borderCollapse: "collapse"
						},
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", {
							style: {
								textAlign: "left",
								paddingRight: 18
							},
							children: "A"
						}), /* @__PURE__ */ jsx("th", {
							style: { textAlign: "left" },
							children: "Y = A′"
						})] }) }), /* @__PURE__ */ jsxs("tbody", { children: [/* @__PURE__ */ jsxs("tr", {
							style: { fontWeight: A ? 400 : 700 },
							children: [/* @__PURE__ */ jsx("td", { children: "0" }), /* @__PURE__ */ jsx("td", { children: "1" })]
						}), /* @__PURE__ */ jsxs("tr", {
							style: { fontWeight: A ? 700 : 400 },
							children: [/* @__PURE__ */ jsx("td", { children: "1" }), /* @__PURE__ */ jsx("td", { children: "0" })]
						})] })]
					}), /* @__PURE__ */ jsxs("div", {
						style: {
							marginTop: 6,
							color: "var(--stage-muted)",
							fontSize: 12
						},
						children: [
							"output = ",
							Y.toFixed(2),
							" V (",
							yHi ? "logic 1" : "logic 0",
							")"
						]
					})]
				}),
				/* @__PURE__ */ jsx(Callout, {
					tone: "info",
					children: /* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: 12.5,
							lineHeight: 1.5
						},
						children: [
							/* @__PURE__ */ jsx("strong", { children: "The catch:" }),
							" while the output is LOW, ",
							Pres > 1e-4 ? `${(Pres * 1e3).toFixed(1)} mW` : "~0 mW",
							" of steady current wastes power in the resistor. CMOS replaces the resistor with a second transistor so only one path ever conducts — that is why chips use CMOS."
						]
					})
				})
			]
		}),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: RN_PREDICT_Q,
			state: ch,
			title: "Predict first"
		}), ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : null] }),
		children: scene
	});
}
const RN_PREDICT_Q = [{
	id: "rnmos-high",
	prompt: "Input A is HIGH (1). The NMOS turns on and connects the output to ground. What is the output Y?",
	choices: [{
		value: "0",
		label: "Y = 0 (LOW)"
	}, {
		value: "1",
		label: "Y = 1 (HIGH)"
	}],
	answer: "0",
	explain: "A HIGH input turns the transistor ON, so it pulls Y down to ground: Y = 0. One transistor + a pull-up resistor inverts the input — a NOT gate."
}];
const NAND_W = 480, NAND_H = 300;
function CmosNandLab({ vdd = 5, vth = 2, title = "NAND from four transistors: the universal gate", prompt = "Toggle A and B. The top PMOS pair pulls the output HIGH unless BOTH inputs are HIGH; only then does the bottom NMOS pair connect it to ground. That is a NAND, and a NAND can build every other gate.", ask, activity = "cmos-nand" } = {}) {
	const [A, setA] = useState(0);
	const [B, setB] = useState(0);
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const ch = useChallenge(NAND_PREDICT_Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "cmos-nand:predict"
	});
	const mk = (a, b) => [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: vdd
		},
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: a
		},
		{
			kind: "V",
			n1: 4,
			n2: 0,
			value: b
		},
		{
			kind: "M",
			pmos: true,
			n1: 2,
			n2: 1,
			n3: 3,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			pmos: true,
			n1: 2,
			n2: 1,
			n3: 4,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			n1: 2,
			n2: 5,
			n3: 3,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			n1: 5,
			n2: 0,
			n3: 4,
			value: 0,
			vth,
			k: K
		}
	];
	const Va = A ? vdd : 0, Vb = B ? vdd : 0;
	const Y = solveDC(mk(Va, Vb)).nodeV[2] ?? 0;
	const pA = vdd - Va > vth, pB = vdd - Vb > vth;
	const nA = Va > vth, nB = Vb > vth;
	const pullDown = nA && nB;
	const yHi = Y > vdd / 2;
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1e3 * .4) % 1), { running: (pA || pB || pullDown) && !reduce });
	const VDD_Y = 30, GND_Y = 290, Y_Y = 145;
	const PAt = 180, PBt = 300, Nt = 240, OUTx = 440;
	const wire = (a, b) => [a, b];
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 12,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			maxWidth: NAND_W,
			margin: "0 auto"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${NAND_W} ${NAND_H}`,
			width: "100%",
			role: "img",
			"aria-label": `CMOS NAND, A ${A}, B ${B}, output ${yHi ? "high" : "low"}`,
			children: [
				/* @__PURE__ */ jsx(Wire, {
					points: [[120, VDD_Y], [360, VDD_Y]],
					live: pA || pB
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[120, GND_Y], [360, GND_Y]],
					live: pullDown
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([PAt, VDD_Y], [PAt, 55]),
					live: pA
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([PAt, 115], [PAt, Y_Y]),
					live: pA
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([PBt, VDD_Y], [PBt, 55]),
					live: pB
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([PBt, 115], [PBt, Y_Y]),
					live: pB
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[PAt, Y_Y], [OUTx, Y_Y]],
					live: yHi
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([Nt, Y_Y], [Nt, 160]),
					live: pullDown
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([Nt, 280], [Nt, GND_Y]),
					live: pullDown
				}),
				pA && /* @__PURE__ */ jsx(FlowDots, {
					points: [[PAt, VDD_Y], [PAt, Y_Y]],
					phase
				}),
				pB && /* @__PURE__ */ jsx(FlowDots, {
					points: [[PBt, VDD_Y], [PBt, Y_Y]],
					phase
				}),
				pullDown && /* @__PURE__ */ jsx(FlowDots, {
					points: [[Nt, Y_Y], [Nt, GND_Y]],
					phase
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: PAt - 9,
					cy: 85,
					half: 30,
					pmos: true,
					on: pA,
					live: pA,
					label: "A"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: PBt - 9,
					cy: 85,
					half: 30,
					pmos: true,
					on: pB,
					live: pB,
					label: "B"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: Nt - 9,
					cy: 190,
					half: 30,
					on: nA,
					live: pullDown,
					label: "A"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: Nt - 9,
					cy: 250,
					half: 30,
					on: nB,
					live: pullDown,
					label: "B"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 364,
					y: 34,
					text: `VDD ${vdd}V`,
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 364,
					y: 294,
					text: "GND",
					color: "var(--stage-muted)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 92,
					y: 66,
					text: "PMOS pull-up",
					color: "var(--stage-muted)",
					size: 11,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 92,
					y: 222,
					text: "NMOS pull-down",
					color: "var(--stage-muted)",
					size: 11,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: 444,
					cy: Y_Y,
					r: 4.5,
					fill: yHi ? C_HI : C_LO
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 452,
					y: Y_Y - 8,
					text: "Y",
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 452,
					y: 156,
					text: yHi ? "1" : "0",
					color: yHi ? C_HI : C_LO,
					size: 13,
					weight: 800,
					anchor: "start"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "input A",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: A === 0,
					onClick: () => setA(0),
					children: "0"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: A === 1,
					onClick: () => setA(1),
					children: "1"
				})]
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "input B",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: B === 0,
					onClick: () => setB(0),
					children: "0"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: B === 1,
					onClick: () => setB(1),
					children: "1"
				})]
			})
		})] }),
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "lab-pill",
					"data-state": (pA || pB) !== pullDown ? "ok" : "no",
					role: "status",
					style: { alignSelf: "flex-start" },
					children: pullDown ? "✓ both inputs HIGH → NMOS pair pulls Y LOW" : "✓ a PMOS conducts → Y pulled HIGH"
				}),
				/* @__PURE__ */ jsxs(Callout, {
					tone: "result",
					children: [/* @__PURE__ */ jsxs("table", {
						style: {
							fontSize: 13,
							fontVariantNumeric: "tabular-nums",
							borderCollapse: "collapse"
						},
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								style: {
									textAlign: "left",
									paddingRight: 14
								},
								children: "A"
							}),
							/* @__PURE__ */ jsx("th", {
								style: {
									textAlign: "left",
									paddingRight: 14
								},
								children: "B"
							}),
							/* @__PURE__ */ jsx("th", {
								style: { textAlign: "left" },
								children: "Y"
							})
						] }) }), /* @__PURE__ */ jsx("tbody", { children: [
							[
								0,
								0,
								1
							],
							[
								0,
								1,
								1
							],
							[
								1,
								0,
								1
							],
							[
								1,
								1,
								0
							]
						].map(([a, b, y]) => /* @__PURE__ */ jsxs("tr", {
							style: {
								fontWeight: a === A && b === B ? 800 : 400,
								background: a === A && b === B ? "color-mix(in oklab, var(--stage-accent) 12%, transparent)" : void 0
							},
							children: [
								/* @__PURE__ */ jsx("td", { children: a }),
								/* @__PURE__ */ jsx("td", { children: b }),
								/* @__PURE__ */ jsx("td", {
									style: { color: y ? "var(--stage-good)" : "var(--stage-fg)" },
									children: y
								})
							]
						}, `${a}${b}`)) })]
					}), /* @__PURE__ */ jsxs("div", {
						style: {
							marginTop: 6,
							color: "var(--stage-muted)",
							fontSize: 12
						},
						children: [
							"output = ",
							Y.toFixed(2),
							" V (",
							yHi ? "logic 1" : "logic 0",
							"), so Y = (A·B)′"
						]
					})]
				}),
				/* @__PURE__ */ jsx(Callout, {
					tone: "info",
					children: /* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: 12.5,
							lineHeight: 1.5
						},
						children: [/* @__PURE__ */ jsx("strong", { children: "NAND is universal." }), " Tie both inputs together → a NOT. A NAND then a NOT → AND. By De Morgan, NANDs make OR too. So these four transistors are the one building block every gate, and an entire CPU, is made from."]
					})
				})
			]
		}),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: NAND_PREDICT_Q,
			state: ch,
			title: "Predict first"
		}), ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : null] }),
		children: scene
	});
}
const NAND_PREDICT_Q = [{
	id: "nand-11",
	prompt: "Both inputs are HIGH (A = 1, B = 1). Both NMOS transistors turn on, completing the path to ground. What is the output Y?",
	choices: [{
		value: "0",
		label: "Y = 0 (LOW)"
	}, {
		value: "1",
		label: "Y = 1 (HIGH)"
	}],
	answer: "0",
	explain: "With both inputs HIGH the series NMOS pair conducts and pulls Y to ground (and both PMOS turn off). Y = 0 only when A AND B are 1, which is NAND = (A·B)′."
}];
const NOR_W = 480, NOR_H = 300;
function CmosNorLab({ vdd = 5, vth = 2, title = "NOR: the De Morgan twin of NAND", prompt = "Toggle A and B. The networks are flipped from the NAND: a SERIES PMOS pair pulls the output HIGH only when BOTH inputs are LOW, and a PARALLEL NMOS pair pulls it LOW the moment EITHER input goes HIGH. NOR is the other universal gate.", ask, activity = "cmos-nor" } = {}) {
	const [A, setA] = useState(0);
	const [B, setB] = useState(0);
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const ch = useChallenge(NOR_PREDICT_Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "cmos-nor:predict"
	});
	const mk = (a, b) => [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: vdd
		},
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: a
		},
		{
			kind: "V",
			n1: 4,
			n2: 0,
			value: b
		},
		{
			kind: "M",
			pmos: true,
			n1: 5,
			n2: 1,
			n3: 3,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			pmos: true,
			n1: 2,
			n2: 5,
			n3: 4,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			n1: 2,
			n2: 0,
			n3: 3,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			n1: 2,
			n2: 0,
			n3: 4,
			value: 0,
			vth,
			k: K
		}
	];
	const Va = A ? vdd : 0, Vb = B ? vdd : 0;
	const Y = solveDC(mk(Va, Vb)).nodeV[2] ?? 0;
	const pA = vdd - Va > vth, pB = vdd - Vb > vth;
	const nA = Va > vth, nB = Vb > vth;
	const pullUp = pA && pB;
	const yHi = Y > vdd / 2;
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1e3 * .4) % 1), { running: (pullUp || nA || nB) && !reduce });
	const VDD_Y = 30, GND_Y = 290, Y_Y = 200;
	const Px = 240;
	const NAt = 180, NBt = 300, OUTx = 440;
	const wire = (a, b) => [a, b];
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 12,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			maxWidth: NOR_W,
			margin: "0 auto"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${NOR_W} ${NOR_H}`,
			width: "100%",
			role: "img",
			"aria-label": `CMOS NOR, A ${A}, B ${B}, output ${yHi ? "high" : "low"}`,
			children: [
				/* @__PURE__ */ jsx(Wire, {
					points: [[120, VDD_Y], [360, VDD_Y]],
					live: pullUp
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[120, GND_Y], [360, GND_Y]],
					live: nA || nB
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([Px, VDD_Y], [Px, 55]),
					live: pullUp
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([Px, 115], [Px, 119]),
					live: pullUp
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([Px, 179], [Px, Y_Y]),
					live: pullUp
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[NAt, Y_Y], [OUTx, Y_Y]],
					live: yHi
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([NAt, Y_Y], [NAt, 210]),
					live: nA
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([NAt, 270], [NAt, GND_Y]),
					live: nA
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([NBt, Y_Y], [NBt, 210]),
					live: nB
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: wire([NBt, 270], [NBt, GND_Y]),
					live: nB
				}),
				pullUp && /* @__PURE__ */ jsx(FlowDots, {
					points: [[Px, VDD_Y], [Px, Y_Y]],
					phase
				}),
				nA && /* @__PURE__ */ jsx(FlowDots, {
					points: [[NAt, Y_Y], [NAt, GND_Y]],
					phase
				}),
				nB && /* @__PURE__ */ jsx(FlowDots, {
					points: [[NBt, Y_Y], [NBt, GND_Y]],
					phase
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: Px - 9,
					cy: 85,
					half: 30,
					pmos: true,
					on: pA,
					live: pullUp,
					label: "A"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: Px - 9,
					cy: 149,
					half: 30,
					pmos: true,
					on: pB,
					live: pullUp,
					label: "B"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: NAt - 9,
					cy: 240,
					half: 30,
					on: nA,
					live: nA,
					label: "A"
				}),
				/* @__PURE__ */ jsx(MosfetGlyph, {
					cx: NBt - 9,
					cy: 240,
					half: 30,
					on: nB,
					live: nB,
					label: "B"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 364,
					y: 34,
					text: `VDD ${vdd}V`,
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 364,
					y: 294,
					text: "GND",
					color: "var(--stage-muted)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 92,
					y: 118,
					text: "PMOS pull-up",
					color: "var(--stage-muted)",
					size: 11,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 92,
					y: 244,
					text: "NMOS pull-down",
					color: "var(--stage-muted)",
					size: 11,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: 444,
					cy: Y_Y,
					r: 4.5,
					fill: yHi ? C_HI : C_LO
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 452,
					y: Y_Y - 8,
					text: "Y",
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 452,
					y: 211,
					text: yHi ? "1" : "0",
					color: yHi ? C_HI : C_LO,
					size: 13,
					weight: 800,
					anchor: "start"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "input A",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: A === 0,
					onClick: () => setA(0),
					children: "0"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: A === 1,
					onClick: () => setA(1),
					children: "1"
				})]
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "input B",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: B === 0,
					onClick: () => setB(0),
					children: "0"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: B === 1,
					onClick: () => setB(1),
					children: "1"
				})]
			})
		})] }),
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "lab-pill",
					"data-state": pullUp !== (nA || nB) ? "ok" : "no",
					role: "status",
					style: { alignSelf: "flex-start" },
					children: pullUp ? "✓ both inputs LOW → series PMOS pulls Y HIGH" : "✓ an NMOS conducts → Y pulled LOW"
				}),
				/* @__PURE__ */ jsxs(Callout, {
					tone: "result",
					children: [/* @__PURE__ */ jsxs("table", {
						style: {
							fontSize: 13,
							fontVariantNumeric: "tabular-nums",
							borderCollapse: "collapse"
						},
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								style: {
									textAlign: "left",
									paddingRight: 14
								},
								children: "A"
							}),
							/* @__PURE__ */ jsx("th", {
								style: {
									textAlign: "left",
									paddingRight: 14
								},
								children: "B"
							}),
							/* @__PURE__ */ jsx("th", {
								style: { textAlign: "left" },
								children: "Y"
							})
						] }) }), /* @__PURE__ */ jsx("tbody", { children: [
							[
								0,
								0,
								1
							],
							[
								0,
								1,
								0
							],
							[
								1,
								0,
								0
							],
							[
								1,
								1,
								0
							]
						].map(([a, b, y]) => /* @__PURE__ */ jsxs("tr", {
							style: {
								fontWeight: a === A && b === B ? 800 : 400,
								background: a === A && b === B ? "color-mix(in oklab, var(--stage-accent) 12%, transparent)" : void 0
							},
							children: [
								/* @__PURE__ */ jsx("td", { children: a }),
								/* @__PURE__ */ jsx("td", { children: b }),
								/* @__PURE__ */ jsx("td", {
									style: { color: y ? "var(--stage-good)" : "var(--stage-fg)" },
									children: y
								})
							]
						}, `${a}${b}`)) })]
					}), /* @__PURE__ */ jsxs("div", {
						style: {
							marginTop: 6,
							color: "var(--stage-muted)",
							fontSize: 12
						},
						children: [
							"output = ",
							Y.toFixed(2),
							" V (",
							yHi ? "logic 1" : "logic 0",
							"), so Y = (A + B)′"
						]
					})]
				}),
				/* @__PURE__ */ jsx(Callout, {
					tone: "info",
					children: /* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: 12.5,
							lineHeight: 1.5
						},
						children: [/* @__PURE__ */ jsx("strong", { children: "NOR is universal too." }), " Compare with the NAND: swapping series for parallel in each network turns AND-logic into OR-logic (De Morgan in silicon). NAND and NOR are the two single bricks any digital circuit, from a gate to a CPU, can be built from."]
					})
				})
			]
		}),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: NOR_PREDICT_Q,
			state: ch,
			title: "Predict first"
		}), ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : null] }),
		children: scene
	});
}
const NOR_PREDICT_Q = [{
	id: "nor-00",
	prompt: "A NOR outputs HIGH for exactly one input combination. Which one?",
	choices: [
		{
			value: "a",
			label: "both LOW: A = 0, B = 0"
		},
		{
			value: "b",
			label: "both HIGH: A = 1, B = 1"
		},
		{
			value: "c",
			label: "whenever the inputs differ"
		}
	],
	answer: "a",
	explain: "Only when both inputs are LOW do both series PMOS conduct (and both parallel NMOS stay off), pulling Y HIGH. Any HIGH input opens an NMOS to ground, so Y = (A + B)′."
}];

//#endregion
export { CmosInverterLab, CmosNandLab, CmosNorLab, RNmosNotLab };