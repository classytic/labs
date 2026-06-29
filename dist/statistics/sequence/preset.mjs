'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { infiniteSum, nthTerm, partialSum, partialSums, terms } from "../core/sequences.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/statistics/sequence/preset.tsx
/**
* SequenceLab, arithmetic & geometric sequences you can watch grow. Each term is
* a bar (the pattern: a steady ladder for arithmetic, an explosion or a fading
* tail for geometric); a line traces the RUNNING TOTAL across them. The magic
* moment is geometric convergence: when |r|<1 the running-total line flattens onto
* a dashed S∞ guide, an infinite sum with a finite answer, seen, not just stated.
*
* Closed forms come from the sequences kernel and are shown (KaTeX) beside the
* brute running total, so formula and picture are provably the same thing.
*/
const W = 540, H = 250, ML = 36, MR = 16, MT = 20, MB = 30;
const PW = W - ML - MR, PH = H - MT - MB;
const r2 = (x) => Math.round(x * 100) / 100;
const fnum = (x) => Number.isInteger(x) ? String(x) : r2(x).toString();
function SequenceLab({ kind = "geometric", first = 1, step = .5, count = 8, title = "Sequences & series", prompt, objectives, hints: hintList, controlId }) {
	const [k, setK] = useState(kind);
	const [a1, setA1] = useState(first);
	const [d, setD] = useState(step);
	const [n, setN] = useState(count);
	const hints = useHints(hintList);
	const defaultConverges = kind === "geometric" && Math.abs(step) < 1;
	const predictQ = useMemo(() => [{
		id: "sequence-converge",
		prompt: kind === "geometric" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"This geometric series has ratio ",
			/* @__PURE__ */ jsx(Tex$1, { tex: `r = ${fnum(step)}` }),
			". It adds infinitely many terms, does the total settle on a finite number, or grow without bound?"
		] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"This is an arithmetic series (each term adds a fixed ",
			/* @__PURE__ */ jsx(Tex$1, { tex: `d = ${fnum(step)}` }),
			"). Summed over infinitely many terms, does the total settle on a finite number, or grow without bound?"
		] }),
		choices: [{
			value: "converges",
			label: "settles on a finite sum"
		}, {
			value: "diverges",
			label: "grows forever"
		}],
		answer: defaultConverges ? "converges" : "diverges",
		explain: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"A geometric series converges only when ",
			/* @__PURE__ */ jsx(Tex$1, { tex: "|r| < 1" }),
			" (the terms shrink to nothing); an arithmetic series always grows without bound. Here ",
			/* @__PURE__ */ jsx(Tex$1, { tex: kind === "geometric" ? `|r| ${defaultConverges ? "<" : "\\ge"} 1` : "d \\ne 0" }),
			", so it ",
			defaultConverges ? "converges" : "diverges",
			"."
		] })
	}], []);
	const ch = useChallenge(predictQ);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "sequence:predict"
	});
	const spec = {
		kind: k,
		first: a1,
		step: d
	};
	const ts = useMemo(() => terms(spec, n), [
		k,
		a1,
		d,
		n
	]);
	const sums = useMemo(() => partialSums(spec, n), [
		k,
		a1,
		d,
		n
	]);
	const sInf = infiniteSum(spec);
	const Sn = partialSum(spec, n);
	const all = [
		0,
		...ts,
		...sums,
		...sInf != null ? [sInf] : []
	];
	const yMax = Math.max(...all), yMin = Math.min(...all);
	const pad = (yMax - yMin) * .08 || 1;
	const yLo = yMin - pad, yHi = yMax + pad;
	const yOf = (v) => 220 - (v - yLo) / (yHi - yLo) * PH;
	const colW = PW / n;
	const cx = (i) => ML + colW * (i + .5);
	const y0 = yOf(0);
	useControlSurface(controlId, {
		kind: {
			type: "enum",
			label: "sequence kind",
			options: ["arithmetic", "geometric"],
			get: () => k,
			set: (v) => setK(v)
		},
		first: {
			type: "number",
			label: "first term a₁",
			min: -5,
			max: 10,
			step: .5,
			get: () => a1,
			set: setA1
		},
		step: {
			type: "number",
			label: k === "arithmetic" ? "common difference d" : "common ratio r",
			min: k === "arithmetic" ? -5 : -2,
			max: k === "arithmetic" ? 5 : 2,
			step: k === "arithmetic" ? 1 : .1,
			get: () => d,
			set: setD
		},
		count: {
			type: "number",
			label: "how many terms",
			min: 2,
			max: 16,
			step: 1,
			get: () => n,
			set: setN
		}
	});
	const isArith = k === "arithmetic";
	const termTex = isArith ? `a_n = ${fnum(a1)} + (n-1)\\cdot ${fnum(d)}` : `a_n = ${fnum(a1)}\\cdot (${fnum(d)})^{\\,n-1}`;
	const sumTex = isArith ? `S_n = \\tfrac{n}{2}\\,(2a_1+(n-1)d)` : `S_n = a_1\\dfrac{1-r^{\\,n}}{1-r}`;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "lab-bar",
			style: {
				gap: 8,
				flexWrap: "wrap"
			},
			children: [/* @__PURE__ */ jsx(Chip, {
				selected: isArith,
				onClick: () => setK("arithmetic"),
				children: "arithmetic (+d)"
			}), /* @__PURE__ */ jsx(Chip, {
				selected: !isArith,
				onClick: () => setK("geometric"),
				children: "geometric (×r)"
			})]
		}),
		/* @__PURE__ */ jsx("div", {
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
				"aria-label": `${k} sequence, ${n} terms, running total ${fnum(Sn)}`,
				children: [
					/* @__PURE__ */ jsx("line", {
						x1: ML,
						y1: y0,
						x2: W - MR,
						y2: y0,
						stroke: "var(--stage-muted)",
						strokeWidth: 1
					}),
					sInf != null && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("line", {
						x1: ML,
						y1: yOf(sInf),
						x2: W - MR,
						y2: yOf(sInf),
						stroke: "var(--stage-good)",
						strokeWidth: 1.5,
						strokeDasharray: "6 5"
					}), /* @__PURE__ */ jsxs("text", {
						x: W - MR,
						y: yOf(sInf) - 5,
						textAnchor: "end",
						fontSize: 11,
						fontWeight: 700,
						fill: "var(--stage-good)",
						children: ["S∞ = ", fnum(sInf)]
					})] }),
					ts.map((t, i) => {
						const bw = Math.min(28, colW * .5);
						const top = Math.min(yOf(t), y0), h = Math.abs(yOf(t) - y0);
						return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
							x: cx(i) - bw / 2,
							y: top,
							width: bw,
							height: Math.max(.5, h),
							rx: 3,
							fill: "color-mix(in oklab, var(--stage-accent) 78%, transparent)"
						}), /* @__PURE__ */ jsx("text", {
							x: cx(i),
							y: y0 + (t >= 0 ? 14 : -6),
							textAnchor: "middle",
							fontSize: 10,
							fill: "var(--stage-muted)",
							children: i + 1
						})] }, i);
					}),
					/* @__PURE__ */ jsx("polyline", {
						points: sums.map((s, i) => `${cx(i)},${yOf(s)}`).join(" "),
						fill: "none",
						stroke: "var(--stage-good)",
						strokeWidth: 2.5
					}),
					sums.map((s, i) => /* @__PURE__ */ jsx("circle", {
						cx: cx(i),
						cy: yOf(s),
						r: 3,
						fill: "var(--stage-good)"
					}, i))
				]
			})
		}),
		/* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				gap: 16,
				flexWrap: "wrap",
				alignItems: "center",
				margin: "10px 0",
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				/* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Tex$1, { tex: termTex }) }),
				/* @__PURE__ */ jsx("span", {
					style: {
						color: "var(--stage-accent)",
						fontWeight: 700
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `a_{${n}} = ${fnum(nthTerm(spec, n))}` })
				}),
				/* @__PURE__ */ jsx("span", {
					style: {
						color: "var(--stage-good)",
						fontWeight: 700
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `S_{${n}} = ${fnum(Sn)}` })
				}),
				sInf != null ? /* @__PURE__ */ jsx("span", {
					style: {
						color: "var(--stage-good)",
						fontWeight: 700
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `S_\\infty = ${fnum(sInf)}` })
				}) : !isArith && /* @__PURE__ */ jsxs("span", {
					style: {
						color: "var(--stage-bad)",
						fontWeight: 600
					},
					children: [
						"diverges (",
						/* @__PURE__ */ jsx(Tex$1, { tex: "|r| \\\\ge 1" }),
						")"
					]
				})
			]
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "a₁",
				value: fnum(a1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: a1,
					min: -5,
					max: 10,
					step: .5,
					onChange: setA1,
					ariaLabel: "first term"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: isArith ? "d" : "r",
				value: fnum(d),
				children: /* @__PURE__ */ jsx(Slider, {
					value: d,
					min: isArith ? -5 : -2,
					max: isArith ? 5 : 2,
					step: isArith ? 1 : .1,
					onChange: setD,
					ariaLabel: isArith ? "common difference" : "common ratio"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "terms",
				value: n,
				children: /* @__PURE__ */ jsx(Slider, {
					value: n,
					min: 2,
					max: 16,
					step: 1,
					onChange: setN,
					ariaLabel: "number of terms"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx(ChallengeCard, {
				questions: predictQ,
				state: ch,
				title: "Predict first"
			}),
			/* @__PURE__ */ jsxs("p", {
				style: {
					fontSize: 12.5,
					color: "var(--stage-muted)",
					marginTop: 4
				},
				children: [/* @__PURE__ */ jsx(Tex$1, { tex: sumTex }), !isArith && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					", with ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "|r| < 1" }),
					" the tail shrinks to nothing, so the total converges."
				] })]
			}),
			/* @__PURE__ */ jsx(HintLadder, { hints })
		] }),
		children: figure
	});
}

//#endregion
export { SequenceLab };