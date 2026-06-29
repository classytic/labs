'use client';

import { CoordPlane } from "./coords.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, MovableDot, Point, Segment } from "@classytic/stage";

//#region src/kit/predict.tsx
const TONE_COLOR = {
	idle: "var(--stage-accent)",
	ok: "var(--stage-good)",
	no: "var(--stage-warn)"
};
const C_DATA = "var(--stage-fg)";
const C_GRID = "var(--stage-muted)";
function PredictPlot({ data, guess, onGuess, tone = "idle", xMax, yMax, xStep = 1, yStep, xLabel, yLabel, height = 340, lockX = true, snap = true, rule = null, showColumn = true, readout = true }) {
	const yS = yStep ?? Math.max(1, Math.round(yMax / 8));
	const view = {
		xMin: -xMax * .04,
		xMax: xMax * 1.04,
		yMin: -yMax * .06,
		yMax: yMax * 1.06
	};
	const gColor = TONE_COLOR[tone];
	const snapXY = (p) => {
		const x = lockX ? guess.x : snap ? Math.round(p.x / xStep) * xStep : p.x;
		const y = snap ? Math.round(p.y / yS) * yS : p.y;
		return {
			x,
			y: Math.max(0, Math.min(yMax, y))
		};
	};
	return /* @__PURE__ */ jsxs(CoordPlane, {
		view,
		height,
		preserveAspect: false,
		stepX: xStep,
		stepY: yS,
		ariaLabel: `Plot: ${data.length} points given, drag to predict the point at ${xLabel ?? "x"} = ${guess.x}`,
		children: [
			yLabel && /* @__PURE__ */ jsx(Label, {
				x: 0,
				y: view.yMax,
				text: yLabel,
				dx: 6,
				dy: -2,
				anchor: "start",
				size: 12,
				weight: 700
			}),
			xLabel && /* @__PURE__ */ jsx(Label, {
				x: view.xMax,
				y: 0,
				text: xLabel,
				dx: -2,
				dy: 16,
				anchor: "end",
				size: 12,
				weight: 700
			}),
			showColumn && /* @__PURE__ */ jsx(Segment, {
				from: {
					x: guess.x,
					y: 0
				},
				to: {
					x: guess.x,
					y: yMax
				},
				color: C_GRID,
				weight: 1.5,
				dashed: true,
				opacity: .5
			}),
			rule && /* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: rule.intercept
				},
				to: {
					x: xMax,
					y: rule.slope * xMax + rule.intercept
				},
				color: "var(--stage-good)",
				weight: 2,
				opacity: .7
			}),
			data.map((d, i) => /* @__PURE__ */ jsx(Point, {
				x: d.x,
				y: d.y,
				r: 6,
				color: C_DATA
			}, `d${i}`)),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: guess.x,
					y: guess.y
				},
				to: {
					x: 0,
					y: guess.y
				},
				color: gColor,
				weight: 1.5,
				dashed: true,
				opacity: .8
			}),
			readout && /* @__PURE__ */ jsx(Label, {
				x: 0,
				y: guess.y,
				text: String(guess.y),
				dx: -8,
				anchor: "end",
				size: 11,
				weight: 700,
				color: gColor
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: guess,
				onMove: (p, phase) => onGuess(snapXY(p), phase),
				constrain: lockX ? "vertical" : void 0,
				color: gColor,
				r: 8,
				step: yS,
				range: {
					min: 0,
					max: yMax
				},
				ariaLabel: `your prediction at ${xLabel ?? "x"} = ${guess.x}, drag up or down to set ${yLabel ?? "y"}`
			}),
			guess.y <= .001 && /* @__PURE__ */ jsx(Label, {
				x: guess.x,
				y: 0,
				text: "drag up ↑",
				dx: 0,
				dy: -14,
				anchor: "middle",
				size: 11,
				weight: 700,
				color: gColor
			})
		]
	});
}

//#endregion
export { PredictPlot };