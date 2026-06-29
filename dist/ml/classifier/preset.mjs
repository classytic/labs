'use client';

import { clamp } from "../../core/util.mjs";
import { StatusPill } from "../../kit/controls.mjs";
import { LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, MovableDot, Polygon, Segment, Stage } from "@classytic/stage";

//#region src/ml/classifier/preset.tsx
/**
* ClassifierThresholdLab, the precision/recall trade-off you can drag. Positive
* and negative examples sit along a score axis (they OVERLAP, like any real
* classifier). Drag the threshold: everything to its right is predicted positive.
* The 2×2 confusion matrix and precision / recall / accuracy / F1 update live , 
* slide right and precision climbs while recall falls; there's no setting that
* maxes both. Misclassified points get a red ring.
*
* A data-analytics instrument from pure primitives: Dot + a horizontal MovableDot
* threshold + a live HTML confusion matrix.
*/
const POS = "var(--stage-good)";
const NEG = "var(--stage-muted)";
const DEFAULT_POS = [
	4,
	5,
	5.5,
	6,
	6.5,
	7,
	7.5,
	8,
	8.5,
	9
];
const DEFAULT_NEG = [
	1,
	1.5,
	2,
	2.5,
	3,
	3.5,
	4,
	4.5,
	5,
	6
];
const PREDICT_Q = [{
	id: "recall-vs-threshold",
	prompt: "As you RAISE the threshold (label fewer things positive), what happens to RECALL — the share of true positives you catch?",
	choices: [
		{
			value: "down",
			label: "recall falls"
		},
		{
			value: "up",
			label: "recall rises"
		},
		{
			value: "same",
			label: "unchanged"
		}
	],
	answer: "down",
	explain: "Raising the threshold means fewer points clear the bar, so you catch fewer of the real positives (more false negatives): recall falls. Precision usually rises in return, since the ones you do call positive are more likely correct. That is the trade-off, no single threshold maxes both."
}];
function ClassifierThresholdLab({ positives = DEFAULT_POS, negatives = DEFAULT_NEG, threshold = 5, span = 10, title = "The precision–recall trade-off", prompt = "Drag the threshold: everything to its right is called positive. Watch the confusion matrix, pushing precision up costs you recall.", objectives, height = 300 }) {
	const view = {
		xMin: 0,
		xMax: span,
		yMin: -4,
		yMax: 4
	};
	const [t, setT] = useState(threshold);
	const [moved, setMoved] = useState(false);
	const ch = useChallenge(PREDICT_Q);
	useCheckpoint({
		solved: moved && ch.allCorrect,
		activity: "classifier-threshold"
	});
	const TP = positives.filter((s) => s >= t).length;
	const FN = positives.length - TP;
	const FP = negatives.filter((s) => s >= t).length;
	const TN = negatives.length - FP;
	const total = positives.length + negatives.length;
	const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
	const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
	const accuracy = (TP + TN) / total;
	const f1 = precision + recall === 0 ? 0 : 2 * precision * recall / (precision + recall);
	const dragT = (p) => {
		setT(clamp(p.x, view.xMin, view.xMax));
		if (!moved) setMoved(true);
	};
	const yOf = (i) => i % 3 - 1;
	const dot = (s, i, posClass) => {
		const wrong = s >= t !== posClass;
		const cy = (posClass ? 2 : -2) + yOf(i) * .5;
		return /* @__PURE__ */ jsxs("g", { children: [wrong && /* @__PURE__ */ jsx(Circle, {
			center: {
				x: s,
				y: cy
			},
			r: .42,
			color: "var(--stage-danger)",
			fill: "none",
			weight: 2
		}), /* @__PURE__ */ jsx(Dot, {
			x: s,
			y: cy,
			r: 5.5,
			color: posClass ? POS : NEG
		})] }, `${posClass ? "p" : "n"}${i}`);
	};
	const Cell = ({ label, n, tone }) => /* @__PURE__ */ jsxs("div", {
		style: {
			padding: "8px 10px",
			borderRadius: 8,
			background: `color-mix(in oklab, ${tone} 14%, var(--stage-bg))`,
			border: `1px solid color-mix(in oklab, ${tone} 40%, var(--stage-grid))`,
			textAlign: "center",
			minWidth: 78
		},
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				fontSize: 10.5,
				fontWeight: 700,
				color: "var(--stage-muted)"
			},
			children: label
		}), /* @__PURE__ */ jsx("div", {
			style: {
				fontSize: 20,
				fontWeight: 800,
				color: tone
			},
			children: n
		})]
	});
	const Metric = ({ label, v }) => /* @__PURE__ */ jsxs("div", {
		style: {
			flex: 1,
			minWidth: 90
		},
		children: [/* @__PURE__ */ jsxs("div", {
			style: {
				fontSize: 11,
				fontWeight: 700,
				color: "var(--stage-muted)"
			},
			children: [
				label,
				" ",
				(v * 100).toFixed(0),
				"%"
			]
		}), /* @__PURE__ */ jsx("div", {
			style: {
				height: 8,
				borderRadius: 999,
				background: "color-mix(in oklab, var(--stage-fg) 10%, transparent)",
				overflow: "hidden"
			},
			children: /* @__PURE__ */ jsx("div", { style: {
				width: `${v * 100}%`,
				height: "100%",
				background: "var(--stage-accent)",
				transition: "width .1s"
			} })
		})]
	});
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view,
		height,
		preserveAspect: false,
		ariaLabel: `Score axis with a threshold at ${t.toFixed(1)}; precision ${(precision * 100).toFixed(0)}%, recall ${(recall * 100).toFixed(0)}%`,
		children: [
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					{
						x: t,
						y: view.yMin
					},
					{
						x: span,
						y: view.yMin
					},
					{
						x: span,
						y: view.yMax
					},
					{
						x: t,
						y: view.yMax
					}
				],
				color: "transparent",
				fill: "var(--stage-accent)",
				fillOpacity: .08,
				weight: 0
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: 0
				},
				to: {
					x: span,
					y: 0
				},
				color: "var(--stage-grid)",
				weight: 1
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 1.2,
				y: 3.5,
				text: "positives ●",
				size: 11,
				color: POS
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 1.2,
				y: -3.5,
				text: "negatives ●",
				size: 11,
				color: NEG
			}),
			/* @__PURE__ */ jsx(Label, {
				x: span - 1.3,
				y: 3.5,
				text: "→ called +",
				size: 11,
				color: "var(--stage-accent)"
			}),
			positives.map((s, i) => dot(s, i, true)),
			negatives.map((s, i) => dot(s, i, false)),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: t,
					y: view.yMin
				},
				to: {
					x: t,
					y: view.yMax
				},
				color: "var(--stage-accent)",
				weight: 2.5,
				dashed: true
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: t,
					y: 0
				},
				onMove: dragT,
				constrain: "horizontal",
				range: {
					min: view.xMin,
					max: view.xMax
				},
				r: 9,
				color: "var(--stage-accent)",
				ariaLabel: "decision threshold"
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "1fr 1fr",
				gap: 4
			},
			children: [
				/* @__PURE__ */ jsx(Cell, {
					label: "true +",
					n: TP,
					tone: POS
				}),
				/* @__PURE__ */ jsx(Cell, {
					label: "false −",
					n: FN,
					tone: "var(--stage-warn)"
				}),
				/* @__PURE__ */ jsx(Cell, {
					label: "false +",
					n: FP,
					tone: "var(--stage-danger)"
				}),
				/* @__PURE__ */ jsx(Cell, {
					label: "true −",
					n: TN,
					tone: NEG
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexWrap: "wrap",
				gap: 12,
				alignContent: "flex-start"
			},
			children: [
				/* @__PURE__ */ jsx(Metric, {
					label: "precision",
					v: precision
				}),
				/* @__PURE__ */ jsx(Metric, {
					label: "recall",
					v: recall
				}),
				/* @__PURE__ */ jsx(Metric, {
					label: "accuracy",
					v: accuracy
				}),
				/* @__PURE__ */ jsx(Metric, {
					label: "F1",
					v: f1
				}),
				/* @__PURE__ */ jsxs(StatusPill, {
					ok: true,
					children: ["threshold ", t.toFixed(1)]
				})
			]
		})] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: PREDICT_Q,
			state: ch,
			title: "Predict first"
		}), /* @__PURE__ */ jsx(LiveRegion, { children: `Threshold ${t.toFixed(1)}. Precision ${(precision * 100).toFixed(0)} percent, recall ${(recall * 100).toFixed(0)} percent.` })] }),
		children: figure
	});
}

//#endregion
export { ClassifierThresholdLab };