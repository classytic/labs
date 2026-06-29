'use client';

import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useInView } from "@classytic/stage";

//#region src/kit/play.tsx
/**
* Play-gate for hand-driven sim labs (those running their own useFrameLoop rather
* than going through <Scene>, which already has this). It does two things:
*   • off-screen pause, the loop only runs while the figure is visible, so a page
*     of labs doesn't pin the CPU;
*   • press-to-start, an ambient animation shouldn't auto-run; show a ▶ Play
*     overlay until the learner starts it.
*
* Usage:
*   const gate = usePlayGate();
*   useFrameLoop(tick, { running: gate.running });   // && any other condition
*   …  <PlayWrap gate={gate}>{figureSvg}</PlayWrap>
*
* For a USER-TRIGGERED lab (a Run/Drop button already decides when to animate),
* skip the overlay, just gate the existing condition on visibility with `useInView`.
*/
function usePlayGate(autoPlay = false) {
	const { ref, inView } = useInView();
	const [playing, setPlaying] = useState(autoPlay);
	return {
		ref,
		inView,
		playing,
		setPlaying,
		running: playing && inView
	};
}
function PlayWrap({ gate, children }) {
	return /* @__PURE__ */ jsxs("div", {
		ref: gate.ref,
		className: "lab-playwrap",
		children: [children, /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-play-toggle",
			"data-playing": gate.playing,
			"aria-label": gate.playing ? "Pause" : "Play",
			"aria-pressed": gate.playing,
			onClick: () => gate.setPlaying(!gate.playing),
			children: gate.playing ? "⏸" : "▶ Play"
		})]
	});
}

//#endregion
export { PlayWrap, usePlayGate };