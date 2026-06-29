import { useEffect, useReducer, useRef } from "react";

//#region src/core/reactive.ts
/**
* Tiny reactive value, the `ValueTracker` / signal at the heart of
* interactivity. A slider/drag updates a `value()`; anything derived from it
* recomputes; React components bound via `useValue` repaint. Framework-light
* (no external dep); the React glue is one hook.
*/
function value(initial) {
	let current = initial;
	const subs = /* @__PURE__ */ new Set();
	const sv = {
		isSciValue: true,
		get: () => current,
		set: (next) => {
			if (Object.is(next, current)) return;
			current = next;
			for (const fn of subs) fn(current);
		},
		update: (fn) => sv.set(fn(current)),
		subscribe: (fn) => {
			subs.add(fn);
			return () => subs.delete(fn);
		}
	};
	return sv;
}
/** Read-only computed value derived from one or more `SciValue`s. */
function derive(deps, compute) {
	const out = value(compute());
	for (const dep of deps) dep.subscribe(() => out.set(compute()));
	return out;
}
/** Subscribe a React component to a `SciValue`; returns its current value. */
function useValue(sv) {
	const [, force] = useReducer((c) => c + 1, 0);
	const ref = useRef(sv);
	ref.current = sv;
	useEffect(() => sv.subscribe(() => force()), [sv]);
	return sv.get();
}
/** Create a stable `SciValue` that lives for the component's lifetime. */
function useSciValue(initial) {
	const ref = useRef(null);
	if (ref.current === null) ref.current = value(typeof initial === "function" ? initial() : initial);
	return ref.current;
}

//#endregion
export { derive, useSciValue, useValue, value };