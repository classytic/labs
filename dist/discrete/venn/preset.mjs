'use client';

import { CheckButton, Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { inclusionExclusion } from "../core/inclusionExclusion.mjs";
import { useId, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { compileLogic, useControlSurface, useLearner } from "@classytic/stage";

//#region src/discrete/venn/preset.tsx
/**
* VennSetBoard, the GENERAL sets + inclusion–exclusion tool (2 or 3 sets). The
* creator declares set MEMBERS; the lab places each element in its true region,
* shows live region counts, and (explore) the inclusion–exclusion breakdown
* |A∪B| = |A| + |B| − |A∩B|, the "overcount, then correct" spine made visible.
*
* The trinity made literal: a SET expression is a PROPOSITIONAL formula over
* membership (∩↔∧, ∪↔∨, ᶜ↔¬), so "shade the region for A ∩ ¬B" runs on the SAME
* `compileLogic` kernel as the truth-table lab, one source of truth.
*
* Self-contained SVG (a fixed diagram, not a coordinate plot), so no Stage coords
* needed; counts/IE come from `@classytic/labs/discrete/core`.
*/
const GEO2 = {
	vb: [
		0,
		0,
		340,
		224
	],
	circles: [{
		cx: 132,
		cy: 118,
		r: 82
	}, {
		cx: 208,
		cy: 118,
		r: 82
	}],
	centroids: {
		"10": [80, 118],
		"01": [260, 118],
		"11": [170, 118],
		"00": [40, 30]
	},
	labels: [{
		x: 104,
		y: 26
	}, {
		x: 236,
		y: 26
	}]
};
const GEO3 = {
	vb: [
		0,
		0,
		360,
		306
	],
	circles: [
		{
			cx: 140,
			cy: 116,
			r: 78
		},
		{
			cx: 220,
			cy: 116,
			r: 78
		},
		{
			cx: 180,
			cy: 186,
			r: 78
		}
	],
	centroids: {
		"100": [104, 96],
		"010": [256, 96],
		"001": [180, 232],
		"110": [180, 84],
		"101": [132, 162],
		"011": [228, 162],
		"111": [180, 140],
		"000": [44, 30]
	},
	labels: [
		{
			x: 104,
			y: 30
		},
		{
			x: 256,
			y: 30
		},
		{
			x: 180,
			y: 296
		}
	]
};
const PALETTE = [
	"var(--stage-accent)",
	"var(--stage-accent-2)",
	"var(--stage-good)"
];
const IE_LETTERS = [
	"A",
	"B",
	"C",
	"D"
];
/** Set expression → logic formula the kernel can parse (∩→∧, ∪→∨, postfix ' / ᶜ → prefix ¬). */
function normalizeSetExpr(s) {
	return s.replace(/([A-Za-z_][A-Za-z0-9_]*)\s*[ᶜ']/g, "¬$1").replace(/∩/g, "∧").replace(/∪/g, "∨").replace(/[\\∖]/g, "∧¬");
}
/** A masked SVG fill for one region (∩ of "in" circles ∖ ∪ of "out" circles). */
function RegionShape({ sig, geo, color, uid, opacity }) {
	const ins = [];
	const outs = [];
	[...sig].forEach((c, i) => (c === "1" ? ins : outs).push(geo.circles[i]));
	const [vx, vy, vw, vh] = geo.vb;
	const maskId = `${uid}m${sig}`;
	const clipIds = ins.map((_, k) => `${uid}c${sig}_${k}`);
	let node = /* @__PURE__ */ jsx("rect", {
		x: vx,
		y: vy,
		width: vw,
		height: vh,
		fill: color,
		opacity,
		mask: outs.length ? `url(#${maskId})` : void 0
	});
	for (let k = ins.length - 1; k >= 0; k--) node = /* @__PURE__ */ jsx("g", {
		clipPath: `url(#${clipIds[k]})`,
		children: node
	});
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("defs", { children: [ins.map((c, k) => /* @__PURE__ */ jsx("clipPath", {
		id: clipIds[k],
		children: /* @__PURE__ */ jsx("circle", {
			cx: c.cx,
			cy: c.cy,
			r: c.r
		})
	}, k)), outs.length > 0 && /* @__PURE__ */ jsxs("mask", {
		id: maskId,
		children: [/* @__PURE__ */ jsx("rect", {
			x: vx,
			y: vy,
			width: vw,
			height: vh,
			fill: "white"
		}), outs.map((c, k) => /* @__PURE__ */ jsx("circle", {
			cx: c.cx,
			cy: c.cy,
			r: c.r,
			fill: "black"
		}, k))]
	})] }), node] });
}
const regionLabel = (sig, names) => {
	const inN = names.filter((_, i) => sig[i] === "1");
	if (inN.length === 0) return "neither";
	if (inN.length === 1) return `${inN[0]} only`;
	return inN.join(" ∩ ");
};
function VennSetBoardLab({ sets, mode: mode0 = "explore", target, title = "Sets & Venn", prompt, objectives, hints: hintList, controlId }) {
	const n = sets.length;
	const geo = n === 3 ? GEO3 : GEO2;
	const names = sets.map((s) => s.name);
	const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
	const [mode, setMode] = useState(mode0);
	const [shaded, setShaded] = useState(/* @__PURE__ */ new Set());
	const [checked, setChecked] = useState(false);
	const [peeked, setPeeked] = useState(false);
	const hints = useHints(hintList);
	const learner = useLearner();
	const sigOf = (m) => sets.map((s) => s.members.includes(m) ? "1" : "0").join("");
	const regions = useMemo(() => {
		const counts = {};
		const all = /* @__PURE__ */ new Set();
		sets.forEach((s) => s.members.forEach((m) => all.add(m)));
		all.forEach((m) => {
			const k = sigOf(m);
			counts[k] = (counts[k] ?? 0) + 1;
		});
		const keys = [];
		for (let mask = 0; mask < 1 << n; mask++) keys.push(mask.toString(2).padStart(n, "0").split("").reverse().join(""));
		return keys.map((sig) => ({
			sig,
			count: counts[sig] ?? 0,
			centroid: geo.centroids[sig] ?? geo.centroids["00"] ?? [0, 0]
		}));
	}, [
		sets,
		n,
		geo
	]);
	const ie = useMemo(() => inclusionExclusion(sets.map((s) => s.members)), [sets]);
	const targetKeys = useMemo(() => {
		if (!target) return /* @__PURE__ */ new Set();
		const c = compileLogic(normalizeSetExpr(target));
		if (!c.ok) return /* @__PURE__ */ new Set();
		const out = /* @__PURE__ */ new Set();
		regions.forEach(({ sig }) => {
			const env = {};
			names.forEach((nm, i) => {
				env[nm] = sig[i] === "1";
			});
			if (c.eval(env)) out.add(sig);
		});
		return out;
	}, [
		target,
		regions,
		names
	]);
	const correct = useMemo(() => shaded.size === targetKeys.size && [...shaded].every((k) => targetKeys.has(k)), [shaded, targetKeys]);
	useCheckpoint({
		solved: mode === "shade" && checked && correct && !peeked,
		activity: `venn:${title}`,
		hintsUsed: hints.count
	});
	const toggle = (sig) => {
		setChecked(false);
		setShaded((s) => {
			const n2 = new Set(s);
			n2.has(sig) ? n2.delete(sig) : n2.add(sig);
			return n2;
		});
	};
	const check = () => setChecked(true);
	const reset = () => {
		setShaded(/* @__PURE__ */ new Set());
		setChecked(false);
	};
	const reveal = () => {
		setPeeked(true);
		setShaded(new Set(targetKeys));
		setChecked(true);
		learner?.report({
			activity: `venn:${title}`,
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
			label: "mode",
			options: ["explore", "shade"],
			get: () => mode,
			set: (v) => setMode(v)
		},
		reveal: {
			type: "action",
			label: "shade the target",
			invoke: reveal
		},
		check: {
			type: "action",
			label: "grade the shading",
			invoke: check
		},
		reset: {
			type: "action",
			label: "clear",
			invoke: reset
		}
	});
	if (n < 2 || n > 3) return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		children: /* @__PURE__ */ jsxs("p", {
			className: "lab-misconception",
			role: "status",
			children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					children: "⚠"
				}),
				" The Venn lab supports 2 or 3 sets; you gave ",
				n,
				". Reduce the number of sets."
			]
		})
	});
	const [vx, vy, vw, vh] = geo.vb;
	const showShade = mode === "shade";
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			justifyContent: "center",
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 12
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `${vx} ${vy} ${vw} ${vh}`,
			style: {
				width: "100%",
				maxWidth: 360,
				height: "auto"
			},
			role: "img",
			"aria-label": `Venn diagram of ${names.join(", ")}`,
			children: [
				showShade && [...shaded].map((sig) => /* @__PURE__ */ jsx(RegionShape, {
					sig,
					geo,
					color: "var(--stage-accent)",
					uid,
					opacity: .38
				}, sig)),
				geo.circles.map((c, i) => /* @__PURE__ */ jsx("circle", {
					cx: c.cx,
					cy: c.cy,
					r: c.r,
					fill: PALETTE[i],
					fillOpacity: .09,
					stroke: PALETTE[i],
					strokeOpacity: .7,
					strokeWidth: 2
				}, i)),
				geo.labels.map((l, i) => /* @__PURE__ */ jsx("text", {
					x: l.x,
					y: l.y,
					fill: PALETTE[i],
					fontSize: 15,
					fontWeight: 800,
					textAnchor: "middle",
					style: {
						paintOrder: "stroke",
						stroke: "var(--stage-bg)",
						strokeWidth: 4,
						strokeLinejoin: "round"
					},
					children: names[i]
				}, i)),
				mode === "explore" && regions.filter((r) => r.count > 0 && r.sig !== "0".repeat(n)).map((r) => /* @__PURE__ */ jsx("text", {
					x: r.centroid[0],
					y: r.centroid[1],
					fill: "var(--stage-fg)",
					fontSize: 16,
					fontWeight: 700,
					textAnchor: "middle",
					dominantBaseline: "central",
					style: {
						paintOrder: "stroke",
						stroke: "var(--stage-bg)",
						strokeWidth: 4.5,
						strokeLinejoin: "round"
					},
					children: r.count
				}, r.sig))
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: mode === "explore" ? /* @__PURE__ */ jsxs("div", {
			style: {
				padding: "10px 14px",
				borderRadius: 10,
				border: "1px solid var(--stage-grid)",
				display: "grid",
				gap: 6
			},
			children: [
				/* @__PURE__ */ jsxs("div", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: [/* @__PURE__ */ jsx("div", {
						className: "lab-field-label",
						children: "Inclusion–exclusion"
					}), names.map((nm, i) => /* @__PURE__ */ jsxs("span", {
						style: { marginRight: 12 },
						children: [
							/* @__PURE__ */ jsx("b", { children: IE_LETTERS[i] }),
							" = ",
							nm
						]
					}, i))]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexWrap: "wrap",
						alignItems: "baseline",
						gap: "4px 7px",
						fontWeight: 600
					},
					children: [ie.terms.map((t, i) => /* @__PURE__ */ jsxs("span", {
						style: { color: t.sign < 0 ? "var(--stage-danger)" : "var(--stage-fg)" },
						children: [
							i > 0 ? t.sign < 0 ? "− " : "+ " : "",
							"|",
							t.indices.map((j) => IE_LETTERS[j]).join("∩"),
							"|"
						]
					}, i)), /* @__PURE__ */ jsxs("span", {
						style: {
							fontWeight: 800,
							marginLeft: 4
						},
						children: [
							"= |",
							names.map((_, i) => IE_LETTERS[i]).join("∪"),
							"|"
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexWrap: "wrap",
						alignItems: "baseline",
						gap: "4px 7px",
						fontVariantNumeric: "tabular-nums",
						color: "var(--stage-muted)"
					},
					children: [ie.terms.map((t, i) => /* @__PURE__ */ jsxs("span", {
						style: { color: t.sign < 0 ? "var(--stage-danger)" : "inherit" },
						children: [i > 0 ? t.sign < 0 ? "− " : "+ " : "", t.size]
					}, i)), /* @__PURE__ */ jsxs("span", {
						style: {
							fontWeight: 800,
							marginLeft: 4,
							color: "var(--stage-good)"
						},
						children: ["= ", ie.unionSize]
					})]
				})
			]
		}) : void 0,
		controls: mode === "shade" ? /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 600,
					marginRight: 4
				},
				children: ["Shade: ", target]
			}),
			regions.map((r) => /* @__PURE__ */ jsx(Chip, {
				selected: shaded.has(r.sig),
				onClick: () => toggle(r.sig),
				children: regionLabel(r.sig, names)
			}, r.sig)),
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: check,
				disabled: shaded.size === 0,
				children: "Check"
			}),
			checked && /* @__PURE__ */ jsx(StatusPill, {
				ok: correct,
				children: correct ? "✓ Exactly right" : "Not quite, adjust the regions"
			})
		] }) : void 0,
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [mode === "shade" && /* @__PURE__ */ jsx(RevealSolution, {
			available: checked && !correct,
			solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				"Shade: ",
				/* @__PURE__ */ jsx("b", { children: [...targetKeys].map((k) => regionLabel(k, names)).join(", ") || "no regions" }),
				"."
			] }),
			onReveal: reveal
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { VennSetBoardLab };