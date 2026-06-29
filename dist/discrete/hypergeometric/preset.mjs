'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { nCr } from "../core/combinatorics.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/hypergeometric/preset.tsx
/**
* HypergeometricLab, does it matter whether you put the ball back? Same urn (K
* winners in N), draw n, and compare the two distributions of "how many winners":
*   • WITH replacement  → binomial   C(n,k) pᵏ(1−p)ⁿ⁻ᵏ,  p = K/N  (draws independent)
*   • WITHOUT            → hypergeometric  C(K,k)·C(N−K,n−k) / C(N,n)
* Drawn as paired bars. The lesson lives in the difference: without replacement is
* NARROWER (each draw shifts the odds, a finite-population correction (N−n)/(N−1)),
* but as the population N grows huge the two distributions merge (taking one ball
* barely changes the mix). Both share the same mean n·K/N.
*
* Card hands & quality-control are hypergeometric; coin/dice repeats are binomial.
*/
const W = 540, H = 300, ML = 30, MR = 14, MT = 16, MB = 34;
const PW = W - ML - MR, PH = H - MT - MB;
const BIN = "var(--stage-accent)", HYP = "var(--stage-warn)";
const f3 = (x) => x < 5e-4 && x > 0 ? x.toExponential(1) : x.toFixed(3);
const Q = [{
	id: "narrower",
	prompt: "Same urn, draw n. One version puts each ball BACK (independent draws), the other does NOT. Which distribution of 'number of winners' is NARROWER (less spread)?",
	choices: [
		{
			value: "without",
			label: "WITHOUT replacement (hypergeometric)"
		},
		{
			value: "with",
			label: "WITH replacement (binomial)"
		},
		{
			value: "same",
			label: "identical spread"
		}
	],
	answer: "without",
	explain: "Without replacement is narrower. Each draw removes a ball and shifts the odds for the next, so draws are negatively correlated. That shrinks the variance by the finite-population correction (N−n)/(N−1) < 1: varHyp = varBin · (N−n)/(N−1). The means stay identical at n·K/N; only the spread differs, and the two converge as N grows huge."
}];
function HypergeometricLab({ N: N0 = 10, K: K0 = 4, n: n0 = 3, title = "With vs without replacement", prompt, objectives, hints: hintList, controlId }) {
	const [N, setN] = useState(N0);
	const [K, setK] = useState(K0);
	const [n, setN_] = useState(n0);
	const [sel, setSel] = useState(null);
	const hints = useHints(hintList);
	const ch = useChallenge(Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "hypergeometric:predict"
	});
	const Kc = Math.min(K, N), nc = Math.min(n, N);
	const p = Kc / N;
	const bin = useMemo(() => Array.from({ length: nc + 1 }, (_, k) => nCr(nc, k) * p ** k * (1 - p) ** (nc - k)), [nc, p]);
	const hyp = useMemo(() => Array.from({ length: nc + 1 }, (_, k) => k <= Kc && nc - k <= N - Kc ? nCr(Kc, k) * nCr(N - Kc, nc - k) / nCr(N, nc) : 0), [
		N,
		Kc,
		nc
	]);
	const mean = nc * p;
	const varBin = nc * p * (1 - p), varHyp = varBin * (N - nc) / (N - 1 || 1);
	const yMax = Math.max(...bin, ...hyp) * 1.1 || 1;
	const colW = PW / (nc + 1);
	const xOf = (k) => ML + (k + .5) * colW;
	const yOf = (v) => 266 - v / yMax * PH;
	const bw = Math.min(20, colW * .36);
	useControlSurface(controlId, {
		N: {
			type: "number",
			label: "population N",
			min: 2,
			max: 60,
			step: 1,
			get: () => N,
			set: (v) => setN(Math.round(v))
		},
		K: {
			type: "number",
			label: "winners K",
			min: 0,
			max: N,
			step: 1,
			get: () => K,
			set: (v) => setK(Math.round(v))
		},
		n: {
			type: "number",
			label: "draw n",
			min: 1,
			max: N,
			step: 1,
			get: () => n,
			set: (v) => setN_(Math.round(v))
		},
		inspect: {
			type: "number",
			label: "inspect k",
			min: -1,
			max: nc,
			step: 1,
			get: () => sel ?? -1,
			set: (v) => setSel(v < 0 ? null : Math.round(v))
		}
	});
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
			"aria-label": `binomial vs hypergeometric, N${N} K${Kc} n${nc}`,
			children: [
				bin.map((_, k) => /* @__PURE__ */ jsxs("g", {
					onClick: () => setSel(sel === k ? null : k),
					style: { cursor: "pointer" },
					children: [
						/* @__PURE__ */ jsx("rect", {
							x: xOf(k) - colW / 2,
							y: MT,
							width: colW,
							height: PH,
							fill: sel === k ? "color-mix(in oklab, var(--stage-fg) 6%, transparent)" : "transparent"
						}),
						/* @__PURE__ */ jsx("rect", {
							x: xOf(k) - bw - 1,
							y: yOf(bin[k]),
							width: bw,
							height: Math.max(0, 266 - yOf(bin[k])),
							rx: 2,
							fill: BIN,
							opacity: .85
						}),
						/* @__PURE__ */ jsx("rect", {
							x: xOf(k) + 1,
							y: yOf(hyp[k]),
							width: bw,
							height: Math.max(0, 266 - yOf(hyp[k])),
							rx: 2,
							fill: HYP,
							opacity: .9
						})
					]
				}, k)),
				/* @__PURE__ */ jsx("line", {
					x1: ML,
					y1: 266,
					x2: W - MR,
					y2: 266,
					stroke: "var(--stage-fg)",
					strokeWidth: 1.5
				}),
				bin.map((_, k) => /* @__PURE__ */ jsx("text", {
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
					stroke: "var(--stage-good)",
					strokeWidth: 1.5,
					strokeDasharray: "4 3"
				}),
				/* @__PURE__ */ jsxs("text", {
					x: xOf(mean),
					y: 25,
					textAnchor: "middle",
					fontSize: 10,
					fontWeight: 700,
					fill: "var(--stage-good)",
					children: ["μ=", mean.toFixed(1)]
				}),
				/* @__PURE__ */ jsx("rect", {
					x: W - 150,
					y: 18,
					width: 10,
					height: 10,
					fill: BIN
				}),
				/* @__PURE__ */ jsx("text", {
					x: W - 136,
					y: 27,
					fontSize: 10,
					fill: "var(--stage-fg)",
					children: "with (binomial)"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: W - 150,
					y: 32,
					width: 10,
					height: 10,
					fill: HYP
				}),
				/* @__PURE__ */ jsx("text", {
					x: W - 136,
					y: 41,
					fontSize: 10,
					fill: "var(--stage-fg)",
					children: "without (hyper)"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				/* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)",
						fontWeight: 600
					},
					children: "spread (variance)"
				}),
				/* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 15,
						fontWeight: 800
					},
					children: [
						/* @__PURE__ */ jsx("span", {
							style: { color: BIN },
							children: varBin.toFixed(2)
						}),
						" vs ",
						/* @__PURE__ */ jsx("span", {
							style: { color: HYP },
							children: varHyp.toFixed(2)
						})
					]
				}),
				/* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: ["same ", /* @__PURE__ */ jsx(Tex$1, { tex: `\\mu = n \\cdot K / N = ${mean.toFixed(2)}` })]
				})
			]
		}), sel != null ? /* @__PURE__ */ jsxs("div", {
			style: {
				fontSize: 13,
				padding: "8px 10px",
				borderRadius: 9,
				background: "color-mix(in oklab, var(--stage-fg) 5%, transparent)",
				display: "grid",
				gap: 4
			},
			children: [
				/* @__PURE__ */ jsxs("b", { children: [
					"P(exactly ",
					sel,
					" winners)"
				] }),
				/* @__PURE__ */ jsxs("span", {
					style: { color: BIN },
					children: ["with: ", /* @__PURE__ */ jsx(Tex$1, { tex: `C(${nc},${sel}) \\cdot ${p.toFixed(2)}^{${sel}} \\cdot ${(1 - p).toFixed(2)}^{${nc - sel}} = ${f3(bin[sel])}` })]
				}),
				/* @__PURE__ */ jsxs("span", {
					style: { color: HYP },
					children: ["without: ", /* @__PURE__ */ jsx(Tex$1, { tex: `C(${Kc},${sel}) \\cdot C(${N - Kc},${nc - sel}) / C(${N},${nc}) = ${f3(hyp[sel])}` })]
				})
			]
		}) : /* @__PURE__ */ jsx("p", {
			className: "lab-prompt",
			style: { fontSize: 13 },
			children: "Click a bar to compare the two probabilities. The blue (with replacement) is always a touch wider than the orange (without)."
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "population N",
				value: N,
				children: /* @__PURE__ */ jsx(Slider, {
					value: N,
					min: 2,
					max: 60,
					step: 1,
					onChange: (v) => {
						setN(v);
						if (K > v) setK(v);
						if (n > v) setN_(v);
					},
					ariaLabel: "population"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "winners K",
				value: Kc,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Kc,
					min: 0,
					max: N,
					step: 1,
					onChange: setK,
					ariaLabel: "winners"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "draw n",
				value: nc,
				children: /* @__PURE__ */ jsx(Slider, {
					value: nc,
					min: 1,
					max: N,
					step: 1,
					onChange: setN_,
					ariaLabel: "draw size"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(ChallengeCard, {
				questions: Q,
				state: ch,
				title: "Predict first"
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "lab-prompt",
				style: {
					fontSize: 12.5,
					color: "var(--stage-muted)"
				},
				children: [
					"Without replacement is narrower by the factor (N−n)/(N−1) = ",
					((N - nc) / (N - 1 || 1)).toFixed(2),
					". Push N up (with K/N fixed) and the bars converge, for a huge population, taking one out barely changes the odds."
				]
			}),
			/* @__PURE__ */ jsx(HintLadder, { hints })
		] }),
		children: figure
	});
}

//#endregion
export { HypergeometricLab };