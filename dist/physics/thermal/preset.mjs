'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { BeakerGlyph, BurnerGlyph, ThermometerGlyph } from "../../kit/thermal.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { ETHANOL, ThermalCore, WATER } from "@classytic/stage/sim";

//#region src/physics/thermal/preset.tsx
/**
* HeatingCurveLab, pour heat into ice and watch temperature climb in steps.
*
* The whole heat story in one picture, driven by the shared `thermal` core: a
* burner heats a beaker (ice → water → steam), a thermometer reads the temperature,
* and the heating curve draws itself on the right, SLOPED runs where one phase
* warms (q = mcΔθ) and FLAT plateaus where it changes phase (q = mL, temperature
* stuck while the latent heat goes in). The width of each part IS the heat it needs,
* so water's huge boiling plateau (latent vaporisation ≫ everything) is impossible
* to miss. Slide the power to heat faster, the mass for a bigger sample, or flip the
* substance; pull power negative to cool back down. Hand-driven on ThermalCore.
*/
const W = 760, H = 440;
const GX0 = 330, GX1 = 736, GY0 = 38, GY1 = 396;
const kJ = (j) => `${(j / 1e3).toFixed(j < 1e4 ? 1 : 0)} kJ`;
function HeatingCurveLab({ substance: sub0 = "water", title = "Heating curve: pour in heat, watch it climb in steps", prompt = "Heat ice until it melts, warms, and boils. Temperature RISES while one phase warms (q = mcΔθ) but stays FLAT during a phase change (q = mL).", objectives = [
	"Read a heating curve: sloped = warming, flat = changing phase",
	"Use q = mcΔθ for a temperature change and q = mL for a phase change",
	"See why water’s boiling plateau is so wide (latent heat ≫ specific heat)"
], substanceName, cSolid, cLiquid, cGas, lFusion, lVapor, tMelt, tBoil, mass: mass0 = 50, power: power0 = 120 } = {}) {
	const [substance, setSubstance] = useState(sub0);
	const [power, setPower] = useState(power0);
	const [mass, setMass] = useState(mass0);
	const [resetN, setResetN] = useState(0);
	const gate = usePlayGate();
	const base = substance === "water" ? WATER : ETHANOL;
	const sub = {
		...base,
		name: substanceName ?? base.name,
		cSolid: cSolid ?? base.cSolid,
		cLiquid: cLiquid ?? base.cLiquid,
		cGas: cGas ?? base.cGas,
		lFusion: lFusion ?? base.lFusion,
		lVapor: lVapor ?? base.lVapor,
		tMelt: tMelt ?? base.tMelt,
		tBoil: tBoil ?? base.tBoil
	};
	const tStart = sub.tMelt - 20;
	const tMax = sub.tBoil + 40;
	const sig = `${substance}:${mass}:${resetN}:${sub.tMelt}:${sub.tBoil}:${sub.lFusion}:${sub.lVapor}:${sub.cLiquid}`;
	const sigRef = useRef("");
	const stateRef = useRef(ThermalCore.reset({
		substance: sub,
		mass,
		tStart,
		tMax,
		powerW: power
	}));
	if (sigRef.current !== sig) {
		sigRef.current = sig;
		stateRef.current = ThermalCore.reset({
			substance: sub,
			mass,
			tStart,
			tMax,
			powerW: power
		});
	}
	useFrameTick(gate.running, (f) => {
		const dt = Math.min(.05, f.dtMs / 1e3);
		stateRef.current = ThermalCore.step({
			...stateRef.current,
			powerW: power
		}, dt * 12);
	});
	const st = stateRef.current;
	const { segs, totalJ, energyJ, tempC, phase, fracMelt } = st;
	const QX = (q) => GX0 + (totalJ > 0 ? q / totalJ : 0) * (GX1 - GX0);
	const TY = (t) => GY1 - (t - tStart) / (tMax - tStart) * (GY1 - GY0);
	const iceFrac = phase === "solid" ? 1 : phase === "melting" ? 1 - fracMelt : 0;
	const fracBoil = st.fracBoil;
	const boiling = phase === "boiling" ? 1 : phase === "liquid" ? Math.max(0, (tempC - sub.tBoil + 25) / 25) * .5 : 0;
	const steam = phase === "boiling" ? Math.max(.25, fracBoil) : phase === "gas" ? 1 : 0;
	const fillFrac = phase === "gas" ? .05 : .72 * (1 - .55 * fracBoil);
	const tFrac = (tempC - tStart) / (tMax - tStart);
	const cur = segs.find((s, i) => energyJ <= s.qStart + s.q || i === segs.length - 1) ?? segs[0];
	const cName = cur.phase === "solid" ? sub.solidName : cur.phase === "gas" ? sub.gasName : sub.liquidName;
	const cVal = cur.phase === "solid" ? sub.cSolid : cur.phase === "gas" ? sub.cGas : sub.cLiquid;
	const pct = totalJ > 0 ? Math.round(energyJ / totalJ * 100) : 0;
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
				"aria-label": `${sub.name} at ${Math.round(tempC)} degrees, ${phase}, ${pct} percent of the way through heating`,
				children: [
					/* @__PURE__ */ jsx(BurnerGlyph, {
						cx: 150,
						baseY: 300,
						w: 84,
						level: power > 0 ? Math.min(1, power / 200) : Math.max(-1, power / 200),
						phase: st.tSec
					}),
					/* @__PURE__ */ jsx(BeakerGlyph, {
						x: 92,
						y: 132,
						w: 116,
						h: 140,
						fillFrac,
						color: sub.color,
						boiling,
						steam,
						iceFrac,
						phase: st.tSec,
						label: `${mass} g ${sub.name.toLowerCase()}`
					}),
					/* @__PURE__ */ jsx(ThermometerGlyph, {
						cx: 252,
						top: 104,
						h: 196,
						frac: tFrac,
						label: `${tempC >= 0 ? "" : "−"}${Math.abs(tempC).toFixed(0)}°C`
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
						y: 42,
						textAnchor: "end",
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: "°C"
					}),
					/* @__PURE__ */ jsx("text", {
						x: GX1,
						y: 418,
						textAnchor: "end",
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: "heat added →"
					}),
					[{
						t: sub.tMelt,
						l: `${sub.tMelt}° melt`
					}, {
						t: sub.tBoil,
						l: `${sub.tBoil}° boil`
					}].map((g) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
						x1: GX0,
						y1: TY(g.t),
						x2: GX1,
						y2: TY(g.t),
						stroke: "var(--stage-grid)",
						strokeWidth: 1,
						strokeDasharray: "4 4"
					}), /* @__PURE__ */ jsx("text", {
						x: GX1 - 4,
						y: TY(g.t) - 3,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: g.l
					})] }, g.l)),
					segs.map((s, i) => {
						const x0 = QX(s.qStart), x1 = QX(s.qStart + s.q), y0 = TY(s.t0), y1 = TY(s.t1);
						const isChange = s.kind === "change";
						const col = isChange ? "var(--stage-warn, #e0a020)" : "var(--stage-accent, #3b82f6)";
						const big = s.q / totalJ > .04;
						return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
							x1: x0,
							y1: y0,
							x2: x1,
							y2: y1,
							stroke: col,
							strokeWidth: isChange ? 4 : 3,
							strokeLinecap: "round"
						}), big && /* @__PURE__ */ jsx("text", {
							x: (x0 + x1) / 2,
							y: isChange ? (y0 + y1) / 2 - 7 : (y0 + y1) / 2 - 5,
							textAnchor: "middle",
							fontSize: 10,
							fontWeight: 700,
							fill: col,
							style: { fontVariantNumeric: "tabular-nums" },
							children: kJ(s.q)
						})] }, i);
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: QX(energyJ),
						cy: TY(tempC),
						r: 6,
						fill: "var(--stage-good, #16a34a)",
						stroke: "var(--stage-bg)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsx("line", {
						x1: QX(energyJ),
						y1: TY(tempC),
						x2: QX(energyJ),
						y2: GY1,
						stroke: "var(--stage-good, #16a34a)",
						strokeWidth: 1,
						strokeDasharray: "3 3",
						opacity: .5
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
					gap: 3,
					fontVariantNumeric: "tabular-nums"
				},
				children: [/* @__PURE__ */ jsxs("span", {
					style: {
						fontWeight: 800,
						fontSize: 16
					},
					children: [
						tempC >= 0 ? "" : "−",
						Math.abs(tempC).toFixed(0),
						" °C · ",
						phase
					]
				}), /* @__PURE__ */ jsxs("span", { children: [
					"heat added: ",
					kJ(energyJ),
					" of ",
					kJ(totalJ),
					" (",
					pct,
					"%)"
				] })]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [
				/* @__PURE__ */ jsx(Callout, {
					tone: "info",
					children: /* @__PURE__ */ jsxs("span", {
						style: {
							display: "grid",
							gap: 6
						},
						children: [/* @__PURE__ */ jsxs("span", { children: [
							/* @__PURE__ */ jsx("span", {
								style: {
									color: "var(--stage-accent)",
									fontWeight: 800
								},
								children: "sloped"
							}),
							", warming one phase: ",
							/* @__PURE__ */ jsx(Tex, { tex: "q = mc\\,\\Delta\\theta" })
						] }), /* @__PURE__ */ jsxs("span", { children: [
							/* @__PURE__ */ jsx("span", {
								style: {
									color: "var(--stage-warn)",
									fontWeight: 800
								},
								children: "flat"
							}),
							", phase change: ",
							/* @__PURE__ */ jsx(Tex, { tex: "q = mL" })
						] })]
					})
				}),
				/* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: ["now: ", /* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: cur.kind === "change" ? cur.which === "melt" ? `melting ${sub.solidName}` : `boiling ${sub.liquidName}` : `warming ${cName}`
					})]
				}),
				/* @__PURE__ */ jsx("span", {
					style: { fontSize: 13 },
					children: cur.kind === "change" ? /* @__PURE__ */ jsx(Tex, { tex: `q = mL = ${mass}\\times ${cur.which === "melt" ? sub.lFusion : sub.lVapor} = ${kJ(cur.q).replace(" kJ", "")}\\,\\text{kJ}` }) : /* @__PURE__ */ jsx(Tex, { tex: `q = mc\\,\\Delta\\theta = ${mass}\\times ${cVal}\\times\\Delta\\theta` })
				})
			]
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "substance",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: substance === "water",
						onClick: () => setSubstance("water"),
						children: "💧 water"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: substance === "ethanol",
						onClick: () => setSubstance("ethanol"),
						children: "🧪 ethanol"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "power",
				value: `${power} W`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: power,
					min: -150,
					max: 300,
					step: 10,
					onChange: setPower,
					ariaLabel: "heating power (watts; negative cools)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "mass",
				value: `${mass} g`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: mass,
					min: 10,
					max: 200,
					step: 10,
					onChange: setMass,
					ariaLabel: "mass (grams)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: " ",
				children: /* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => setResetN((n) => n + 1),
					children: "↻ reset"
				})
			})
		] }),
		children: figure
	});
}

//#endregion
export { HeatingCurveLab };