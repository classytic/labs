'use client';

import { clamp, num } from "../core/util.mjs";
import { Tex as Tex$1 } from "../core/tex.mjs";
import { Chip, Slider } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { CellBox, ResistorBox } from "../kit/diagram.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Segment, Stage } from "@classytic/stage";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/circuit-lab.tsx
/**
* CircuitLab, two resistors driven by a battery, in series or parallel, with the
* voltage- and current-divider rules made visible. Drag V, R₁, R₂; flip series
* ↔ parallel; step through: total resistance → total current → how it divides.
*
* Series: same current, voltage splits (VDR  Vᵢ = V·Rᵢ/ΣR).
* Parallel: same voltage, current splits (CDR  Iᵢ = I·R_other/ΣR).
*
* Now on the @classytic/stage engine: the schematic is SVG wires + `ResistorBox`
* glyphs + labels (accessible, themed) instead of a canvas blit.
*/
const STEPS_SERIES = [
	"Two resistors in series carry the SAME current.",
	"Add them up: the total resistance is R₁ + R₂.",
	"Total current I = V / (R₁ + R₂) flows through both.",
	"The voltage splits in proportion (VDR): Vᵢ = V · Rᵢ / (R₁ + R₂)."
];
const STEPS_PARALLEL = [
	"Two resistors in parallel share the SAME voltage.",
	"Combine reciprocals: 1/R = 1/R₁ + 1/R₂.",
	"Total current I = V / R splits between the branches.",
	"The current splits inversely (CDR): Iᵢ = I · R_other / (R₁ + R₂)."
];
const VIEW = {
	xMin: 0,
	xMax: 100,
	yMin: 0,
	yMax: 60
};
const TOP = 46, BOT = 12, BX = 9, RIGHT = 93;
function CircuitLab({ voltage, r1, r2, mode: modeInit = "series", height = 320 } = {}) {
	const [V, setV] = useState(clamp(num(voltage, 12), 1, 24));
	const [R1, setR1] = useState(clamp(num(r1, 100), 10, 1e3));
	const [R2, setR2] = useState(clamp(num(r2, 200), 10, 1e3));
	const [parallel, setParallel] = useState(modeInit === "parallel");
	const [step, setStep] = useState(0);
	useEffect(() => {
		setV(clamp(num(voltage, 12), 1, 24));
	}, [voltage]);
	useEffect(() => {
		setR1(clamp(num(r1, 100), 10, 1e3));
	}, [r1]);
	useEffect(() => {
		setR2(clamp(num(r2, 200), 10, 1e3));
	}, [r2]);
	useEffect(() => {
		setParallel(modeInit === "parallel");
	}, [modeInit]);
	const sol = solveDC(parallel ? [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: V,
			id: "b"
		},
		{
			kind: "R",
			n1: 1,
			n2: 0,
			value: R1
		},
		{
			kind: "R",
			n1: 1,
			n2: 0,
			value: R2
		}
	] : [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: V,
			id: "b"
		},
		{
			kind: "R",
			n1: 1,
			n2: 2,
			value: R1
		},
		{
			kind: "R",
			n1: 2,
			n2: 0,
			value: R2
		}
	]);
	const Itot = Math.abs(sol.current["b"] ?? 0);
	const Rtot = Itot > 1e-12 ? V / Itot : Infinity;
	const v1 = parallel ? V : (sol.nodeV[1] ?? 0) - (sol.nodeV[2] ?? 0);
	const v2 = parallel ? V : sol.nodeV[2] ?? 0;
	const i1 = v1 / R1;
	const i2 = v2 / R2;
	const steps = parallel ? STEPS_PARALLEL : STEPS_SERIES;
	const clampedStep = Math.min(step, steps.length - 1);
	const W = (a, b, key) => /* @__PURE__ */ jsx(Segment, {
		from: a,
		to: b,
		color: "var(--stage-fg)",
		opacity: .5,
		weight: 2
	}, key);
	const cyMid = 58 / 2;
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: VIEW,
		height,
		preserveAspect: false,
		ariaLabel: `${parallel ? "Parallel" : "Series"} circuit: ${V}V battery with R1 ${R1.toFixed(0)} and R2 ${R2.toFixed(0)} ohms`,
		children: [
			W({
				x: BX,
				y: 35
			}, {
				x: BX,
				y: TOP
			}, "b-up"),
			W({
				x: BX,
				y: cyMid - 6
			}, {
				x: BX,
				y: BOT
			}, "b-dn"),
			/* @__PURE__ */ jsx(CellBox, {
				center: {
					x: BX,
					y: cyMid
				},
				half: 6,
				orient: "v",
				live: true,
				label: `${V.toFixed(0)} V`
			}),
			!parallel ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
				W({
					x: BX,
					y: TOP
				}, {
					x: 26,
					y: TOP
				}, "s1"),
				/* @__PURE__ */ jsx(ResistorBox, {
					center: {
						x: 34,
						y: TOP
					},
					w: 16,
					h: 7,
					color: "var(--stage-accent)",
					label: `R₁ ${R1.toFixed(0)}Ω`,
					reading: step >= 3 ? `${v1.toFixed(2)} V` : void 0
				}),
				W({
					x: 42,
					y: TOP
				}, {
					x: 58,
					y: TOP
				}, "s2"),
				/* @__PURE__ */ jsx(ResistorBox, {
					center: {
						x: 66,
						y: TOP
					},
					w: 16,
					h: 7,
					color: "var(--stage-good)",
					label: `R₂ ${R2.toFixed(0)}Ω`,
					reading: step >= 3 ? `${v2.toFixed(2)} V` : void 0
				}),
				W({
					x: 74,
					y: TOP
				}, {
					x: RIGHT,
					y: TOP
				}, "s3"),
				W({
					x: RIGHT,
					y: TOP
				}, {
					x: RIGHT,
					y: BOT
				}, "s4"),
				W({
					x: RIGHT,
					y: BOT
				}, {
					x: BX,
					y: BOT
				}, "s5")
			] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
				W({
					x: BX,
					y: TOP
				}, {
					x: 30,
					y: TOP
				}, "p1"),
				W({
					x: 30,
					y: TOP
				}, {
					x: 30,
					y: BOT
				}, "pl"),
				W({
					x: BX,
					y: BOT
				}, {
					x: 30,
					y: BOT
				}, "p2"),
				W({
					x: 72,
					y: TOP
				}, {
					x: RIGHT,
					y: TOP
				}, "p3"),
				W({
					x: RIGHT,
					y: TOP
				}, {
					x: RIGHT,
					y: BOT
				}, "pr-out"),
				W({
					x: 72,
					y: BOT
				}, {
					x: RIGHT,
					y: BOT
				}, "p4"),
				W({
					x: 72,
					y: TOP
				}, {
					x: 72,
					y: BOT
				}, "pr"),
				W({
					x: 30,
					y: TOP
				}, {
					x: 43,
					y: TOP
				}, "b1a"),
				/* @__PURE__ */ jsx(ResistorBox, {
					center: {
						x: 51,
						y: TOP
					},
					w: 16,
					h: 7,
					color: "var(--stage-accent)",
					label: `R₁ ${R1.toFixed(0)}Ω`,
					reading: step >= 3 ? `${(i1 * 1e3).toFixed(1)} mA` : void 0
				}),
				W({
					x: 59,
					y: TOP
				}, {
					x: 72,
					y: TOP
				}, "b1b"),
				W({
					x: 30,
					y: BOT
				}, {
					x: 43,
					y: BOT
				}, "b2a"),
				/* @__PURE__ */ jsx(ResistorBox, {
					center: {
						x: 51,
						y: BOT
					},
					w: 16,
					h: 7,
					color: "var(--stage-good)",
					label: `R₂ ${R2.toFixed(0)}Ω`,
					reading: step >= 3 ? `${(i2 * 1e3).toFixed(1)} mA` : void 0
				}),
				W({
					x: 59,
					y: BOT
				}, {
					x: 72,
					y: BOT
				}, "b2b")
			] })
		]
	});
	const controls = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-chip",
			onClick: () => setStep((s) => Math.max(0, s - 1)),
			disabled: clampedStep === 0,
			children: "← Back"
		}),
		/* @__PURE__ */ jsxs("span", {
			style: {
				fontVariantNumeric: "tabular-nums",
				opacity: .75
			},
			children: [
				"step ",
				clampedStep + 1,
				" / ",
				steps.length
			]
		}),
		/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-chip",
			onClick: () => setStep((s) => Math.min(steps.length - 1, s + 1)),
			disabled: clampedStep >= steps.length - 1,
			children: "Next →"
		}),
		/* @__PURE__ */ jsx(Chip, {
			selected: parallel,
			onClick: () => {
				setParallel((p) => !p);
				setStep(0);
			},
			children: parallel ? "parallel" : "series"
		})
	] }), /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsx(Field, {
			label: "V",
			children: /* @__PURE__ */ jsx(Slider, {
				value: V,
				min: 1,
				max: 24,
				step: 1,
				onChange: setV,
				ariaLabel: "battery voltage",
				style: { width: 90 }
			})
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "R₁",
			children: /* @__PURE__ */ jsx(Slider, {
				value: R1,
				min: 10,
				max: 1e3,
				step: 10,
				onChange: setR1,
				ariaLabel: "resistor 1",
				style: { width: 90 }
			})
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "R₂",
			children: /* @__PURE__ */ jsx(Slider, {
				value: R2,
				min: 10,
				max: 1e3,
				step: 10,
				onChange: setR2,
				ariaLabel: "resistor 2",
				style: { width: 90 }
			})
		})
	] })] });
	const aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: /* @__PURE__ */ jsxs("span", {
			style: {
				display: "grid",
				gap: 4,
				fontVariantNumeric: "tabular-nums"
			},
			children: [/* @__PURE__ */ jsxs("span", { children: [
				"R ",
				Rtot.toFixed(0),
				" Ω"
			] }), /* @__PURE__ */ jsxs("span", { children: [
				"I ",
				(Itot * 1e3).toFixed(1),
				" mA"
			] })]
		})
	}), /* @__PURE__ */ jsx("div", {
		style: {
			display: "grid",
			gap: 6,
			padding: "8px 2px 0",
			fontSize: 14
		},
		children: parallel ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Tex$1, { tex: `\\frac{1}{R}=\\frac{1}{R_1}+\\frac{1}{R_2}\\Rightarrow R=${Rtot.toFixed(1)}\\,\\Omega` }), /* @__PURE__ */ jsx(Tex$1, { tex: `I_1=I\\cdot\\frac{R_2}{R_1+R_2}=${(i1 * 1e3).toFixed(1)}\\,\\text{mA}` })] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Tex$1, { tex: `R=R_1+R_2=${Rtot.toFixed(0)}\\,\\Omega,\\quad I=\\frac{V}{R}=${(Itot * 1e3).toFixed(1)}\\,\\text{mA}` }), /* @__PURE__ */ jsx(Tex$1, { tex: `V_1=V\\cdot\\frac{R_1}{R_1+R_2}=${v1.toFixed(2)}\\,\\text{V}` })] })
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: parallel ? "Parallel, current divides" : "Series, voltage divides",
		prompt: steps[clampedStep],
		aside,
		controls,
		children: figure
	});
}

//#endregion
export { CircuitLab };