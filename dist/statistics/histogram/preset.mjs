'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useHints } from "../../kit/pedagogy.mjs";
import { fiveNumber, mean, median } from "../core/descriptive.mjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/statistics/histogram/preset.tsx
/**
* HistogramBoxLab, the SHAPE of data. A histogram (adjustable bins) sits above a
* box-and-whisker on a SHARED axis, so the two views of the same numbers line up:
* the histogram shows the distribution's shape, the box plot its five-number summary
* (min · Q1 · median · Q3 · max) and outliers (beyond 1.5·IQR). Click in the plot to
* DROP a data point and watch both update live; flip between symmetric / skewed /
* bimodal presets to see how shape reads differently in each view.
*
* Every statistic comes from the descriptive-stats kernel (fiveNumber/frequencies);
* the lab only draws them.
*/
const W = 540, H = 320, ML = 38, MR = 16;
const AXIS = H * .6;
const BOX_TOP = 218, BOX_H = 46;
const PRESETS = {
	symmetric: [
		6,
		7,
		8,
		8,
		9,
		9,
		9,
		10,
		10,
		10,
		10,
		11,
		11,
		11,
		12,
		12,
		13,
		14
	],
	"right-skewed": [
		2,
		3,
		3,
		4,
		4,
		4,
		5,
		5,
		5,
		6,
		6,
		7,
		8,
		10,
		13,
		17
	],
	bimodal: [
		3,
		4,
		4,
		5,
		5,
		6,
		13,
		14,
		14,
		15,
		15,
		16,
		17
	]
};
function HistogramBoxLab({ data = PRESETS.symmetric, bins = 8, min = 0, max = 20, title = "Histogram & box plot", prompt, objectives, hints: hintList, controlId }) {
	const [vals, setVals] = useState(data);
	const [binCount, setBinCount] = useState(bins);
	const hints = useHints(hintList);
	const svgRef = useRef(null);
	const lo = min, hi = max;
	const xOf = (v) => ML + (v - lo) / (hi - lo) * (W - ML - MR);
	const vOf = (px) => Math.max(lo, Math.min(hi, lo + (px - ML) / (W - ML - MR) * (hi - lo)));
	const { bars, maxCount } = useMemo(() => {
		const bw = (hi - lo) / binCount;
		const counts = new Array(binCount).fill(0);
		for (const v of vals) {
			const b = Math.min(binCount - 1, Math.floor((v - lo) / bw));
			if (b >= 0) counts[b]++;
		}
		return {
			bars: counts.map((c, i) => ({
				c,
				x0: lo + i * bw,
				x1: lo + (i + 1) * bw
			})),
			maxCount: Math.max(1, ...counts)
		};
	}, [
		vals,
		binCount,
		lo,
		hi
	]);
	const fn = fiveNumber(vals);
	const lowFence = fn.q1 - 1.5 * fn.iqr, highFence = fn.q3 + 1.5 * fn.iqr;
	const inliers = vals.filter((v) => v >= lowFence && v <= highFence);
	const whiskLo = inliers.length ? Math.min(...inliers) : fn.min;
	const whiskHi = inliers.length ? Math.max(...inliers) : fn.max;
	const outliers = vals.filter((v) => v < lowFence || v > highFence);
	const addAt = (px) => setVals((a) => [...a, Math.round(vOf(px))]);
	const onClick = (e) => {
		const r = svgRef.current.getBoundingClientRect();
		addAt((e.clientX - r.left) / r.width * W);
	};
	const reset = useCallback(() => setVals(data), [data]);
	const usePreset = useCallback((k) => setVals(PRESETS[k].slice()), []);
	useControlSurface(controlId, {
		bins: {
			type: "number",
			label: "bin count",
			min: 2,
			max: 16,
			step: 1,
			get: () => binCount,
			set: setBinCount
		},
		clear: {
			type: "action",
			label: "clear data",
			invoke: () => setVals([])
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
		}
	});
	const histBottom = AXIS, histTop = 20;
	const yBar = (c) => histBottom - c / maxCount * (histBottom - histTop);
	const ticks = Array.from({ length: Math.floor((hi - lo) / Math.max(1, Math.round((hi - lo) / 10))) + 1 }, (_, i) => lo + i * Math.max(1, Math.round((hi - lo) / 10)));
	const boxMid = 241;
	const stat = (label, v) => /* @__PURE__ */ jsxs("span", {
		style: {
			display: "inline-flex",
			flexDirection: "column",
			alignItems: "center",
			minWidth: 52
		},
		children: [/* @__PURE__ */ jsx("span", {
			style: {
				fontSize: 11,
				color: "var(--stage-muted)",
				fontWeight: 600
			},
			children: label
		}), /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: 15,
				fontWeight: 800,
				fontVariantNumeric: "tabular-nums"
			},
			children: v
		})]
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 8
		},
		children: /* @__PURE__ */ jsxs("svg", {
			ref: svgRef,
			viewBox: `0 0 ${W} ${H}`,
			style: {
				width: "100%",
				maxWidth: W,
				height: "auto",
				display: "block",
				cursor: "crosshair"
			},
			onClick,
			role: "img",
			"aria-label": `histogram and box plot; median ${fn.median}`,
			children: [
				bars.map((b, i) => {
					const x = xOf(b.x0), w = xOf(b.x1) - xOf(b.x0);
					return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
						x: x + 1,
						y: yBar(b.c),
						width: Math.max(1, w - 2),
						height: histBottom - yBar(b.c),
						fill: "color-mix(in oklab, var(--stage-accent) 78%, transparent)"
					}), b.c > 0 && /* @__PURE__ */ jsx("text", {
						x: x + w / 2,
						y: yBar(b.c) - 3,
						textAnchor: "middle",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: b.c
					})] }, i);
				}),
				/* @__PURE__ */ jsx("line", {
					x1: ML,
					y1: AXIS,
					x2: W - MR,
					y2: AXIS,
					stroke: "var(--stage-fg)",
					strokeWidth: 1.5
				}),
				ticks.map((t) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
					x1: xOf(t),
					y1: AXIS,
					x2: xOf(t),
					y2: 196,
					stroke: "var(--stage-muted)",
					strokeWidth: 1
				}), /* @__PURE__ */ jsx("text", {
					x: xOf(t),
					y: 207,
					textAnchor: "middle",
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: t
				})] }, t)),
				vals.length > 0 && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx("line", {
						x1: xOf(whiskLo),
						y1: boxMid,
						x2: xOf(fn.q1),
						y2: boxMid,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: xOf(fn.q3),
						y1: boxMid,
						x2: xOf(whiskHi),
						y2: boxMid,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					[whiskLo, whiskHi].map((v, i) => /* @__PURE__ */ jsx("line", {
						x1: xOf(v),
						y1: 226,
						x2: xOf(v),
						y2: 256,
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}, i)),
					/* @__PURE__ */ jsx("rect", {
						x: xOf(fn.q1),
						y: BOX_TOP,
						width: Math.max(1, xOf(fn.q3) - xOf(fn.q1)),
						height: BOX_H,
						rx: 4,
						fill: "color-mix(in oklab, var(--stage-accent) 16%, transparent)",
						stroke: "var(--stage-accent)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: xOf(fn.median),
						y1: BOX_TOP,
						x2: xOf(fn.median),
						y2: 264,
						stroke: "var(--stage-accent-2, #d6336c)",
						strokeWidth: 2.5
					}),
					outliers.map((v, i) => /* @__PURE__ */ jsx("circle", {
						cx: xOf(v),
						cy: boxMid,
						r: 3.5,
						fill: "none",
						stroke: "var(--stage-danger, #e03131)",
						strokeWidth: 1.5
					}, i)),
					/* @__PURE__ */ jsxs("text", {
						x: xOf(fn.median),
						y: BOX_TOP - 4,
						textAnchor: "middle",
						fontSize: 10,
						fontWeight: 700,
						fill: "var(--stage-accent-2, #d6336c)",
						children: ["med ", fn.median]
					}),
					/* @__PURE__ */ jsxs("text", {
						x: xOf(fn.q1),
						y: 277,
						textAnchor: "middle",
						fontSize: 9.5,
						fill: "var(--stage-muted)",
						children: ["Q1 ", fn.q1]
					}),
					/* @__PURE__ */ jsxs("text", {
						x: xOf(fn.q3),
						y: 277,
						textAnchor: "middle",
						fontSize: 9.5,
						fill: "var(--stage-muted)",
						children: ["Q3 ", fn.q3]
					})
				] })
			]
		})
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 8,
			flexWrap: "wrap",
			justifyContent: "center",
			margin: "10px 0",
			padding: "8px 0",
			borderTop: "1px solid var(--stage-grid)",
			borderBottom: "1px solid var(--stage-grid)"
		},
		children: [
			stat("n", String(vals.length)),
			stat("mean", vals.length ? mean(vals).toFixed(1) : ", "),
			stat("median", vals.length ? String(median(vals)) : ", "),
			stat("Q1", vals.length ? String(fn.q1) : ", "),
			stat("Q3", vals.length ? String(fn.q3) : ", "),
			stat("IQR", vals.length ? String(fn.iqr) : ", "),
			stat("outliers", String(outliers.length))
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "shape:"
			}),
			Object.keys(PRESETS).map((k) => /* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: () => usePreset(k),
				children: k
			}, k)),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: () => setVals([]),
				children: "clear"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "reset"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "bins",
				value: binCount,
				children: /* @__PURE__ */ jsx(Slider, {
					value: binCount,
					min: 2,
					max: 16,
					step: 1,
					onChange: setBinCount,
					ariaLabel: "bin count"
				})
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "· click the plot to add a point"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { HistogramBoxLab };