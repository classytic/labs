'use client';

import { clamp } from "../../core/util.mjs";
import { StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, MovableDot, Segment, Stage } from "@classytic/stage";

//#region src/math/number-line/preset.tsx
/**
* NumberLineLab, see a number's place, including BELOW zero. A horizontal line
* with a draggable marker that snaps to integers; optionally pose a target
* ("drag to where x lands") so the learner discovers that taking away more than
* you have lands you left of zero, a negative. Reusable for integers,
* inequalities, and the "owing weight" intuition.
*/
const snap = (v) => Math.round(v);
function NumberLineLab({ min = -8, max = 8, start = 0, target, title = "Number line", prompt = "Drag the marker along the line.", height = 200 } = {}) {
	const [val, setVal] = useState(clamp(snap(start), min, max));
	useEffect(() => {
		setVal(clamp(snap(start), min, max));
	}, [
		start,
		min,
		max
	]);
	const solved = target != null && val === target;
	useCheckpoint({
		solved,
		activity: "number-line"
	});
	const ticks = useMemo(() => {
		const t = [];
		for (let i = min; i <= max; i++) t.push(i);
		return t;
	}, [min, max]);
	const span = max - min;
	const markerColor = solved ? "var(--stage-good)" : "var(--stage-accent)";
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: min - .8,
			xMax: max + .8,
			yMin: -1.3,
			yMax: 1.3
		},
		height,
		preserveAspect: false,
		ariaLabel: `Number line from ${min} to ${max}; marker at ${val}`,
		children: [
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: min,
					y: 0
				},
				to: {
					x: 0,
					y: 0
				},
				color: "var(--stage-danger)",
				opacity: .22,
				weight: 9
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: min,
					y: 0
				},
				to: {
					x: max,
					y: 0
				},
				color: "var(--stage-fg)",
				opacity: .6,
				weight: 2
			}),
			ticks.map((t) => /* @__PURE__ */ jsx(Segment, {
				from: {
					x: t,
					y: t === 0 ? -.26 : -.16
				},
				to: {
					x: t,
					y: t === 0 ? .26 : .16
				},
				color: "var(--stage-fg)",
				opacity: t === 0 ? .7 : .35,
				weight: t === 0 ? 2 : 1
			}, `t${t}`)),
			ticks.filter((t) => span <= 16 || t % 2 === 0).map((t) => /* @__PURE__ */ jsx(Label, {
				x: t,
				y: 0,
				text: String(t),
				color: "var(--stage-muted)",
				dy: 22,
				size: 12
			}, `l${t}`)),
			solved && target != null && /* @__PURE__ */ jsx(Dot, {
				x: target,
				y: 0,
				r: 11,
				color: "var(--stage-good)",
				opacity: .3
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: val,
					y: 0
				},
				onMove: (p) => setVal(clamp(snap(p.x), min, max)),
				constrain: "horizontal",
				range: {
					min,
					max
				},
				snap: 1,
				step: 1,
				color: markerColor,
				ariaLabel: "number-line marker"
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsxs("span", {
			style: {
				fontWeight: 600,
				fontVariantNumeric: "tabular-nums"
			},
			children: ["value = ", val]
		}), target != null && /* @__PURE__ */ jsx(StatusPill, {
			ok: solved,
			children: solved ? `✓ Landed on ${target}` : "Not there yet"
		})] }),
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: target != null ? solved ? `Landed on ${target}` : `Marker at ${val}` : `Marker at ${val}` }),
		children: figure
	});
}

//#endregion
export { NumberLineLab };