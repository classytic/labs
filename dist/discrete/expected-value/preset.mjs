'use client';

import { mulberry32 } from "../../core/rng.mjs";
import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider, Stepper } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { expectedValue } from "../core/probability.mjs";
import { CATEGORICAL } from "../../kit/palette.mjs";
import { useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/expected-value/preset.tsx
/**
* ExpectedValueLab, E[X] = Σ value·prob, made physical: each outcome is a WEIGHT
* (heavier = more likely) sitting at its value on a number line, and the expected
* value is exactly where they BALANCE (the long-run average payout). Framed as "is
* this game worth it?": a cost marker shows the house edge when E[X] < cost. Then
* SPIN it many times and watch the running average settle onto E[X] (the law of
* large numbers, the average is the expectation, earned).
*
* Drag the probabilities/values; the fulcrum slides. Kernel = expectedValue; seeded
* rng for replayable spins.
*/
const W = 520, H = 210, ML = 30, MR = 20, AXIS = 138;
const PAL = CATEGORICAL;
function ExpectedValueLab({ outcomes = [
	{
		label: "lose",
		value: 0,
		prob: .7
	},
	{
		label: "small",
		value: 5,
		prob: .25
	},
	{
		label: "jackpot",
		value: 50,
		prob: .05
	}
], cost = 5, title = "Expected value: is the game fair?", prompt, objectives, hints: hintList, controlId }) {
	const [probs, setProbs] = useState(outcomes.map((o) => o.prob));
	const [vals, setVals] = useState(outcomes.map((o) => o.value));
	const [plays, setPlays] = useState(0);
	const [total, setTotal] = useState(0);
	const rng = useRef(mulberry32(99));
	const hints = useHints(hintList);
	const sumP = probs.reduce((a, b) => a + b, 0) || 1;
	const pn = probs.map((p) => p / sumP);
	const ev = useMemo(() => expectedValue(vals.map((v, i) => ({
		value: v,
		p: pn[i]
	}))), [vals, probs]);
	const lo = Math.min(0, ...vals), hi = Math.max(...vals, cost) * 1.12 || 1;
	const xOf = (v) => ML + (v - lo) / (hi - lo) * (W - ML - MR);
	const avg = plays ? total / plays : null;
	const tol = Math.max(.5, Math.abs(ev) * .05);
	useCheckpoint({
		solved: plays >= 30 && avg != null && Math.abs(avg - ev) <= tol,
		activity: `expected-value:${title}`,
		hintsUsed: hints?.count ?? 0
	});
	const spin = (times) => {
		let t = total, c = plays;
		for (let s = 0; s < times; s++) {
			let r = rng.current(), i = 0;
			while (i < pn.length - 1 && r > pn[i]) {
				r -= pn[i];
				i++;
			}
			t += vals[i];
			c++;
		}
		setTotal(t);
		setPlays(c);
	};
	const reset = () => {
		setProbs(outcomes.map((o) => o.prob));
		setVals(outcomes.map((o) => o.value));
		setPlays(0);
		setTotal(0);
		rng.current = mulberry32(99);
	};
	useControlSurface(controlId, {
		...Object.fromEntries(outcomes.map((o, i) => [`p_${o.label ?? i}`, {
			type: "number",
			label: `prob ${o.label ?? i}`,
			min: 0,
			max: 1,
			step: .05,
			get: () => probs[i] ?? 0,
			set: (v) => {
				setProbs((a) => a.map((x, j) => j === i ? v : x));
			}
		}])),
		spin: {
			type: "action",
			label: "spin 50",
			invoke: () => spin(50)
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
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
			"aria-label": `expected value ${ev.toFixed(2)}`,
			children: [
				vals.map((v, i) => {
					const r = 7 + 24 * pn[i];
					return /* @__PURE__ */ jsxs("g", { children: [
						/* @__PURE__ */ jsx("line", {
							x1: xOf(v),
							y1: AXIS,
							x2: xOf(v),
							y2: AXIS - 40 - r,
							stroke: "var(--stage-grid)",
							strokeWidth: 1
						}),
						/* @__PURE__ */ jsx("circle", {
							cx: xOf(v),
							cy: AXIS - 40 - r,
							r,
							fill: PAL[i % PAL.length],
							opacity: .9
						}),
						/* @__PURE__ */ jsxs("text", {
							x: xOf(v),
							y: AXIS - 40 - r,
							textAnchor: "middle",
							dominantBaseline: "central",
							fontSize: 11,
							fontWeight: 700,
							fill: "white",
							children: [(pn[i] * 100).toFixed(0), "%"]
						}),
						/* @__PURE__ */ jsx("text", {
							x: xOf(v),
							y: 166,
							textAnchor: "middle",
							fontSize: 11,
							fill: "var(--stage-fg)",
							fontWeight: 600,
							children: outcomes[i]?.label ?? v
						})
					] }, i);
				}),
				/* @__PURE__ */ jsx("line", {
					x1: ML,
					y1: AXIS,
					x2: W - MR,
					y2: AXIS,
					stroke: "var(--stage-fg)",
					strokeWidth: 2.5
				}),
				vals.map((v, i) => /* @__PURE__ */ jsx("text", {
					x: xOf(v),
					y: 152,
					textAnchor: "middle",
					fontSize: 10,
					fill: "var(--stage-muted)",
					style: { fontVariantNumeric: "tabular-nums" },
					children: v
				}, i)),
				cost != null && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("line", {
					x1: xOf(cost),
					y1: AXIS - 70,
					x2: xOf(cost),
					y2: AXIS,
					stroke: "var(--stage-danger, #e03131)",
					strokeWidth: 1.5,
					strokeDasharray: "3 3"
				}), /* @__PURE__ */ jsxs("text", {
					x: xOf(cost),
					y: AXIS - 74,
					textAnchor: "middle",
					fontSize: 10,
					fontWeight: 700,
					fill: "var(--stage-danger, #e03131)",
					children: ["cost ", cost]
				})] }),
				/* @__PURE__ */ jsxs("g", {
					style: { transition: "transform .15s" },
					children: [/* @__PURE__ */ jsx("path", {
						d: `M${xOf(ev)},139 l-10,17 h20 Z`,
						fill: "var(--stage-good)"
					}), /* @__PURE__ */ jsxs("text", {
						x: xOf(ev),
						y: 170,
						textAnchor: "middle",
						fontSize: 11,
						fontWeight: 800,
						fill: "var(--stage-good)",
						children: ["E[X]=", ev.toFixed(2)]
					})]
				}),
				avg != null && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("circle", {
					cx: xOf(avg),
					cy: AXIS - 6,
					r: 5,
					fill: "var(--stage-accent)"
				}), /* @__PURE__ */ jsxs("text", {
					x: xOf(avg),
					y: AXIS - 12,
					textAnchor: "middle",
					fontSize: 9,
					fill: "var(--stage-accent)",
					fontWeight: 700,
					children: ["avg ", avg.toFixed(2)]
				})] })
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
						children: "expected value"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "lab-callout-big",
						children: ev.toFixed(2)
					}),
					cost != null && /* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 12,
							fontWeight: 700,
							color: ev >= cost ? "var(--stage-good)" : "var(--stage-danger, #e03131)"
						},
						children: ev >= cost ? "fair / favours you" : `house edge ${(cost - ev).toFixed(2)}/play`
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					fontSize: 13,
					display: "grid",
					gap: 2
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-muted)" },
						children: /* @__PURE__ */ jsx(Tex$1, { tex: "E[X] = \\sum \\text{value} \\cdot \\text{prob}" })
					}),
					/* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Tex$1, { tex: "= " + vals.map((v, i) => `${v} \\cdot ${(pn[i] * 100).toFixed(0)}\\%`).join(" + ") }) }),
					/* @__PURE__ */ jsxs("span", { children: ["= ", /* @__PURE__ */ jsx("b", {
						style: { color: "var(--stage-good)" },
						children: ev.toFixed(2)
					})] })
				]
			}),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "lab-prompt",
				style: { fontSize: 13 },
				children: "Play it for real, the average payout homes in on E[X]."
			}), /* @__PURE__ */ jsxs(ControlBar, { children: [
				/* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => spin(1),
					children: "spin 1"
				}),
				/* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => spin(50),
					children: "spin 50"
				}),
				/* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => {
						setPlays(0);
						setTotal(0);
						rng.current = mulberry32(99);
					},
					children: "clear"
				}),
				plays > 0 && /* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 12,
						fontWeight: 700
					},
					children: [
						plays,
						" plays · avg ",
						avg.toFixed(2)
					]
				})
			] })] })
		] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			outcomes.map((o, i) => /* @__PURE__ */ jsx(Field, {
				label: `${o.label ?? `out ${i}`} prob`,
				value: `${(pn[i] * 100).toFixed(0)}%`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: probs[i] ?? 0,
					min: 0,
					max: 1,
					step: .05,
					onChange: (v) => setProbs((a) => a.map((x, j) => j === i ? v : x)),
					ariaLabel: `prob ${o.label ?? i}`
				})
			}, i)),
			/* @__PURE__ */ jsx(Field, {
				label: "value (last)",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: vals[vals.length - 1] ?? 0,
					onChange: (v) => setVals((a) => a.map((x, j) => j === a.length - 1 ? v : x)),
					min: 0,
					max: 100
				})
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "reset"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { ExpectedValueLab };