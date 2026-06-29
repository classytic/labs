'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { thermalColor } from "../../kit/thermal.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/physics/temperature-scales/preset.tsx
/**
* TemperatureScalesLab, one temperature, three rulers. A single mercury column is
* read off the Celsius, Fahrenheit and Kelvin scales side by side, so you SEE that
* they're the same physical thing measured with differently-placed zeros and
* differently-sized degrees:
*
*   • Celsius   , 0 at water's freezing point, 100 at its boiling point
*   • Fahrenheit, F = (9/5)C + 32  (smaller degrees, offset zero)
*   • Kelvin    , K = C + 273.15, starting at ABSOLUTE ZERO, where molecular
*     motion stops, so Kelvin never goes negative (that's why science uses it)
*
* Drag the temperature or jump to a fixed point; all three readouts and the marked
* fixed-point lines update together. Interactive, no simulation. Pure SVG, themed.
*/
const W = 470, H = 430;
const C_MIN = -273.15, C_MAX = 120;
const Y_TOP = 60, Y_BOT = 352;
const TX = 96;
const toF = (c) => c * 9 / 5 + 32;
const toK = (c) => c + 273.15;
const yOf = (c) => Y_BOT - (c - C_MIN) / (C_MAX - C_MIN) * (Y_BOT - Y_TOP);
const COLS = [
	{
		x: 200,
		name: "°C",
		val: (c) => c,
		unit: "°"
	},
	{
		x: 308,
		name: "°F",
		val: toF,
		unit: "°"
	},
	{
		x: 410,
		name: "K",
		val: toK,
		unit: ""
	}
];
const LINE_X0 = 152, LINE_X1 = 440;
const FIXED = [
	{
		c: -273.15,
		label: "absolute zero",
		short: "abs 0"
	},
	{
		c: 0,
		label: "water freezes",
		short: "ice"
	},
	{
		c: 37,
		label: "body temp",
		short: "body"
	},
	{
		c: 100,
		label: "water boils",
		short: "boil"
	}
];
const PRESETS = [
	{
		c: -273.15,
		label: "absolute zero"
	},
	{
		c: 0,
		label: "ice"
	},
	{
		c: 25,
		label: "room"
	},
	{
		c: 37,
		label: "body"
	},
	{
		c: 100,
		label: "boiling"
	}
];
function TemperatureScalesLab({ title = "Temperature scales: one heat, three rulers", prompt = "Celsius, Fahrenheit and Kelvin measure the same temperature with different zeros and degree sizes. Drag it and watch all three, and see why Kelvin starts at absolute zero.", objectives = [
	"Convert between °C, °F and K: F = 9⁄5·C + 32, K = C + 273.15",
	"Place the fixed points (freezing 0/32/273, boiling 100/212/373)",
	"Explain why Kelvin is absolute, it starts where motion stops, so it’s never negative"
] } = {}) {
	const [c, setC] = useState(25);
	const f = toF(c), k = toK(c);
	const col = thermalColor(Math.max(0, Math.min(1, (c - C_MIN) / (C_MAX - C_MIN))));
	const stemW = 26, bulbR = 22, bulbCy = 376;
	const yC = yOf(c);
	const figure = /* @__PURE__ */ jsx("div", {
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
			"aria-label": `${c.toFixed(0)} Celsius, ${f.toFixed(0)} Fahrenheit, ${k.toFixed(0)} Kelvin`,
			children: [
				FIXED.map((fp) => {
					const y = yOf(fp.c);
					return /* @__PURE__ */ jsxs("g", { children: [
						/* @__PURE__ */ jsx("line", {
							x1: LINE_X0,
							y1: y,
							x2: LINE_X1,
							y2: y,
							stroke: "var(--stage-grid)",
							strokeWidth: 1,
							strokeDasharray: "4 4"
						}),
						/* @__PURE__ */ jsx("text", {
							x: LINE_X0 - 6,
							y: y + 3.5,
							textAnchor: "end",
							fontSize: 10,
							fill: "var(--stage-muted)",
							children: fp.short
						}),
						COLS.map((col) => /* @__PURE__ */ jsxs("text", {
							x: col.x,
							y: y + 4,
							textAnchor: "middle",
							fontSize: 11,
							fontWeight: 600,
							fill: "var(--stage-muted)",
							style: { fontVariantNumeric: "tabular-nums" },
							children: [Math.round(col.val(fp.c)), col.unit]
						}, col.name))
					] }, fp.c);
				}),
				COLS.map((col) => /* @__PURE__ */ jsx("text", {
					x: col.x,
					y: Y_TOP - 24,
					textAnchor: "middle",
					fontSize: 13,
					fontWeight: 800,
					fill: "var(--stage-fg)",
					children: col.name
				}, col.name)),
				/* @__PURE__ */ jsx("rect", {
					x: TX - stemW / 2,
					y: Y_TOP - 6,
					width: stemW,
					height: 322,
					rx: stemW / 2,
					fill: "var(--stage-bg)",
					stroke: "var(--stage-metal)",
					strokeWidth: 2.5
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: TX,
					cy: bulbCy,
					r: bulbR,
					fill: col,
					stroke: "var(--stage-metal)",
					strokeWidth: 2.5
				}),
				/* @__PURE__ */ jsx("rect", {
					x: 87,
					y: yC,
					width: stemW - 8,
					height: bulbCy - yC,
					fill: col
				}),
				/* @__PURE__ */ jsx("rect", {
					x: 88,
					y: Y_TOP,
					width: 3,
					height: bulbCy - Y_TOP - 2,
					rx: 1.5,
					fill: "color-mix(in oklab, var(--stage-sheen, #fff) 50%, transparent)"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: 109,
					y1: yC,
					x2: LINE_X1,
					y2: yC,
					stroke: col,
					strokeWidth: 2
				}),
				COLS.map((co) => {
					const v = Math.round(co.val(c));
					return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
						x: co.x - 25,
						y: yC - 12,
						width: 50,
						height: 24,
						rx: 7,
						fill: "var(--stage-bg)",
						stroke: col,
						strokeWidth: 2
					}), /* @__PURE__ */ jsxs("text", {
						x: co.x,
						y: yC + 4,
						textAnchor: "middle",
						fontSize: 12.5,
						fontWeight: 800,
						fill: "var(--stage-fg)",
						style: { fontVariantNumeric: "tabular-nums" },
						children: [v, co.unit]
					})] }, `live-${co.name}`);
				})
			]
		})
	});
	const near = FIXED.reduce((a, b) => Math.abs(b.c - c) < Math.abs(a.c - c) ? b : a);
	const atFixed = Math.abs(near.c - c) < 1;
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 12
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "grid",
							gap: 2,
							fontVariantNumeric: "tabular-nums"
						},
						children: [
							/* @__PURE__ */ jsxs("span", {
								style: {
									fontSize: 22,
									fontWeight: 800
								},
								children: [c.toFixed(1), " °C"]
							}),
							/* @__PURE__ */ jsxs("span", {
								style: {
									fontWeight: 700,
									color: "var(--stage-muted)"
								},
								children: [
									f.toFixed(1),
									" °F · ",
									k.toFixed(1),
									" K"
								]
							}),
							atFixed && /* @__PURE__ */ jsxs("span", {
								style: {
									color: "var(--stage-good)",
									fontWeight: 700,
									fontSize: 12
								},
								children: ["📍 ", near.label]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "grid",
							gap: 6,
							padding: "10px 12px",
							borderRadius: 10,
							background: "color-mix(in oklab, var(--stage-fg) 5%, transparent)",
							fontSize: 13
						},
						children: [/* @__PURE__ */ jsx(Tex, {
							tex: "F = \\tfrac{9}{5}\\,C + 32",
							block: true
						}), /* @__PURE__ */ jsx(Tex, {
							tex: "K = C + 273.15",
							block: true
						})]
					}),
					/* @__PURE__ */ jsxs("p", {
						style: {
							margin: 0,
							fontSize: 12.5,
							lineHeight: 1.5,
							color: "var(--stage-muted)"
						},
						children: [/* @__PURE__ */ jsx("strong", {
							style: { color: "var(--stage-fg)" },
							children: "Why Kelvin?"
						}), " It starts at absolute zero (−273.15 °C), where molecules stop moving, so K is never negative and doubling it really doubles the energy. C and F just put their zeros at handy everyday points."]
					})
				]
			})
		}),
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "temperature",
				value: `${c.toFixed(0)} °C`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: c,
					min: -273,
					max: 120,
					step: 1,
					onChange: setC,
					ariaLabel: "temperature in Celsius"
				})
			}) }), /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "jump to",
				children: /* @__PURE__ */ jsx("span", {
					className: "lab-field-row",
					children: PRESETS.map((p) => /* @__PURE__ */ jsx(Chip, {
						selected: Math.abs(p.c - c) < .6,
						onClick: () => setC(p.c),
						children: p.label
					}, p.label))
				})
			}) })]
		}),
		children: figure
	});
}

//#endregion
export { TemperatureScalesLab };