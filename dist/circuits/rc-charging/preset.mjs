'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { CapacitorGlyph, CellGlyph, FlowDots, ResistorGlyph, Wire } from "../../kit/electronics.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane } from "../../kit/coords.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Polyline, Segment, useFrameLoop } from "@classytic/stage";
import { solveTransient } from "@classytic/stage/circuit";

//#region src/circuits/rc-charging/preset.tsx
/**
* RCChargingLab — a capacitor filling like a bucket, drawn with the SHARED
* electronics glyphs (CellGlyph / ResistorGlyph / CapacitorGlyph) and computed by
* the REAL circuit engine (solveTransient, Backward-Euler), not a faked exponential.
* The CapacitorGlyph fills to the live charge; current flows around the loop while
* it fills and stops once full. The V(t) curve below is the actual transient
* solution, with the time constant τ = R·C and the 63%-at-one-τ mark.
*/
const C_CURVE = "var(--stage-accent)";
const W = 520, H = 168, xL = 50, xR = 470, yT = 52, yB = 138, HALF = 28;
const CELL_X = 120, R_X = 255, CAP_X = 390;
const LOOP = [
	[xL, yT],
	[xR, yT],
	[xR, yB],
	[xL, yB],
	[xL, yT]
];
function RCChargingLab({ volts = 5, resistanceK = 10, capacitanceU = 10, show = "both", title = "RC charging: filling the capacitor", prompt = "The resistor is a narrow pipe, the capacitor a bucket. Bigger C or bigger R means slower filling. That product is the time constant τ = R·C.", ask, activity = "rc-charging" } = {}) {
	const [Vs, setVs] = useState(volts);
	const [Rk, setRk] = useState(resistanceK);
	const [Cu, setCu] = useState(capacitanceU);
	const [mode, setMode] = useState("charge");
	const [tFrac, setTFrac] = useState(1);
	const [phase, setPhase] = useState(0);
	const reduce = useReducedMotion();
	const R = Rk * 1e3, C = Cu * 1e-6;
	const tau = R * C;
	const dt = tau / 120, steps = 600;
	const charging = mode === "charge";
	const elems = charging ? [
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
		{
			kind: "C",
			n1: 2,
			n2: 0,
			value: C
		}
	] : [{
		kind: "R",
		n1: 1,
		n2: 0,
		value: R
	}, {
		kind: "C",
		n1: 1,
		n2: 0,
		value: C
	}];
	const capNode = charging ? 2 : 1;
	const trace = solveTransient(elems, {
		dt,
		steps,
		initialV: charging ? void 0 : new Map([[1, Vs]])
	});
	const pts = trace.map((s) => ({
		x: s.t / tau,
		y: (s.nodeV[capNode] ?? 0) / Vs
	}));
	const view = {
		xMin: 0,
		xMax: 5,
		yMin: 0,
		yMax: 1.12
	};
	const Vnow = (() => {
		const target = tFrac * tau;
		return trace.reduce((b, s) => Math.abs(s.t - target) < Math.abs(b.t - target) ? s : b).nodeV[capNode] ?? 0;
	})();
	const frac = Math.max(0, Math.min(1, Vnow / Vs));
	const iMag = charging ? 1 - frac : frac;
	const flowing = iMag > .03;
	useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1e3 * (.1 + .4 * iMag)) % 1), { running: flowing && !reduce });
	useCheckpoint({
		solved: charging ? frac >= .99 : frac <= .01,
		activity: `rc-charging:${mode}`
	});
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
			"aria-label": `RC ${mode}, capacitor at ${Math.round(frac * 100)} percent`,
			children: [
				/* @__PURE__ */ jsx(Wire, {
					points: LOOP,
					live: flowing
				}),
				flowing && /* @__PURE__ */ jsx(FlowDots, {
					points: LOOP,
					phase: charging ? phase : -phase
				}),
				/* @__PURE__ */ jsx(CellGlyph, {
					cx: CELL_X,
					cy: yT,
					half: HALF,
					live: flowing && charging,
					label: `${Vs} V`
				}),
				/* @__PURE__ */ jsx(ResistorGlyph, {
					cx: R_X,
					cy: yT,
					half: HALF,
					live: flowing,
					label: `${Rk} kΩ`
				}),
				/* @__PURE__ */ jsx(CapacitorGlyph, {
					cx: CAP_X,
					cy: yT,
					half: HALF,
					charge: frac,
					live: flowing,
					label: `${Cu} µF`
				})
			]
		})
	});
	const graph = /* @__PURE__ */ jsxs(CoordPlane, {
		view,
		height: 168,
		preserveAspect: false,
		stepX: 1,
		stepY: .25,
		ariaLabel: `RC ${mode} curve, V over Vs versus t over tau`,
		children: [
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: charging ? .632 : .368
				},
				to: {
					x: 5,
					y: charging ? .632 : .368
				},
				color: "var(--stage-muted)",
				weight: 1,
				dashed: true
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 1,
					y: 0
				},
				to: {
					x: 1,
					y: 1
				},
				color: "var(--stage-muted)",
				weight: 1,
				dashed: true
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 1,
				y: charging ? .632 : .368,
				text: charging ? "63% at t=τ" : "37% at t=τ",
				color: "var(--stage-muted)",
				size: 10,
				dx: 6,
				dy: -4,
				anchor: "start"
			}),
			/* @__PURE__ */ jsx(Polyline, {
				points: pts,
				color: C_CURVE,
				weight: 3
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: tFrac,
				y: frac,
				r: 6,
				color: C_CURVE
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 4.9,
				y: .18,
				text: "V / Vs  vs  t / τ",
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
				label: "mode",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: charging,
						onClick: () => setMode("charge"),
						children: "charge"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: !charging,
						onClick: () => setMode("discharge"),
						children: "discharge"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "battery",
				value: `${Vs} V`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Vs,
					min: 1,
					max: 12,
					step: 1,
					onChange: setVs,
					ariaLabel: "battery voltage"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "R",
				value: `${Rk} kΩ`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Rk,
					min: 1,
					max: 100,
					step: 1,
					onChange: setRk,
					ariaLabel: "resistance"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "C",
				value: `${Cu} µF`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Cu,
					min: 1,
					max: 100,
					step: 1,
					onChange: setCu,
					ariaLabel: "capacitance"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "time",
				value: `${tFrac.toFixed(1)} τ`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: tFrac,
					min: 0,
					max: 5,
					step: .1,
					onChange: setTFrac,
					ariaLabel: "time in units of tau"
				})
			})
		] }),
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: ["τ = R·C = ", /* @__PURE__ */ jsxs("strong", { children: [(tau * 1e3).toFixed(1), " ms"] })] }),
					/* @__PURE__ */ jsxs("span", { children: [
						"at t = ",
						tFrac.toFixed(1),
						"τ: V",
						/* @__PURE__ */ jsx("sub", { children: "C" }),
						" = ",
						/* @__PURE__ */ jsxs("strong", { children: [Vnow.toFixed(2), " V"] }),
						" (",
						Math.round(frac * 100),
						"%)"
					] }),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-muted)" },
						children: charging ? "one τ reaches 63%, five τ is essentially full" : "one τ drops to 37%, five τ is essentially empty"
					})
				]
			})
		}),
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: figure
	});
}

//#endregion
export { RCChargingLab };