'use client';

import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Segment } from "@classytic/stage";

//#region src/kit/bar-strip.tsx
function BarStrip({ span, cells, shaded, y, color, weight = 32, trackColor = "var(--stage-grid)" }) {
	const cw = span / cells;
	const lines = [];
	for (let i = 1; i < cells; i++) lines.push(/* @__PURE__ */ jsx(Segment, {
		from: {
			x: i * cw,
			y: y - .5
		},
		to: {
			x: i * cw,
			y: y + .5
		},
		color: "var(--stage-bg)",
		weight: 2
	}, i));
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(Segment, {
			from: {
				x: 0,
				y
			},
			to: {
				x: span,
				y
			},
			color: trackColor,
			weight,
			opacity: .55
		}),
		shaded > 0 && /* @__PURE__ */ jsx(Segment, {
			from: {
				x: 0,
				y
			},
			to: {
				x: shaded * cw,
				y
			},
			color,
			weight
		}),
		lines
	] });
}

//#endregion
export { BarStrip };