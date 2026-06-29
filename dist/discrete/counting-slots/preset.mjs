'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { CheckButton, Chip, StatusPill, Stepper } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { factorial, nCr, nPr } from "../core/combinatorics.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/counting-slots/preset.tsx
/**
* CountingSlotsLab, counting made concrete, the FUN way (the tree drowns past ~8
* leaves; this scales and reads friendly). The multiplication principle as filling
* a row of POSITIONS: fill slot 1 from the whole pool, slot 2 from what's left, … , 
* the pool shrinks, the product builds (4 × 3 × 2). It covers the whole family from
* one model:
*   • arrange (order matters)      → permutations nPr  (k = n ⇒ factorial n!)
*   • arrange + repeats            → nᵏ  (PINs, with replacement)
*   • choose (order doesn't)       → combinations nCr, and you WATCH the k! orderings
*     of one selection collapse into a single group (the ÷k! correction, made literal)
*
* Predict-then-check; the kernel (nPr/nCr/factorial) is the source of truth.
*/
const allPerms = (a) => a.length <= 1 ? [a] : a.flatMap((x, i) => allPerms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
function CountingSlotsLab({ items = [
	"A",
	"B",
	"C",
	"D"
], slots = 3, positions, mode: mode0 = "arrange", replacement: repl0 = false, title = "Counting by filling slots", prompt, objectives, hints: hintList, controlId }) {
	const n = items.length;
	const [mode, setMode] = useState(mode0);
	const [repl, setRepl] = useState(repl0);
	const [k, setK] = useState(Math.min(slots, repl0 ? slots : n));
	const [step, setStep] = useState(0);
	const [guess, setGuess] = useState(0);
	const [checked, setChecked] = useState(false);
	const [peeked, setPeeked] = useState(false);
	const hints = useHints(hintList);
	const choices = (i) => repl ? n : n - i;
	const arrangeTotal = useMemo(() => repl ? n ** k : nPr(n, k), [
		repl,
		n,
		k
	]);
	const total = mode === "choose" ? nCr(n, k) : arrangeTotal;
	const sample = useMemo(() => Array.from({ length: k }, (_, i) => items[repl ? i % n : i]), [
		items,
		k,
		repl,
		n
	]);
	const productSoFar = useMemo(() => {
		let p = 1;
		for (let i = 0; i < step; i++) p *= choices(i);
		return p;
	}, [
		step,
		repl,
		n
	]);
	const reset = () => {
		setStep(0);
		setGuess(0);
		setChecked(false);
		setPeeked(false);
	};
	const fillNext = () => setStep((s) => Math.min(k, s + 1));
	const solved = checked && guess === total && !peeked;
	useCheckpoint({
		solved,
		activity: `counting-slots:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		mode: {
			type: "enum",
			label: "order matters?",
			options: ["arrange", "choose"],
			get: () => mode,
			set: (v) => {
				setMode(v);
				reset();
			}
		},
		replacement: {
			type: "boolean",
			label: "allow repeats",
			get: () => repl,
			set: (v) => {
				setRepl(v);
				reset();
			}
		},
		slots: {
			type: "number",
			label: "positions k",
			min: 1,
			max: repl ? 6 : n,
			step: 1,
			get: () => k,
			set: (v) => {
				setK(Math.round(v));
				reset();
			}
		},
		fill: {
			type: "action",
			label: "fill the next slot",
			invoke: fillNext
		},
		reveal: {
			type: "action",
			label: "reveal the count",
			invoke: () => {
				setStep(k);
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
	const used = new Set(repl ? [] : sample.slice(0, step));
	const filled = step >= k;
	const collapse = mode === "choose" && filled;
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 16
		},
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
				className: "lab-field-label",
				children: [
					"the pool, ",
					n,
					" to pick from",
					!repl && ", each used once"
				]
			}), /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					gap: 6,
					flexWrap: "wrap"
				},
				children: items.map((it, i) => /* @__PURE__ */ jsx("span", {
					style: {
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						minWidth: 34,
						height: 34,
						padding: "0 8px",
						borderRadius: 9,
						fontSize: 17,
						fontWeight: 700,
						border: "1.5px solid var(--stage-grid)",
						background: used.has(it) ? "transparent" : "color-mix(in oklab, var(--stage-accent) 12%, transparent)",
						opacity: used.has(it) ? .3 : 1,
						textDecoration: used.has(it) ? "line-through" : "none"
					},
					children: it
				}, i))
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
				className: "lab-field-label",
				children: [
					k,
					" position",
					k === 1 ? "" : "s",
					" to fill ",
					mode === "choose" ? "(a group, order won't matter)" : "(in order)"
				]
			}), /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					gap: 10,
					flexWrap: "wrap",
					alignItems: "flex-end"
				},
				children: Array.from({ length: k }, (_, i) => {
					const done = i < step, here = i === step;
					return /* @__PURE__ */ jsxs("div", {
						style: {
							display: "grid",
							justifyItems: "center",
							gap: 3
						},
						children: [
							positions?.[i] && /* @__PURE__ */ jsx("span", {
								style: { fontSize: 15 },
								children: positions[i]
							}),
							/* @__PURE__ */ jsx("span", {
								style: {
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: 46,
									height: 46,
									borderRadius: 11,
									fontSize: 20,
									fontWeight: 800,
									border: `2px ${done ? "solid" : "dashed"} ${here ? "var(--stage-good)" : done ? "var(--stage-accent)" : "var(--stage-grid)"}`,
									background: done ? "color-mix(in oklab, var(--stage-accent) 16%, transparent)" : "transparent",
									color: done ? "var(--stage-fg)" : "var(--stage-muted)"
								},
								children: done ? sample[i] : here ? "?" : ""
							}),
							/* @__PURE__ */ jsxs("span", {
								style: {
									fontSize: 12,
									fontWeight: 700,
									color: done ? "var(--stage-accent)" : "var(--stage-muted)"
								},
								children: [done || here ? `${choices(i)}` : "·", /* @__PURE__ */ jsxs("span", {
									style: {
										fontWeight: 500,
										fontSize: 10
									},
									children: [" ", done || here ? "choices" : ""]
								})]
							})
						]
					}, i);
				})
			})] }),
			/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: 18,
					fontWeight: 800,
					fontVariantNumeric: "tabular-nums"
				},
				children: step === 0 ? /* @__PURE__ */ jsx("span", {
					style: {
						color: "var(--stage-muted)",
						fontWeight: 500,
						fontSize: 14
					},
					children: "Fill the first slot, how many choices?"
				}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx(Tex$1, { tex: Array.from({ length: step }, (_, i) => choices(i)).join(" \\times ") }),
					step < k && /* @__PURE__ */ jsxs("span", {
						style: { color: "var(--stage-muted)" },
						children: [" ", /* @__PURE__ */ jsx(Tex$1, { tex: "\\times \\ldots" })]
					}),
					filled && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						" = ",
						/* @__PURE__ */ jsx("span", {
							style: { color: "var(--stage-good)" },
							children: arrangeTotal
						}),
						" ",
						mode === "arrange" ? "arrangements" : "ordered"
					] }),
					!filled && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						" = ",
						productSoFar,
						" so far"
					] })
				] })
			}),
			collapse && /* @__PURE__ */ jsxs("div", {
				style: {
					padding: "10px 12px",
					borderRadius: 10,
					background: "color-mix(in oklab, var(--stage-warn) 10%, transparent)",
					border: "1px solid var(--stage-grid)"
				},
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "lab-field-label",
						children: "order doesn't matter, these are all the SAME group"
					}),
					factorial(k) <= 8 ? /* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							gap: 6,
							flexWrap: "wrap",
							alignItems: "center"
						},
						children: [
							allPerms(sample).map((p, i) => /* @__PURE__ */ jsx("span", {
								style: {
									fontWeight: 700,
									fontSize: 13,
									padding: "2px 7px",
									borderRadius: 7,
									background: "color-mix(in oklab, var(--stage-muted) 14%, transparent)"
								},
								children: p.join("")
							}, i)),
							/* @__PURE__ */ jsx("span", {
								style: {
									margin: "0 4px",
									color: "var(--stage-muted)"
								},
								children: "→"
							}),
							/* @__PURE__ */ jsxs("span", {
								style: {
									fontWeight: 800,
									padding: "2px 9px",
									borderRadius: 7,
									background: "color-mix(in oklab, var(--stage-good) 18%, transparent)",
									color: "var(--stage-good)"
								},
								children: [`{${sample.join(", ")}}`, " = 1"]
							})
						]
					}) : /* @__PURE__ */ jsxs("p", {
						style: { fontSize: 13 },
						children: [
							"Each group of ",
							k,
							" can be ordered in ",
							k,
							"! = ",
							factorial(k),
							" ways, all the same selection."
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						style: {
							marginTop: 8,
							fontSize: 16,
							fontWeight: 800,
							fontVariantNumeric: "tabular-nums"
						},
						children: [
							/* @__PURE__ */ jsx(Tex$1, { tex: `${arrangeTotal} \\div ${k}! = ${arrangeTotal} \\div ${factorial(k)} =` }),
							" ",
							/* @__PURE__ */ jsx("span", {
								style: { color: "var(--stage-good)" },
								children: total
							}),
							" groups"
						]
					})
				]
			}),
			filled && /* @__PURE__ */ jsxs("div", {
				style: {
					padding: "8px 12px",
					borderRadius: 10,
					border: "1px dashed var(--stage-grid)",
					fontSize: 14.5,
					fontVariantNumeric: "tabular-nums"
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 11,
							fontWeight: 700,
							letterSpacing: ".03em",
							color: "var(--stage-muted)"
						},
						children: "📐 SO THE FORMULA IS "
					}),
					/* @__PURE__ */ jsx("br", {}),
					repl ? /* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx(Tex$1, { tex: `n^{k} = ${n}^{${k}} =` }),
						" ",
						/* @__PURE__ */ jsx("b", {
							style: { color: "var(--stage-good)" },
							children: arrangeTotal
						}),
						" ",
						/* @__PURE__ */ jsxs("span", {
							style: { color: "var(--stage-muted)" },
							children: [
								"(each slot has all ",
								n,
								" again)"
							]
						})
					] }) : mode === "arrange" ? /* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx(Tex$1, { tex: k === n ? `n! = ${n}! =` : `P(${n},${k}) = ${n} \\times \\ldots \\times ${n - k + 1} = ${n}! / (${n}-${k})! =` }),
						" ",
						/* @__PURE__ */ jsx("b", {
							style: { color: "var(--stage-good)" },
							children: arrangeTotal
						}),
						" ",
						/* @__PURE__ */ jsxs("span", {
							style: { color: "var(--stage-muted)" },
							children: [
								"(the ",
								k === n ? "" : "unfilled ",
								"tail ",
								k === n ? "" : `${n - k}!`,
								" cancels)"
							]
						})
					] }) : /* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx(Tex$1, { tex: `C(${n},${k}) = P(${n},${k}) / ${k}! = ${n}! / (${k}! \\cdot (${n}-${k})!) =` }),
						" ",
						/* @__PURE__ */ jsx("b", {
							style: { color: "var(--stage-good)" },
							children: total
						})
					] })
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
					children: mode === "choose" ? `choose ${k} of ${n}` : repl ? `${k} from ${n} (repeats ok)` : k === n ? `arrange all ${n}` : `arrange ${k} of ${n}`
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
					children: mode === "choose" ? `${n}C${k}` : repl ? `${n}^${k}` : k === n ? `${n}!` : `${n}P${k}`
				})
			]
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
			className: "lab-prompt",
			children: "🎯 How many ways? Guess, then fill the slots to check."
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
					max: Math.max(50, total * 2)
				})
			}),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: () => setChecked(true),
				children: "Check"
			}),
			checked && /* @__PURE__ */ jsx(StatusPill, {
				ok: guess === total,
				children: guess === total ? "✓ right!" : "not yet, fill the slots"
			})
		] })] })] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "order",
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "flex",
						gap: 6
					},
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mode === "arrange",
						onClick: () => {
							setMode("arrange");
							reset();
						},
						children: "matters (arrange)"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: mode === "choose",
						onClick: () => {
							setMode("choose");
							reset();
						},
						children: "doesn't (choose)"
					})]
				})
			}),
			mode === "arrange" && /* @__PURE__ */ jsx(Field, {
				label: "repeats",
				children: /* @__PURE__ */ jsx(Chip, {
					selected: repl,
					onClick: () => {
						setRepl((r) => !r);
						reset();
					},
					children: repl ? "allowed (nᵏ)" : "each once"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "positions k",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: k,
					onChange: (v) => {
						setK(Math.max(1, Math.min(repl ? 6 : n, v)));
						reset();
					},
					min: 1,
					max: repl ? 6 : n
				})
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: fillNext,
				children: filled ? "✓ filled" : "▶ fill next slot"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "reset"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(RevealSolution, {
			available: !filled || checked && !solved,
			buttonLabel: "Show the count",
			solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				mode === "choose" ? `${n}C${k}` : repl ? `${n}^${k}` : k === n ? `${n}!` : `${n}P${k}`,
				" = ",
				/* @__PURE__ */ jsx("b", { children: total }),
				mode === "choose" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					" (=",
					arrangeTotal,
					" ÷ ",
					k,
					"!)"
				] }),
				"."
			] }),
			onReveal: () => {
				setStep(k);
				setPeeked(true);
				setGuess(total);
				setChecked(true);
			}
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { CountingSlotsLab };