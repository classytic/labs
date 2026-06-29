'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { R, fractionAboveEa, halfLife } from "@classytic/stage/chem";

//#region src/chem/kinetics/preset.tsx
/**
* KineticsLab, why heat and catalysts speed reactions, shown the visceral way: a
* vessel of molecules bouncing around (faster when hot), where only collisions with
* enough energy (≥ Eₐ) succeed, those flash and convert reactant A → product B.
* Beside it, the Maxwell–Boltzmann energy spread shows the SAME story as the shaded
* "can react" tail past Eₐ, and a composition bar tracks A→B in real time.
*
* Backed by the shared `@classytic/stage/chem` kinetics engine: the conversion pace
* is the Arrhenius rate constant k = A·e^(−Eₐ/RT) (via arrheniusRatio), the readout
* shows the real reactive fraction e^(−Eₐ/RT) and the half-life for the chosen order.
* Raise the temperature → molecules speed up and more clear the barrier; drop Eₐ with
* a catalyst → the barrier moves left and far more collisions succeed. The reaction
* (Eₐ, rate, order, count, temperature) is fully AUTHORABLE, and a predict-first
* question ships with it. Play-gated particle sim; pure SVG.
*/
const W = 720, H = 380;
const BX0 = 28, BX1 = 312, BY0 = 64, BY1 = 332;
const A_COL = "var(--stage-accent, #3b82f6)";
const B_COL = "var(--stage-good, #16a34a)";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const KINETICS_CHALLENGE = [{
	id: "temp",
	prompt: "Raising the temperature speeds the reaction mainly because…",
	choices: [
		{
			value: "energy",
			label: "more molecules have energy ≥ Eₐ"
		},
		{
			value: "bigger",
			label: "the molecules get bigger"
		},
		{
			value: "lowerEa",
			label: "it lowers the activation energy"
		}
	],
	answer: "energy",
	explain: "Heat widens the energy spread, so a larger fraction (e^(−Eₐ/RT)) clears the barrier, and they move faster, so collide more often."
}, {
	id: "cat",
	prompt: "A catalyst speeds a reaction by…",
	choices: [
		{
			value: "lowerEa",
			label: "lowering the activation energy Eₐ"
		},
		{
			value: "heat",
			label: "adding heat to the flask"
		},
		{
			value: "shift",
			label: "making the products more stable (changing ΔH)"
		}
	],
	answer: "lowerEa",
	explain: "A catalyst offers a lower-Eₐ path, so far more collisions succeed, without being used up or changing the energy of reactants/products."
}];
function KineticsLab({ EaKJ = 50, kRef = .6, order = 1, molecules = 30, T0 = 300, title = "Reaction rate: temperature, activation energy & collisions", prompt = "Molecules must collide with enough energy (≥ Eₐ) to react. Heat them up or lower Eₐ with a catalyst and watch many more collisions succeed.", objectives = [
	"Explain rate by the collision model: enough-energy collisions react",
	"See temperature widen the energy spread so more molecules clear Eₐ",
	"Use Arrhenius k = A·e^(−Eₐ/RT); see a catalyst lower Eₐ, not ΔH"
] } = {}) {
	const N = Math.max(6, Math.min(60, molecules));
	const [T, setT] = useState(T0);
	const [catalyst, setCatalyst] = useState(false);
	const [resetN, setResetN] = useState(0);
	const gate = usePlayGate();
	const challenge = useChallenge(KINETICS_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "kinetics"
	});
	const Ea0 = EaKJ * 1e3;
	const Ea = Ea0 * (catalyst ? .55 : 1);
	const k = kRef * Math.exp(Ea0 / (R * 300)) * Math.exp(-Ea / (R * T));
	const ratioVs300 = k / kRef;
	const frac = fractionAboveEa(Ea, T);
	const makeMols = () => Array.from({ length: N }, (_, i) => {
		const hx = i * .6180339887 % 1, hy = (i * .7548776 + .13) % 1, th = i * 2.3999632;
		return {
			x: 38 + hx * (BX1 - BX0 - 20),
			y: 74 + hy * (BY1 - BY0 - 20),
			vx: Math.cos(th),
			vy: Math.sin(th),
			b: false,
			flash: 0
		};
	});
	const molsRef = useRef(makeMols());
	const coolRef = useRef(0);
	const sigRef = useRef("");
	const sig = `${N}:${resetN}`;
	if (sigRef.current !== sig) {
		sigRef.current = sig;
		molsRef.current = makeMols();
		coolRef.current = 0;
	}
	useFrameTick(gate.running, (f) => {
		const dt = Math.min(.05, f.dtMs / 1e3);
		const spd = 58 * Math.sqrt(T / 300);
		const p = 1 - Math.exp(-k * dt);
		const mols = molsRef.current;
		let nA = 0;
		for (const m of mols) {
			m.x += m.vx * spd * dt;
			m.y += m.vy * spd * dt;
			if (m.x < 35) {
				m.x = 35;
				m.vx = Math.abs(m.vx);
			} else if (m.x > BX1 - 7) {
				m.x = BX1 - 7;
				m.vx = -Math.abs(m.vx);
			}
			if (m.y < 71) {
				m.y = 71;
				m.vy = Math.abs(m.vy);
			} else if (m.y > BY1 - 7) {
				m.y = BY1 - 7;
				m.vy = -Math.abs(m.vy);
			}
			if (m.flash > 0) m.flash = Math.max(0, m.flash - dt * 5);
			if (!m.b) if (Math.random() < p) {
				m.b = true;
				m.flash = 1;
			} else nA++;
		}
		if (nA === 0) {
			coolRef.current += dt;
			if (coolRef.current > 1.3) {
				molsRef.current = makeMols();
				coolRef.current = 0;
			}
		}
	});
	const mols = molsRef.current;
	const nB = mols.filter((m) => m.b).length;
	const nA = N - nB;
	const convPct = Math.round(nB / N * 100);
	const MX0 = 360, MX1 = 700, MY0 = 62, MY1 = 190;
	const Edist = 18 * (T / 300);
	const eaDisp = clamp(EaKJ * (catalyst ? .55 : 1) / 1, 6, 96);
	const AXMAX = 100;
	const mb = (E) => Math.sqrt(Math.max(0, E)) * Math.exp(-E / Edist);
	const mbMax = Math.max(...Array.from({ length: 50 }, (_, i) => mb(i / 49 * AXMAX))) || 1;
	const EX = (E) => MX0 + E / AXMAX * (MX1 - MX0);
	const EY = (v) => MY1 - v / mbMax * (MY1 - MY0);
	const curvePts = Array.from({ length: 61 }, (_, i) => {
		const E = i / 60 * AXMAX;
		return `${EX(E).toFixed(1)},${EY(mb(E)).toFixed(1)}`;
	});
	const shadePts = [
		`${EX(eaDisp).toFixed(1)},${MY1}`,
		...Array.from({ length: 31 }, (_, i) => {
			const E = eaDisp + i / 30 * (AXMAX - eaDisp);
			return `${EX(E).toFixed(1)},${EY(mb(E)).toFixed(1)}`;
		}),
		`${EX(AXMAX).toFixed(1)},${MY1}`
	];
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
				"aria-label": `Reaction vessel at ${T} kelvin, ${convPct}% converted to product`,
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: BX0,
						y: BY0,
						width: BX1 - BX0,
						height: BY1 - BY0,
						rx: 8,
						fill: "color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))",
						stroke: "var(--stage-metal)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 340 / 2,
						y: BY0 - 8,
						textAnchor: "middle",
						fontSize: 12,
						fontWeight: 700,
						fill: "var(--stage-fg)",
						children: [
							"reaction vessel · ",
							T,
							" K"
						]
					}),
					mols.map((m, i) => /* @__PURE__ */ jsxs("g", { children: [m.flash > 0 && /* @__PURE__ */ jsx("circle", {
						cx: m.x,
						cy: m.y,
						r: 6 + (1 - m.flash) * 8,
						fill: "none",
						stroke: "var(--stage-warn)",
						strokeWidth: 2,
						opacity: m.flash
					}), /* @__PURE__ */ jsx("circle", {
						cx: m.x,
						cy: m.y,
						r: 5.5,
						fill: m.b ? B_COL : A_COL,
						opacity: .92
					})] }, i)),
					/* @__PURE__ */ jsx("circle", {
						cx: 40,
						cy: 348,
						r: 5,
						fill: A_COL
					}),
					/* @__PURE__ */ jsx("text", {
						x: 50,
						y: 352,
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: "A (reactant)"
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: 148,
						cy: 348,
						r: 5,
						fill: B_COL
					}),
					/* @__PURE__ */ jsx("text", {
						x: 158,
						y: 352,
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: "B (product)"
					}),
					/* @__PURE__ */ jsxs("text", {
						x: MX0,
						y: MY0 - 6,
						fontSize: 12,
						fontWeight: 700,
						fill: "var(--stage-fg)",
						children: ["molecular energies ", /* @__PURE__ */ jsx("tspan", {
							fontWeight: 400,
							fill: "var(--stage-muted)",
							children: "(schematic)"
						})]
					}),
					/* @__PURE__ */ jsx("line", {
						x1: MX0,
						y1: MY1,
						x2: MX1,
						y2: MY1,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("polygon", {
						points: shadePts.join(" "),
						fill: "var(--stage-warn)",
						opacity: .25
					}),
					/* @__PURE__ */ jsx("polyline", {
						points: curvePts.join(" "),
						fill: "none",
						stroke: "var(--stage-accent)",
						strokeWidth: 2.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: EX(eaDisp),
						y1: MY0,
						x2: EX(eaDisp),
						y2: MY1,
						stroke: "var(--stage-danger, #e03131)",
						strokeWidth: 2,
						strokeDasharray: "4 3"
					}),
					/* @__PURE__ */ jsx("text", {
						x: EX(eaDisp),
						y: 66,
						textAnchor: "middle",
						fontSize: 10,
						fontWeight: 700,
						fill: "var(--stage-danger, #e03131)",
						children: "Eₐ"
					}),
					/* @__PURE__ */ jsx("text", {
						x: (EX(eaDisp) + MX1) / 2,
						y: MY1 - 8,
						textAnchor: "middle",
						fontSize: 9.5,
						fill: "color-mix(in oklab, var(--stage-warn) 75%, var(--stage-fg))",
						children: "can react"
					}),
					/* @__PURE__ */ jsx("text", {
						x: MX1,
						y: 206,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "energy →"
					}),
					/* @__PURE__ */ jsx("text", {
						x: MX0,
						y: 234,
						fontSize: 12,
						fontWeight: 700,
						fill: "var(--stage-fg)",
						children: "composition"
					}),
					/* @__PURE__ */ jsx("rect", {
						x: MX0,
						y: 244,
						width: MX1 - MX0,
						height: 26,
						rx: 5,
						fill: A_COL,
						opacity: .85
					}),
					/* @__PURE__ */ jsx("rect", {
						x: MX0,
						y: 244,
						width: (MX1 - MX0) * (nB / N),
						height: 26,
						rx: 5,
						fill: B_COL
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 368,
						y: 261,
						fontSize: 12,
						fontWeight: 700,
						fill: "#fff",
						children: ["A ", nA]
					}),
					/* @__PURE__ */ jsxs("text", {
						x: MX1 - 8,
						y: 261,
						textAnchor: "end",
						fontSize: 12,
						fontWeight: 700,
						fill: "#fff",
						children: ["B ", nB]
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 1060 / 2,
						y: 292,
						textAnchor: "middle",
						fontSize: 12,
						fill: "var(--stage-muted)",
						children: [convPct, "% converted"]
					})
				]
			})
		})
	});
	const tHalf = halfLife(order, 1, Math.max(1e-6, k));
	const aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
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
					fontSize: 15
				},
				children: [
					"k ≈ ",
					ratioVs300 < 1e3 ? ratioVs300.toFixed(2) : ratioVs300.toExponential(1),
					"× (vs 300 K, no catalyst)"
				]
			}), /* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 12.5,
					color: "var(--stage-muted)"
				},
				children: [
					"fraction with E ≥ Eₐ ≈ ",
					frac < 1e-4 ? frac.toExponential(1) : frac.toFixed(4),
					" · t½ ≈ ",
					tHalf < 100 ? tHalf.toFixed(1) : tHalf.toExponential(1),
					" s"
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
		children: [/* @__PURE__ */ jsx(Tex, {
			tex: "k = A\\,e^{-E_a / RT}",
			block: true
		}), /* @__PURE__ */ jsxs("span", {
			style: { color: "var(--stage-muted)" },
			children: ["Only collisions with energy ≥ Eₐ react. ", catalyst ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("strong", {
				style: { color: B_COL },
				children: "Catalyst on"
			}), ", Eₐ is lowered, so far more collisions succeed (ΔH is unchanged)."] }) : /* @__PURE__ */ jsx(Fragment$1, { children: "Heat the vessel and the energy spread widens, pushing more molecules past Eₐ." })]
		})]
	})] });
	const footer = /* @__PURE__ */ jsx(ChallengeCard, {
		questions: KINETICS_CHALLENGE,
		state: challenge,
		title: "Predict first"
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "temperature",
				value: `${T} K (${(T - 273).toFixed(0)} °C)`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: T,
					min: 260,
					max: 400,
					step: 5,
					onChange: setT,
					ariaLabel: "temperature (K)"
				})
			}) }), /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "catalyst",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: catalyst,
						onClick: () => setCatalyst(true),
						children: "catalyst on (lower Eₐ)"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: !catalyst,
						onClick: () => setCatalyst(false),
						children: "none"
					})]
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: " ",
				children: /* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => setResetN((n) => n + 1),
					children: "↻ refill A"
				})
			})] })]
		}),
		footer,
		children: figure
	});
}

//#endregion
export { KineticsLab };