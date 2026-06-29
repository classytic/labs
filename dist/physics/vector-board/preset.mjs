'use client';

import { toDeg } from "../../core/util.mjs";
import { RichText } from "../../kit/rich.mjs";
import { Callout, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { Feedback, HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { AngleArc, LabeledVector, RightAngleMark } from "../../kit/diagram.mjs";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Label, MovableDot, Segment, Stage, Vector, vec } from "@classytic/stage";

//#region src/physics/vector-board/preset.tsx
/**
* VectorBoard, the GENERAL, authorable vector lab (CAIE/IGCSE).
*
* A creator declares vectors (tail, components, colour, label, draggable) + how
* to combine them (`sum` → resultant, tip-to-tail / parallelogram; `diff` →
* relative velocity, the rain / "V_RC = V_C − V_A" case) + an optional
* drag-to-match goal. From this one board: resultant addition, component
* resolution, river-crossing, walking-home, relative-velocity, all as DATA.
*
* Built entirely on @classytic/stage primitives (Vector, MovableDot, Axes, vec
* math, useLearner) + the shared LabeledVector / AngleArc helpers, nothing
* reinvented. Drag a head, watch the resultant + angle update; land it on the
* target to solve.
*/
const ORIGIN = {
	x: 0,
	y: 0
};
const PALETTE = [
	"var(--stage-accent)",
	"var(--stage-accent-2)",
	"var(--stage-good)"
];
/**
* Frame the board to everything that matters, origin, every arrow tip, the
* resultant, and the goal, with padding, snapped to integers for clean axes.
* Computed from the AUTHORED vectors (not live drag state) so the view stays put
* while the learner drags, and the resultant can never shoot off-frame.
*/
function autoView(vectors, combine, goal) {
	const comps = vectors.map((v) => v.comp);
	const pts = [ORIGIN];
	vectors.forEach((v, i) => pts.push(vec.add(v.tail ?? ORIGIN, comps[i] ?? ORIGIN)));
	if (combine === "diff") pts.push(vec.sub(comps[0] ?? ORIGIN, comps[1] ?? ORIGIN));
	else if (combine !== "none") pts.push(comps.reduce((a, c) => vec.add(a, c), ORIGIN));
	if (goal) pts.push(goal.match);
	const xs = pts.map((p) => p.x);
	const ys = pts.map((p) => p.y);
	const pad = 1.6;
	return {
		xMin: Math.floor(Math.min(0, ...xs) - pad),
		xMax: Math.ceil(Math.max(0, ...xs) + pad),
		yMin: Math.floor(Math.min(0, ...ys) - pad),
		yMax: Math.ceil(Math.max(0, ...ys) + pad)
	};
}
function VectorBoardLab({ view: viewProp, vectors, combine = "sum", resultantLabel = "R", resultantColor = "var(--stage-warn)", show = {
	angle: true,
	magnitude: true
}, goal, snap = 1, objectives, hints: hintList, title = "Vectors", prompt = "Drag the arrow heads.", height = 320 }) {
	const [comps, setComps] = useState(() => vectors.map((v) => v.comp));
	useEffect(() => {
		setComps(vectors.map((v) => v.comp));
	}, [vectors]);
	const view = useMemo(() => viewProp ?? autoView(vectors, combine, goal), [
		viewProp,
		vectors,
		combine,
		goal
	]);
	const tailOf = (i) => vectors[i]?.tail ?? ORIGIN;
	const tipOf = (i) => vec.add(tailOf(i), comps[i] ?? ORIGIN);
	const snapV = (v) => snap ? Math.round(v / snap) * snap : v;
	const resultant = useMemo(() => {
		if (combine === "none" || comps.length === 0) return null;
		if (combine === "diff") return vec.sub(comps[0] ?? ORIGIN, comps[1] ?? ORIGIN);
		return comps.reduce((acc, c) => vec.add(acc, c), ORIGIN);
	}, [comps, combine]);
	const tol = goal?.tol ?? .45;
	const solved = !!(goal && resultant && vec.dist(resultant, goal.match) <= tol);
	const hints = useHints(hintList);
	useCheckpoint({
		solved,
		activity: "vector-board",
		hintsUsed: hints.count
	});
	const resMag = resultant ? vec.mag(resultant) : 0;
	const resDeg = resultant ? Math.round(toDeg(vec.angle(resultant))) : 0;
	const resColor = solved ? "var(--stage-good)" : resultantColor;
	const showResultant = !!resultant && !(combine === "sum" && vectors.length === 1);
	const misconception = goal && !solved && resultant && Math.abs(vec.mag(resultant) - vec.mag(goal.match)) < tol ? "Right length, now fix the direction (rotate it onto the target)." : void 0;
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view,
		height,
		preserveAspect: true,
		ariaLabel: `${title}; resultant magnitude ${resMag.toFixed(1)} at ${resDeg} degrees`,
		children: [
			/* @__PURE__ */ jsx(Axes, { labels: true }),
			goal && /* @__PURE__ */ jsx(Vector, {
				tail: ORIGIN,
				tip: goal.match,
				color: "var(--stage-good)",
				weight: 2,
				opacity: .28
			}),
			show.parallelogram && combine === "sum" && resultant && comps.length === 2 && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Segment, {
				from: comps[0] ?? ORIGIN,
				to: resultant,
				color: "var(--stage-muted)",
				dashed: true,
				weight: 1.2,
				opacity: .6
			}), /* @__PURE__ */ jsx(Segment, {
				from: comps[1] ?? ORIGIN,
				to: resultant,
				color: "var(--stage-muted)",
				dashed: true,
				weight: 1.2,
				opacity: .6
			})] }),
			vectors.map((v, i) => {
				const col = v.color ?? PALETTE[i % PALETTE.length];
				const c = comps[i];
				if (!c) return null;
				const t = tailOf(i);
				const magStr = vec.mag(c).toFixed(1);
				const text = v.label ? show.magnitude ? `|${v.label}| = ${magStr}` : v.label : show.magnitude ? magStr : "";
				const at = {
					x: t.x + c.x * .62,
					y: t.y + c.y * .62
				};
				const L = Math.hypot(c.x, c.y) || 1;
				let pmx = -c.y / L, pmy = c.x / L;
				const ref = resultant ?? {
					x: c.x,
					y: c.y
				};
				if (pmx * (ref.x - at.x) + pmy * (ref.y - at.y) > 0) {
					pmx = -pmx;
					pmy = -pmy;
				}
				const dx = pmx * 26;
				const dy = -pmy * 26;
				return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(LabeledVector, {
					tail: t,
					comp: c,
					color: col
				}), text && /* @__PURE__ */ jsx(Label, {
					x: at.x,
					y: at.y,
					text,
					color: col,
					dx,
					dy,
					size: 12
				})] }, v.id ?? i);
			}),
			resultant && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				show.components && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx(Segment, {
						from: ORIGIN,
						to: {
							x: resultant.x,
							y: 0
						},
						color: "var(--stage-muted)",
						dashed: true,
						weight: 1.2,
						opacity: .7
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: resultant.x,
							y: 0
						},
						to: resultant,
						color: "var(--stage-muted)",
						dashed: true,
						weight: 1.2,
						opacity: .7
					}),
					/* @__PURE__ */ jsx(RightAngleMark, {
						at: {
							x: resultant.x,
							y: 0
						},
						u: {
							x: -Math.sign(resultant.x || 1),
							y: 0
						},
						v: {
							x: 0,
							y: Math.sign(resultant.y || 1)
						}
					})
				] }),
				showResultant && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(LabeledVector, {
					tail: ORIGIN,
					comp: resultant,
					color: resColor,
					weight: 3.5
				}), /* @__PURE__ */ jsx(Label, {
					x: resultant.x,
					y: resultant.y,
					text: resultantLabel,
					color: resColor,
					dx: 12,
					dy: -10,
					size: 13
				})] }),
				show.angle && /* @__PURE__ */ jsx(AngleArc, {
					at: ORIGIN,
					from: {
						x: 1,
						y: 0
					},
					to: resultant,
					label: `${Math.abs(resDeg)}°`
				})
			] }),
			vectors.map((v, i) => v.drag ? /* @__PURE__ */ jsx(MovableDot, {
				value: tipOf(i),
				onMove: (p) => setComps((cs) => cs.map((c, j) => j === i ? {
					x: snapV(p.x) - tailOf(i).x,
					y: snapV(p.y) - tailOf(i).y
				} : c)),
				range: {
					min: Math.min(view.xMin, view.yMin),
					max: Math.max(view.xMax, view.yMax)
				},
				snap: snap || 1,
				color: v.color ?? PALETTE[i % PALETTE.length],
				ariaLabel: `${v.label ?? "vector"} head`
			}, `d${v.id ?? i}`) : null)
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsxs(Callout, {
				tone: solved ? "result" : "info",
				children: [/* @__PURE__ */ jsxs("span", {
					style: {
						fontWeight: 600,
						fontVariantNumeric: "tabular-nums"
					},
					children: [
						/* @__PURE__ */ jsx(RichText, { children: resultantLabel }),
						" = ",
						resMag.toFixed(1),
						" @ ",
						resDeg,
						"°"
					]
				}), goal && /* @__PURE__ */ jsx(Feedback, {
					ok: solved,
					misconception,
					okText: "On target",
					tryText: "Match the target"
				})]
			}),
			goal && /* @__PURE__ */ jsx(HintLadder, { hints }),
			/* @__PURE__ */ jsx(LiveRegion, { children: goal ? solved ? "On target" : misconception ?? `Resultant ${resMag.toFixed(1)} at ${resDeg} degrees` : "" })
		] }),
		children: figure
	});
}

//#endregion
export { VectorBoardLab };