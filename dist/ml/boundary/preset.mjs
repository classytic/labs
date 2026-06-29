'use client';

import { gaussian, mulberry32 } from "../../core/rng.mjs";
import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Circle, Dot, Grid, MovableDot, Polygon, Segment, Stage, useControlSurface, useFrameLoop, useInView } from "@classytic/stage";

//#region src/ml/boundary/preset.tsx
/**
* DecisionBoundaryLab, a linear classifier you can SEE think. Two classes of
* points sit in the plane; a straight boundary splits it into two predicted
* regions. Drag the boundary's two handles to separate the classes by hand
* (misclassified points get a red ring, accuracy updates live), then hit "train"
* and watch a PERCEPTRON nudge the same line into place on its own. The honest
* twist: the XOR dataset can't be split by ANY straight line, accuracy stalls
* below 100%, the door to "why we need more than a line."
*
* Pure stage primitives (Stage + Polygon shading + MovableDot handles + frame-loop
* perceptron). Seeded points → replayable. The "manipulation IS the lesson" ML lab.
*/
const R = 5;
const A0 = "#1c7ed6", A1 = "#e8590c";
const view = {
	xMin: -5,
	xMax: R,
	yMin: -5,
	yMax: R
};
function makeData(kind, seed) {
	const rng = mulberry32(seed);
	const pts = [];
	const blob = (cx, cy, cls, k) => {
		for (let i = 0; i < k; i++) pts.push({
			x: gaussian(rng, cx, 1),
			y: gaussian(rng, cy, 1),
			cls
		});
	};
	if (kind === "separable") {
		blob(-2, -1.5, 0, 14);
		blob(2, 1.5, 1, 14);
	} else if (kind === "overlap") {
		blob(-1.1, -.6, 0, 16);
		blob(1.1, .6, 1, 16);
	} else {
		blob(-2, 2, 0, 8);
		blob(2, -2, 0, 8);
		blob(2, 2, 1, 8);
		blob(-2, -2, 1, 8);
	}
	return pts;
}
const clampR = (v) => Math.max(-5, Math.min(R, v));
function DecisionBoundaryLab({ dataset = "separable", seed = 11, title = "Draw the decision boundary", prompt, objectives, hints: hintList, controlId }) {
	const [kind, setKind] = useState(dataset);
	const [pts, setPts] = useState(() => makeData(dataset, seed));
	const [a1, setA1] = useState({
		x: 0,
		y: -5
	});
	const [a2, setA2] = useState({
		x: 0,
		y: R
	});
	const [training, setTraining] = useState(false);
	const hints = useHints(hintList);
	const { ref: viewRef, inView } = useInView();
	const w = useRef([
		0,
		1,
		0
	]);
	const iter = useRef(0);
	const wOf = (p, q) => {
		const dx = q.x - p.x;
		const nx = -(q.y - p.y), ny = dx;
		return [
			-(nx * p.x + ny * p.y),
			nx,
			ny
		];
	};
	const weights = useMemo(() => wOf(a1, a2), [a1, a2]);
	const raw = (W, p) => W[0] + W[1] * p.x + W[2] * p.y;
	const { sign, acc, wrong } = useMemo(() => {
		const score = (s) => pts.reduce((a, p) => a + ((s * raw(weights, p) > 0 ? 1 : 0) === p.cls ? 1 : 0), 0);
		const sp = score(1), sn = score(-1);
		const s = sp >= sn ? 1 : -1;
		const wr = pts.filter((p) => (s * raw(weights, p) > 0 ? 1 : 0) !== p.cls);
		return {
			sign: s,
			acc: pts.length ? Math.max(sp, sn) / pts.length : 0,
			wrong: wr
		};
	}, [pts, weights]);
	useCheckpoint({
		solved: acc === 1,
		activity: `boundary:${title}`,
		hintsUsed: hints.count
	});
	const regions = useMemo(() => {
		const corners = [
			{
				x: -5,
				y: -5
			},
			{
				x: R,
				y: -5
			},
			{
				x: R,
				y: R
			},
			{
				x: -5,
				y: R
			}
		];
		const f = (p) => sign * raw(weights, p);
		const pos = [], neg = [];
		for (let i = 0; i < 4; i++) {
			const a = corners[i], b = corners[(i + 1) % 4], fa = f(a), fb = f(b);
			(fa >= 0 ? pos : neg).push(a);
			if (fa > 0 !== fb > 0) {
				const t = fa / (fa - fb);
				const m = {
					x: a.x + t * (b.x - a.x),
					y: a.y + t * (b.y - a.y)
				};
				pos.push(m);
				neg.push(m);
			}
		}
		return {
			pos,
			neg
		};
	}, [weights, sign]);
	useFrameLoop(() => {
		if (!training) return;
		const lr = .04;
		let changed = 0;
		for (const p of pts) {
			const pred = w.current[0] + w.current[1] * p.x + w.current[2] * p.y > 0 ? 1 : 0;
			const e = p.cls - pred;
			if (e) {
				changed++;
				w.current[0] += lr * e;
				w.current[1] += lr * e * p.x;
				w.current[2] += lr * e * p.y;
			}
		}
		iter.current++;
		const [b, wx, wy] = w.current;
		if (Math.abs(wy) > Math.abs(wx)) {
			setA1({
				x: -5,
				y: clampR(-(b + wx * -5) / (wy || 1e-6))
			});
			setA2({
				x: R,
				y: clampR(-(b + wx * R) / (wy || 1e-6))
			});
		} else {
			setA1({
				x: clampR(-(b + wy * -5) / (wx || 1e-6)),
				y: -5
			});
			setA2({
				x: clampR(-(b + wy * R) / (wx || 1e-6)),
				y: R
			});
		}
		if (changed === 0 || iter.current > 400) setTraining(false);
	}, { running: training && inView });
	const train = useCallback(() => {
		w.current = [...weights];
		iter.current = 0;
		setTraining(true);
	}, [weights]);
	const loadData = useCallback((k) => {
		setKind(k);
		setPts(makeData(k, seed));
		setTraining(false);
		setA1({
			x: 0,
			y: -5
		});
		setA2({
			x: 0,
			y: R
		});
	}, [seed]);
	const resetLine = useCallback(() => {
		setTraining(false);
		setA1({
			x: 0,
			y: -5
		});
		setA2({
			x: 0,
			y: R
		});
	}, []);
	useControlSurface(controlId, {
		dataset: {
			type: "enum",
			label: "dataset",
			options: [
				"separable",
				"overlap",
				"xor"
			],
			get: () => kind,
			set: (v) => loadData(v)
		},
		train: {
			type: "action",
			label: "train (perceptron)",
			invoke: train
		},
		reset: {
			type: "action",
			label: "reset boundary",
			invoke: resetLine
		}
	});
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height: 330,
			ariaLabel: `decision boundary, accuracy ${(acc * 100).toFixed(0)}%`,
			children: [
				/* @__PURE__ */ jsx(Grid, { step: 1 }),
				/* @__PURE__ */ jsx(Axes, {}),
				/* @__PURE__ */ jsx(Polygon, {
					points: regions.neg,
					fill: A0,
					fillOpacity: .12,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: regions.pos,
					fill: A1,
					fillOpacity: .12,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: a1,
					to: a2,
					color: "var(--stage-fg)",
					weight: 2.5
				}),
				pts.map((p, i) => /* @__PURE__ */ jsx(Dot, {
					x: p.x,
					y: p.y,
					r: 4.5,
					color: p.cls === 0 ? A0 : A1
				}, i)),
				wrong.map((p, i) => /* @__PURE__ */ jsx(Circle, {
					center: {
						x: p.x,
						y: p.y
					},
					r: .32,
					fill: "none",
					color: "var(--stage-danger, #e03131)",
					weight: 2
				}, `w${i}`)),
				/* @__PURE__ */ jsx(MovableDot, {
					value: a1,
					onMove: (p) => {
						setTraining(false);
						setA1({
							x: clampR(p.x),
							y: clampR(p.y)
						});
					},
					range: {
						min: -5,
						max: R
					},
					color: "var(--stage-fg)",
					ariaLabel: "boundary handle 1"
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: a2,
					onMove: (p) => {
						setTraining(false);
						setA2({
							x: clampR(p.x),
							y: clampR(p.y)
						});
					},
					range: {
						min: -5,
						max: R
					},
					color: "var(--stage-fg)",
					ariaLabel: "boundary handle 2"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				/* @__PURE__ */ jsx("span", {
					style: { color: A0 },
					children: "● class A"
				}),
				"  ",
				/* @__PURE__ */ jsx("span", {
					style: { color: A1 },
					children: "● class B"
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "lab-callout-big",
					style: { color: acc === 1 ? "var(--stage-good)" : "var(--stage-accent)" },
					children: [
						"accuracy ",
						(acc * 100).toFixed(1),
						"%"
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: { color: "var(--stage-muted)" },
					children: [wrong.length, " misclassified"]
				}),
				kind === "xor" && acc < 1 && /* @__PURE__ */ jsx("div", {
					style: {
						color: "var(--stage-danger, #e03131)",
						fontWeight: 600
					},
					children: "a single line can't split XOR"
				})
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Chip, {
				selected: training,
				onClick: train,
				children: training ? "⏳ training…" : "⚙ train (perceptron)"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: resetLine,
				children: "reset line"
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "data:"
			}),
			[
				"separable",
				"overlap",
				"xor"
			].map((k) => /* @__PURE__ */ jsx(Chip, {
				selected: kind === k,
				onClick: () => loadData(k),
				children: k
			}, k)),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "· drag the two handles"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { DecisionBoundaryLab };