'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { BulbGlyph, CellGlyph, DiodeGlyph, FlowDots, Wire } from "../../kit/electronics.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane } from "../../kit/coords.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Plot, Segment, useFrameLoop } from "@classytic/stage";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/diode/preset.tsx
/**
* DiodeLab — a diode as a ONE-WAY VALVE you can watch, drawn with the SHARED
* electronics glyph library (CellGlyph / DiodeGlyph / BulbGlyph) on a real
* schematic, not hand-rolled shapes. A battery pushes current around the loop
* through the diode to a lamp: forward, the valve opens, current flows and the
* lamp glows; reverse, the symbol flips, the flow stops, the lamp goes dark. The
* small I-V curve below is the same story as a graph, with the live operating
* point from the engine's nonlinear (Shockley) solver.
*/
const VT = .025852, IS = 1e-12;
const C_OK = "var(--stage-good)";
const C_BAD = "var(--stage-danger, #e03131)";
const W = 520, H = 188, xL = 45, xR = 475, yT = 56, yB = 150, HALF = 28;
const CELL_X = 110, DIODE_X = 250, BULB_X = 400;
const LOOP = [
	[xL, yT],
	[xR, yT],
	[xR, yB],
	[xL, yB],
	[xL, yT]
];
function DiodeLab({ volts = 2, resistanceK = 1, show = "both", title = "The diode: a one-way valve", prompt = "The battery pushes current around the loop. Forward, the valve opens and the lamp lights; reverse it and the flow is blocked.", ask, activity = "diode" } = {}) {
	const [Vs, setVs] = useState(volts);
	const [Rk, setRk] = useState(resistanceK);
	const [reversed, setReversed] = useState(false);
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const R = Rk * 1e3;
	const sol = solveDC([
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: Vs
		},
		{
			kind: "R",
			n1: 1,
			n2: 2,
			value: R
		},
		reversed ? {
			kind: "D",
			n1: 0,
			n2: 2,
			value: 0,
			id: "d"
		} : {
			kind: "D",
			n1: 2,
			n2: 0,
			value: 0,
			id: "d"
		}
	]);
	const V2 = sol.nodeV[2] ?? 0;
	const Vd = reversed ? -V2 : V2;
	const Ima = (sol.current["d"] ?? 0) * 1e3;
	const conducting = Ima > .05;
	const brightness = Math.max(0, Math.min(1, Ima / (Vs / R * 1e3 || 1)));
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1e3 * (.1 + .4 * brightness)) % 1), { running: conducting && !reduce });
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
			"aria-label": `Diode circuit, ${conducting ? "conducting, lamp lit" : "blocked, lamp dark"}`,
			children: [
				/* @__PURE__ */ jsx(Wire, {
					points: LOOP,
					live: conducting
				}),
				conducting && /* @__PURE__ */ jsx(FlowDots, {
					points: LOOP,
					phase
				}),
				/* @__PURE__ */ jsx(CellGlyph, {
					cx: CELL_X,
					cy: yT,
					half: HALF,
					live: conducting,
					label: `${Vs} V`
				}),
				/* @__PURE__ */ jsx("g", {
					transform: reversed ? `translate(${2 * DIODE_X} 0) scale(-1 1)` : void 0,
					children: /* @__PURE__ */ jsx(DiodeGlyph, {
						cx: DIODE_X,
						cy: yT,
						half: HALF,
						live: conducting,
						conducting,
						label: reversed ? "reverse" : "forward"
					})
				}),
				/* @__PURE__ */ jsx(BulbGlyph, {
					cx: BULB_X,
					cy: yT,
					half: HALF,
					live: conducting,
					brightness,
					label: "lamp"
				})
			]
		})
	});
	const ivCurve = (vd) => IS * (Math.exp(Math.min(vd / VT, 80)) - 1) * 1e3;
	const graph = /* @__PURE__ */ jsxs(CoordPlane, {
		view: {
			xMin: -.7,
			xMax: .75,
			yMin: -1.5,
			yMax: 10
		},
		height: 160,
		preserveAspect: false,
		ariaLabel: "Diode I-V curve",
		children: [
			/* @__PURE__ */ jsx(Plot.OfX, {
				y: ivCurve,
				domain: [-.7, .72],
				color: "var(--stage-accent)",
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: Math.max(-.7, Math.min(.72, Vd)),
				y: Math.max(-1.5, Math.min(10, ivCurve(Vd))),
				r: 5,
				color: conducting ? C_OK : C_BAD
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: .6,
					y: 0
				},
				to: {
					x: .6,
					y: 10
				},
				color: "var(--stage-muted)",
				weight: 1,
				dashed: true
			}),
			/* @__PURE__ */ jsx(Label, {
				x: .72,
				y: 9.3,
				text: "I (mA) vs V across the diode",
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
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "orientation",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: !reversed,
						onClick: () => setReversed(false),
						children: "forward ▶|"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: reversed,
						onClick: () => setReversed(true),
						children: "reverse |◀"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "battery",
				value: `${Vs} V`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Vs,
					min: 0,
					max: 5,
					step: .1,
					onChange: setVs,
					ariaLabel: "battery voltage"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "R",
				value: `${Rk} kΩ`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Rk,
					min: .2,
					max: 10,
					step: .1,
					onChange: setRk,
					ariaLabel: "series resistance"
				})
			})
		] }),
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx("div", {
				className: "lab-pill",
				"data-state": conducting ? "ok" : "no",
				role: "status",
				style: { alignSelf: "flex-start" },
				children: conducting ? "✓ valve OPEN, current flows, lamp lit" : "✗ valve SHUT, blocked, lamp dark"
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
						/* @__PURE__ */ jsxs("span", { children: ["V across diode = ", /* @__PURE__ */ jsxs("strong", { children: [Vd.toFixed(2), " V"] })] }),
						/* @__PURE__ */ jsxs("span", { children: ["current = ", /* @__PURE__ */ jsx("strong", { children: Math.abs(Ima) < .001 ? "≈ 0" : Ima.toFixed(2) + " mA" })] }),
						/* @__PURE__ */ jsx("span", {
							style: { color: "var(--stage-muted)" },
							children: "forward drop sits near the 0.6 to 0.7 V knee no matter the current"
						})
					]
				})
			})]
		}),
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: figure
	});
}

//#endregion
export { DiodeLab };