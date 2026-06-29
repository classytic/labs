'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { thermalColor } from "../../kit/thermal.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { R, gammaDiatomic, gammaMonatomic, runProcess } from "@classytic/stage/thermo";

//#region src/physics/gas-process/preset.tsx
/**
* GasProcessLab, the four ideal-gas processes on a P–V diagram, with the first law
* kept honest. Pick a process, push/pull the gas, and watch:
*   • a piston cylinder (gas particles spread as V grows, colour tracks T),
*   • the P–V curve with the WORK shaded as the area under it (∫P dV),
*   • the bookkeeping ΔU = Q − W with every term and sign.
*
* A faint isotherm through the start point shows why an adiabatic curve falls
* STEEPER than an isothermal one (it also cools). Pure `@classytic/stage/thermo`
* kernel; interactive (recomputes on the slider), no simulation loop.
*/
const W = 720, H = 380;
const KINDS = [
	{
		k: "isothermal",
		label: "isothermal",
		hint: "T constant"
	},
	{
		k: "adiabatic",
		label: "adiabatic",
		hint: "Q = 0"
	},
	{
		k: "isobaric",
		label: "isobaric",
		hint: "P constant"
	},
	{
		k: "isochoric",
		label: "isochoric",
		hint: "V constant"
	}
];
const kPa = (p) => (p / 1e3).toFixed(0);
const L = (v) => (v * 1e3).toFixed(1);
const J = (x) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(0);
function GasProcessLab({ kind: kind0 = "isothermal", title = "Gas processes: work is the area under P–V", prompt = "Expand or compress an ideal gas four different ways. The shaded area under the P–V curve is the work; the first law ΔU = Q − W balances the books.", objectives = [
	"Read work as the area under the P–V curve (∫P dV)",
	"Compare isothermal, adiabatic, isobaric and isochoric paths",
	"Apply the first law ΔU = Q − W and see when Q, W or ΔU is zero"
], gas: gas0 = "monatomic", moles = 1, tempK = 300, volumeL = 20 } = {}) {
	const [kind, setKind] = useState(kind0);
	const [mono, setMono] = useState(gas0 === "monatomic");
	const [ratio, setRatio] = useState(1.8);
	const gamma = mono ? gammaMonatomic : gammaDiatomic;
	const N = moles, T0 = tempK, V0 = volumeL / 1e3;
	const P0 = N * R * T0 / V0;
	const s0 = {
		P: P0,
		V: V0,
		T: T0,
		n: N
	};
	const { end, path, Q, W: work, dU, dS } = runProcess(s0, kind, kind === "isochoric" ? { T: T0 * ratio } : { V: V0 * ratio }, gamma);
	const allV = path.map((p) => p.V).concat(V0 * 2.6);
	const allP = path.map((p) => p.P).concat(P0 * 1.15);
	const Vmax = Math.max(...allV), Pmax = Math.max(...allP);
	const GX0 = 360, GX1 = 695, GY0 = 30, GY1 = 320;
	const PXV = (v) => GX0 + v / Vmax * (GX1 - GX0);
	const PYP = (p) => GY1 - p / Pmax * (GY1 - GY0);
	const curve = path.map((p) => `${PXV(p.V).toFixed(1)},${PYP(p.P).toFixed(1)}`).join(" ");
	const areaPts = `${PXV(path[0].V).toFixed(1)},${PYP(0).toFixed(1)} ${curve} ${PXV(end.V).toFixed(1)},${PYP(0).toFixed(1)}`;
	const isoRef = Array.from({ length: 40 }, (_, i) => {
		const v = (.4 + i / 39 * 2.1) * V0;
		return `${PXV(v).toFixed(1)},${PYP(N * R * T0 / v).toFixed(1)}`;
	}).join(" ");
	const cylX = 60, cylTop = 70, cylW = 150, cylBotMax = 320;
	const gasTop = cylBotMax - end.V / (V0 * 2.6) * (cylBotMax - cylTop);
	const tFrac = Math.max(0, Math.min(1, (end.T - 150) / 450));
	const particles = Array.from({ length: 26 }, (_, i) => {
		return /* @__PURE__ */ jsx("circle", {
			cx: 72 + i * .6180339 % 1 * (cylW - 24),
			cy: gasTop + 10 + i * .3542 % 1 * (cylBotMax - gasTop - 16),
			r: 3,
			fill: thermalColor(tFrac),
			opacity: .9
		}, i);
	});
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
			"aria-label": `${kind} process, work ${work.toFixed(0)} joules`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: cylX,
					y: gasTop,
					width: cylW,
					height: cylBotMax - gasTop,
					fill: thermalColor(tFrac),
					opacity: .18
				}),
				particles,
				/* @__PURE__ */ jsx("path", {
					d: `M ${cylX} ${cylTop - 6} L ${cylX} ${cylBotMax} L 210 ${cylBotMax} L 210 ${cylTop - 6}`,
					fill: "none",
					stroke: "var(--stage-metal)",
					strokeWidth: 3,
					strokeLinejoin: "round"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: cylX - 4,
					y: gasTop - 10,
					width: 158,
					height: 10,
					rx: 3,
					fill: "var(--stage-metal)"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: 130,
					y: gasTop - 34,
					width: 10,
					height: 24,
					fill: "var(--stage-metal)"
				}),
				[
					.3,
					.5,
					.7
				].map((f) => /* @__PURE__ */ jsx("line", {
					x1: cylX + cylW * f,
					y1: gasTop - 40,
					x2: cylX + cylW * f,
					y2: gasTop - 28,
					stroke: "var(--stage-warn)",
					strokeWidth: 2,
					markerEnd: ""
				}, f)),
				/* @__PURE__ */ jsxs("text", {
					x: 135,
					y: 338,
					textAnchor: "middle",
					fontSize: 11,
					fill: "var(--stage-muted)",
					children: [
						L(end.V),
						" L · ",
						kPa(end.P),
						" kPa · ",
						end.T.toFixed(0),
						" K"
					]
				}),
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
					y: 34,
					textAnchor: "end",
					fontSize: 11,
					fill: "var(--stage-muted)",
					children: "P"
				}),
				/* @__PURE__ */ jsx("text", {
					x: GX1,
					y: 340,
					textAnchor: "end",
					fontSize: 11,
					fill: "var(--stage-muted)",
					children: "V →"
				}),
				/* @__PURE__ */ jsx("polyline", {
					points: isoRef,
					fill: "none",
					stroke: "var(--stage-grid)",
					strokeWidth: 1,
					strokeDasharray: "3 3"
				}),
				/* @__PURE__ */ jsx("polygon", {
					points: areaPts,
					fill: "var(--stage-warn)",
					opacity: .18
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
					cx: PXV(s0.V),
					cy: PYP(s0.P),
					r: 5,
					fill: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx("text", {
					x: PXV(s0.V),
					y: PYP(s0.P) - 9,
					textAnchor: "middle",
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: "start"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: PXV(end.V),
					cy: PYP(end.P),
					r: 6,
					fill: "var(--stage-accent)",
					stroke: "var(--stage-bg)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("text", {
					x: (PXV(s0.V) + PXV(end.V)) / 2,
					y: PYP(0) - 8,
					textAnchor: "middle",
					fontSize: 11,
					fontWeight: 700,
					fill: "color-mix(in oklab, var(--stage-warn) 80%, var(--stage-fg))",
					children: "W = area"
				})
			]
		})
	});
	const zero = (label) => /* @__PURE__ */ jsx("span", {
		style: { color: "var(--stage-muted)" },
		children: label
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "grid",
					gap: 3,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx("strong", { children: "W" }),
						" (by gas) = ",
						kind === "isochoric" ? zero("0 J") : `${J(work)} J`
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx("strong", { children: "Q" }),
						" (in) = ",
						kind === "adiabatic" ? zero("0 J") : `${J(Q)} J`
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx("strong", { children: "ΔU" }),
						" = ",
						kind === "isothermal" ? zero("0 J") : `${J(dU)} J`
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx("strong", { children: "ΔS" }),
						" = ",
						kind === "adiabatic" ? zero("0 J/K") : `${J(dS)} J/K`
					] })
				]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\Delta U = Q - W",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					kind === "isothermal" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						"T fixed ⇒ ΔU = 0, so ",
						/* @__PURE__ */ jsx("strong", {
							style: { color: "var(--stage-fg)" },
							children: "all the heat becomes work"
						}),
						". PV = const."
					] }),
					kind === "adiabatic" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						"No heat in (Q = 0), so the work comes straight out of internal energy, the gas ",
						/* @__PURE__ */ jsx("strong", {
							style: { color: "var(--stage-fg)" },
							children: "cools as it expands"
						}),
						". PVᵞ = const (steeper than the isotherm)."
					] }),
					kind === "isobaric" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						"P fixed ⇒ work is simply ",
						/* @__PURE__ */ jsx("strong", {
							style: { color: "var(--stage-fg)" },
							children: "W = PΔV"
						}),
						" (a rectangle). Heat splits into work + internal energy."
					] }),
					kind === "isochoric" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						"V fixed ⇒ no work at all (",
						/* @__PURE__ */ jsx("strong", {
							style: { color: "var(--stage-fg)" },
							children: "W = 0"
						}),
						"); every joule of heat raises the internal energy (and temperature)."
					] })
				]
			})]
		})] }),
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "process",
				children: /* @__PURE__ */ jsx("span", {
					className: "lab-field-row",
					children: KINDS.map((k) => /* @__PURE__ */ jsx(Chip, {
						selected: kind === k.k,
						onClick: () => setKind(k.k),
						children: k.label
					}, k.k))
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: "gas",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mono,
						onClick: () => setMono(true),
						children: "monatomic (γ=5/3)"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: !mono,
						onClick: () => setMono(false),
						children: "diatomic (γ=7/5)"
					})]
				})
			})] }), /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: kind === "isochoric" ? "heat / cool (T ratio)" : "expand / compress (V ratio)",
				value: `×${ratio.toFixed(2)}`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: ratio,
					min: .5,
					max: 2.5,
					step: .05,
					onChange: setRatio,
					ariaLabel: "process amount"
				})
			}) })]
		}),
		children: figure
	});
}

//#endregion
export { GasProcessLab };