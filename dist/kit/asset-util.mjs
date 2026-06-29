//#region src/kit/asset-util.ts
/** Normalized pixel rect from two DESIGN-space corners (handles the y-flip safely). */
function pxRect(P, x0, y0, x1, y1) {
	const [ax, ay] = P(x0, y0);
	const [bx, by] = P(x1, y1);
	return {
		x: Math.min(ax, bx),
		y: Math.min(ay, by),
		width: Math.abs(bx - ax),
		height: Math.abs(by - ay)
	};
}

//#endregion
export { pxRect };