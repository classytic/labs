//#region src/core/easing.ts
const linear = (t) => t;
/** Smootherstep (manim's default `smooth`): zero velocity AND accel at the ends. */
const smooth = (t) => {
	const x = Math.min(1, Math.max(0, t));
	return x * x * x * (x * (x * 6 - 15) + 10);
};
const easeInCubic = (t) => t * t * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
/** Accelerate from rest (manim `rush_into`). */
const rushInto = (t) => 2 * smooth(t / 2);
/** Decelerate to rest (manim `rush_from`). */
const rushFrom = (t) => 2 * smooth(t / 2 + .5) - 1;
/** Go to 1 then back to 0 (manim `there_and_back`), great for pulses. */
const thereAndBack = (t) => smooth(t < .5 ? 2 * t : 2 * (1 - t));
/** Overshoot then settle. */
const elastic = (t) => {
	if (t === 0 || t === 1) return t;
	const p = .3;
	return 2 ** (-10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
};
/** Standard CSS-style cubic-bezier easing factory. */
function cubicBezier(x1, y1, x2, y2) {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const fx = (t) => ((ax * t + bx) * t + cx) * t;
	const fy = (t) => ((ay * t + by) * t + cy) * t;
	const dfx = (t) => (3 * ax * t + 2 * bx) * t + cx;
	return (x) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let t = x;
		for (let i = 0; i < 8; i++) {
			const e = fx(t) - x;
			if (Math.abs(e) < 1e-4) break;
			const d = dfx(t);
			if (Math.abs(d) < 1e-6) break;
			t -= e / d;
		}
		return fy(Math.min(1, Math.max(0, t)));
	};
}
/** Squash an easing into the sub-window [a,b] of [0,1] (manim `squish_rate_func`). */
function squish(fn, a = .2, b = .8) {
	return (t) => t < a ? 0 : t > b ? 1 : fn((t - a) / (b - a));
}
/** Built-in registry, extend with `registerEasing` (see ./registry). */
const EASINGS = {
	linear,
	smooth,
	easeInCubic,
	easeOutCubic,
	easeInOut,
	rushInto,
	rushFrom,
	thereAndBack,
	elastic
};

//#endregion
export { EASINGS, cubicBezier, easeInCubic, easeInOut, easeOutCubic, elastic, linear, rushFrom, rushInto, smooth, squish, thereAndBack };