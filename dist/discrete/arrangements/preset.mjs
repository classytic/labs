'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { CheckButton, Chip, StatusPill, Stepper } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { factorial, multinomial } from "../core/combinatorics.mjs";
import { CATEGORICAL } from "../../kit/palette.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/arrangements/preset.tsx
/**
* ArrangementsLab, arranging things in a row when some are IDENTICAL (the multiset
* permutation the slots/selection labs don't cover). The classic MISSISSIPPI, or a
* row of coloured beads. The derivation, made concrete: if all n were distinct
* there'd be n! orders; but swapping two identical letters gives the SAME word, so
* each real arrangement is counted (count of that letter)! times, divide it out:
*
*   n! / (n₁! · n₂! · …)        (the multinomial coefficient)
*
* You watch two identical tiles swap into the same row (the overcount), then the
* formula falls out. Predict-then-check. Kernel = factorial / multinomial.
*/
const PALETTE = CATEGORICAL;
function fromWord(w) {
	const order = [], m = /* @__PURE__ */ new Map();
	for (const ch of w.toUpperCase()) {
		if (!/[A-Z]/.test(ch)) continue;
		if (!m.has(ch)) order.push(ch);
		m.set(ch, (m.get(ch) ?? 0) + 1);
	}
	return order.map((l) => ({
		label: l,
		count: m.get(l)
	}));
}
function ArrangementsLab({ word, items, title = "Arrange with repeats", prompt, objectives, hints: hintList, controlId }) {
	const base = useMemo(() => items ?? (word ? fromWord(word) : fromWord("MISSISSIPPI")), [items, word]);
	const [counts, setCounts] = useState(base.map((g) => g.count));
	const [guess, setGuess] = useState(0);
	const [checked, setChecked] = useState(false);
	const [peeked, setPeeked] = useState(false);
	const hints = useHints(hintList);
	const live = base.map((g, i) => ({
		...g,
		count: counts[i],
		color: g.color ?? PALETTE[i % PALETTE.length]
	})).filter((g) => g.count > 0);
	const n = live.reduce((a, g) => a + g.count, 0);
	const nFact = factorial(n);
	const total = useMemo(() => n > 0 ? multinomial(...live.map((g) => g.count)) : 1, [counts]);
	const repeats = live.filter((g) => g.count > 1);
	const tiles = live.flatMap((g) => Array.from({ length: g.count }, () => g));
	const swapGroup = repeats.slice().sort((a, b) => b.count - a.count)[0];
	const setI = (i, v) => {
		setChecked(false);
		setCounts((c) => c.map((x, j) => j === i ? Math.max(0, Math.min(8, v)) : x));
	};
	const reset = () => {
		setChecked(false);
		setPeeked(false);
		setGuess(0);
		setCounts(base.map((g) => g.count));
	};
	const solved = checked && guess === total && !peeked;
	useCheckpoint({
		solved,
		activity: `arrangements:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		...Object.fromEntries(base.map((g, i) => [`count_${g.label}`, {
			type: "number",
			label: `# of ${g.label}`,
			min: 0,
			max: 8,
			step: 1,
			get: () => counts[i] ?? 0,
			set: (v) => setI(i, v)
		}])),
		reveal: {
			type: "action",
			label: "reveal the count",
			invoke: () => {
				setPeeked(true);
				setGuess(total);
				setChecked(true);
			}
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
		}
	});
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 16
		},
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
				className: "lab-field-label",
				children: [n, " items in a row, identical ones share a colour"]
			}), /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					gap: 4,
					flexWrap: "wrap"
				},
				children: tiles.map((g, i) => {
					const isSwap = swapGroup && g.label === swapGroup.label;
					const swapIdx = isSwap ? tiles.filter((t, j) => j < i && t.label === g.label).length : -1;
					const flag = isSwap && swapIdx < 2;
					return /* @__PURE__ */ jsx("span", {
						style: {
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: 30,
							height: 30,
							borderRadius: 8,
							fontWeight: 800,
							fontSize: 15,
							color: "white",
							background: g.color,
							boxShadow: flag ? "0 0 0 2px var(--stage-fg)" : "none"
						},
						children: g.label
					}, i);
				})
			})] }),
			swapGroup && /* @__PURE__ */ jsxs("p", {
				className: "lab-prompt",
				children: [
					"Swap the two ringed ",
					/* @__PURE__ */ jsx("b", {
						style: { color: swapGroup.color },
						children: swapGroup.label
					}),
					"'s ⇄, it's the ",
					/* @__PURE__ */ jsx("b", { children: "same row" }),
					". So every arrangement is counted ",
					swapGroup.count,
					"! times over (once per ordering of the ",
					swapGroup.count,
					" ",
					swapGroup.label,
					"'s)."
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					padding: "10px 12px",
					borderRadius: 10,
					border: "1px dashed var(--stage-grid)",
					fontSize: 15,
					fontVariantNumeric: "tabular-nums",
					display: "grid",
					gap: 4
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 11,
							fontWeight: 700,
							color: "var(--stage-muted)"
						},
						children: "📐 WHY THE FORMULA"
					}),
					/* @__PURE__ */ jsxs("span", { children: [
						"if all ",
						n,
						" were different: ",
						/* @__PURE__ */ jsxs("b", { children: [n, "!"] }),
						" = ",
						nFact.toLocaleString(),
						" orders"
					] }),
					repeats.length > 0 && /* @__PURE__ */ jsxs("span", { children: [
						"but identical copies repeat: ",
						/* @__PURE__ */ jsx(Tex$1, { tex: `\\div\\ ${repeats.map((g) => `${g.count}!`).join(" \\cdot ")}` }),
						" ",
						/* @__PURE__ */ jsxs("span", {
							style: { color: "var(--stage-muted)" },
							children: [
								"(",
								repeats.map((g) => `the ${g.count} ${g.label}'s`).join(", "),
								")"
							]
						})
					] }),
					/* @__PURE__ */ jsxs("span", {
						style: { fontWeight: 800 },
						children: [
							/* @__PURE__ */ jsx(Tex$1, { tex: `${n}! / (${live.map((g) => `${g.count}!`).join(" \\cdot ")}) = ${nFact.toLocaleString().replace(/,/g, "{,}")} / ${live.reduce((a, g) => a * factorial(g.count), 1).toLocaleString().replace(/,/g, "{,}")} =` }),
							" ",
							/* @__PURE__ */ jsx("span", {
								style: { color: "var(--stage-good)" },
								children: total.toLocaleString()
							}),
							" distinct arrangements"
						]
					})
				]
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
					children: "distinct arrangements"
				}),
				/* @__PURE__ */ jsx("span", {
					className: "lab-callout-big",
					children: total.toLocaleString()
				}),
				/* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `${n}! / ${live.map((g) => `${g.count}!`).join(" \\cdot ")}` })
				})
			]
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
			className: "lab-prompt",
			children: "🎯 How many distinct rows? Guess, then check."
		}), /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "your answer",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: guess,
					onChange: (v) => {
						setGuess(v);
						setChecked(false);
					},
					min: 0,
					max: Math.max(100, total)
				})
			}),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: () => setChecked(true),
				children: "Check"
			}),
			checked && /* @__PURE__ */ jsx(StatusPill, {
				ok: guess === total,
				children: guess === total ? "✓ right!" : "not yet"
			})
		] })] })] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [base.map((g, i) => /* @__PURE__ */ jsx(Field, {
			label: `# ${g.label}`,
			children: /* @__PURE__ */ jsx(Stepper, {
				value: counts[i] ?? 0,
				onChange: (v) => setI(i, v),
				min: 0,
				max: 8
			})
		}, g.label)), /* @__PURE__ */ jsx(Chip, {
			selected: false,
			onClick: reset,
			children: "reset"
		})] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(RevealSolution, {
			available: !solved,
			buttonLabel: "Show the count",
			solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Tex$1, { tex: `${n}! / (${live.map((g) => `${g.count}!`).join(" \\cdot ")}) =` }),
				" ",
				/* @__PURE__ */ jsx("b", { children: total.toLocaleString() }),
				" distinct arrangements."
			] }),
			onReveal: () => {
				setPeeked(true);
				setGuess(total);
				setChecked(true);
			}
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { ArrangementsLab };