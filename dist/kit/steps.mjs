'use client';

import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/steps.tsx
/**
* In-lab stepper, teach ONE idea at a time (Brilliant-style), instead of dumping
* a dense screen. A lab declares N steps and reveals layers/captions as the learner
* hits Continue. Pure UI state; pair with `<StepNav>` (Back / dots / Continue).
* (Distinct from stage's cross-block StepProgress, this is within a single lab.)
*/
function useSteps(total) {
	const [step, setStep] = useState(0);
	const clamp = (n) => Math.max(0, Math.min(total - 1, n));
	return {
		step: clamp(step),
		total,
		atStart: step <= 0,
		atEnd: step >= total - 1,
		next: () => setStep((s) => clamp(s + 1)),
		prev: () => setStep((s) => clamp(s - 1)),
		setStep: (n) => setStep(clamp(n))
	};
}
function StepNav({ steps, nextLabel = "Continue", doneLabel = "Done" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "lab-stepnav",
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-btn lab-btn-ghost",
				onClick: steps.prev,
				disabled: steps.atStart,
				children: "← Back"
			}),
			/* @__PURE__ */ jsx("span", {
				className: "lab-dots",
				"aria-hidden": true,
				children: Array.from({ length: steps.total }, (_, i) => /* @__PURE__ */ jsx("span", {
					className: "lab-dot",
					"data-on": i <= steps.step
				}, i))
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-btn",
				onClick: steps.next,
				disabled: steps.atEnd,
				children: steps.atEnd ? doneLabel : nextLabel
			})
		]
	});
}

//#endregion
export { StepNav, useSteps };