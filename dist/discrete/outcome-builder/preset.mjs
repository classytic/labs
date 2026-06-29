'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { gcd } from "../core/combinatorics.mjs";
import { CoinGlyph, DiceGlyph } from "../../kit/probability.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/outcome-builder/preset.tsx
/**
* OutcomeBuilderLab, "where do the possibilities come from?" Build a sample space
* one stage at a time: add a coin or a die and watch the list of ALL outcomes
* fan out, with the counting principle spelled out (2 × 2 × 6 = 24). Each outcome
* is drawn with the real coin/dice glyphs, so the abstract "sample space" is a
* concrete board you can point at. Click outcomes to mark an EVENT and read its
* probability as favourable ÷ total, the definition, built by hand.
*
* Pure enumeration (cartesian product of the per-stage option lists); P uses the
* gcd from the discrete kernel for a reduced fraction.
*/
const OPTIONS = {
	coin: ["H", "T"],
	die: [
		1,
		2,
		3,
		4,
		5,
		6
	]
};
const ItemGlyph = ({ it, size = 26 }) => /* @__PURE__ */ jsx("svg", {
	width: size,
	height: size,
	viewBox: `0 0 ${size} ${size}`,
	style: { display: "block" },
	"aria-hidden": true,
	children: it.kind === "coin" ? /* @__PURE__ */ jsx(CoinGlyph, {
		cx: size / 2,
		cy: size / 2,
		r: size * .42,
		face: String(it.val)
	}) : /* @__PURE__ */ jsx(DiceGlyph, {
		x: size * .1,
		y: size * .1,
		size: size * .8,
		value: Number(it.val)
	})
});
function OutcomeBuilderLab({ stages: stages0 = ["coin", "coin"], maxOutcomes = 72, title = "Build the sample space", prompt, objectives, hints: hintList, controlId }) {
	const [stages, setStages] = useState(stages0);
	const [fav, setFav] = useState(/* @__PURE__ */ new Set());
	const hints = useHints(hintList);
	const outcomes = useMemo(() => {
		let acc = [[]];
		for (const s of stages) acc = acc.flatMap((row) => OPTIONS[s].map((v) => [...row, {
			kind: s,
			val: v
		}]));
		return acc;
	}, [stages]);
	const total = stages.reduce((a, s) => a * OPTIONS[s].length, 1);
	const tooMany = total > maxOutcomes;
	const key = (o) => o.map((it) => `${it.kind[0]}${it.val}`).join("");
	const add = (k) => {
		if (total * OPTIONS[k].length <= maxOutcomes * 4) {
			setStages((s) => [...s, k]);
			setFav(/* @__PURE__ */ new Set());
		}
	};
	const removeStage = () => {
		setStages((s) => s.slice(0, -1));
		setFav(/* @__PURE__ */ new Set());
	};
	const reset = () => {
		setStages(stages0);
		setFav(/* @__PURE__ */ new Set());
	};
	const toggle = (k) => setFav((f) => {
		const n = new Set(f);
		n.has(k) ? n.delete(k) : n.add(k);
		return n;
	});
	const favCount = fav.size;
	const g = favCount > 0 ? gcd(favCount, total) : 1;
	useCheckpoint({
		solved: favCount > 0,
		activity: `outcome-builder:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		addCoin: {
			type: "action",
			label: "add a coin",
			invoke: () => add("coin")
		},
		addDie: {
			type: "action",
			label: "add a die",
			invoke: () => add("die")
		},
		remove: {
			type: "action",
			label: "remove last stage",
			invoke: removeStage
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
		}
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 8,
			alignItems: "center",
			flexWrap: "wrap",
			fontSize: 16,
			fontWeight: 700,
			margin: "6px 0"
		},
		children: [stages.map((s, i) => /* @__PURE__ */ jsxs("span", {
			style: {
				display: "inline-flex",
				alignItems: "center",
				gap: 4
			},
			children: [
				i > 0 && /* @__PURE__ */ jsx("span", {
					style: { color: "var(--stage-muted)" },
					children: "×"
				}),
				/* @__PURE__ */ jsx("span", {
					style: { color: "var(--stage-accent)" },
					children: OPTIONS[s].length
				}),
				/* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 11,
						color: "var(--stage-muted)",
						fontWeight: 500
					},
					children: [
						"(",
						s,
						")"
					]
				})
			]
		}, i)), stages.length > 0 && /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx("span", {
				style: { color: "var(--stage-muted)" },
				children: "="
			}),
			/* @__PURE__ */ jsx("span", {
				style: { color: "var(--stage-good)" },
				children: total
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 13,
					color: "var(--stage-muted)",
					fontWeight: 500
				},
				children: "outcomes"
			})
		] })]
	}), tooMany ? /* @__PURE__ */ jsxs("p", {
		style: {
			margin: "12px 0",
			padding: 12,
			borderRadius: 10,
			border: "1px dashed var(--stage-grid)",
			color: "var(--stage-muted)"
		},
		children: [
			"That's ",
			/* @__PURE__ */ jsx("b", { children: total }),
			" equally-likely outcomes, too many to draw. The counting principle still gives the count without listing them all."
		]
	}) : /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			flexWrap: "wrap",
			gap: 6,
			margin: "12px 0",
			padding: 10,
			borderRadius: 12,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: outcomes.map((o) => {
			const k = key(o);
			const on = fav.has(k);
			return /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => toggle(k),
				"aria-pressed": on,
				style: {
					display: "inline-flex",
					gap: 2,
					padding: "4px 6px",
					borderRadius: 8,
					cursor: "pointer",
					border: `1.5px solid ${on ? "var(--stage-good)" : "var(--stage-grid)"}`,
					background: on ? "color-mix(in oklab, var(--stage-good) 16%, transparent)" : "transparent"
				},
				children: o.map((it, i) => /* @__PURE__ */ jsx(ItemGlyph, {
					it,
					size: 24
				}, i))
			}, k);
		})
	})] });
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsx(Chip, {
			selected: false,
			onClick: () => add("coin"),
			children: "+ coin"
		}),
		/* @__PURE__ */ jsx(Chip, {
			selected: false,
			onClick: () => add("die"),
			children: "+ die"
		}),
		/* @__PURE__ */ jsx(Chip, {
			selected: false,
			onClick: removeStage,
			children: "− stage"
		}),
		/* @__PURE__ */ jsx(Chip, {
			selected: false,
			onClick: reset,
			children: "reset"
		}),
		/* @__PURE__ */ jsx(Chip, {
			selected: false,
			onClick: () => setFav(/* @__PURE__ */ new Set()),
			children: "clear event"
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: favCount > 0 ? "result" : "info",
			children: favCount > 0 ? /* @__PURE__ */ jsxs("span", {
				style: {
					color: "var(--stage-good)",
					fontWeight: 700
				},
				children: [
					/* @__PURE__ */ jsx(Tex$1, { tex: `P(\\text{event}) = ${favCount}/${total}` }),
					g > 1 && /* @__PURE__ */ jsxs("span", {
						style: { color: "var(--stage-muted)" },
						children: [" ", /* @__PURE__ */ jsx(Tex$1, { tex: `= ${favCount / g}/${total / g}` })]
					}),
					" ",
					/* @__PURE__ */ jsx(Tex$1, { tex: `= ${(favCount / total).toFixed(3)}` })
				]
			}) : /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"Click outcomes to mark an event → its probability is favourable ÷ ",
					total,
					"."
				]
			})
		}),
		controls,
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { OutcomeBuilderLab };