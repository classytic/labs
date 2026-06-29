'use client';

import { CheckButton, Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { gcd } from "../core/combinatorics.mjs";
import { DiceGlyph } from "../../kit/probability.mjs";
import { Fragment, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface, useLearner } from "@classytic/stage";

//#region src/discrete/sample-space/preset.tsx
/**
* SampleSpaceBoard, the GENERAL equally-likely-outcomes tool. Probability =
* count the favourable slice of all equally-likely outcomes; this makes that
* literal: every outcome is a cell, the learner SELECTS an event, and reads
* favourable / total → P. The two-dice 6×6 grid is the star (you SEE P(sum=7)
* as a diagonal of 6 cells = 1/6).
*
* Two authoring forms:
*   • `dims`, a 1- or 2-D product space (one die [6], two dice [6,6], cards
*     [4,13]); cells are coordinate pairs, events are reduce-based (sum/diff/
*     max/min/product/doubles) so they stay DATA, not code.
*   • `outcomes`, an explicit 1-D list (coins HHT…, custom); event = a named
*     favourable set.
* Counts/P come from `@classytic/labs/discrete/core`; an agent narrates them.
*/
const DIE = [
	"",
	"⚀",
	"⚁",
	"⚂",
	"⚃",
	"⚄",
	"⚅"
];
/** A small inline die using the proper pip glyph (replaces the ⚀ emoji). */
function Die({ value, size = 24 }) {
	return /* @__PURE__ */ jsx("svg", {
		width: size,
		height: size,
		viewBox: `0 0 ${size} ${size}`,
		style: { display: "block" },
		"aria-hidden": true,
		children: /* @__PURE__ */ jsx(DiceGlyph, {
			x: size * .1,
			y: size * .1,
			size: size * .8,
			value
		})
	});
}
const DiceRow = ({ faces, size }) => /* @__PURE__ */ jsx("span", {
	style: {
		display: "inline-flex",
		gap: 3
	},
	children: faces.map((f, i) => /* @__PURE__ */ jsx(Die, {
		value: f,
		size
	}, i))
});
const reduceVal = (a, b, r) => {
	switch (r) {
		case "sum": return a + b;
		case "diff": return Math.abs(a - b);
		case "max": return Math.max(a, b);
		case "min": return Math.min(a, b);
		case "product": return a * b;
		default: return a === b ? 1 : 0;
	}
};
const cmpFn = (x, c, v) => {
	switch (c) {
		case "eq": return x === v;
		case "ge": return x >= v;
		case "le": return x <= v;
		case "gt": return x > v;
		case "lt": return x < v;
	}
};
function fracStr(num, den) {
	if (den === 0) return "0";
	const g = gcd(num, den) || 1;
	const r = `${num / g}/${den / g}`;
	return num / g === den / g ? "1" : num === 0 ? "0" : r;
}
function SampleSpaceBoardLab({ dims, faces, dice, outcomes, event, mode: mode0, showValue, title = "Sample space", prompt, objectives, hints: hintList, controlId }) {
	const isTarget = (mode0 ?? (event ? "target" : "explore")) === "target";
	const [sel, setSel] = useState(/* @__PURE__ */ new Set());
	const [checked, setChecked] = useState(false);
	const [peeked, setPeeked] = useState(false);
	const hints = useHints(hintList);
	const learner = useLearner();
	const { cells, cols, total, rowFaces, colFaces, is2d } = useMemo(() => {
		const face = (d, i) => faces?.[d]?.[i] ?? i + 1;
		if (dims && dims.length === 2) {
			const [a, b] = dims;
			const rf = Array.from({ length: a }, (_, i) => face(0, i));
			const cf = Array.from({ length: b }, (_, j) => face(1, j));
			const cs = [];
			for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) {
				const fi = rf[i], fj = cf[j];
				let fav = false;
				if (event) {
					if (event.reduce === "same") fav = fi === fj;
					else if (event.reduce && event.cmp && event.value != null) fav = cmpFn(reduceVal(fi, fj, event.reduce), event.cmp, event.value);
				}
				const showsValue = showValue && event?.reduce && event.reduce !== "same";
				const label = showsValue ? String(reduceVal(fi, fj, event.reduce)) : dice ? `${DIE[fi] ?? fi}${DIE[fj] ?? fj}` : `${fi},${fj}`;
				cs.push({
					key: `${i},${j}`,
					label,
					favorable: fav,
					dice: dice && !showsValue ? [fi, fj] : void 0
				});
			}
			return {
				cells: cs,
				cols: b,
				total: a * b,
				rowFaces: rf,
				colFaces: cf,
				is2d: true
			};
		}
		if (outcomes) {
			const favset = new Set(event?.favorable ?? []);
			return {
				cells: outcomes.map((o) => ({
					key: o,
					label: o,
					favorable: favset.has(o)
				})),
				cols: Math.min(outcomes.length, 8),
				total: outcomes.length,
				rowFaces: [],
				colFaces: [],
				is2d: false
			};
		}
		const a = dims?.[0] ?? 6;
		return {
			cells: Array.from({ length: a }, (_, i) => {
				const fi = face(0, i);
				return {
					key: `${i}`,
					label: dice ? DIE[fi] ?? String(fi) : String(fi),
					favorable: !!event?.favorable?.includes(String(fi)),
					dice: dice ? [fi] : void 0
				};
			}),
			cols: Math.min(a, 8),
			total: a,
			rowFaces: [],
			colFaces: [],
			is2d: false
		};
	}, [
		dims,
		faces,
		dice,
		outcomes,
		event,
		showValue
	]);
	const targetKeys = useMemo(() => new Set(cells.filter((c) => c.favorable).map((c) => c.key)), [cells]);
	const favorableCount = isTarget ? targetKeys.size : sel.size;
	const correct = useMemo(() => sel.size === targetKeys.size && [...sel].every((k) => targetKeys.has(k)), [sel, targetKeys]);
	useCheckpoint({
		solved: isTarget && checked && correct && !peeked,
		activity: `sample-space:${title}`,
		hintsUsed: hints.count
	});
	const toggle = (k) => {
		setChecked(false);
		setSel((s) => {
			const n = new Set(s);
			n.has(k) ? n.delete(k) : n.add(k);
			return n;
		});
	};
	const check = () => setChecked(true);
	const reset = () => {
		setSel(/* @__PURE__ */ new Set());
		setChecked(false);
	};
	const reveal = () => {
		setPeeked(true);
		setSel(new Set(targetKeys));
		setChecked(true);
		learner?.report({
			activity: `sample-space:${title}`,
			correct: false,
			completion: true,
			score: {
				raw: 0,
				max: 1
			}
		});
	};
	useControlSurface(controlId, {
		reveal: {
			type: "action",
			label: "select the event",
			invoke: reveal
		},
		check: {
			type: "action",
			label: "grade the selection",
			invoke: check
		},
		reset: {
			type: "action",
			label: "clear",
			invoke: reset
		}
	});
	const cellStyle = (c) => {
		const on = sel.has(c.key);
		const isFav = targetKeys.has(c.key);
		let bg = "transparent", bd = "var(--stage-grid)", col = "var(--stage-fg)";
		if (isTarget && checked) {
			if (on && isFav) {
				bg = "color-mix(in oklab, var(--stage-good) 20%, transparent)";
				bd = "var(--stage-good)";
			} else if (on && !isFav) {
				bg = "color-mix(in oklab, var(--stage-danger) 16%, transparent)";
				bd = "var(--stage-danger)";
			} else if (!on && isFav) {
				bd = "var(--stage-good)";
				col = "var(--stage-good)";
			}
		} else if (on) {
			bg = "color-mix(in oklab, var(--stage-accent) 18%, transparent)";
			bd = "var(--stage-accent)";
		}
		return {
			aspectRatio: "1",
			minWidth: 34,
			padding: "4px",
			borderRadius: 8,
			border: `1.5px solid ${bd}`,
			background: bg,
			color: col,
			fontWeight: 700,
			fontSize: dice ? 18 : 13,
			cursor: "pointer",
			display: "flex",
			alignItems: "center",
			justifyContent: "center"
		};
	};
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			display: "inline-block",
			borderRadius: 12,
			border: "1px solid var(--stage-grid)",
			background: "var(--stage-bg)",
			padding: 12,
			margin: "8px 0",
			overflowX: "auto"
		},
		children: is2d ? /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gridTemplateColumns: `auto repeat(${cols}, 1fr)`,
				gap: 4
			},
			children: [
				/* @__PURE__ */ jsx("span", {}),
				colFaces.map((f, j) => /* @__PURE__ */ jsx("span", {
					style: {
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						fontWeight: 800,
						color: "var(--stage-accent-2)",
						fontSize: 13
					},
					children: dice ? /* @__PURE__ */ jsx(Die, {
						value: f,
						size: 24
					}) : f
				}, j)),
				rowFaces.map((rf, i) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						fontWeight: 800,
						color: "var(--stage-accent)",
						fontSize: 13,
						paddingRight: 4
					},
					children: dice ? /* @__PURE__ */ jsx(Die, {
						value: rf,
						size: 24
					}) : rf
				}), colFaces.map((_, j) => {
					const c = cells[i * cols + j];
					return /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => toggle(c.key),
						style: cellStyle(c),
						"aria-label": `outcome ${c.label}`,
						children: c.dice ? /* @__PURE__ */ jsx(DiceRow, {
							faces: c.dice,
							size: 18
						}) : c.label
					}, j);
				})] }, i))
			]
		}) : /* @__PURE__ */ jsx("div", {
			style: {
				display: "grid",
				gridTemplateColumns: `repeat(${cols}, 1fr)`,
				gap: 4
			},
			children: cells.map((c) => /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => toggle(c.key),
				style: cellStyle(c),
				"aria-label": `outcome ${c.label}`,
				children: c.dice ? /* @__PURE__ */ jsx(DiceRow, {
					faces: c.dice,
					size: 18
				}) : c.label
			}, c.key))
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 700,
					fontVariantNumeric: "tabular-nums"
				},
				children: [
					"P",
					event?.label ? `(${event.label})` : "",
					" = ",
					favorableCount,
					"/",
					total,
					" = ",
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-accent)" },
						children: fracStr(favorableCount, total)
					}),
					" ≈ ",
					(total ? favorableCount / total : 0).toFixed(3)
				]
			}),
			isTarget && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(CheckButton, {
				onClick: check,
				disabled: sel.size === 0,
				children: "Check"
			}), checked && /* @__PURE__ */ jsx(StatusPill, {
				ok: correct,
				children: correct ? "✓ Exactly the event" : "Not quite, green outlines are the ones you missed"
			})] }),
			!isTarget && sel.size > 0 && /* @__PURE__ */ jsx(Chip, {
				selected: true,
				onClick: reset,
				children: "clear"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [isTarget && /* @__PURE__ */ jsx(RevealSolution, {
			available: checked && !correct,
			solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				targetKeys.size,
				" of ",
				total,
				" outcomes match",
				event?.label ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
					" (",
					event.label,
					")"
				] }) : "",
				" → P = ",
				/* @__PURE__ */ jsx("b", { children: fracStr(targetKeys.size, total) }),
				"."
			] }),
			onReveal: reveal
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { SampleSpaceBoardLab };