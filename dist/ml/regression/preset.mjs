'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Slider, StatusPill } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Grid, Label, MovableDot, Polygon, Segment, Stage, useFrameLoop, useInView } from "@classytic/stage";

//#region src/ml/regression/preset.tsx
/**
* RegressionLab, least squares you can FEEL, and gradient descent you can WATCH.
*
* Drag the line's two handles: every data point grows a SQUARE whose area is its
* squared error, and the loss (mean squared error) updates live, "least squares"
* is literally "make the total square area smallest". Then press Descend and watch
* the line crawl downhill on its own, squares shrinking, loss tumbling. The
* learning-rate slider lets you make it overshoot and DIVERGE, the #1 gradient-
* descent intuition. Reveal snaps to the closed-form optimum to check yourself.
*
* The litmus test for ML/data labs on the stage engine: scatter + draggable fit +
* frame-loop optimisation + live loss, all from the shared primitives. Isometric
* view (preserveAspect + equal spans) so a data-unit square reads as a real
* on-screen square, and stays SSR-deterministic.
*/
const DEFAULT_DATA = [
	{
		x: 1,
		y: 2.1
	},
	{
		x: 2,
		y: 2.4
	},
	{
		x: 3,
		y: 4.2
	},
	{
		x: 4,
		y: 3.9
	},
	{
		x: 5,
		y: 5.6
	},
	{
		x: 6,
		y: 5.1
	},
	{
		x: 7,
		y: 7.2
	},
	{
		x: 8,
		y: 7
	},
	{
		x: 9,
		y: 8.3
	}
];
const slopeSign = (data) => {
	const n = data.length;
	if (n === 0) return "up";
	const xb = data.reduce((s, p) => s + p.x, 0) / n;
	const yb = data.reduce((s, p) => s + p.y, 0) / n;
	let num = 0;
	for (const p of data) num += (p.x - xb) * (p.y - yb);
	return num >= 0 ? "up" : "down";
};
function RegressionLab({ data = DEFAULT_DATA, showSquares = true, learnRate = .006, m0 = .3, b0 = 3.2, span = 10, title = "Least squares: drag the line, watch the error", prompt = "Each point grows a square of its squared error. Make the total area smallest, then press Descend and watch gradient descent do it for you.", objectives, height = 380 }) {
	const view = {
		xMin: 0,
		xMax: span,
		yMin: 0,
		yMax: span
	};
	const n = data.length;
	const mid = span / 2;
	const [line, setLine] = useState({
		m: m0,
		b: b0
	});
	const [lr, setLr] = useState(learnRate);
	const [running, setRunning] = useState(false);
	const [iter, setIter] = useState(0);
	const [history, setHistory] = useState([]);
	const { ref: viewRef, inView } = useInView();
	const opt = useMemo(() => {
		const xb = data.reduce((s, p) => s + p.x, 0) / n;
		const yb = data.reduce((s, p) => s + p.y, 0) / n;
		let num = 0, den = 0;
		for (const p of data) {
			num += (p.x - xb) * (p.y - yb);
			den += (p.x - xb) ** 2;
		}
		const m = den === 0 ? 0 : num / den;
		return {
			m,
			b: yb - m * xb
		};
	}, [data, n]);
	const mse = (ln) => data.reduce((s, p) => s + (ln.m * p.x + ln.b - p.y) ** 2, 0) / n;
	const grad = (ln) => {
		let dm = 0, db = 0;
		for (const p of data) {
			const e = ln.m * p.x + ln.b - p.y;
			dm += e * p.x;
			db += e;
		}
		return {
			dm: 2 / n * dm,
			db: 2 / n * db
		};
	};
	const loss = mse(line);
	const optLoss = mse(opt);
	const loss0 = mse({
		m: m0,
		b: b0
	});
	const closeEnough = loss <= optLoss * 1.05 + 1e-6;
	useCheckpoint({
		solved: closeEnough,
		activity: "regression"
	});
	const predictQ = useMemo(() => {
		return [{
			id: "slope-sign",
			prompt: "Before you fit the line — looking at the cloud of points, will the best-fit line slope UP or DOWN?",
			choices: [{
				value: "up",
				label: "slope up (positive)"
			}, {
				value: "down",
				label: "slope down (negative)"
			}],
			answer: slopeSign(data),
			explain: "Least squares follows the overall trend of the cloud: as x increases the points drift the same way, so the best-fit slope picks up that direction — no dragging needed to call its sign."
		}];
	}, [data]);
	const ch = useChallenge(predictQ);
	const lineRef = useRef(line);
	lineRef.current = line;
	const iterRef = useRef(0);
	iterRef.current = iter;
	useFrameLoop(() => {
		let nx = lineRef.current;
		for (let i = 0; i < 3; i++) {
			const g = grad(nx);
			nx = {
				m: nx.m - lr * g.dm,
				b: nx.b - lr * g.db
			};
		}
		setLine(nx);
		setIter((i) => i + 3);
		setHistory((h) => [...h.slice(-119), mse(nx)]);
		const g = grad(nx);
		if (Math.hypot(g.dm, g.db) < .001 || iterRef.current > 3e3 || !Number.isFinite(nx.m)) setRunning(false);
	}, { running: running && inView });
	const yAt = (x) => line.m * x + line.b;
	const handleL = {
		x: 0,
		y: yAt(0)
	};
	const handleR = {
		x: span,
		y: yAt(span)
	};
	const setFromHandles = (l, r) => {
		const m = (r.y - l.y) / (r.x - l.x || 1);
		setLine({
			m,
			b: l.y - m * l.x
		});
	};
	const dragL = (p) => {
		setRunning(false);
		setFromHandles({
			x: 0,
			y: clamp(p.y, view.yMin, view.yMax)
		}, handleR);
	};
	const dragR = (p) => {
		setRunning(false);
		setFromHandles(handleL, {
			x: span,
			y: clamp(p.y, view.yMin, view.yMax)
		});
	};
	const reset = () => {
		setLine({
			m: m0,
			b: b0
		});
		setIter(0);
		setHistory([]);
		setRunning(false);
	};
	const reveal = () => {
		setRunning(false);
		setLine(opt);
	};
	const lossFrac = clamp(loss / (loss0 || 1), 0, 1);
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height,
			ariaLabel: `Scatter with a fitted line; mean squared error ${loss.toFixed(2)}`,
			children: [
				/* @__PURE__ */ jsx(Grid, {}),
				/* @__PURE__ */ jsx(Axes, {}),
				showSquares && data.map((p, i) => {
					const yhat = line.m * p.x + line.b;
					const r = p.y - yhat;
					const dir = p.x < mid ? 1 : -1;
					const x2 = p.x + dir * Math.abs(r);
					const col = r >= 0 ? "var(--stage-good)" : "var(--stage-danger)";
					return /* @__PURE__ */ jsx(Polygon, {
						points: [
							{
								x: p.x,
								y: p.y
							},
							{
								x: p.x,
								y: yhat
							},
							{
								x: x2,
								y: yhat
							},
							{
								x: x2,
								y: p.y
							}
						],
						color: col,
						fill: col,
						fillOpacity: .16,
						weight: 1
					}, i);
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: yAt(0)
					},
					to: {
						x: span,
						y: yAt(span)
					},
					color: "var(--stage-accent)",
					weight: 3
				}),
				data.map((p, i) => /* @__PURE__ */ jsx(Dot, {
					x: p.x,
					y: p.y,
					r: 5,
					color: "var(--stage-accent-2)"
				}, i)),
				/* @__PURE__ */ jsx(MovableDot, {
					value: handleL,
					onMove: dragL,
					constrain: "vertical",
					range: {
						min: view.yMin,
						max: view.yMax
					},
					color: "var(--stage-accent)",
					ariaLabel: "line left end"
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: handleR,
					onMove: dragR,
					constrain: "vertical",
					range: {
						min: view.yMin,
						max: view.yMax
					},
					color: "var(--stage-accent)",
					ariaLabel: "line right end"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: span - 1.4,
					y: yAt(span - 1.4) + .6,
					text: `y = ${line.m.toFixed(2)}x + ${line.b.toFixed(2)}`,
					size: 12,
					color: "var(--stage-accent)"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				/* @__PURE__ */ jsxs("span", {
					style: {
						fontWeight: 700,
						fontVariantNumeric: "tabular-nums"
					},
					children: ["MSE ", /* @__PURE__ */ jsx("b", {
						style: {
							color: closeEnough ? "var(--stage-good)" : "var(--stage-fg)",
							fontSize: 18
						},
						children: loss.toFixed(3)
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					style: {
						minWidth: 120,
						height: 10,
						borderRadius: 999,
						background: "color-mix(in oklab, var(--stage-fg) 10%, transparent)",
						overflow: "hidden",
						margin: "6px 0"
					},
					children: /* @__PURE__ */ jsx("div", { style: {
						width: `${lossFrac * 100}%`,
						height: "100%",
						background: closeEnough ? "var(--stage-good)" : "var(--stage-warn)",
						transition: "width .12s, background .2s"
					} })
				}),
				/* @__PURE__ */ jsx(StatusPill, {
					ok: closeEnough,
					children: closeEnough ? "best fit!" : `optimum ${optLoss.toFixed(3)}`
				})
			]
		}), history.length > 1 && /* @__PURE__ */ jsxs("svg", {
			viewBox: "0 0 240 44",
			width: "100%",
			height: 44,
			role: "img",
			"aria-label": "loss decreasing over steps",
			style: {
				display: "block",
				maxWidth: 360,
				marginTop: 4
			},
			children: [/* @__PURE__ */ jsx("polyline", {
				points: history.map((v, i) => `${i / (history.length - 1) * 240},${44 - clamp(v / (loss0 || 1), 0, 1) * 40 - 2}`).join(" "),
				fill: "none",
				stroke: "var(--stage-accent)",
				strokeWidth: 2,
				vectorEffect: "non-scaling-stroke"
			}), /* @__PURE__ */ jsx("text", {
				x: 2,
				y: 10,
				fill: "var(--stage-muted)",
				fontSize: 9,
				children: "loss ↓"
			})]
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: () => {
					if (!Number.isFinite(line.m)) reset();
					setRunning((r) => !r);
				},
				children: running ? "⏸ Pause" : "▶ Descend"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-chip",
				onClick: reveal,
				children: "Reveal best fit"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-chip",
				onClick: reset,
				children: "Reset"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "learning rate",
				value: /* @__PURE__ */ jsxs("span", {
					style: {
						fontVariantNumeric: "tabular-nums",
						color: lr > .02 ? "var(--stage-danger)" : "var(--stage-muted)"
					},
					children: [lr.toFixed(3), lr > .02 ? " ⚠" : ""]
				}),
				children: /* @__PURE__ */ jsx(Slider, {
					value: lr,
					min: .001,
					max: .03,
					step: .001,
					onChange: setLr,
					ariaLabel: "learning rate"
				})
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					marginLeft: "auto",
					color: "var(--stage-muted)",
					fontVariantNumeric: "tabular-nums"
				},
				children: ["step ", iter]
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: predictQ,
			state: ch,
			title: "Predict first"
		}), /* @__PURE__ */ jsx(LiveRegion, { children: `Line y = ${line.m.toFixed(2)}x + ${line.b.toFixed(2)}. Mean squared error ${loss.toFixed(2)}. ${closeEnough ? "This is the best fit." : ""}` })] }),
		children: figure
	});
}

//#endregion
export { RegressionLab };