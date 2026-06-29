'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { CheckButton, Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { Lamp, ToggleSwitch } from "../../kit/logic-gates.mjs";
import { classify, compileLogic as compileLogic$1, equivalent, evalBool, logicToLatex as logicToLatex$1 } from "../index.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface, useLearner } from "@classytic/stage";

//#region src/discrete/truth-table/preset.tsx
/**
* TruthTableEngine, the GENERAL authorable truth-table tool. A creator declares
* any propositional formula (¬ ∧ ∨ ⊕ → ↔, unicode or ASCII) and a mode; the lab
* derives EVERYTHING from the stage logic kernel (parse → truth table → classify
* → equivalence). No per-problem widget, one tool covers all of propositional
* logic, from "fill the implication table" to "are these two equivalent?".
*
* Modes:
*   • show    , full reference table with sub-expression columns built up
*                textbook-style (vars → ¬p → q∧r → … → the whole formula).
*   • fill    , learner toggles each output cell, then Check (graded per cell).
*   • classify, learner judges tautology / contradiction / contingency.
* Pass `compare` to put a second formula beside the first + an equivalence verdict
* (De Morgan, contrapositive, p→q ≡ ¬p∨q …). Agent-drivable via `controlId`.
*/
const CLASSES = [
	"tautology",
	"contradiction",
	"contingency"
];
/** 2^n rows: past this a truth table is impractical to render and unsafe for 32-bit shifts. */
const MAX_VARS = 12;
/** Sub-expressions in build-up (post-order) order, deduped, vars/consts excluded;
*  the root formula is last. */
function subformulas(n) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	const walk = (x) => {
		if (x.kind === "not") walk(x.a);
		else if (x.kind === "bin") {
			walk(x.a);
			walk(x.b);
		}
		if (x.kind === "var" || x.kind === "const") return;
		const key = logicToLatex$1(x);
		if (!seen.has(key)) {
			seen.add(key);
			out.push(x);
		}
	};
	walk(n);
	return out;
}
const TF = (v) => /* @__PURE__ */ jsx("span", {
	style: {
		fontWeight: 700,
		color: v ? "var(--stage-good)" : "var(--stage-muted)"
	},
	children: v ? "T" : "F"
});
function TruthTableLab({ formula, compare, mode: mode0 = "fill", breakdown = true, title = "Truth table", prompt, objectives, hints: hintList, controlId }) {
	const compiled = useMemo(() => compileLogic$1(formula), [formula]);
	const cmp = useMemo(() => compare ? compileLogic$1(compare) : null, [compare]);
	const [mode, setMode] = useState(compare ? "show" : mode0);
	const [highlight, setHighlight] = useState(-1);
	const [filled, setFilled] = useState([]);
	const [guess, setGuess] = useState(null);
	const [checked, setChecked] = useState(false);
	const [peeked, setPeeked] = useState(false);
	const [live, setLive] = useState({});
	const hints = useHints(hintList);
	const learner = useLearner();
	const ast = compiled.ok ? compiled.ast : null;
	const vars = useMemo(() => {
		if (!ast) return [];
		const s = new Set(compiled.ok ? compiled.vars : []);
		if (cmp?.ok) cmp.vars.forEach((v) => s.add(v));
		return [...s].sort();
	}, [
		ast,
		compiled,
		cmp
	]);
	const envs = useMemo(() => {
		if (vars.length > MAX_VARS) return [];
		const rows = [];
		for (let m = 0; m < 2 ** vars.length; m++) {
			const env = {};
			vars.forEach((v, i) => {
				env[v] = (m & 1 << vars.length - 1 - i) !== 0;
			});
			rows.push(env);
		}
		return rows;
	}, [vars]);
	const cols = useMemo(() => {
		if (!ast) return [];
		if (cmp?.ok) return [ast, cmp.ast];
		return mode === "show" && breakdown ? subformulas(ast) : [ast];
	}, [
		ast,
		cmp,
		mode,
		breakdown
	]);
	const truth = (row) => evalBool(ast, envs[row]);
	const cls = useMemo(() => ast ? classify(ast) : "contingency", [ast]);
	const equiv = ast && cmp?.ok ? equivalent(ast, cmp.ast) : null;
	const allFilledCorrect = mode === "fill" && envs.length > 0 && envs.every((_, i) => filled[i] === truth(i));
	const solved = mode === "classify" ? guess === cls && checked : allFilledCorrect && checked;
	useCheckpoint({
		solved: solved && !peeked,
		activity: `truth-table:${formula}`,
		hintsUsed: hints.count
	});
	const cycle = (i) => {
		if (peeked) return;
		setChecked(false);
		setFilled((f) => {
			const n = f.slice();
			n[i] = n[i] == null ? true : n[i] === true ? false : null;
			return n;
		});
	};
	const check = () => setChecked(true);
	const reset = () => {
		setFilled([]);
		setGuess(null);
		setChecked(false);
	};
	const revealAll = () => {
		setPeeked(true);
		setFilled(envs.map((_, i) => truth(i)));
		setGuess(cls);
		setChecked(true);
		if (learner) learner.report({
			activity: `truth-table:${formula}`,
			correct: false,
			completion: true,
			score: {
				raw: 0,
				max: 1
			}
		});
	};
	useControlSurface(controlId, {
		mode: {
			type: "enum",
			label: "interaction mode",
			options: [
				"show",
				"fill",
				"classify"
			],
			get: () => mode,
			set: (v) => setMode(v)
		},
		highlight: {
			type: "number",
			label: "spotlight row (−1 clears)",
			min: -1,
			max: Math.max(0, envs.length - 1),
			get: () => highlight,
			set: (v) => setHighlight(Math.round(v))
		},
		step: {
			type: "action",
			label: "advance the spotlighted row",
			invoke: () => setHighlight((h) => (h + 1) % Math.max(1, envs.length))
		},
		reveal: {
			type: "action",
			label: "reveal the answer",
			invoke: revealAll
		},
		check: {
			type: "action",
			label: "grade the current attempt",
			invoke: check
		},
		reset: {
			type: "action",
			label: "clear the attempt",
			invoke: reset
		}
	});
	if (!compiled.ok) return /* @__PURE__ */ jsx(LabFrame, {
		title,
		children: /* @__PURE__ */ jsxs("p", {
			className: "lab-misconception",
			role: "status",
			children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					children: "⚠"
				}),
				" Couldn’t parse ",
				/* @__PURE__ */ jsx("code", { children: formula }),
				": ",
				compiled.error
			]
		})
	});
	if (vars.length > MAX_VARS) return /* @__PURE__ */ jsx(LabFrame, {
		title,
		children: /* @__PURE__ */ jsxs("p", {
			className: "lab-misconception",
			role: "status",
			children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					children: "⚠"
				}),
				" This truth table has ",
				vars.length,
				" variables (",
				2 ** vars.length,
				" rows). Keep it to ",
				MAX_VARS,
				" or fewer."
			]
		})
	});
	const th = {
		padding: "6px 12px",
		fontWeight: 700,
		borderBottom: "2px solid var(--stage-grid)",
		textAlign: "center",
		whiteSpace: "nowrap"
	};
	const td = {
		padding: "4px 12px",
		textAlign: "center",
		borderBottom: "1px solid var(--stage-grid)"
	};
	const finalIdx = cols.length - 1;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		!compare && ast && vars.length >= 1 && vars.length <= 4 && (() => {
			const liveOut = evalBool(ast, Object.fromEntries(vars.map((v) => [v, live[v] ?? false])));
			const flip = (v) => setLive((L) => {
				const n = {
					...L,
					[v]: !(L[v] ?? false)
				};
				setHighlight(vars.reduce((a, vv, i) => a | (n[vv] ?? false ? 1 : 0) << vars.length - 1 - i, 0));
				return n;
			});
			const sw = 54, lampX = vars.length * sw + 56;
			return /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 12,
					flexWrap: "wrap",
					margin: "8px 0",
					padding: "6px 12px",
					borderRadius: 10,
					background: "color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))",
					border: "1px solid var(--stage-grid)"
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 12.5,
							fontWeight: 600,
							color: "var(--stage-muted)"
						},
						children: "try it:"
					}),
					/* @__PURE__ */ jsxs("svg", {
						viewBox: `0 0 ${lampX + 56} 56`,
						style: {
							height: 52,
							maxWidth: lampX + 56
						},
						role: "img",
						"aria-label": `inputs ${vars.map((v) => `${v}=${live[v] ? "T" : "F"}`).join(", ")}, output ${liveOut ? "true" : "false"}`,
						children: [
							vars.map((v, i) => /* @__PURE__ */ jsxs("g", {
								onClick: () => flip(v),
								style: { cursor: "pointer" },
								role: "button",
								"aria-pressed": !!live[v],
								children: [/* @__PURE__ */ jsx("rect", {
									x: i * sw,
									y: 6,
									width: sw,
									height: 44,
									fill: "transparent"
								}), /* @__PURE__ */ jsx(ToggleSwitch, {
									x: i * sw + 4,
									y: 22,
									w: 44,
									h: 24,
									on: !!live[v],
									label: v
								})]
							}, v)),
							/* @__PURE__ */ jsx("line", {
								x1: vars.length * sw + 2,
								y1: 34,
								x2: lampX - 18,
								y2: 34,
								stroke: liveOut ? "var(--stage-live)" : "var(--stage-wire)",
								strokeWidth: 2.5,
								strokeLinecap: "round"
							}),
							/* @__PURE__ */ jsx(Lamp, {
								cx: lampX,
								cy: 34,
								r: 15,
								on: liveOut
							})
						]
					}),
					/* @__PURE__ */ jsx("span", {
						style: {
							fontWeight: 800,
							color: liveOut ? "var(--stage-good)" : "var(--stage-muted)"
						},
						children: liveOut ? "TRUE" : "FALSE"
					})
				]
			});
		})(),
		/* @__PURE__ */ jsx("div", {
			style: {
				overflowX: "auto",
				borderRadius: 12,
				border: "1px solid var(--stage-grid)",
				margin: "10px 0"
			},
			children: /* @__PURE__ */ jsxs("table", {
				style: {
					borderCollapse: "collapse",
					width: "100%",
					fontVariantNumeric: "tabular-nums"
				},
				children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [vars.map((v) => /* @__PURE__ */ jsx("th", {
					style: {
						...th,
						color: "var(--stage-accent)"
					},
					children: v
				}, v)), cols.map((c, ci) => /* @__PURE__ */ jsx("th", {
					style: {
						...th,
						borderLeft: ci === 0 ? "2px solid var(--stage-grid)" : void 0,
						background: ci === finalIdx ? "color-mix(in oklab, var(--stage-accent) 8%, transparent)" : void 0
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: logicToLatex$1(c) })
				}, ci))] }) }), /* @__PURE__ */ jsx("tbody", { children: envs.map((env, i) => /* @__PURE__ */ jsxs("tr", {
					onMouseEnter: () => setHighlight(i),
					style: { background: highlight === i ? "color-mix(in oklab, var(--stage-accent) 12%, transparent)" : void 0 },
					children: [vars.map((v) => /* @__PURE__ */ jsx("td", {
						style: td,
						children: TF(env[v])
					}, v)), cols.map((c, ci) => {
						const val = evalBool(c, env);
						const isFinal = ci === finalIdx && !compare;
						if (mode === "fill" && isFinal) {
							const f = filled[i];
							const right = checked && f === val;
							const wrong = checked && f != null && f !== val;
							return /* @__PURE__ */ jsx("td", {
								style: {
									...td,
									borderLeft: ci === 0 ? "2px solid var(--stage-grid)" : void 0
								},
								children: /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => cycle(i),
									"aria-label": `row ${i + 1} output`,
									style: {
										minWidth: 30,
										padding: "2px 8px",
										borderRadius: 7,
										fontWeight: 700,
										cursor: peeked ? "default" : "pointer",
										border: `1.5px solid ${right ? "var(--stage-good)" : wrong ? "var(--stage-danger)" : "var(--stage-grid)"}`,
										background: right ? "color-mix(in oklab, var(--stage-good) 16%, transparent)" : wrong ? "color-mix(in oklab, var(--stage-danger) 14%, transparent)" : "transparent",
										color: f == null ? "var(--stage-muted)" : f ? "var(--stage-good)" : "var(--stage-fg)"
									},
									children: f == null ? "?" : f ? "T" : "F"
								})
							}, ci);
						}
						return /* @__PURE__ */ jsx("td", {
							style: {
								...td,
								borderLeft: ci === 0 ? "2px solid var(--stage-grid)" : void 0,
								background: isFinal ? "color-mix(in oklab, var(--stage-accent) 5%, transparent)" : void 0
							},
							children: TF(val)
						}, ci);
					})]
				}, i)) })]
			})
		}),
		compare && equiv !== null && /* @__PURE__ */ jsx("div", {
			className: "lab-bar",
			children: /* @__PURE__ */ jsx(StatusPill, {
				ok: equiv,
				children: equiv ? "Equivalent ✓, identical columns" : "NOT equivalent, columns differ"
			})
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			!compare && /* @__PURE__ */ jsx(Fragment$1, { children: [
				"show",
				"fill",
				"classify"
			].map((m) => /* @__PURE__ */ jsx(Chip, {
				selected: mode === m,
				onClick: () => {
					setMode(m);
					reset();
					setPeeked(false);
				},
				children: m
			}, m)) }),
			!compare && mode === "classify" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				CLASSES.map((k) => /* @__PURE__ */ jsx(Chip, {
					selected: guess === k,
					onClick: () => {
						setGuess(k);
						setChecked(false);
					},
					children: k
				}, k)),
				/* @__PURE__ */ jsx(CheckButton, {
					onClick: check,
					disabled: !guess,
					children: "Check"
				}),
				checked && /* @__PURE__ */ jsx(StatusPill, {
					ok: guess === cls,
					children: guess === cls ? `✓ ${cls}` : `Not quite, it’s a ${cls}`
				})
			] }),
			!compare && mode === "fill" && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(CheckButton, {
				onClick: check,
				disabled: filled.filter((x) => x != null).length === 0,
				children: "Check"
			}), checked && /* @__PURE__ */ jsx(StatusPill, {
				ok: allFilledCorrect,
				children: allFilledCorrect ? "All correct ✓" : "Some cells are off, fix the red ones"
			})] })
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [!compare && mode !== "show" && /* @__PURE__ */ jsx(RevealSolution, {
			available: checked && !solved,
			solution: mode === "classify" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
				"This formula is a ",
				/* @__PURE__ */ jsx("b", { children: cls }),
				"."
			] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
				"The full column is ",
				/* @__PURE__ */ jsx("b", { children: envs.map((_, i) => truth(i) ? "T" : "F").join(" ") }),
				" (top→bottom). Remember: ",
				/* @__PURE__ */ jsx(Tex$1, { tex: "p \\rightarrow q" }),
				" is false ",
				/* @__PURE__ */ jsx("i", { children: "only" }),
				" when p is true and q is false."
			] }),
			onReveal: revealAll
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { TruthTableLab };