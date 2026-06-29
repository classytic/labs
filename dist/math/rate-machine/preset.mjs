'use client';

import { Stepper } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { CoordPlane } from "../../kit/coords.mjs";
import { Vessel } from "../../kit/vessel.mjs";
import { getScene } from "../../kit/scenes.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, MovableDot, Point, Polyline, Segment } from "@classytic/stage";

//#region src/math/rate-machine/preset.tsx
/**
* RateMachineLab, the COUNT-driven member of the concrete → graph family (sibling of
* the reading-driven LinearModelLab). Here the learner drives the INPUT: drag the
* count up and down (or step it) and watch one quantity scale with it in three
* linked views at once:
*   • discrete objects drop INTO / out of the vessel as the count changes;
*   • the liquid level rises and falls by the same rate each step;
*   • a point rides up the line on the graph, leaving a dot at every whole step so
*     the equal-step pattern of a proportional/linear rule builds before your eyes.
*
* Proportionality becomes something you scrub, not a table you read. Built entirely
* on the shared primitives (Vessel + scene registry, CoordPlane + MovableDot, the
* kit Stepper / LabFrame / useCheckpoint), so it stays consistent with every other
* lab and an author skins it (battery, jar, savings, charge) by swapping props.
*/
const num = (n) => String(Math.round(n * 100) / 100);
const singular = (s) => s.replace(/s$/, "");
function RateMachineLab(props = {}) {
	const { rate = 5, base = 0, maxCount = 6, startCount = 1, yMax = 40, yStep = 5, xLabel = "Items", yLabel = "Cost", unit = "$", itemLabel, scene = "vessel", extraScenes = [], showObjects = true, liquidColor = "var(--stage-accent)", objectColor = "#e85aa6", target, height = 340, title = `Build it up: ${rate} ${unit} per ${singular((itemLabel ?? xLabel).toLowerCase())}`, prompt, activity = "rate-machine" } = props;
	const totalOf = (k) => rate * k + base;
	const [count, setCount] = useState(() => Math.max(0, Math.min(maxCount, startCount)));
	const total = totalOf(count);
	const one = singular((itemLabel ?? xLabel).toLowerCase());
	const solved = target != null && count === target;
	const tone = solved ? "ok" : "idle";
	useCheckpoint({
		solved,
		activity,
		response: `${count} ${one} → ${num(total)} ${unit}`
	});
	const setK = (k) => setCount(Math.max(0, Math.min(maxCount, Math.round(k))));
	const view = {
		xMin: -maxCount * .04,
		xMax: maxCount * 1.06,
		yMin: -yMax * .06,
		yMax: yMax * 1.06
	};
	const handle = {
		x: count,
		y: total
	};
	const accent = solved ? "var(--stage-good)" : "var(--stage-accent)";
	const dots = [];
	for (let k = 0; k <= count; k++) {
		if (k === count) continue;
		dots.push(/* @__PURE__ */ jsx(Point, {
			x: k,
			y: totalOf(k),
			r: 5,
			color: "var(--stage-fg)"
		}, `d${k}`));
	}
	const figure = /* @__PURE__ */ jsxs(CoordPlane, {
		view,
		height,
		preserveAspect: false,
		stepX: 1,
		stepY: yStep,
		ariaLabel: `Graph of ${yLabel} against ${xLabel}; ${count} ${count === 1 ? one : (itemLabel ?? xLabel).toLowerCase()} so far`,
		children: [
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: view.yMax,
				text: yLabel,
				dx: 6,
				dy: -2,
				anchor: "start",
				size: 12,
				weight: 700
			}),
			/* @__PURE__ */ jsx(Label, {
				x: view.xMax,
				y: 0,
				text: xLabel,
				dx: -2,
				dy: 16,
				anchor: "end",
				size: 12,
				weight: 700
			}),
			count > 0 && /* @__PURE__ */ jsx(Polyline, {
				points: [{
					x: 0,
					y: base
				}, ...Array.from({ length: count }, (_, i) => ({
					x: i + 1,
					y: totalOf(i + 1)
				}))],
				color: accent,
				weight: 2,
				opacity: .55
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: count,
					y: total
				},
				to: {
					x: 0,
					y: total
				},
				color: accent,
				weight: 1.5,
				dashed: true,
				opacity: .8
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: total,
				text: num(total),
				dx: -8,
				anchor: "end",
				size: 11,
				weight: 700,
				color: accent
			}),
			dots,
			/* @__PURE__ */ jsx(MovableDot, {
				value: handle,
				onMove: (p) => setK(p.x),
				constrain: "horizontal",
				range: {
					min: 0,
					max: maxCount
				},
				step: 1,
				color: accent,
				r: 8,
				ariaLabel: `drag right to add ${(itemLabel ?? xLabel).toLowerCase()}, left to remove; now ${count}`
			}),
			/* @__PURE__ */ jsx(Label, {
				x: count,
				y: total,
				text: `${count} ${count === 1 ? one : (itemLabel ?? xLabel).toLowerCase()}`,
				dx: 10,
				dy: -8,
				anchor: "start",
				size: 11,
				weight: 700,
				color: accent
			})
		]
	});
	const fillFrac = total / yMax;
	const levelColor = solved ? "var(--stage-good)" : liquidColor;
	const sceneLabel = `${count} ${count === 1 ? one : (itemLabel ?? xLabel).toLowerCase()}`;
	const names = scene === "none" ? [] : [scene, ...extraScenes];
	const multi = names.length > 1;
	const dim = multi ? Math.round((height - 8) / names.length) - 6 : height - 8;
	const twins = names.map((name, i) => {
		return /* @__PURE__ */ jsx("div", { children: name === "vessel" ? /* @__PURE__ */ jsx(Vessel, {
			width: multi ? 110 : 132,
			height: dim,
			fillFrac,
			guessTone: tone,
			objects: showObjects ? count : 0,
			liquidColor: levelColor,
			objectColor,
			label: multi ? void 0 : sceneLabel,
			scaleMax: multi ? void 0 : yMax,
			scaleStep: yStep * 2,
			unit
		}) : getScene(name)?.render({
			frac: fillFrac,
			guessTone: tone,
			color: levelColor,
			label: multi ? void 0 : sceneLabel,
			width: multi ? 118 : 138,
			height: dim
		}) }, i);
	}).filter((t) => t.props.children);
	const readout = /* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 6,
				fontSize: 13,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				/* @__PURE__ */ jsxs("span", {
					style: { fontWeight: 700 },
					children: [
						count,
						" × ",
						num(rate),
						base ? ` + ${num(base)}` : "",
						" = ",
						/* @__PURE__ */ jsxs("strong", {
							style: { color: `var(--stage-${solved ? "good" : "fg"})` },
							children: [
								num(total),
								" ",
								unit
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: [
						"Each ",
						one,
						" adds ",
						/* @__PURE__ */ jsxs("strong", { children: [
							num(rate),
							" ",
							unit
						] }),
						": the same step every time."
					]
				}),
				target != null && (solved ? /* @__PURE__ */ jsxs("span", {
					style: {
						color: "var(--stage-good)",
						fontWeight: 700
					},
					children: [
						"✓ ",
						target,
						" ",
						target === 1 ? one : (itemLabel ?? xLabel).toLowerCase(),
						"."
					]
				}) : /* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: [
						"Goal: set it to ",
						target,
						"."
					]
				}))
			]
		})
	});
	const aside = twins.length ? /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 10,
			justifyItems: "center"
		},
		children: [twins, readout]
	}) : readout;
	const controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: xLabel,
		name: "count",
		value: `${count}`,
		children: /* @__PURE__ */ jsx(Stepper, {
			label: xLabel,
			value: count,
			min: 0,
			max: maxCount,
			step: 1,
			onChange: setK
		})
	}) });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: prompt ?? `Drag the point right to add ${(itemLabel ?? xLabel).toLowerCase()}. Watch the ${unit === "$" ? yLabel.toLowerCase() : "level"} grow by ${num(rate)} ${unit} each time.`,
		aside,
		controls,
		children: figure
	});
}

//#endregion
export { RateMachineLab };