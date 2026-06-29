'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { CheckButton, Chip, StatusPill, Stepper } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, RevealSolution, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { factorial } from "../core/combinatorics.mjs";
import { Fragment, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Segment, Stage, useControlSurface, useLearner } from "@classytic/stage";

//#region src/discrete/counting-tree/preset.tsx
/**
* CountingTree, the GENERAL sequential-counting + probability-tree tool. One
* model covers the multiplication principle, permutations (draw without
* replacement → n·(n−1)·…), with-replacement counts (nᵏ), the
* permutation→combination collapse (÷k!), AND probability trees (multiply the
* weights down a path). The creator declares the stages (or a pool to draw
* from); the kernel (`@classytic/labs/discrete/core`) computes every number, so
* an agent narrates and never invents.
*
* Two authoring forms:
*   • `stages` , explicit uniform-per-stage branches (general multiplication /
*                 independent probability, e.g. flip a coin 3×).
*   • `pool`+`draws`+`replacement`, draw k items from a pool; replacement off
*                 ⇒ a permutation tree (5·4·3), on ⇒ nᵏ.
*/
const MAX_LEAVES = 28;
/** A readable fraction for small denominators, else 2dp. */
function frac(w) {
	for (let d = 2; d <= 12; d++) {
		const n = w * d;
		if (Math.abs(n - Math.round(n)) < 1e-6) return `${Math.round(n)}/${d}`;
	}
	return w.toFixed(2);
}
function CountingTreeLab({ stages, pool, draws = 2, replacement = false, mode = "count", ask = "ordered", title = "Counting tree", prompt, objectives, hints: hintList, controlId, height = 320 }) {
	const [guess, setGuess] = useState(0);
	const [checked, setChecked] = useState(false);
	const [peeked, setPeeked] = useState(false);
	const [sel, setSel] = useState(-1);
	const hints = useHints(hintList);
	const learner = useLearner();
	const built = useMemo(() => {
		const nodes = [];
		const edges = [];
		const leafPaths = [];
		let id = 0, leafY = 0, overflow = false;
		const kidsAt = (depth, remaining) => {
			if (pool) {
				if (depth >= draws) return [];
				const items = replacement ? pool : remaining;
				return items.map((it) => ({
					label: it,
					weight: items.length ? 1 / items.length : 0,
					item: it
				}));
			}
			const st = stages?.[depth];
			if (!st) return [];
			const tot = st.branches.reduce((s, b) => s + (b.weight ?? 1), 0) || 1;
			return st.branches.map((b) => ({
				label: b.label,
				weight: mode === "probability" ? (b.weight ?? 1) / tot : 1
			}));
		};
		const depthCount = pool ? draws : stages?.length ?? 0;
		const rec = (depth, remaining, pathLabel, prob, edgeIds) => {
			const myId = id++;
			const node = {
				id: myId,
				depth,
				y: 0,
				label: "",
				leaf: false
			};
			const kids = kidsAt(depth, remaining);
			if (kids.length === 0 || depth >= depthCount) {
				node.leaf = true;
				node.y = leafY++;
				node.label = pathLabel;
				leafPaths.push({
					id: myId,
					path: pathLabel,
					prob,
					edges: edgeIds
				});
				nodes.push(node);
				return node;
			}
			const ys = [];
			for (const k of kids) {
				if (leafY > MAX_LEAVES) {
					overflow = true;
					break;
				}
				const eId = edges.length;
				const child = rec(depth + 1, replacement || !pool ? remaining : remaining.filter((r) => r !== k.item), pathLabel ? `${pathLabel}${k.label}` : k.label, prob * k.weight, [...edgeIds, eId]);
				edges.push({
					from: myId,
					to: child.id,
					label: k.label,
					weight: k.weight
				});
				ys.push(child.y);
			}
			node.y = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : leafY++;
			nodes.push(node);
			return node;
		};
		rec(0, pool ? [...pool] : [], "", 1, []);
		return {
			nodes,
			edges,
			leafPaths,
			leaves: leafY,
			maxDepth: depthCount,
			overflow
		};
	}, [
		stages,
		pool,
		draws,
		replacement,
		mode
	]);
	const byId = useMemo(() => new Map(built.nodes.map((n) => [n.id, n])), [built]);
	const orderedTotal = built.leafPaths.length;
	const k = pool ? draws : stages?.length ?? 0;
	const unorderedTotal = Math.round(orderedTotal / factorial(k));
	const factorStr = useMemo(() => {
		if (pool) {
			const n = pool.length;
			return Array.from({ length: draws }, (_, i) => replacement ? n : n - i).join(" \\times ");
		}
		return (stages ?? []).map((s) => s.branches.length).join(" \\times ");
	}, [
		pool,
		draws,
		replacement,
		stages
	]);
	const target = ask === "unordered" ? unorderedTotal : orderedTotal;
	const predictQ = useMemo(() => {
		if (mode !== "count") return [];
		const n = pool ? pool.length : 0;
		const withRepl = pool ? Math.pow(n, draws) : 0;
		const kFact = factorial(k);
		const addTrap = pool ? n * draws : 0;
		const prompt = pool ? `Filling ${draws} ranked ${draws === 1 ? "spot" : "spots"} from ${n} ${n === 1 ? "option" : "options"}, ${replacement ? "reuse allowed" : "with no repeats"} — how many ${ask === "unordered" ? "unordered selections" : "ordered outcomes"} are there?` : `Working down ${k} ${k === 1 ? "stage" : "stages"} of choices, how many ${ask === "unordered" ? "unordered selections" : "ordered paths"} does the tree end with?`;
		const distractors = [
			withRepl,
			kFact,
			addTrap,
			target + 1,
			target * 2
		].filter((v) => Number.isFinite(v) && v > 0 && v !== target);
		const seen = new Set([target]);
		const choiceVals = [target];
		for (const v of distractors) {
			if (!seen.has(v)) {
				seen.add(v);
				choiceVals.push(v);
			}
			if (choiceVals.length >= 3) break;
		}
		choiceVals.sort((a, b) => a - b);
		return [{
			id: "predict-count",
			prompt,
			choices: choiceVals.map((v) => ({
				value: String(v),
				label: String(v)
			})),
			answer: String(target),
			explain: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				"Multiply a ",
				/* @__PURE__ */ jsx("b", { children: "shrinking pool" }),
				": ",
				/* @__PURE__ */ jsx(Tex$1, { tex: `${factorStr}${ask === "unordered" ? ` \\div ${k}!` : ""} = ${target}` }),
				"."
			] })
		}];
	}, [
		mode,
		pool,
		draws,
		replacement,
		ask,
		k,
		target,
		orderedTotal,
		factorStr
	]);
	const ch = useChallenge(predictQ);
	const solved = mode === "count" ? checked && guess === target && !peeked : false;
	useCheckpoint({
		solved: solved || ch.allCorrect,
		activity: `counting-tree:${title}`,
		hintsUsed: hints.count
	});
	const check = () => setChecked(true);
	const reset = () => {
		setGuess(0);
		setChecked(false);
		setSel(-1);
	};
	const reveal = () => {
		setPeeked(true);
		setGuess(target);
		setChecked(true);
		learner?.report({
			activity: `counting-tree:${title}`,
			correct: false,
			completion: true,
			score: {
				raw: 0,
				max: 1
			}
		});
	};
	useControlSurface(controlId, {
		highlight: {
			type: "number",
			label: "spotlight a path (leaf index, −1 clears)",
			min: -1,
			max: Math.max(0, built.leafPaths.length - 1),
			get: () => sel,
			set: (v) => setSel(Math.round(v))
		},
		step: {
			type: "action",
			label: "walk to the next path",
			invoke: () => setSel((s) => (s + 1) % Math.max(1, built.leafPaths.length))
		},
		reveal: {
			type: "action",
			label: "reveal the answer",
			invoke: reveal
		},
		check: {
			type: "action",
			label: "grade the count",
			invoke: check
		},
		reset: {
			type: "action",
			label: "clear",
			invoke: reset
		}
	});
	const selPath = sel >= 0 ? built.leafPaths[sel] : void 0;
	const selEdges = new Set(selPath?.edges ?? []);
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -.4,
				xMax: built.maxDepth + 1.3,
				yMin: -.7,
				yMax: Math.max(.7, built.leaves - 1 + .7)
			},
			height,
			preserveAspect: false,
			ariaLabel: `Counting tree with ${orderedTotal} paths`,
			children: [built.edges.map((e, i) => {
				const a = byId.get(e.from), b = byId.get(e.to);
				const on = selEdges.has(i);
				return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Segment, {
					from: {
						x: a.depth,
						y: a.y
					},
					to: {
						x: b.depth,
						y: b.y
					},
					color: on ? "var(--stage-good)" : "var(--stage-muted)",
					weight: on ? 3 : 1.5,
					opacity: on ? 1 : .6
				}), /* @__PURE__ */ jsx(Label, {
					x: (a.depth + b.depth) / 2,
					y: (a.y + b.y) / 2,
					text: mode === "probability" ? `${e.label} ${frac(e.weight)}` : e.label,
					color: on ? "var(--stage-good)" : "var(--stage-fg)",
					size: 11,
					dy: -7
				})] }, i);
			}), built.nodes.map((n) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Dot, {
				x: n.depth,
				y: n.y,
				r: n.leaf ? 4 : 3,
				color: n.leaf ? "var(--stage-accent)" : "var(--stage-fg)",
				opacity: n.leaf ? 1 : .6
			}), n.leaf && /* @__PURE__ */ jsx(Label, {
				x: n.depth,
				y: n.y,
				text: mode === "probability" ? `${n.label} = ${frac(built.leafPaths.find((p) => p.id === n.id)?.prob ?? 0)}` : n.label,
				color: "var(--stage-accent)",
				size: 11,
				dx: 10,
				anchor: "start"
			})] }, n.id))]
		})
	}), built.overflow && /* @__PURE__ */ jsxs("p", {
		className: "lab-prompt",
		children: [
			"Tree truncated at ",
			MAX_LEAVES,
			" paths, shrink the pool/draws to see it all."
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: mode === "count" ? /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: ask === "unordered" ? "How many unordered selections?" : "How many paths (outcomes)?",
				children: /* @__PURE__ */ jsx(Stepper, {
					value: guess,
					onChange: (v) => {
						setGuess(v);
						setChecked(false);
					},
					min: 0,
					max: Math.max(20, orderedTotal * 2)
				})
			}),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: check,
				children: "Check"
			}),
			checked && /* @__PURE__ */ jsx(StatusPill, {
				ok: guess === target,
				children: guess === target ? `✓ ${target}` : `Not yet, count the branches`
			}),
			built.leafPaths.length <= 16 && /* @__PURE__ */ jsxs(Field, {
				label: "Trace each path",
				children: [built.leafPaths.map((p, i) => /* @__PURE__ */ jsx(Chip, {
					selected: sel === i,
					onClick: () => setSel(sel === i ? -1 : i),
					children: p.path
				}, i)), sel >= 0 && /* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: [
						"path ",
						sel + 1,
						" of ",
						orderedTotal
					]
				})]
			})
		] }) : /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "Trace a path",
			children: built.leafPaths.map((p, i) => /* @__PURE__ */ jsx(Chip, {
				selected: sel === i,
				onClick: () => setSel(i),
				children: p.path
			}, i))
		}), selPath && /* @__PURE__ */ jsxs(StatusPill, {
			ok: true,
			children: [
				"P(",
				selPath.path,
				") = ",
				frac(selPath.prob),
				" = ",
				selPath.prob.toFixed(3)
			]
		})] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			predictQ.length > 0 && /* @__PURE__ */ jsx(ChallengeCard, {
				questions: predictQ,
				state: ch,
				title: "Predict first"
			}),
			mode === "count" && checked && /* @__PURE__ */ jsxs("p", {
				className: "lab-prompt",
				children: [
					"Multiplication principle: ",
					/* @__PURE__ */ jsx("b", { children: /* @__PURE__ */ jsx(Tex$1, { tex: `${factorStr} = ${orderedTotal}` }) }),
					" ordered outcomes.",
					ask === "unordered" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						" Order doesn’t matter, so divide by ",
						k,
						"! = ",
						factorial(k),
						": ",
						/* @__PURE__ */ jsx("b", { children: /* @__PURE__ */ jsx(Tex$1, { tex: `${orderedTotal} / ${factorial(k)} = ${unorderedTotal}` }) }),
						"."
					] })
				]
			}),
			mode === "count" && /* @__PURE__ */ jsx(RevealSolution, {
				available: checked && !solved,
				solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
					"The count is ",
					/* @__PURE__ */ jsx("b", { children: target }),
					", ",
					/* @__PURE__ */ jsx(Tex$1, { tex: `${factorStr}${ask === "unordered" ? ` \\div ${k}!` : ""}` }),
					"."
				] }),
				onReveal: reveal
			}),
			/* @__PURE__ */ jsx(HintLadder, { hints })
		] }),
		children: figure
	});
}

//#endregion
export { CountingTreeLab };