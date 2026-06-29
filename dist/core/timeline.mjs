'use client';

import { clamp, lerp } from "./util.mjs";
import { smooth } from "./easing.mjs";
import { useRef, useState } from "react";
import { useFrameLoop } from "@classytic/stage";

//#region src/core/timeline.ts
/**
* Declarative animation over the injectable clock. `useTween` animates one
* number from `from`→`to` with an easing; it derives progress from the clock's
* `timeMs` (not an accumulated counter), so under a fixed driver (e.g. Remotion)
* it's deterministic and scrubbable. Widgets that prefer to drive frames
* imperatively use `useFrameLoop` (from `@classytic/stage`) directly.
*/
function useTween(opts) {
	const { from = 0, to, durationMs = 800, ease = smooth, autoplay = false, loop = false } = opts;
	const [playing, setPlaying] = useState(autoplay);
	const [progress, setProgress] = useState(autoplay ? 0 : 0);
	const startRef = useRef(null);
	useFrameLoop((f) => {
		if (startRef.current === null) startRef.current = f.timeMs;
		let p = (f.timeMs - startRef.current) / durationMs;
		if (p >= 1) if (loop === true) {
			startRef.current = f.timeMs;
			p = 0;
		} else if (loop === "pingpong") {
			const cycle = (f.timeMs - startRef.current) / durationMs % 2;
			p = cycle <= 1 ? cycle : 2 - cycle;
		} else {
			p = 1;
			setPlaying(false);
		}
		setProgress(p);
	}, { running: playing });
	return {
		value: lerp(from, to, ease(clamp(progress, 0, 1))),
		progress,
		playing,
		play: () => {
			startRef.current = null;
			setPlaying(true);
		},
		pause: () => setPlaying(false),
		reset: () => {
			startRef.current = null;
			setProgress(0);
			setPlaying(false);
		}
	};
}
/**
* Pure multi-stage interpolation: build a `(t in [0,1]) => number` from
* keyframes. The manim-style way to express richer programmatic animation
* without a scheduler, drive `t` from `useTween`/`useFrameLoop`.
*/
function keyframes(frames) {
	const ks = [...frames].sort((a, b) => a.at - b.at);
	return (t) => {
		if (ks.length === 0) return 0;
		if (t <= ks[0].at) return ks[0].value;
		if (t >= ks[ks.length - 1].at) return ks[ks.length - 1].value;
		for (let i = 0; i < ks.length - 1; i++) {
			const a = ks[i];
			const b = ks[i + 1];
			if (t >= a.at && t <= b.at) {
				const local = (t - a.at) / (b.at - a.at || 1);
				const e = (b.ease ?? smooth)(local);
				return lerp(a.value, b.value, e);
			}
		}
		return ks[ks.length - 1].value;
	};
}

//#endregion
export { keyframes, useTween };