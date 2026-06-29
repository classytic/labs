'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useFrameLoop } from "@classytic/stage";

//#region src/kit/anim.ts
/**
* Animation boilerplate, factored out of every timed lab.
*
* Before, each lab hand-rolled: a reduced-motion ref, a throwaway `tick` state,
* and a `useFrameLoop` that bumped the tick every frame to force a re-render.
* These two hooks collapse all of that to one line each.
*/
/**
* prefers-reduced-motion, read once at mount. The value is read synchronously, so
* for labs whose FIRST render visibly depends on it (and that hydrate from SSR)
* prefer {@link useReducedMotionDeferred} to avoid a hydration mismatch.
*/
function useReducedMotion() {
	const ref = useRef(void 0);
	if (ref.current === void 0) ref.current = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
	return ref.current;
}
/**
* Hydration-safe prefers-reduced-motion: returns `false` on the server AND the first
* client render (so SSR markup matches), then flips to the real value after mount.
* Use this in SSR'd labs that gate their first paint on the reduced-motion flag.
*/
function useReducedMotionDeferred() {
	const [reduce, setReduce] = useState(false);
	useEffect(() => {
		setReduce(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
	}, []);
	return reduce;
}
/**
* Run `step` once per animation frame while `running`, then re-render. Replaces the
* per-lab `const [, setTick] = useState(0)` + `setTick(t => (t + 1) & 0xffff)` dance:
* integrate into your refs inside `step`, and the view repaints automatically.
*/
function useFrameTick(running, step) {
	const [, setTick] = useState(0);
	const bump = useCallback(() => setTick((t) => t + 1 & 65535), []);
	useFrameLoop((f) => {
		step?.(f);
		bump();
	}, { running });
	return bump;
}

//#endregion
export { useFrameTick, useReducedMotion, useReducedMotionDeferred };