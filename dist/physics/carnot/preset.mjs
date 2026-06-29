'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { carnotCycle, gammaDiatomic, gammaMonatomic } from "@classytic/stage/thermo";

//#region src/physics/carnot/preset.tsx
/**
* CarnotCycleLab, the most efficient possible heat engine, shown two ways at once:
*   • P–V diagram: the four-leg loop (hot isothermal expansion → adiabatic expansion
*     → cold isothermal compression → adiabatic compression). The ENCLOSED area is
*     the net work the engine delivers per cycle.
*   • T–S diagram: the very same cycle is a RECTANGLE, heat in along the top (Th),
*     heat out along the bottom (Tc), entropy unchanged on the adiabatic sides. Its
*     area (ΔS·(Th−Tc)) equals the net work too, and it makes the entropy bookkeeping
*     obvious: ΔS = Qh/Th = Qc/Tc, so the gas returns to the same entropy (net ΔS = 0).
*
* The efficiency η = 1 − Tc/Th falls straight out, and no real engine can beat it
* (2nd law). A point animates around both diagrams together. Pure
* `@classytic/stage/thermo` kernel; play-gated.
*/
const W = 720, H = 380;
const V1 = .02;
const J = (x) => Math.round(x).toString();
function CarnotCycleLab({ hotK = 500, coldK = 300, gas = "monatomic", expansionRatio = 2, title = "Carnot cycle: the best a heat engine can do", prompt = "A gas absorbs heat at a hot temperature, does work, and dumps the rest at a cold one. Watch the loop on the P–V diagram and the same cycle as a rectangle on the T–S diagram.", objectives = [
	"See the Carnot cycle as a P–V loop whose area is the net work",
	"Read the same cycle as a T–S rectangle (heat in at Th, out at Tc)",
	"Derive the efficiency η = 1 − Tc/Th, the ceiling no engine can beat"
] } = {}) {
	const [Th, setTh] = useState(hotK);
	const [Tc, setTc] = useState(coldK);
	const [mono, setMono] = useState(gas === "monatomic");
	const [vr, setVr] = useState(expansionRatio);
	const uRef = useRef(0);
	const gate = usePlayGate();
	useFrameTick(gate.running, (f) => {
		uRef.current = (uRef.current + Math.min(.05, f.dtMs / 1e3) * .18) % 1;
	});
	const tcc = Math.min(Tc, Th - 20);
	const gamma = mono ? gammaMonatomic : gammaDiatomic;
	const c = carnotCycle(1, Th, tcc, V1, V1 * vr, gamma);
	const dS = c.legs[0].dS;
	const allV = c.legs.flatMap((l) => l.path.map((p) => p.V));
	const allP = c.legs.flatMap((l) => l.path.map((p) => p.P));
	const Vmax = Math.max(...allV) * 1.08, Vmin = Math.min(...allV) * .9;
	const Pmax = Math.max(...allP) * 1.08;
	const AX = 50, BX = 350, AY = 64, BY = 320;
	const pvx = (v) => AX + (v - Vmin) / (Vmax - Vmin) * (BX - AX);
	const pvy = (p) => BY - p / Pmax * (BY - AY);
	const loop = c.legs.flatMap((l) => l.path).map((p) => `${pvx(p.V).toFixed(1)},${pvy(p.P).toFixed(1)}`).join(" ");
	const CX = 430, DX = 700, CY = 64, DY = 320;
	const Smax = dS * 1.18, Tmax = Th * 1.12;
	const tsx = (s) => CX + s / Smax * (DX - CX);
	const tsy = (t) => DY - t / Tmax * (DY - CY);
	const u = uRef.current;
	const li = Math.min(3, Math.floor(u * 4));
	const lf = u * 4 % 1;
	const leg = c.legs[li];
	const pvPt = leg.path[Math.min(leg.path.length - 1, Math.round(lf * (leg.path.length - 1)))];
	const tsState = () => {
		if (li === 0) return {
			s: lf * dS,
			t: Th
		};
		if (li === 1) return {
			s: dS,
			t: Th + lf * (tcc - Th)
		};
		if (li === 2) return {
			s: dS - lf * dS,
			t: tcc
		};
		return {
			s: 0,
			t: tcc + lf * (Th - tcc)
		};
	};
	const ts = tsState();
	const legColor = (i) => i === 0 ? "var(--stage-danger, #e03131)" : i === 2 ? "var(--stage-accent, #3b82f6)" : "var(--stage-muted)";
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", {
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
				"aria-label": `Carnot cycle, efficiency ${(c.efficiency * 100).toFixed(0)} percent`,
				children: [
					/* @__PURE__ */ jsx("text", {
						x: AX,
						y: AY - 14,
						fontSize: 12,
						fontWeight: 700,
						fill: "var(--stage-fg)",
						children: "P–V diagram"
					}),
					/* @__PURE__ */ jsx("line", {
						x1: AX,
						y1: CY,
						x2: AX,
						y2: BY,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: AX,
						y1: BY,
						x2: BX,
						y2: BY,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("text", {
						x: AX - 6,
						y: 70,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "P"
					}),
					/* @__PURE__ */ jsx("text", {
						x: BX,
						y: 338,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "V →"
					}),
					/* @__PURE__ */ jsx("polygon", {
						points: loop,
						fill: "var(--stage-warn)",
						opacity: .16
					}),
					c.legs.map((l, i) => /* @__PURE__ */ jsx("polyline", {
						points: l.path.map((p) => `${pvx(p.V).toFixed(1)},${pvy(p.P).toFixed(1)}`).join(" "),
						fill: "none",
						stroke: legColor(i),
						strokeWidth: i % 2 === 0 ? 3 : 2,
						strokeDasharray: i % 2 === 1 ? "4 3" : void 0,
						strokeLinejoin: "round"
					}, i)),
					/* @__PURE__ */ jsx("text", {
						x: 400 / 2,
						y: 384 / 2,
						textAnchor: "middle",
						fontSize: 11,
						fontWeight: 700,
						fill: "color-mix(in oklab, var(--stage-warn) 80%, var(--stage-fg))",
						children: "W = enclosed area"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: pvx(pvPt.V),
						cy: pvy(pvPt.P),
						r: 6,
						fill: "var(--stage-good)",
						stroke: "var(--stage-bg)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsx("text", {
						x: CX,
						y: AY - 14,
						fontSize: 12,
						fontWeight: 700,
						fill: "var(--stage-fg)",
						children: "T–S diagram"
					}),
					/* @__PURE__ */ jsx("line", {
						x1: CX,
						y1: CY,
						x2: CX,
						y2: DY,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: CX,
						y1: DY,
						x2: DX,
						y2: DY,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("text", {
						x: CX - 6,
						y: 70,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "T"
					}),
					/* @__PURE__ */ jsx("text", {
						x: DX,
						y: 338,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "S →"
					}),
					/* @__PURE__ */ jsx("rect", {
						x: tsx(0),
						y: tsy(Th),
						width: tsx(dS) - tsx(0),
						height: tsy(tcc) - tsy(Th),
						fill: "var(--stage-warn)",
						opacity: .16
					}),
					/* @__PURE__ */ jsx("line", {
						x1: tsx(0),
						y1: tsy(Th),
						x2: tsx(dS),
						y2: tsy(Th),
						stroke: "var(--stage-danger, #e03131)",
						strokeWidth: 3
					}),
					/* @__PURE__ */ jsx("line", {
						x1: tsx(0),
						y1: tsy(tcc),
						x2: tsx(dS),
						y2: tsy(tcc),
						stroke: "var(--stage-accent, #3b82f6)",
						strokeWidth: 3
					}),
					/* @__PURE__ */ jsx("line", {
						x1: tsx(dS),
						y1: tsy(Th),
						x2: tsx(dS),
						y2: tsy(tcc),
						stroke: "var(--stage-muted)",
						strokeWidth: 2,
						strokeDasharray: "4 3"
					}),
					/* @__PURE__ */ jsx("line", {
						x1: tsx(0),
						y1: tsy(Th),
						x2: tsx(0),
						y2: tsy(tcc),
						stroke: "var(--stage-muted)",
						strokeWidth: 2,
						strokeDasharray: "4 3"
					}),
					/* @__PURE__ */ jsx("text", {
						x: (tsx(0) + tsx(dS)) / 2,
						y: tsy(Th) - 5,
						textAnchor: "middle",
						fontSize: 10,
						fill: "var(--stage-danger, #e03131)",
						children: "Qh in at Th"
					}),
					/* @__PURE__ */ jsx("text", {
						x: (tsx(0) + tsx(dS)) / 2,
						y: tsy(tcc) + 14,
						textAnchor: "middle",
						fontSize: 10,
						fill: "var(--stage-accent, #3b82f6)",
						children: "Qc out at Tc"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: tsx(ts.s),
						cy: tsy(ts.t),
						r: 6,
						fill: "var(--stage-good)",
						stroke: "var(--stage-bg)",
						strokeWidth: 2
					})
				]
			})
		})
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
					gap: 2,
					fontVariantNumeric: "tabular-nums"
				},
				children: [/* @__PURE__ */ jsxs("span", {
					style: {
						fontWeight: 800,
						fontSize: 18
					},
					children: [
						"η = ",
						(c.efficiency * 100).toFixed(1),
						"%"
					]
				}), /* @__PURE__ */ jsxs("span", {
					style: { fontSize: 13 },
					children: [
						"Qh ",
						J(c.Qh),
						" J → W ",
						J(c.Wnet),
						" J + Qc ",
						J(c.Qc),
						" J"
					]
				})]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [
				/* @__PURE__ */ jsx(Tex, {
					tex: "\\eta = 1 - \\dfrac{T_c}{T_h} = \\dfrac{W}{Q_h}",
					block: true
				}),
				/* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: [
						"Heat enters at ",
						/* @__PURE__ */ jsxs("strong", {
							style: { color: "var(--stage-danger, #e03131)" },
							children: [
								"Th = ",
								Th,
								" K"
							]
						}),
						" and leaves at ",
						/* @__PURE__ */ jsxs("strong", {
							style: { color: "var(--stage-accent, #3b82f6)" },
							children: [
								"Tc = ",
								tcc,
								" K"
							]
						}),
						". The wider the temperature gap, the more efficient, but you can never reach 100% without Tc = 0."
					]
				}),
				/* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: [
						"On the T–S rectangle, ",
						/* @__PURE__ */ jsx(Tex, { tex: "\\Delta S = Q_h/T_h = Q_c/T_c" }),
						" = ",
						dS.toFixed(2),
						" J/K, so the gas comes back to the same entropy, ",
						/* @__PURE__ */ jsx("strong", {
							style: { color: "var(--stage-fg)" },
							children: "net ΔS = 0"
						}),
						" for a reversible cycle."
					]
				})
			]
		})] }),
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "hot Th",
				value: `${Th} K`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Th,
					min: 360,
					max: 800,
					step: 10,
					onChange: setTh,
					ariaLabel: "hot reservoir temperature"
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: "cold Tc",
				value: `${tcc} K`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Tc,
					min: 250,
					max: 600,
					step: 10,
					onChange: setTc,
					ariaLabel: "cold reservoir temperature"
				})
			})] }), /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "expansion V₂/V₁",
				value: `×${vr.toFixed(1)}`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: vr,
					min: 1.3,
					max: 3,
					step: .1,
					onChange: setVr,
					ariaLabel: "isothermal expansion ratio"
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: "gas",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mono,
						onClick: () => setMono(true),
						children: "monatomic"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: !mono,
						onClick: () => setMono(false),
						children: "diatomic"
					})]
				})
			})] })]
		}),
		children: figure
	});
}

//#endregion
export { CarnotCycleLab };