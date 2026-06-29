'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { frequencies, mean, median, mode, range, stddev, variance } from "../core/descriptive.mjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/statistics/center-spread/preset.tsx
/**
* CenterSpreadLab, centre & spread you can FEEL. Data points sit on a number
* line; drag them and the mean rides under the line as a BALANCE-POINT fulcrum
* (the mean is literally where the data balances), the median holds its ground,
* the mode stack lights up, and a shaded mean ± σ band breathes wider as the data
* spreads. The punchline lives in the dragging: yank one point far out and the
* mean chases it while the median barely moves, why we report the median for
* skewed data. Optional `challenge` turns it into "drag until the mean is 5".
*
* All numbers come from the descriptive-stats kernel; the lab only POINTS at them.
*/
const W = 500, H = 210, M = 34, AXIS = 150;
function CenterSpreadLab({ data = [
	2,
	3,
	3,
	5,
	8
], min = 0, max = 10, step = 1, showSigma = true, challenge, title = "Centre & spread", prompt, objectives, hints: hintList, controlId }) {
	const [vals, setVals] = useState(data);
	const hints = useHints(hintList);
	const svgRef = useRef(null);
	const drag = useRef(null);
	const lo = min, hi = max;
	const xOf = (v) => M + (v - lo) / (hi - lo) * (W - 2 * M);
	const vOf = (px) => {
		const v = lo + (px - M) / (W - 2 * M) * (hi - lo);
		return Math.max(lo, Math.min(hi, Math.round(v / step) * step));
	};
	const mu = mean(vals), md = median(vals), mo = mode(vals), rg = range(vals), sd = stddev(vals);
	const freqs = frequencies(vals);
	Math.max(1, ...freqs.map((f) => f.count));
	const stacked = useMemo(() => {
		const seen = /* @__PURE__ */ new Map();
		return vals.map((v, i) => {
			const k = seen.get(v) ?? 0;
			seen.set(v, k + 1);
			return {
				v,
				i,
				level: k
			};
		});
	}, [vals]);
	const pointerVal = (e) => {
		const r = svgRef.current.getBoundingClientRect();
		return vOf((e.clientX - r.left) / r.width * W);
	};
	const onDown = (i) => (e) => {
		drag.current = i;
		e.target.setPointerCapture(e.pointerId);
	};
	const onMove = (e) => {
		if (drag.current == null) return;
		const nv = pointerVal(e);
		setVals((arr) => arr.map((x, k) => k === drag.current ? nv : x));
	};
	const onUp = () => {
		drag.current = null;
	};
	const reset = useCallback(() => setVals(data), [data]);
	const addPoint = useCallback(() => setVals((a) => [...a, Math.round((lo + hi) / 2 / step) * step]), [
		lo,
		hi,
		step
	]);
	const removePoint = useCallback(() => setVals((a) => a.length > 1 ? a.slice(0, -1) : a), []);
	const addOutlier = useCallback(() => setVals((a) => [...a, hi]), [hi]);
	const solved = challenge ? Math.abs((challenge.stat === "mean" ? mu : md) - challenge.target) < 1e-6 : false;
	useCheckpoint({
		solved,
		activity: `center-spread:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		add: {
			type: "action",
			label: "add a point",
			invoke: addPoint
		},
		remove: {
			type: "action",
			label: "remove a point",
			invoke: removePoint
		},
		outlier: {
			type: "action",
			label: "add an outlier",
			invoke: addOutlier
		},
		reset: {
			type: "action",
			label: "reset data",
			invoke: reset
		}
	});
	const sigmaL = Math.max(lo, mu - sd), sigmaR = Math.min(hi, mu + sd);
	const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step).filter((_, i, a) => a.length <= 12 || i % Math.ceil(a.length / 12) === 0);
	const stat = (label, value, color = "var(--stage-fg)") => /* @__PURE__ */ jsxs("span", {
		style: {
			display: "inline-flex",
			flexDirection: "column",
			alignItems: "center",
			minWidth: 64
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
				fontSize: 17,
				fontWeight: 800,
				color,
				fontVariantNumeric: "tabular-nums"
			},
			children: value
		})]
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		challenge && /* @__PURE__ */ jsxs("p", {
			style: {
				fontWeight: 600,
				color: solved ? "var(--stage-good)" : "var(--stage-fg)"
			},
			children: [
				solved ? "✓ " : "🎯 ",
				"Drag the points until the ",
				/* @__PURE__ */ jsx("b", { children: challenge.stat }),
				" = ",
				challenge.target,
				"."
			]
		}),
		/* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)",
				padding: 8,
				touchAction: "none"
			},
			children: /* @__PURE__ */ jsxs("svg", {
				ref: svgRef,
				viewBox: `0 0 ${W} ${H}`,
				style: {
					width: "100%",
					maxWidth: W,
					height: "auto",
					display: "block",
					margin: "0 auto"
				},
				onPointerMove: onMove,
				onPointerUp: onUp,
				onPointerLeave: onUp,
				role: "img",
				"aria-label": `number line; mean ${mu.toFixed(2)}, median ${md}`,
				children: [
					showSigma && sd > 0 && /* @__PURE__ */ jsx("rect", {
						x: xOf(sigmaL),
						y: AXIS - 96,
						width: xOf(sigmaR) - xOf(sigmaL),
						height: 96,
						fill: "color-mix(in oklab, var(--stage-accent) 12%, transparent)"
					}),
					/* @__PURE__ */ jsx("line", {
						x1: M,
						y1: AXIS,
						x2: W - M,
						y2: AXIS,
						stroke: "var(--stage-fg)",
						strokeWidth: 2
					}),
					ticks.map((t) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
						x1: xOf(t),
						y1: AXIS,
						x2: xOf(t),
						y2: 155,
						stroke: "var(--stage-muted)",
						strokeWidth: 1.5
					}), /* @__PURE__ */ jsx("text", {
						x: xOf(t),
						y: 168,
						textAnchor: "middle",
						fontSize: 11,
						fill: "var(--stage-muted)",
						style: { fontVariantNumeric: "tabular-nums" },
						children: t
					})] }, t)),
					/* @__PURE__ */ jsx("line", {
						x1: xOf(md),
						y1: AXIS - 104,
						x2: xOf(md),
						y2: AXIS,
						stroke: "var(--stage-accent-2, #d6336c)",
						strokeWidth: 2,
						strokeDasharray: "5 4"
					}),
					/* @__PURE__ */ jsxs("text", {
						x: xOf(md),
						y: AXIS - 110,
						textAnchor: "middle",
						fontSize: 11,
						fontWeight: 700,
						fill: "var(--stage-accent-2, #d6336c)",
						children: ["median ", md]
					}),
					stacked.map(({ v, i, level }) => {
						const cy = AXIS - 14 - level * 19;
						const isMode = mo.includes(v) && mo.length > 0;
						return /* @__PURE__ */ jsx("circle", {
							cx: xOf(v),
							cy,
							r: 9,
							fill: isMode ? "var(--stage-warn)" : "var(--stage-accent)",
							stroke: "var(--stage-bg)",
							strokeWidth: 2,
							onPointerDown: onDown(i),
							style: {
								cursor: "grab",
								transition: drag.current === i ? "none" : "cx .08s, cy .08s"
							}
						}, i);
					}),
					/* @__PURE__ */ jsxs("g", {
						style: {
							transition: drag.current == null ? "transform .1s" : "none",
							transform: `translateX(${xOf(mu) - W / 2}px)`
						},
						children: [/* @__PURE__ */ jsx("path", {
							d: `M${W / 2},151 l-9,16 h18 Z`,
							fill: "var(--stage-good)"
						}), /* @__PURE__ */ jsxs("text", {
							x: W / 2,
							y: 180,
							textAnchor: "middle",
							fontSize: 11,
							fontWeight: 800,
							fill: "var(--stage-good)",
							children: ["mean ", mu.toFixed(2)]
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				gap: 8,
				flexWrap: "wrap",
				justifyContent: "center",
				margin: "12px 0",
				padding: "8px 0",
				borderTop: "1px solid var(--stage-grid)",
				borderBottom: "1px solid var(--stage-grid)"
			},
			children: [
				stat("mean", mu.toFixed(2), "var(--stage-good)"),
				stat("median", String(md), "var(--stage-accent-2, #d6336c)"),
				stat("mode", mo.length ? mo.join(", ") : ", ", "var(--stage-warn)"),
				stat("range", String(rg)),
				stat("variance", variance(vals).toFixed(2)),
				stat(/* @__PURE__ */ jsx(Tex$1, { tex: "\\\\sigma" }), sd.toFixed(2), "var(--stage-accent)"),
				stat("n", String(vals.length))
			]
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: addPoint,
				children: "+ point"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: removePoint,
				children: "− point"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: addOutlier,
				children: "add outlier"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "reset"
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)",
					alignSelf: "center"
				},
				children: "drag the dots ↔"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { CenterSpreadLab };