'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { CapacitorGlyph, CellGlyph, ResistorGlyph } from "../../kit/electronics.mjs";
import { useFrameTick, useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useInView } from "@classytic/stage";
import { RateCore } from "@classytic/stage/sim";

//#region src/circuits/capacitor-leak/preset.tsx
/**
* CapacitorLeakLab, why a capacitor charges, holds, and (slowly) LEAKS.
*
* A textbook RC loop: a cell charges a capacitor C through a resistor R. Flip
* the switch to "leak" and the cell is disconnected, the capacitor discharges
* through its own leakage resistance, the field between the plates thins, drips
* fall off the lower plate, and Vc decays exponentially. One source of truth , 
* Vc(t), integrated by the shared `useFrameLoop` clock, drives the plate field,
* the drips, the live readout, and the Vc–t trace, so they can never disagree.
*
* Time-dependent physics lives in the COMPONENT (the pure scene resolver runs
* once per resolve and can't integrate an ODE); the symbols are the tokenized
* @classytic/stage electronics glyphs, so the schematic stays exam-standard and
* rethemes with `--stage-*`. SVG only, honours prefers-reduced-motion.
*/
const W = 440, H = 250;
const xL = 60, xR = 380, yT = 80, yB = 172;
const CELL_X = 130, R_X = 230, CAP_X = 330, DEV_HALF = 30;
const GRAPH = {
	x: xL,
	y: 196,
	w: xR - xL,
	h: 44
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function CapacitorLeakLab({ emf = 6, rK = 10, capU = 100, leakK = 200, startCharged = false, title = "Charging & leaking a capacitor", prompt = "Charge it up, then flip to “leak”, watch the field thin and Vc decay.", objectives, hints = [] }) {
	const [V, setV] = useState(emf);
	const [R, setR] = useState(rK);
	const [C, setC] = useState(capU);
	const [leak, setLeak] = useState(leakK);
	const [mode, setMode] = useState("charge");
	const rate = useRef(RateCore.reset({
		value0: startCharged ? emf : 0,
		trace: 160
	}));
	const leakPhase = useRef(0);
	const reduce = useReducedMotion();
	const { ref: viewRef, inView } = useInView();
	const tauCharge = R * C / 1e3;
	const tauLeak = leak * C / 1e3;
	const target = mode === "charge" ? V : 0;
	const tau = Math.max(.001, mode === "charge" ? tauCharge : tauLeak);
	useFrameTick(!reduce && inView, (f) => {
		const dt = Math.min(.05, f.dtMs / 1e3);
		rate.current = RateCore.step({
			...rate.current,
			target,
			tau
		}, dt);
		if (mode === "leak" && rate.current.value > .01) leakPhase.current = (leakPhase.current + dt * .7) % 1;
	});
	const vc = rate.current.value;
	const q = V > 0 ? clamp01(vc / V) : 0;
	const charging = mode === "charge" && q < .995;
	const leaking = mode === "leak" && q > .01;
	const hint = useHints(hints);
	useCheckpoint({
		solved: mode === "leak" && q <= .05,
		activity: `capacitor-leak:${title}`,
		hintsUsed: hint.count
	});
	const sampleArr = rate.current.samples;
	const trace = sampleArr.length > 1 ? sampleArr.map((s, i) => {
		const x = GRAPH.x + i / (sampleArr.length - 1) * GRAPH.w;
		const y = GRAPH.y + GRAPH.h - (V > 0 ? s / V : 0) * (GRAPH.h - 8) - 4;
		return `${x.toFixed(1)},${y.toFixed(1)}`;
	}).join(" ") : "";
	const wire = (x1, y1, x2, y2, live) => /* @__PURE__ */ jsx("line", {
		x1,
		y1,
		x2,
		y2,
		stroke: live ? "var(--stage-live)" : "var(--stage-wire)",
		strokeWidth: 2.5,
		strokeLinecap: "round"
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
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
			"aria-label": `RC circuit, capacitor at ${Math.round(q * 100)} percent, ${mode === "charge" ? "charging" : "leaking"}`,
			children: [
				wire(xL, yT, CELL_X - DEV_HALF, yT, charging),
				wire(160, yT, R_X - DEV_HALF, yT, charging),
				wire(260, yT, CAP_X - DEV_HALF, yT, charging),
				wire(360, yT, xR, yT, charging),
				wire(xR, yT, xR, yB, charging),
				wire(xR, yB, xL, yB, charging),
				mode === "charge" ? wire(xL, yB, xL, yT, charging) : /* @__PURE__ */ jsxs("g", { children: [
					wire(xL, yB, xL, yT - 26, false),
					/* @__PURE__ */ jsx("line", {
						x1: xL,
						y1: yT - 26,
						x2: 76,
						y2: yT - 40,
						stroke: "var(--stage-warn)",
						strokeWidth: 3,
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: xL,
						cy: yT - 26,
						r: 3,
						fill: "var(--stage-metal)"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: xL,
						cy: yT,
						r: 3,
						fill: "var(--stage-metal)"
					})
				] }),
				/* @__PURE__ */ jsx(CellGlyph, {
					cx: CELL_X,
					cy: yT,
					half: DEV_HALF,
					live: charging,
					label: `${V} V`
				}),
				/* @__PURE__ */ jsx(ResistorGlyph, {
					cx: R_X,
					cy: yT,
					half: DEV_HALF,
					live: charging,
					label: `${R} kΩ`
				}),
				/* @__PURE__ */ jsx(CapacitorGlyph, {
					cx: CAP_X,
					cy: yT,
					half: DEV_HALF,
					charge: q,
					leaking,
					leakPhase: leakPhase.current,
					live: charging,
					label: `${C} µF`
				}),
				/* @__PURE__ */ jsx("rect", {
					x: GRAPH.x,
					y: GRAPH.y,
					width: GRAPH.w,
					height: GRAPH.h,
					rx: 4,
					fill: "none",
					stroke: "var(--stage-grid)",
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx("text", {
					x: GRAPH.x + 4,
					y: GRAPH.y + 12,
					fill: "var(--stage-muted)",
					fontSize: 10,
					children: "Vc vs t"
				}),
				trace && /* @__PURE__ */ jsx("polyline", {
					points: trace,
					fill: "none",
					stroke: "var(--stage-charge)",
					strokeWidth: 2,
					strokeLinejoin: "round"
				})
			]
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `Capacitor ${Math.round(q * 100)} percent, ${mode}. Vc ${vc.toFixed(1)} volts.` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "mode",
				value: /* @__PURE__ */ jsxs("span", {
					style: { fontVariantNumeric: "tabular-nums" },
					children: [
						"Vc ",
						vc.toFixed(2),
						" V · ",
						Math.round(q * 100),
						"% · τ ",
						tau.toFixed(2),
						" s"
					]
				}),
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "flex",
						gap: 10
					},
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mode === "charge",
						onClick: () => setMode("charge"),
						children: "⚡ Charge"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: mode === "leak",
						onClick: () => setMode("leak"),
						children: "💧 Leak"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "EMF",
				value: `${V} V`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: V,
					min: 1,
					max: 12,
					step: 1,
					onChange: setV,
					ariaLabel: "EMF (volts)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "R",
				value: `${R} kΩ`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: R,
					min: 1,
					max: 100,
					step: 1,
					onChange: setR,
					ariaLabel: "charging resistance (kilohm)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "C",
				value: `${C} µF`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: C,
					min: 10,
					max: 1e3,
					step: 10,
					onChange: setC,
					ariaLabel: "capacitance (microfarad)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "leak R",
				value: `${leak} kΩ`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: leak,
					min: 20,
					max: 1e3,
					step: 10,
					onChange: setLeak,
					ariaLabel: "leakage resistance (kilohm)"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints: hint }),
		children: figure
	});
}

//#endregion
export { CapacitorLeakLab };