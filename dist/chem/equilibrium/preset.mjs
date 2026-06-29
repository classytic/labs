'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { EquilibriumCore } from "@classytic/stage/sim";

//#region src/chem/equilibrium/preset.tsx
/**
* LeChatelierLab, a reversible reaction at equilibrium that fights back, on the
* shared `equilibrium` core. The reaction is AUTHORABLE: a creator declares the two
* species, the product coefficient, the colours, K, and whether the forward reaction
* is endothermic, so the SAME lab teaches N₂O₄⇌2NO₂ (brown/colourless), the
* chromate⇌dichromate colour change, a cobalt-complex equilibrium, and so on. The
* default is the classic:
*
*     A ⇌ ν·B      (default N₂O₄ ⇌ 2 NO₂, colourless ⇌ brown, endothermic forward)
*
* The flask tint tracks the product; concentration bars + a live trace show both.
* Apply a stress (add a species, compress, heat/cool) and watch Le Chatelier shift
* it to oppose the change, the SHIFT DIRECTION emerges from the core's Q-vs-K, never
* hardcoded, so it stays correct for whatever reaction the creator declares.
* Hand-driven on EquilibriumCore, play-gated.
*/
const W = 720, H = 360;
const T0 = 300, CAP = 200;
/** Predict the shift the default N₂O₄ ⇌ 2NO₂ system makes: pressure favours fewer moles; heating the endothermic forward reaction makes more product. */
const EQUILIBRIUM_CHALLENGE = [{
	id: "compress",
	prompt: "Compress the flask (raise pressure). N₂O₄ ⇌ 2NO₂ shifts toward…",
	choices: [
		{
			value: "reactant",
			label: "N₂O₄ (paler)"
		},
		{
			value: "product",
			label: "NO₂ (browner)"
		},
		{
			value: "none",
			label: "no change"
		}
	],
	answer: "reactant",
	explain: "Squeezing favours the side with fewer gas moles, 1 mol N₂O₄ beats 2 mol NO₂, so the mix goes paler."
}, {
	id: "heat",
	prompt: "The forward reaction is endothermic. Heating the flask makes the mix…",
	choices: [
		{
			value: "browner",
			label: "browner, and K rises"
		},
		{
			value: "paler",
			label: "paler, and K falls"
		},
		{
			value: "same",
			label: "unchanged"
		}
	],
	answer: "browner",
	explain: "Heat is a reactant for an endothermic forward step, so it drives more NO₂ (browner) and raises K."
}];
function LeChatelierLab({ reactantName = "N₂O₄", productName = "NO₂", productCoeff = 2, productColor = "rgb(150,82,40)", reactantColor = "var(--stage-accent, #3b82f6)", K = .6, endothermic = true, title = "Le Chatelier: equilibrium fights back", prompt = "A reversible reaction sits at equilibrium (Q = K). Stress it, add a gas, squeeze it, heat it, and watch the reaction shift to oppose the change.", objectives = [
	"Read equilibrium as Q = K (the reaction quotient meets the constant)",
	"Predict the shift when you add/remove a species or change the volume",
	"See heating favour the endothermic side and change K itself"
] } = {}) {
	const [T, setT] = useState(T0);
	const [resetN, setResetN] = useState(0);
	const gate = usePlayGate();
	const challenge = useChallenge(EQUILIBRIUM_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "le-chatelier"
	});
	const SPEC = [{
		name: reactantName,
		coeff: 1,
		side: "reactant"
	}, {
		name: productName,
		coeff: productCoeff,
		side: "product"
	}];
	const kf = endothermic ? K * (T / T0) : K * (T0 / T);
	const sigRef = useRef("");
	const histRef = useRef([]);
	const coreRef = useRef(EquilibriumCore.reset({
		species: SPEC,
		conc0: [1, 0],
		kf,
		kr: 1
	}));
	const sig = `${reactantName}:${productName}:${productCoeff}:${resetN}`;
	if (sigRef.current !== sig) {
		sigRef.current = sig;
		coreRef.current = EquilibriumCore.reset({
			species: SPEC,
			conc0: [1, 0],
			kf,
			kr: 1
		});
		histRef.current = [];
	}
	useFrameTick(gate.running, () => {
		coreRef.current = EquilibriumCore.step({
			...coreRef.current,
			kf
		}, .02);
		const h = histRef.current;
		h.push({
			a: coreRef.current.conc[0],
			b: coreRef.current.conc[1]
		});
		if (h.length > CAP) h.shift();
	});
	const st = coreRef.current;
	const [a, b] = [st.conc[0], st.conc[1]];
	const stress = (fn) => {
		coreRef.current = {
			...coreRef.current,
			...fn(coreRef.current)
		};
	};
	const addA = () => stress((s) => ({ conc: [s.conc[0] + .4, s.conc[1]] }));
	const addB = () => stress((s) => ({ conc: [s.conc[0], s.conc[1] + .6] }));
	const compress = () => stress((s) => ({ conc: s.conc.map((c) => c / .7) }));
	const expand = () => stress((s) => ({ conc: s.conc.map((c) => c * .7) }));
	const maxC = Math.max(1.2, a, b, ...histRef.current.map((p) => Math.max(p.a, p.b)));
	const ratio = st.K > 0 && isFinite(st.Q) ? st.Q / st.K : 1;
	const status = ratio < .92 ? `shifting → (making ${productName})` : ratio > 1.08 ? `shifting ← (making ${reactantName})` : "at equilibrium · Q = K";
	const tint = Math.min(.85, b / (a + b + 1e-6) * .95), fx = 70, fy = 60;
	const gx0 = 320, gx1 = 695, gy0 = 60, gy1 = 300;
	const line = (key) => histRef.current.map((p, i) => {
		const x = gx0 + (histRef.current.length <= 1 ? 0 : i / (histRef.current.length - 1)) * (gx1 - gx0);
		const y = gy1 - p[key] / maxC * (gy1 - gy0);
		return `${x.toFixed(1)},${y.toFixed(1)}`;
	}).join(" ");
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
				"aria-label": `${reactantName} to ${productName} equilibrium, Q ${st.Q.toFixed(2)}, K ${st.K.toFixed(2)}, ${status}`,
				children: [
					/* @__PURE__ */ jsx("path", {
						d: `M 140 ${fy} L 140 110 Q ${fx} 150 76 260 Q 90 290 170 290 Q 250 290 264 260 Q 270 150 200 110 L 200 ${fy}`,
						fill: productColor,
						fillOpacity: tint,
						stroke: "var(--stage-metal)",
						strokeWidth: 2.5,
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 170,
						y: 312,
						textAnchor: "middle",
						fontSize: 12,
						fill: "var(--stage-muted)",
						children: [
							"tint ∝ [",
							productName,
							"]"
						]
					}),
					/* @__PURE__ */ jsx("g", { children: [[
						reactantName,
						a,
						reactantColor,
						100
					], [
						productName,
						b,
						productColor,
						165
					]].map(([nm, v, col, bx]) => {
						const bh = v / maxC * 150, by = 100 + (150 - bh);
						return /* @__PURE__ */ jsxs("g", { children: [
							/* @__PURE__ */ jsx("rect", {
								x: bx,
								y: by,
								width: 44,
								height: bh,
								rx: 3,
								fill: col,
								opacity: .55
							}),
							/* @__PURE__ */ jsx("text", {
								x: bx + 22,
								y: 265,
								textAnchor: "middle",
								fontSize: 11,
								fill: "var(--stage-fg)",
								children: nm
							}),
							/* @__PURE__ */ jsx("text", {
								x: bx + 22,
								y: by - 5,
								textAnchor: "middle",
								fontSize: 10,
								fontWeight: 700,
								fill: "var(--stage-fg)",
								style: { fontVariantNumeric: "tabular-nums" },
								children: v.toFixed(2)
							})
						] }, nm);
					}) }),
					/* @__PURE__ */ jsx("line", {
						x1: gx0,
						y1: gy0,
						x2: gx0,
						y2: gy1,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: gx0,
						y1: gy1,
						x2: gx1,
						y2: gy1,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("text", {
						x: gx0 - 6,
						y: 62,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "conc"
					}),
					/* @__PURE__ */ jsx("text", {
						x: gx1,
						y: 318,
						textAnchor: "end",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "time →"
					}),
					histRef.current.length > 1 && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("polyline", {
						points: line("a"),
						fill: "none",
						stroke: reactantColor,
						strokeWidth: 2.5
					}), /* @__PURE__ */ jsx("polyline", {
						points: line("b"),
						fill: "none",
						stroke: productColor,
						strokeWidth: 2.5
					})] }),
					/* @__PURE__ */ jsx("text", {
						x: 328,
						y: 74,
						fontSize: 11,
						fill: reactantColor,
						children: reactantName
					}),
					/* @__PURE__ */ jsx("text", {
						x: 384,
						y: 74,
						fontSize: 11,
						fill: productColor,
						children: productName
					})
				]
			})
		})
	});
	const exp = productCoeff === 1 ? "" : `^${productCoeff}`;
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
						fontSize: 15
					},
					children: [
						"Q = ",
						isFinite(st.Q) ? st.Q.toFixed(2) : "∞",
						" · K = ",
						st.K.toFixed(2)
					]
				}), /* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 13,
						color: "var(--stage-muted)"
					},
					children: status
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
				tex: `K = \\dfrac{[\\mathrm{${productName}}]${exp}}{[\\mathrm{${reactantName}}]}`,
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"The system always moves to bring ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "Q back to K"
					}),
					". Add a species and it’s consumed; compress and it shifts to fewer moles; ",
					endothermic ? "heat and the endothermic forward reaction wins" : "heat and the exothermic reverse reaction wins",
					", and K itself changes with temperature."
				]
			})]
		})] }),
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "add / remove",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsxs(Chip, {
						selected: false,
						onClick: addA,
						children: ["+ ", reactantName]
					}), /* @__PURE__ */ jsxs(Chip, {
						selected: false,
						onClick: addB,
						children: ["+ ", productName]
					})]
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: "volume",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: compress,
						children: "⬇ compress"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: expand,
						children: "⬆ expand"
					})]
				})
			})] }), /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "temperature",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [
						/* @__PURE__ */ jsx(Chip, {
							selected: T > T0,
							onClick: () => setT(420),
							children: "🔥 heat"
						}),
						/* @__PURE__ */ jsx(Chip, {
							selected: T === T0,
							onClick: () => setT(T0),
							children: "room"
						}),
						/* @__PURE__ */ jsx(Chip, {
							selected: T < T0,
							onClick: () => setT(220),
							children: "❄ cool"
						})
					]
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: " ",
				children: /* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => setResetN((n) => n + 1),
					children: "↻ reset"
				})
			})] })]
		}),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: EQUILIBRIUM_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { LeChatelierLab };