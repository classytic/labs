'use client';

import { VectorBoardLab } from "./preset.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/physics/vector-board/view.tsx
/** Default vectors for a freshly-inserted block. */
const VECTOR_BOARD_DEMO = [{
	label: "a",
	dx: 3,
	dy: 1,
	color: "var(--stage-accent)",
	drag: true
}, {
	label: "b",
	dx: 1,
	dy: 2,
	color: "var(--stage-accent-2)",
	drag: true
}];
function VectorBoardView({ vectors, combine = "sum", goalX, goalY, tol, components, angle, parallelogram, title, prompt, view, resultantLabel, objectives, hints }) {
	const vs = (vectors ?? []).map((v) => ({
		comp: {
			x: Number(v.dx) || 0,
			y: Number(v.dy) || 0
		},
		label: v.label,
		color: v.color || void 0,
		drag: !!v.drag
	}));
	const goal = goalX !== void 0 && goalX !== "" && goalY !== void 0 && goalY !== "" ? {
		match: {
			x: Number(goalX) || 0,
			y: Number(goalY) || 0
		},
		tol
	} : void 0;
	return /* @__PURE__ */ jsx(VectorBoardLab, {
		view,
		vectors: vs,
		combine,
		resultantLabel,
		goal,
		objectives,
		hints,
		show: {
			components,
			angle,
			parallelogram,
			magnitude: true
		},
		title: title ?? "Vectors",
		prompt: prompt ?? (goal ? "Drag the heads so the resultant lands on the target." : "Drag the arrow heads.")
	});
}

//#endregion
export { VECTOR_BOARD_DEMO, VectorBoardView };