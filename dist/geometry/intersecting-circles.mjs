'use client';

import { clamp, num } from "../core/util.mjs";
import { GeometryBoard } from "./board/preset.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/geometry/intersecting-circles.tsx
const COLORS = {
	accent: "var(--stage-accent)",
	warn: "var(--stage-warn)",
	good: "var(--stage-good)"
};
function IntersectingCircles({ r1: r1p, r2: r2p, title = "Common chord of two circles", height = 360 } = {}) {
	const r1 = clamp(num(r1p, 3.2), 1, 5);
	const r2 = clamp(num(r2p, 2.8), 1, 5);
	return /* @__PURE__ */ jsx(GeometryBoard, {
		scene: [
			{
				type: "point",
				id: "A",
				x: 3,
				y: 0,
				draggable: true,
				label: "A",
				color: COLORS.accent
			},
			{
				type: "point",
				id: "B",
				x: 6.4,
				y: 0,
				draggable: true,
				label: "B",
				color: COLORS.warn
			},
			{
				type: "circle",
				id: "cA",
				center: "A",
				radius: r1,
				color: COLORS.accent
			},
			{
				type: "circle",
				id: "cB",
				center: "B",
				radius: r2,
				color: COLORS.warn
			},
			{
				type: "segment",
				from: "A",
				to: "B",
				dashed: true
			},
			{
				type: "intersect",
				id: "P",
				of: ["cA", "cB"],
				pick: 0,
				label: "P",
				color: COLORS.good
			},
			{
				type: "intersect",
				id: "Q",
				of: ["cA", "cB"],
				pick: 1,
				label: "Q",
				color: COLORS.good
			},
			{
				type: "segment",
				from: "P",
				to: "Q",
				color: COLORS.good,
				label: "chord"
			},
			{
				type: "measure",
				kind: "distance",
				of: ["A", "B"],
				label: "d = |AB|"
			},
			{
				type: "measure",
				kind: "distance",
				of: ["P", "Q"],
				label: "chord |PQ|"
			}
		],
		view: {
			xMin: -1,
			xMax: 11,
			yMin: -5,
			yMax: 5
		},
		title,
		height
	});
}

//#endregion
export { IntersectingCircles };