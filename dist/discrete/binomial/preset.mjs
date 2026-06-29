'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { CheckButton, Chip, Slider, StatusPill, Stepper } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { nCr } from "../core/combinatorics.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/binomial/preset.tsx
/**
* BinomialDistributionLab, the bridge from counting to the bell. P(X=k successes
* in n trials) = C(n,k)·pᵏ·(1−p)ⁿ⁻ᵏ, drawn as bars you can interrogate: click a bar
* and the formula DERIVES itself, k successes happen C(n,k) ways (the Pascal /
* counting number), each way has probability pᵏ for the successes times (1−p)ⁿ⁻ᵏ for
* the failures. Slide p to watch it skew and (at ½) turn symmetric; slide n and flip
* on the normal overlay to watch the binomial become the Galton-board bell. Mean np
* and σ = √(np(1−p)) are marked.
*
* One lab ties together Pascal (the coefficients), the counting labs (the C(n,k)),
* and the normal distribution (the limit). Values from the nCr kernel.
*/
const W = 540, H = 300, ML = 30, MR = 14, MT = 16, MB = 34;
const PW = W - ML - MR, PH = H - MT - MB;
const ACC = "var(--stage-accent)", GOOD = "var(--stage-good)";
const f3 = (x) => x < 5e-4 ? x.toExponential(1) : x.toFixed(3);
function BinomialDistributionLab({ n: n0 = 10, p: p0 = .5, showNormal: sn0 = false, title = "Binomial distribution", prompt, objectives, hints: hintList, controlId }) {
	const [n, setN] = useState(n0);
	const [p, setP] = useState(p0);
	const [normal, setNormal] = useState(sn0);
	const [sel, setSel] = useState(null);
	const [guess, setGuess] = useState(0);
	const [checked, setChecked] = useState(false);
	const hints = useHints(hintList);
	const probs = useMemo(() => Array.from({ length: n + 1 }, (_, k) => nCr(n, k) * p ** k * (1 - p) ** (n - k)), [n, p]);
	const mean = n * p, variance = n * p * (1 - p), sd = Math.sqrt(variance);
	const mode = probs.indexOf(Math.max(...probs));
	const npdf = (x) => variance > 0 ? Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance) : 0;
	const yMax = Math.max(...probs, normal ? npdf(mean) : 0) * 1.1 || 1;
	const colW = PW / (n + 1);
	const xOf = (k) => ML + (k + .5) * colW;
	const yOf = (v) => 266 - v / yMax * PH;
	const barW = Math.min(40, colW * .74);
	useCheckpoint({
		solved: checked && guess === mode,
		activity: `binomial:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		n: {
			type: "number",
			label: "trials n",
			min: 1,
			max: 24,
			step: 1,
			get: () => n,
			set: (v) => {
				setN(Math.round(v));
				setChecked(false);
			}
		},
		p: {
			type: "number",
			label: "success prob p",
			min: 0,
			max: 1,
			step: .01,
			get: () => p,
			set: setP
		},
		normal: {
			type: "boolean",
			label: "normal overlay",
			get: () => normal,
			set: setNormal
		},
		inspect: {
			type: "number",
			label: "inspect k (−1 clears)",
			min: -1,
			max: n,
			step: 1,
			get: () => sel ?? -1,
			set: (v) => setSel(v < 0 ? null : Math.round(v))
		}
	});
	const ticks = n <= 16 ? Array.from({ length: n + 1 }, (_, k) => k) : Array.from({ length: n + 1 }, (_, k) => k).filter((k) => k % 2 === 0);
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 8
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			style: {
				width: "100%",
				maxWidth: W,
				height: "auto",
				display: "block"
			},
			role: "img",
			"aria-label": `binomial n ${n} p ${p}, most likely ${mode}`,
			children: [
				probs.map((pr, k) => {
					const on = sel === k;
					return /* @__PURE__ */ jsxs("g", {
						onClick: () => setSel(on ? null : k),
						style: { cursor: "pointer" },
						children: [
							/* @__PURE__ */ jsx("rect", {
								x: xOf(k) - colW / 2,
								y: MT,
								width: colW,
								height: PH,
								fill: "transparent"
							}),
							/* @__PURE__ */ jsx("rect", {
								x: xOf(k) - barW / 2,
								y: yOf(pr),
								width: barW,
								height: Math.max(0, 266 - yOf(pr)),
								rx: 3,
								fill: on ? GOOD : `color-mix(in oklab, ${ACC} 78%, transparent)`
							}),
							(n <= 16 || on) && /* @__PURE__ */ jsx("text", {
								x: xOf(k),
								y: yOf(pr) - 3,
								textAnchor: "middle",
								fontSize: 9,
								fill: "var(--stage-muted)",
								children: (pr * 100).toFixed(pr < .1 ? 1 : 0)
							})
						]
					}, k);
				}),
				/* @__PURE__ */ jsx("line", {
					x1: ML,
					y1: 266,
					x2: W - MR,
					y2: 266,
					stroke: "var(--stage-fg)",
					strokeWidth: 1.5
				}),
				ticks.map((k) => /* @__PURE__ */ jsx("text", {
					x: xOf(k),
					y: 280,
					textAnchor: "middle",
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: k
				}, k)),
				/* @__PURE__ */ jsx("line", {
					x1: xOf(mean),
					y1: MT,
					x2: xOf(mean),
					y2: 266,
					stroke: GOOD,
					strokeWidth: 1.5,
					strokeDasharray: "4 3"
				}),
				/* @__PURE__ */ jsxs("text", {
					x: xOf(mean),
					y: 25,
					textAnchor: "middle",
					fontSize: 10,
					fontWeight: 700,
					fill: GOOD,
					children: ["μ=", mean.toFixed(1)]
				}),
				normal && variance > 0 && /* @__PURE__ */ jsx("polyline", {
					points: Array.from({ length: 121 }, (_, i) => {
						const x = -.5 + i / 120 * (n + 1);
						return `${(ML + (x + .5) * colW).toFixed(1)},${yOf(npdf(x)).toFixed(1)}`;
					}).join(" "),
					fill: "none",
					stroke: "var(--stage-warn)",
					strokeWidth: 2.5,
					strokeDasharray: "6 4"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsxs(Callout, {
				tone: "result",
				children: [
					/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 12,
							color: "var(--stage-muted)",
							fontWeight: 600
						},
						children: "most likely"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "lab-callout-big",
						children: mode
					}),
					/* @__PURE__ */ jsxs("span", {
						style: {
							fontSize: 12,
							color: "var(--stage-muted)"
						},
						children: [
							/* @__PURE__ */ jsx(Tex$1, { tex: `\\mu = np = ${mean.toFixed(2)}` }),
							" · ",
							/* @__PURE__ */ jsx(Tex$1, { tex: `\\sigma = ${sd.toFixed(2)}` })
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				style: { fontSize: 13.5 },
				children: /* @__PURE__ */ jsx(Tex$1, { tex: "P(X=k)=\\binom{n}{k}p^{k}(1-p)^{n-k}" })
			}),
			sel != null ? /* @__PURE__ */ jsxs("div", {
				style: {
					fontSize: 13.5,
					padding: "8px 10px",
					borderRadius: 9,
					background: "color-mix(in oklab, var(--stage-good) 10%, transparent)",
					display: "grid",
					gap: 3
				},
				children: [
					/* @__PURE__ */ jsxs("b", { children: [
						"P(X=",
						sel,
						") = ",
						f3(probs[sel])
					] }),
					/* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Tex$1, { tex: `= \\binom{${n}}{${sel}} \\cdot ${p}^{${sel}} \\cdot ${(1 - p).toFixed(2)}^{${n - sel}}` }) }),
					/* @__PURE__ */ jsxs("span", {
						style: { color: "var(--stage-muted)" },
						children: [
							"= ",
							nCr(n, sel),
							" ways × (each ",
							f3(p ** sel * (1 - p) ** (n - sel)),
							")"
						]
					})
				]
			}) : /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "lab-prompt",
				children: "🎯 Which number of successes is most likely? Guess, then check."
			}), /* @__PURE__ */ jsxs(ControlBar, { children: [
				/* @__PURE__ */ jsx(Field, {
					label: "most likely k",
					children: /* @__PURE__ */ jsx(Stepper, {
						value: guess,
						onChange: (v) => {
							setGuess(v);
							setChecked(false);
						},
						min: 0,
						max: n
					})
				}),
				/* @__PURE__ */ jsx(CheckButton, {
					onClick: () => setChecked(true),
					children: "Check"
				}),
				checked && /* @__PURE__ */ jsx(StatusPill, {
					ok: guess === mode,
					children: guess === mode ? `✓ ${mode}` : `it's ${mode}`
				})
			] })] })
		] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "trials n",
				value: n,
				children: /* @__PURE__ */ jsx(Slider, {
					value: n,
					min: 1,
					max: 24,
					step: 1,
					onChange: (v) => {
						setN(v);
						setChecked(false);
					},
					ariaLabel: "trials"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "success p",
				value: p.toFixed(2),
				children: /* @__PURE__ */ jsx(Slider, {
					value: p,
					min: 0,
					max: 1,
					step: .01,
					onChange: setP,
					ariaLabel: "success probability"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "normal",
				children: /* @__PURE__ */ jsx(Chip, {
					selected: normal,
					onClick: () => setNormal((v) => !v),
					children: "bell overlay"
				})
			}),
			sel != null && /* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: () => setSel(null),
				children: "clear inspect"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("p", {
			className: "lab-prompt",
			style: {
				fontSize: 12.5,
				color: "var(--stage-muted)"
			},
			children: "Coefficients are Pascal's row n; at p = ½ it's that row ÷ 2ⁿ. Crank n with the bell overlay → the binomial becomes the normal (the Galton board)."
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { BinomialDistributionLab };