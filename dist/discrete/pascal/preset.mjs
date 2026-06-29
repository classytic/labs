'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { nCr } from "../core/combinatorics.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/discrete/pascal/preset.tsx
/**
* PascalTriangleLab, where counting, the binomial theorem, and a fractal meet. The
* triangle is built live by the one rule that defines it, each cell is the SUM of
* the two above, and every cell is also C(n,k): the number of ways to choose k of
* n (so the counting labs and this are the same numbers). Click a cell to see the
* two parents add into it AND its three identities (combination · path count ·
* binomial coefficient). Pick the binomial view and a whole ROW becomes the
* expansion (a+b)ⁿ. Flip "odd/even" and the triangle blooms into the Sierpiński
* triangle, the wow that shows structure hides in plain arithmetic.
*
* Values come from nCr (kernel), but the recurrence is what's shown, the formula
* is derived by the picture, not stated.
*/
const CW = 46, RH = 42, R = 18, PAD = 22;
const ACC = "var(--stage-accent)", GOOD = "var(--stage-good)", WARN = "var(--stage-warn)";
function expansionTex(n) {
	const terms = [];
	for (let k = 0; k <= n; k++) {
		const c = nCr(n, k), ai = n - k, bi = k;
		let t = c === 1 ? "" : String(c);
		if (ai > 0) t += ai === 1 ? "a" : `a^{${ai}}`;
		if (bi > 0) t += bi === 1 ? "b" : `b^{${bi}}`;
		terms.push(t || "1");
	}
	return `(a+b)^{${n}} = ${terms.join(" + ")}`;
}
function PascalTriangleLab({ rows = 7, view: view0 = "build", title = "Pascal's triangle", prompt, objectives, hints: hintList, controlId }) {
	const [N, setN] = useState(rows);
	const [view, setView] = useState(view0);
	const [sel, setSel] = useState({
		n: 4,
		k: 2
	});
	const hints = useHints(hintList);
	const Q = useMemo(() => [{
		id: "pascal-C52",
		prompt: "Row 5 of Pascal’s triangle is 1, 5, 10, 10, 5, 1. What is C(5,2) — the number of ways to choose 2 from 5?",
		choices: [
			{
				value: "20",
				label: "20"
			},
			{
				value: "10",
				label: "10"
			},
			{
				value: "7",
				label: "7"
			}
		],
		answer: "10",
		explain: "Each cell is the sum of the two above it, and equals C(n,k); C(5,2)=10, while 5×4=20 counts ORDERED pairs."
	}], []);
	const ch = useChallenge(Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "pascal:predict"
	});
	const vbW = N * CW + 2 * R + 40, vbH = PAD + (N + 1) * RH + 10;
	const cx = (n, k) => vbW / 2 + (k - n / 2) * CW;
	const cy = (n) => 40 + n * RH;
	const selRow = sel?.n ?? -1;
	const parents = useMemo(() => {
		if (!sel || sel.n === 0) return null;
		return {
			l: sel.k - 1 >= 0 && sel.k - 1 <= sel.n - 1 ? {
				n: sel.n - 1,
				k: sel.k - 1
			} : null,
			r: sel.k <= sel.n - 1 ? {
				n: sel.n - 1,
				k: sel.k
			} : null
		};
	}, [sel]);
	useControlSurface(controlId, {
		rows: {
			type: "number",
			label: "rows",
			min: 3,
			max: 14,
			step: 1,
			get: () => N,
			set: (v) => setN(Math.round(v))
		},
		view: {
			type: "enum",
			label: "view",
			options: [
				"build",
				"binomial",
				"parity"
			],
			get: () => view,
			set: (v) => setView(v)
		}
	});
	const cells = [];
	for (let n = 0; n <= N; n++) for (let k = 0; k <= n; k++) {
		const v = nCr(n, k);
		const odd = v % 2 === 1;
		const isSel = sel?.n === n && sel?.k === k;
		const isParent = parents && (parents.l?.n === n && parents.l?.k === k || parents.r?.n === n && parents.r?.k === k);
		const inRow = view === "binomial" && n === selRow;
		let fill = "var(--stage-bg)", stroke = "var(--stage-grid)", txt = "var(--stage-fg)";
		if (view === "parity") {
			fill = odd ? ACC : "transparent";
			stroke = odd ? ACC : "color-mix(in oklab, var(--stage-grid) 50%, transparent)";
			txt = odd ? "white" : "var(--stage-muted)";
		}
		if (isParent) {
			fill = `color-mix(in oklab, ${WARN} 22%, var(--stage-bg))`;
			stroke = WARN;
		}
		if (inRow) {
			fill = `color-mix(in oklab, ${ACC} 14%, var(--stage-bg))`;
			stroke = ACC;
		}
		if (isSel) {
			fill = GOOD;
			stroke = GOOD;
			txt = "white";
		}
		const digits = String(v).length;
		cells.push(/* @__PURE__ */ jsxs("g", {
			onClick: () => setSel({
				n,
				k
			}),
			style: { cursor: "pointer" },
			children: [/* @__PURE__ */ jsx("circle", {
				cx: cx(n, k),
				cy: cy(n),
				r: R,
				fill,
				stroke,
				strokeWidth: isSel || isParent ? 2.5 : 1.3
			}), (view !== "parity" || odd) && /* @__PURE__ */ jsx("text", {
				x: cx(n, k),
				y: cy(n),
				textAnchor: "middle",
				dominantBaseline: "central",
				fontSize: Math.max(9, 15 - (digits - 1) * 2),
				fontWeight: isSel ? 800 : 600,
				fill: txt,
				style: { pointerEvents: "none" },
				children: v
			})]
		}, `${n}-${k}`));
	}
	const arrows = [];
	if (parents && sel) {
		for (const p of [parents.l, parents.r]) if (p) arrows.push(/* @__PURE__ */ jsx("line", {
			x1: cx(p.n, p.k),
			y1: cy(p.n) + R,
			x2: cx(sel.n, sel.k),
			y2: cy(sel.n) - R,
			stroke: WARN,
			strokeWidth: 2,
			markerEnd: "url(#stage-arrow)"
		}, `a${p.k}`));
	}
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 8
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${vbW} ${vbH}`,
			style: {
				width: "100%",
				maxWidth: vbW,
				height: "auto",
				display: "block"
			},
			role: "img",
			"aria-label": `Pascal's triangle, ${N + 1} rows`,
			children: [
				/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("marker", {
					id: "stage-arrow",
					viewBox: "0 0 10 10",
					refX: "8",
					refY: "5",
					markerWidth: "6",
					markerHeight: "6",
					orient: "auto-start-reverse",
					children: /* @__PURE__ */ jsx("path", {
						d: "M0,0 L10,5 L0,10 z",
						fill: WARN
					})
				}) }),
				arrows,
				cells
			]
		})
	});
	const aside = sel ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
		tone: "result",
		children: [
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)",
					fontWeight: 600
				},
				children: [
					"cell (row ",
					sel.n,
					", position ",
					sel.k,
					")"
				]
			}),
			/* @__PURE__ */ jsx("span", {
				className: "lab-callout-big",
				children: nCr(sel.n, sel.k)
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: [
					"C(",
					sel.n,
					",",
					sel.k,
					")"
				]
			})
		]
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 6,
			fontSize: 13.5
		},
		children: [
			parents && (parents.l || parents.r) ? /* @__PURE__ */ jsxs("p", {
				style: { margin: 0 },
				children: ["📐 sum of the two above: ", /* @__PURE__ */ jsxs("b", { children: [
					parents.l ? nCr(parents.l.n, parents.l.k) : 0,
					" + ",
					parents.r ? nCr(parents.r.n, parents.r.k) : 0,
					" = ",
					nCr(sel.n, sel.k)
				] })]
			}) : /* @__PURE__ */ jsxs("p", {
				style: { margin: 0 },
				children: [
					"📐 an edge, always ",
					/* @__PURE__ */ jsx("b", { children: "1" }),
					" (one way)."
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				style: { margin: 0 },
				children: [
					"🎯 = ways to ",
					/* @__PURE__ */ jsxs("b", { children: [
						"choose ",
						sel.k,
						" of ",
						sel.n
					] }),
					" (C(",
					sel.n,
					",",
					sel.k,
					"))"
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				style: { margin: 0 },
				children: [
					"➕ = coefficient of ",
					/* @__PURE__ */ jsx(Tex$1, { tex: `a^{${sel.n - sel.k}}b^{${sel.k}}` }),
					" in (a+b)",
					/* @__PURE__ */ jsx("sup", { children: sel.n })
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				style: {
					margin: 0,
					color: "var(--stage-muted)"
				},
				children: [
					"row ",
					sel.n,
					" sums to 2",
					/* @__PURE__ */ jsx("sup", { children: sel.n }),
					" = ",
					2 ** sel.n
				]
			})
		]
	})] }) : /* @__PURE__ */ jsx(Callout, { children: "Click any cell." });
	const footer = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx(ChallengeCard, {
			questions: Q,
			state: ch,
			title: "Predict first"
		}),
		view === "binomial" && selRow >= 0 && /* @__PURE__ */ jsxs("div", {
			style: {
				padding: "8px 12px",
				borderRadius: 10,
				background: "color-mix(in oklab, var(--stage-accent) 8%, transparent)",
				overflowX: "auto"
			},
			children: [
				/* @__PURE__ */ jsx(Tex$1, { tex: expansionTex(selRow) }),
				" ",
				/* @__PURE__ */ jsxs("span", {
					style: {
						color: "var(--stage-muted)",
						fontSize: 12
					},
					children: [
						"← row ",
						selRow,
						" of the triangle is the coefficients"
					]
				})
			]
		}),
		view === "parity" && /* @__PURE__ */ jsxs("p", {
			className: "lab-prompt",
			children: [
				"Colour only the ",
				/* @__PURE__ */ jsx("b", { children: "odd" }),
				" numbers → the ",
				/* @__PURE__ */ jsx("b", { children: "Sierpiński triangle" }),
				" appears. Structure hiding inside plain addition."
			]
		}),
		/* @__PURE__ */ jsx(HintLadder, { hints })
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "view",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					gap: 6
				},
				children: [
					/* @__PURE__ */ jsx(Chip, {
						selected: view === "build",
						onClick: () => setView("build"),
						children: "build (sum above)"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: view === "binomial",
						onClick: () => setView("binomial"),
						children: "(a+b)ⁿ"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: view === "parity",
						onClick: () => setView("parity"),
						children: "odd/even"
					})
				]
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "rows",
			value: N,
			children: /* @__PURE__ */ jsx(Slider, {
				value: N,
				min: 3,
				max: 14,
				step: 1,
				onChange: setN,
				ariaLabel: "rows"
			})
		})] }),
		footer,
		children: figure
	});
}

//#endregion
export { PascalTriangleLab };