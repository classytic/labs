'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { thermalColor } from "../../kit/thermal.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/physics/water-density/preset.tsx
/**
* WaterDensityLab, water's strange, life-saving anomaly. Almost everything gets
* denser as it cools, but water is DENSEST at about 4 °C; cool it further toward 0
* and it expands again, and ice is less dense still, so ice floats.
*
*   • THE 4 °C ANOMALY, a density–temperature curve that peaks at 4 °C (zoomed in,
*     because the bump is tiny). Drag the temperature and watch the density rise to
*     a maximum at 4 °C, then fall.
*   • WHY LAKES FREEZE TOP-DOWN, a lake cross-section: the densest 4 °C water sinks
*     to the bottom, colder water sits above it, and ice forms on the surface. The
*     ice blanket insulates the liquid water below, so fish survive the winter.
*
* If water behaved "normally", lakes would freeze solid from the bottom up and kill
* everything in them. Interactive, no simulation loop. Pure SVG, themed.
*/
const W = 640, H = 360;
const SAMPLES = [
	[0, 999.84],
	[1, 999.9],
	[2, 999.94],
	[3, 999.96],
	[4, 999.97],
	[5, 999.96],
	[6, 999.94],
	[8, 999.85],
	[10, 999.7],
	[15, 999.1],
	[20, 998.2],
	[25, 997.05]
];
const ICE_RHO = 916.7;
const T_MAX = 25, RHO_LO = 997, RHO_HI = 1000.15;
function densityOf(t) {
	const tc = Math.max(0, Math.min(T_MAX, t));
	for (let i = 0; i < SAMPLES.length - 1; i++) {
		const [t0, r0] = SAMPLES[i], [t1, r1] = SAMPLES[i + 1];
		if (tc <= t1) return r0 + (r1 - r0) * ((tc - t0) / (t1 - t0));
	}
	return SAMPLES[SAMPLES.length - 1][1];
}
function WaterDensityLab({ mode: mode0 = "anomaly", title = "Water’s 4 °C anomaly: why ice floats", prompt = "Almost everything shrinks as it cools, but water is densest at 4 °C and expands again toward freezing, so ice floats and lakes freeze from the top down.", objectives = [
	"See water reach maximum density at about 4 °C (not at 0 °C)",
	"Explain why ice floats, it is LESS dense than liquid water",
	"Explain why a lake freezes top-down, leaving 4 °C water (and fish) below"
] } = {}) {
	const [mode, setMode] = useState(mode0);
	const [tC, setTC] = useState(12);
	const GX0 = 70, GX1 = 600, GY0 = 40, GY1 = 300;
	const PX = (t) => GX0 + t / T_MAX * (GX1 - GX0);
	const PY = (r) => GY1 - (r - RHO_LO) / (RHO_HI - RHO_LO) * (GY1 - GY0);
	const rho = densityOf(tC);
	let figure;
	if (mode === "anomaly") {
		const curve = SAMPLES.map(([t, r]) => `${PX(t).toFixed(1)},${PY(r).toFixed(1)}`).join(" ");
		figure = /* @__PURE__ */ jsx("div", {
			style: fwrap,
			children: /* @__PURE__ */ jsxs("svg", {
				viewBox: `0 0 ${W} ${H}`,
				width: "100%",
				role: "img",
				"aria-label": `Water density ${rho.toFixed(2)} kilograms per cubic metre at ${tC} degrees`,
				children: [
					/* @__PURE__ */ jsx("line", {
						x1: GX0,
						y1: GY0,
						x2: GX0,
						y2: GY1,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: GX0,
						y1: GY1,
						x2: GX1,
						y2: GY1,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("text", {
						x: GX0 - 6,
						y: 42,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "ρ (kg/m³)"
					}),
					/* @__PURE__ */ jsx("text", {
						x: 670 / 2,
						y: 332,
						textAnchor: "middle",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "temperature (°C) →"
					}),
					[
						0,
						4,
						10,
						15,
						20,
						25
					].map((t) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
						x1: PX(t),
						y1: GY1,
						x2: PX(t),
						y2: 304,
						stroke: "var(--stage-muted)",
						strokeWidth: 1
					}), /* @__PURE__ */ jsx("text", {
						x: PX(t),
						y: 316,
						textAnchor: "middle",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: t
					})] }, t)),
					/* @__PURE__ */ jsx("line", {
						x1: PX(4),
						y1: GY0,
						x2: PX(4),
						y2: GY1,
						stroke: "var(--stage-good)",
						strokeWidth: 1,
						strokeDasharray: "4 4"
					}),
					/* @__PURE__ */ jsx("text", {
						x: PX(4) + 5,
						y: 52,
						fontSize: 11,
						fontWeight: 700,
						fill: "var(--stage-good)",
						children: "densest at 4 °C"
					}),
					/* @__PURE__ */ jsx("polyline", {
						points: curve,
						fill: "none",
						stroke: "var(--stage-accent)",
						strokeWidth: 3,
						strokeLinejoin: "round",
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: PX(4),
						cy: PY(999.97),
						r: 5,
						fill: "var(--stage-good)"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: PX(tC),
						cy: PY(rho),
						r: 6,
						fill: thermalColor(tC / T_MAX),
						stroke: "var(--stage-bg)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsx("line", {
						x1: PX(tC),
						y1: PY(rho),
						x2: PX(tC),
						y2: GY1,
						stroke: "var(--stage-muted)",
						strokeWidth: 1,
						strokeDasharray: "3 3",
						opacity: .5
					}),
					/* @__PURE__ */ jsx("text", {
						x: PX(15),
						y: PY(998),
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "cooling 25→4 °C: denser → sinks"
					}),
					/* @__PURE__ */ jsx("text", {
						x: PX(.4),
						y: PY(999.6),
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "4→0 °C: lighter → rises"
					})
				]
			})
		});
	} else {
		const lx = 60, rx = 580, top = 60, bot = 300;
		const iceBot = 94;
		figure = /* @__PURE__ */ jsx("div", {
			style: fwrap,
			children: /* @__PURE__ */ jsxs("svg", {
				viewBox: `0 0 ${W} ${H}`,
				width: "100%",
				role: "img",
				"aria-label": "Lake cross-section freezing from the top down with 4 degree water at the bottom",
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: lx,
						y: top - 30,
						width: rx - lx,
						height: 30,
						fill: "color-mix(in oklab, var(--stage-accent) 8%, var(--stage-bg))"
					}),
					/* @__PURE__ */ jsx("text", {
						x: 68,
						y: top - 12,
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: "cold air ❄"
					}),
					[
						{
							y0: iceBot,
							y1: 150,
							t: 0,
							label: "0 °C: just above freezing"
						},
						{
							y0: 150,
							y1: 210,
							t: 2,
							label: "2 °C"
						},
						{
							y0: 210,
							y1: 270,
							t: 3,
							label: "3 °C"
						},
						{
							y0: 270,
							y1: bot,
							t: 4,
							label: "4 °C: densest water sinks here"
						}
					].map((b, i) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
						x: lx,
						y: b.y0,
						width: rx - lx,
						height: b.y1 - b.y0,
						fill: thermalColor(b.t / T_MAX),
						opacity: .4
					}), /* @__PURE__ */ jsx("text", {
						x: rx - 10,
						y: (b.y0 + b.y1) / 2 + 4,
						textAnchor: "end",
						fontSize: 11,
						fill: "var(--stage-fg)",
						children: b.label
					})] }, i)),
					/* @__PURE__ */ jsx("rect", {
						x: lx,
						y: top,
						width: rx - lx,
						height: iceBot - top,
						fill: "color-mix(in oklab, #cfeaff 75%, var(--stage-bg))",
						stroke: "color-mix(in oklab, #2b7fff 40%, transparent)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("text", {
						x: 70,
						y: 82,
						fontSize: 12,
						fontWeight: 800,
						fill: "#2b6fb8",
						children: "ICE floats (less dense)"
					}),
					[
						[140, 270],
						[250, 282],
						[430, 268]
					].map(([fx, fy], i) => /* @__PURE__ */ jsxs("g", {
						fill: "var(--stage-fg)",
						opacity: .75,
						children: [
							/* @__PURE__ */ jsx("ellipse", {
								cx: fx,
								cy: fy,
								rx: 12,
								ry: 6
							}),
							/* @__PURE__ */ jsx("polygon", { points: `${fx + 11},${fy} ${fx + 20},${fy - 5} ${fx + 20},${fy + 5}` }),
							/* @__PURE__ */ jsx("circle", {
								cx: fx - 6,
								cy: fy - 1,
								r: 1.4,
								fill: "var(--stage-bg)"
							})
						]
					}, i)),
					/* @__PURE__ */ jsx("path", {
						d: `M ${lx} ${top} L ${lx} ${bot} L ${rx} ${bot} L ${rx} ${top}`,
						fill: "none",
						stroke: "var(--stage-metal)",
						strokeWidth: 3
					}),
					/* @__PURE__ */ jsx("text", {
						x: 90,
						y: bot - 14,
						fontSize: 16,
						fill: "var(--stage-accent)",
						children: "↓ 4 °C sinks"
					})
				]
			})
		});
	}
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: mode === "anomaly" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					fontVariantNumeric: "tabular-nums",
					fontWeight: 800
				},
				children: [
					/* @__PURE__ */ jsxs("span", {
						style: { fontSize: 16 },
						children: [
							"ρ = ",
							rho.toFixed(2),
							" kg/m³"
						]
					}),
					/* @__PURE__ */ jsx("br", {}),
					"at ",
					tC,
					" °C",
					Math.abs(tC - 4) < .6 ? ", maximum!" : ""
				]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13,
				color: "var(--stage-muted)"
			},
			children: [/* @__PURE__ */ jsxs("span", { children: [
				"As liquid water cools it gets denser, but only down to ",
				/* @__PURE__ */ jsx("strong", {
					style: { color: "var(--stage-fg)" },
					children: "4 °C"
				}),
				". Cool it further and the molecules begin lining up into the open hexagonal structure of ice, so it ",
				/* @__PURE__ */ jsx("strong", {
					style: { color: "var(--stage-fg)" },
					children: "expands"
				}),
				"."
			] }), /* @__PURE__ */ jsxs("span", { children: [
				"Ice itself is only ",
				/* @__PURE__ */ jsxs("strong", {
					style: { color: "var(--stage-fg)" },
					children: [ICE_RHO, " kg/m³"]
				}),
				", much less than water, which is why it floats."
			] })]
		})] }) : /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "2px 2px 0",
				fontSize: 13,
				color: "var(--stage-muted)"
			},
			children: [/* @__PURE__ */ jsx(Callout, {
				tone: "info",
				children: /* @__PURE__ */ jsxs("span", { children: [
					"Because the densest water is at ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "4 °C"
					}),
					", it sinks to the bottom. Colder water (0–3 °C) is lighter and stays on top, where it finally freezes into floating ice."
				] })
			}), /* @__PURE__ */ jsxs("span", { children: [
				"The ice blanket ",
				/* @__PURE__ */ jsx("strong", {
					style: { color: "var(--stage-fg)" },
					children: "insulates"
				}),
				" the water beneath, so the lake never freezes solid, and the fish survive at 4 °C. If water were \"normal\", lakes would freeze bottom-up and kill everything."
			] })]
		}),
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "view",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mode === "anomaly",
						onClick: () => setMode("anomaly"),
						children: "the 4 °C anomaly"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: mode === "lake",
						onClick: () => setMode("lake"),
						children: "why lakes freeze top-down"
					})]
				})
			}) }), mode === "anomaly" && /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "temperature",
				value: `${tC} °C`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: tC,
					min: 0,
					max: 25,
					step: 1,
					onChange: setTC,
					ariaLabel: "water temperature (Celsius)"
				})
			}) })]
		}),
		children: figure
	});
}
const fwrap = {
	borderRadius: 14,
	overflow: "hidden",
	background: "var(--stage-bg)",
	border: "1px solid var(--stage-grid)"
};

//#endregion
export { WaterDensityLab };