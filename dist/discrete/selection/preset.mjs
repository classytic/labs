'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { CheckButton, Chip, StatusPill, Stepper } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { nCr } from "../core/combinatorics.mjs";
import { CATEGORICAL } from "../../kit/palette.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/selection/preset.tsx
/**
* SelectionLab, "draw from the bag": counting (and probability) when you SELECT a
* handful from groups, the pattern behind colored-ball urns and card hands. Pick how
* many of each colour you want in the draw; the lab counts the favourable selections
* as a product of per-group choices and divides by the total selections:
*
*   ways = ∏ C(groupᵢ, wantᵢ)            P = ways / C(N, k)
*
* One model spans urn problems (5 red 3 blue, draw 3 → P(2 red 1 blue)) and card
* hands (13 hearts of 52, draw 5 → P(2 hearts)). Concrete: the bag is drawn as real
* balls. Predict the count, then check. Kernel = nCr (the combination is the engine).
*/
const PALETTE = CATEGORICAL;
const NAMED = {
	red: "#e03131",
	blue: "#1c7ed6",
	green: "#2f9e44",
	yellow: "#f59f00",
	purple: "#9c36b5",
	teal: "#0ca678",
	black: "#343a40",
	orange: "#e8590c"
};
const colorOf = (g, i) => g.color ?? NAMED[g.label.toLowerCase()] ?? PALETTE[i % PALETTE.length];
const frac = (w) => {
	for (let d = 2; d <= 200; d++) {
		const x = w * d;
		if (Math.abs(x - Math.round(x)) < 1e-9) return `${Math.round(x)}/${d}`;
	}
	return w.toFixed(4);
};
function SelectionLab({ groups = [
	{
		label: "red",
		count: 5
	},
	{
		label: "blue",
		count: 3
	},
	{
		label: "green",
		count: 2
	}
], draw = 3, want, mode: mode0 = "probability", title = "Draw from the bag", prompt, objectives, hints: hintList, controlId }) {
	const N = useMemo(() => groups.reduce((a, g) => a + g.count, 0), [groups]);
	const [k, setK] = useState(draw);
	const [pick, setPick] = useState(want ?? groups.map((_, i) => i === 0 ? Math.min(2, groups[0].count) : i === 1 ? 1 : 0));
	const [mode, setMode] = useState(mode0);
	const [guess, setGuess] = useState(0);
	const [checked, setChecked] = useState(false);
	const [peeked, setPeeked] = useState(false);
	const hints = useHints(hintList);
	const sumPick = pick.reduce((a, b) => a + b, 0);
	const valid = sumPick === k && pick.every((w, i) => w <= groups[i].count && w >= 0);
	const ways = useMemo(() => valid ? pick.reduce((a, w, i) => a * nCr(groups[i].count, w), 1) : 0, [
		pick,
		groups,
		valid
	]);
	const total = useMemo(() => nCr(N, k), [N, k]);
	const prob = total ? ways / total : 0;
	const setPickI = (i, v) => {
		setChecked(false);
		setPick((p) => p.map((w, j) => j === i ? Math.max(0, Math.min(groups[i].count, v)) : w));
	};
	const reset = () => {
		setChecked(false);
		setPeeked(false);
		setGuess(0);
	};
	const solved = checked && valid && guess === ways && !peeked;
	useCheckpoint({
		solved,
		activity: `selection:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		draw: {
			type: "number",
			label: "how many drawn (k)",
			min: 1,
			max: N,
			step: 1,
			get: () => k,
			set: (v) => setK(Math.round(v))
		},
		mode: {
			type: "enum",
			label: "count or probability",
			options: ["count", "probability"],
			get: () => mode,
			set: (v) => setMode(v)
		},
		...Object.fromEntries(groups.map((g, i) => [`want_${g.label}`, {
			type: "number",
			label: `want ${g.label}`,
			min: 0,
			max: g.count,
			step: 1,
			get: () => pick[i] ?? 0,
			set: (v) => setPickI(i, v)
		}])),
		reveal: {
			type: "action",
			label: "reveal the count",
			invoke: () => {
				setPeeked(true);
				setGuess(ways);
				setChecked(true);
			}
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
		}
	});
	const renderBalls = N <= 40;
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 16
		},
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
				className: "lab-field-label",
				children: [
					"the bag, ",
					N,
					" total"
				]
			}), /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					gap: 16,
					flexWrap: "wrap"
				},
				children: groups.map((g, i) => /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gap: 4,
						justifyItems: "start"
					},
					children: [/* @__PURE__ */ jsxs("span", {
						style: {
							fontSize: 12,
							fontWeight: 700,
							color: colorOf(g, i)
						},
						children: [
							g.count,
							" ",
							g.label
						]
					}), renderBalls ? /* @__PURE__ */ jsx("div", {
						style: {
							display: "flex",
							gap: 3,
							flexWrap: "wrap",
							maxWidth: 150
						},
						children: Array.from({ length: g.count }, (_, j) => /* @__PURE__ */ jsx("span", { style: {
							width: 16,
							height: 16,
							borderRadius: "50%",
							background: colorOf(g, i),
							opacity: j < (pick[i] ?? 0) ? 1 : .32,
							boxShadow: j < (pick[i] ?? 0) ? "0 0 0 2px var(--stage-fg)" : "none"
						} }, j))
					}) : /* @__PURE__ */ jsx("span", { style: {
						width: 40,
						height: 16,
						borderRadius: 8,
						background: colorOf(g, i)
					} })]
				}, g.label))
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
				className: "lab-field-label",
				children: [
					"draw ",
					k,
					", you want: ",
					groups.map((g, i) => `${pick[i] ?? 0} ${g.label}`).join(" + ")
				]
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 6,
					flexWrap: "wrap",
					alignItems: "center",
					minHeight: 26
				},
				children: [groups.flatMap((g, i) => Array.from({ length: pick[i] ?? 0 }, (_, j) => /* @__PURE__ */ jsx("span", { style: {
					width: 22,
					height: 22,
					borderRadius: "50%",
					background: colorOf(g, i)
				} }, `${i}-${j}`))), !valid && /* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 13,
						color: "var(--stage-danger, #e03131)",
						fontWeight: 600
					},
					children: [
						"← must total exactly ",
						k,
						" (now ",
						sumPick,
						")"
					]
				})]
			})] }),
			/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: 16,
					fontWeight: 700,
					fontVariantNumeric: "tabular-nums"
				},
				children: valid ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx(Tex$1, { tex: `\\text{ways} = ${groups.map((g, i) => `C(${g.count},${pick[i]})`).join(" \\cdot ")} = ${groups.map((g, i) => nCr(g.count, pick[i])).join(" \\cdot ")} =` }),
					" ",
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-good)" },
						children: ways
					})
				] }), mode === "probability" && /* @__PURE__ */ jsxs("div", {
					style: { marginTop: 4 },
					children: [
						/* @__PURE__ */ jsx(Tex$1, { tex: `P = ${ways} / C(${N},${k}) = ${ways}/${total} =` }),
						" ",
						/* @__PURE__ */ jsx("span", {
							style: { color: "var(--stage-good)" },
							children: frac(prob)
						}),
						" ",
						/* @__PURE__ */ jsx(Tex$1, { tex: `\\approx ${prob.toFixed(3)}` })
					]
				})] }) : /* @__PURE__ */ jsxs("span", {
					style: {
						color: "var(--stage-muted)",
						fontWeight: 500,
						fontSize: 14
					},
					children: [
						"Set how many of each colour to draw, they must add up to ",
						k,
						"."
					]
				})
			})
		]
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
					children: mode === "probability" ? "probability" : "favourable ways"
				}),
				/* @__PURE__ */ jsx("span", {
					className: "lab-callout-big",
					children: mode === "probability" ? valid ? frac(prob) : ", " : ways.toLocaleString()
				}),
				/* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: [
						"of C(",
						N,
						",",
						k,
						") = ",
						total.toLocaleString(),
						" total draws"
					]
				})
			]
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
			className: "lab-prompt",
			children: [
				"🎯 How many of the ",
				total.toLocaleString(),
				" possible draws match? Guess, then check."
			]
		}), /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "favourable ways",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: guess,
					onChange: (v) => {
						setGuess(v);
						setChecked(false);
					},
					min: 0,
					max: Math.max(50, total)
				})
			}),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: () => setChecked(true),
				disabled: !valid,
				children: "Check"
			}),
			checked && /* @__PURE__ */ jsx(StatusPill, {
				ok: guess === ways,
				children: guess === ways ? "✓ right!" : "not yet"
			})
		] })] })] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			groups.map((g, i) => /* @__PURE__ */ jsx(Field, {
				label: `draw ${g.label}`,
				children: /* @__PURE__ */ jsx(Stepper, {
					value: pick[i] ?? 0,
					onChange: (v) => setPickI(i, v),
					min: 0,
					max: g.count
				})
			}, g.label)),
			/* @__PURE__ */ jsx(Field, {
				label: "total drawn k",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: k,
					onChange: (v) => {
						setK(Math.max(1, Math.min(N, v)));
						setChecked(false);
					},
					min: 1,
					max: N
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "show",
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "flex",
						gap: 6
					},
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mode === "count",
						onClick: () => setMode("count"),
						children: "count"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: mode === "probability",
						onClick: () => setMode("probability"),
						children: "probability"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "reset"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(RevealSolution, {
			available: !solved,
			buttonLabel: "Show the count",
			solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Tex$1, { tex: `${groups.map((g, i) => `C(${g.count},${pick[i]})`).join(" \\cdot ")} =` }),
				" ",
				/* @__PURE__ */ jsx("b", { children: ways }),
				mode === "probability" && /* @__PURE__ */ jsxs(Fragment$1, { children: [" favourable, so P = ", frac(prob)] }),
				"."
			] }),
			onReveal: () => {
				setPeeked(true);
				setGuess(ways);
				setChecked(true);
			}
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { SelectionLab };