'use client';

import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { ruleOfProduct } from "../core/combinatorics.mjs";
import { CharacterFigure, ComboCard, OptionSwatch } from "./figure.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/discrete/combination-studio/preset.tsx
/**
* CombinationStudioLab, the rule of product you can FEEL. Instead of reading
* "3 × 2 = 6", the learner:
*   1. picks one option from each rack (a shirt, some trousers) and watches a
*      little character assemble live, so every outcome is a thing, not a label;
*   2. PREDICTS how many different ones exist before exploring (predict-first);
*   3. fills a discovery wall by making each combination, the wall is literally a
*      rows × columns grid, so the product IS an area they complete;
*   4. adds a third variable (a hat) and watches 3 × 2 = 6 become 3 × 2 × 2 = 12,
*      feeling why a new choice MULTIPLIES.
*
* Fully authorable: a creator supplies any scenario (outfits, sundaes, number
* plates, routes) as categories of options. Pure cartesian-product enumeration;
* the count uses ruleOfProduct from the discrete kernel.
*/
const DEFAULT_CATS = [
	{
		id: "shirt",
		label: "Shirt",
		slot: "top",
		options: [
			{
				id: "r",
				label: "red",
				color: "#e5484d"
			},
			{
				id: "b",
				label: "blue",
				color: "#3e63dd"
			},
			{
				id: "g",
				label: "green",
				color: "#30a46c"
			}
		]
	},
	{
		id: "trousers",
		label: "Trousers",
		slot: "bottom",
		options: [{
			id: "d",
			label: "denim",
			color: "#2b4a8b"
		}, {
			id: "k",
			label: "khaki",
			color: "#a18249"
		}]
	},
	{
		id: "hat",
		label: "Hat",
		slot: "hat",
		options: [{
			id: "o",
			label: "orange",
			color: "#f76808"
		}, {
			id: "p",
			label: "purple",
			color: "#8e4ec6"
		}]
	}
];
/** cartesian product of the active categories' option lists. */
function enumerate(cats) {
	let acc = [[]];
	for (const c of cats) acc = acc.flatMap((row) => c.options.map((o) => [...row, o]));
	return acc.map((picks) => ({
		key: picks.map((o) => o.id).join("|"),
		picks
	}));
}
function partsOf(cats, picks) {
	const p = {};
	cats.forEach((c, i) => {
		const o = picks[i];
		if (!o) return;
		if (c.slot === "top") p.top = o.color;
		else if (c.slot === "bottom") p.bottom = o.color;
		else if (c.slot === "hat") p.hat = o.color;
		else if (c.slot === "hold") p.hold = o.emoji;
	});
	return p;
}
function CombinationStudioLab({ scenario = "outfit", categories = DEFAULT_CATS, figure = "character", startActive, maxWall = 60, title = `How many ${scenario}s can you make?`, prompt = "Pick one from each rack, make it, and fill the wall. Each new choice multiplies the total.", objectives, hints: hintList } = {}) {
	const minActive = Math.min(2, categories.length);
	const [active, setActive] = useState(Math.max(1, Math.min(startActive ?? minActive, categories.length)));
	const cats = categories.slice(0, active);
	const [picks, setPicks] = useState(() => Object.fromEntries(categories.map((c) => [c.id, c.options[0].id])));
	const [found, setFound] = useState(/* @__PURE__ */ new Set());
	const hints = useHints(hintList);
	const combos = useMemo(() => enumerate(cats), [cats]);
	const sizes = cats.map((c) => c.options.length);
	const total = ruleOfProduct(...sizes);
	const tooMany = total > maxWall;
	const currentPicks = cats.map((c) => c.options.find((o) => o.id === picks[c.id]) ?? c.options[0]);
	const currentKey = currentPicks.map((o) => o.id).join("|");
	const madeCurrent = found.has(currentKey);
	const choices = [total, ...[
		total + sizes[active - 1],
		sizes.reduce((a, b) => a + b, 0),
		Math.max(1, total - 2)
	].filter((d) => d !== total).slice(0, 2)].sort((a, b) => a - b).map((n) => ({
		value: String(n),
		label: String(n)
	}));
	const questions = useMemo(() => [{
		id: `q-${active}-${total}`,
		prompt: `With ${cats.map((c, i) => `${sizes[i]} ${c.label.toLowerCase()}${sizes[i] > 1 ? "s" : ""}`).join(" and ")}, how many different ${scenario}s?`,
		choices,
		answer: String(total),
		explain: `Yes: ${sizes.join(" × ")} = ${total}. Each independent choice multiplies.`
	}], [active, total]);
	const challenge = useChallenge(questions);
	const allFound = found.size >= total && total > 0;
	useCheckpoint({
		solved: allFound,
		activity: `combination-studio:${scenario}`,
		hintsUsed: hints.count
	});
	const make = () => setFound((f) => new Set(f).add(currentKey));
	const pickOpt = (catId, optId) => setPicks((p) => ({
		...p,
		[catId]: optId
	}));
	const addVar = () => {
		setActive((a) => Math.min(categories.length, a + 1));
		setFound(/* @__PURE__ */ new Set());
	};
	const dropVar = () => {
		setActive((a) => Math.max(1, a - 1));
		setFound(/* @__PURE__ */ new Set());
	};
	const reset = () => setFound(/* @__PURE__ */ new Set());
	const FoundFig = ({ combo, size }) => figure === "character" ? /* @__PURE__ */ jsx(CharacterFigure, {
		parts: partsOf(cats, combo.picks),
		size,
		dim: !found.has(combo.key)
	}) : /* @__PURE__ */ jsx(ComboCard, {
		cells: cats.map((c, i) => ({
			emoji: combo.picks[i].emoji,
			color: combo.picks[i].color
		})),
		size,
		dim: !found.has(combo.key)
	});
	const grid2d = active === 2 && !tooMany;
	const rows = grid2d ? cats[0].options : [];
	const cols = grid2d ? cats[1].options : [];
	const figureEl = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 16
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					flexWrap: "wrap",
					fontSize: 20,
					fontWeight: 800
				},
				children: [
					cats.map((c, i) => /* @__PURE__ */ jsxs("span", {
						style: {
							display: "inline-flex",
							alignItems: "baseline",
							gap: 5
						},
						children: [
							i > 0 && /* @__PURE__ */ jsx("span", {
								style: { color: "var(--stage-muted)" },
								children: "×"
							}),
							/* @__PURE__ */ jsx("span", {
								style: { color: "var(--stage-accent)" },
								children: sizes[i]
							}),
							/* @__PURE__ */ jsxs("span", {
								style: {
									fontSize: 12,
									color: "var(--stage-muted)",
									fontWeight: 600
								},
								children: [c.label.toLowerCase(), sizes[i] > 1 ? "s" : ""]
							})
						]
					}, c.id)),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-muted)" },
						children: "="
					}),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-good)" },
						children: total
					}),
					/* @__PURE__ */ jsxs("span", {
						style: {
							fontSize: 13,
							color: "var(--stage-muted)",
							fontWeight: 600
						},
						children: [
							found.size,
							"/",
							total,
							" found"
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 18,
					alignItems: "center",
					justifyContent: "center",
					flexWrap: "wrap",
					padding: "10px 6px",
					borderRadius: 14,
					background: "var(--stage-bg)",
					border: "1px solid var(--stage-grid)"
				},
				children: [/* @__PURE__ */ jsx("div", {
					style: {
						display: "grid",
						gap: 8
					},
					children: cats.map((c) => /* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8,
							flexWrap: "wrap"
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: {
								width: 64,
								fontSize: 12,
								fontWeight: 700,
								color: "var(--stage-muted)",
								textAlign: "right"
							},
							children: c.label
						}), c.options.map((o) => /* @__PURE__ */ jsx(OptionSwatch, {
							emoji: o.emoji,
							color: o.color,
							label: o.label,
							selected: picks[c.id] === o.id,
							onClick: () => pickOpt(c.id, o.id)
						}, o.id))]
					}, c.id))
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						justifyItems: "center",
						gap: 6
					},
					children: [figure === "character" ? /* @__PURE__ */ jsx(CharacterFigure, {
						parts: partsOf(cats, currentPicks),
						size: 96
					}) : /* @__PURE__ */ jsx(ComboCard, {
						cells: cats.map((c, i) => ({
							emoji: currentPicks[i].emoji,
							color: currentPicks[i].color
						})),
						size: 84
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: make,
						disabled: madeCurrent,
						className: "lab-btn",
						style: { opacity: madeCurrent ? .5 : 1 },
						children: madeCurrent ? "✓ already made" : "+ make this one"
					})]
				})]
			}),
			tooMany ? /* @__PURE__ */ jsxs("p", {
				style: {
					margin: 0,
					padding: 12,
					borderRadius: 10,
					border: "1px dashed var(--stage-grid)",
					color: "var(--stage-muted)"
				},
				children: [
					"That is ",
					/* @__PURE__ */ jsx("b", { children: total }),
					" combinations, too many to draw, but the rule of product still gives the count without listing them. Drop a variable to see them all."
				]
			}) : grid2d ? /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gridTemplateColumns: `auto repeat(${cols.length}, 1fr)`,
					gap: 6,
					alignItems: "center",
					justifyItems: "center"
				},
				children: [
					/* @__PURE__ */ jsx("span", {}),
					cols.map((o) => /* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 11,
							fontWeight: 700,
							color: "var(--stage-muted)"
						},
						children: o.label
					}, o.id)),
					rows.map((r, ri) => /* @__PURE__ */ jsx(FragmentRow, {
						label: r.label,
						children: cols.map((cOpt, ci) => {
							const combo = combos[ri * cols.length + ci];
							const isFound = found.has(combo.key);
							return /* @__PURE__ */ jsx("div", {
								style: {
									padding: 4,
									borderRadius: 10,
									border: `1.5px solid ${isFound ? "var(--stage-good)" : "var(--stage-grid)"}`,
									background: isFound ? "color-mix(in oklab, var(--stage-good) 12%, transparent)" : "transparent"
								},
								children: /* @__PURE__ */ jsx(FoundFig, {
									combo,
									size: 48
								})
							}, cOpt.id);
						})
					}, r.id))
				]
			}) : /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 6,
					justifyContent: "center"
				},
				children: combos.map((combo) => {
					const isFound = found.has(combo.key);
					return /* @__PURE__ */ jsx("div", {
						style: {
							padding: 4,
							borderRadius: 10,
							border: `1.5px solid ${isFound ? "var(--stage-good)" : "var(--stage-grid)"}`,
							background: isFound ? "color-mix(in oklab, var(--stage-good) 12%, transparent)" : "transparent"
						},
						children: /* @__PURE__ */ jsx(FoundFig, {
							combo,
							size: 46
						})
					}, combo.key);
				})
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions,
			state: challenge,
			title: "Predict first"
		}), /* @__PURE__ */ jsx(Callout, {
			tone: allFound ? "result" : "info",
			children: allFound ? /* @__PURE__ */ jsxs("span", {
				style: {
					color: "var(--stage-good)",
					fontWeight: 700
				},
				children: [
					"You made all ",
					total,
					". That is exactly ",
					sizes.join(" × "),
					" = ",
					total,
					": every choice multiplied."
				]
			}) : /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"Make every ",
					scenario,
					" to fill the wall. Then add a variable and watch the total multiply."
				]
			})
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: addVar,
				children: "+ add a variable"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: dropVar,
				children: "− drop a variable"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "clear wall"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figureEl
	});
}
/** A grid row: the row label cell + its children cells (keeps JSX flat above). */
function FragmentRow({ label, children }) {
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("span", {
		style: {
			fontSize: 11,
			fontWeight: 700,
			color: "var(--stage-muted)",
			justifySelf: "end"
		},
		children: label
	}), children] });
}

//#endregion
export { CombinationStudioLab };