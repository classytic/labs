'use client';

import { Tex } from "../core/tex.mjs";
import { ControlBar, LabFrame } from "../kit/frame.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/math/derivation.tsx
/**
* Derivation, a step-by-step algebra/equation derivation, revealed one line at a
* time. Each step is a LaTeX expression (rendered with KaTeX) plus an optional
* justification ("subtract yₚ", "cross-multiply"). The learner clicks through;
* the latest line is emphasized. This is how you teach a *derivation*, the
* two-point line form, the quadratic formula, a chord-length proof, as a guided
* sequence rather than a wall of algebra.
*
* Pure presentation over the engine's `<Tex>` + the shared control kit (no canvas,
* no equation solving implied, the author supplies the steps, optionally
* generated/verified with the symbolic engine).
*/
function normalize(steps) {
	const out = (Array.isArray(steps) ? steps : []).map((s) => typeof s === "string" ? { tex: s } : s).filter((s) => !!s && typeof s.tex === "string");
	return out.length ? out : [{
		tex: "a^2 + b^2 = c^2",
		note: "add your steps"
	}];
}
function Derivation({ steps, title = "Derivation", showAll = false } = {}) {
	const all = normalize(steps);
	const [step, setStep] = useState(showAll ? all.length - 1 : 0);
	useEffect(() => {
		setStep(showAll ? all.length - 1 : 0);
	}, [showAll, all.length]);
	const figure = /* @__PURE__ */ jsx("ol", {
		style: {
			listStyle: "none",
			margin: 0,
			padding: 0,
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: all.slice(0, step + 1).map((s, i) => /* @__PURE__ */ jsxs("li", {
			style: {
				display: "flex",
				flexWrap: "wrap",
				alignItems: "baseline",
				gap: "4px 16px",
				borderRadius: 8,
				padding: "8px 12px",
				transition: "background 120ms",
				background: i === step && !showAll ? "color-mix(in oklab, var(--primary, var(--stage-accent)) 12%, transparent)" : "transparent"
			},
			children: [
				/* @__PURE__ */ jsx("span", {
					style: {
						fontFamily: "ui-monospace, monospace",
						fontSize: 12,
						opacity: .55
					},
					children: i + 1
				}),
				/* @__PURE__ */ jsx("span", {
					style: { fontSize: 15 },
					children: /* @__PURE__ */ jsx(Tex, { tex: s.tex })
				}),
				s.note && /* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 13,
						opacity: .65
					},
					children: [",  ", s.note]
				})
			]
		}, i))
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: "Work through the derivation one line at a time.",
		controls: !showAll ? /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-chip",
				onClick: () => setStep((s) => Math.max(0, s - 1)),
				disabled: step === 0,
				children: "← Back"
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontVariantNumeric: "tabular-nums",
					opacity: .75
				},
				children: [
					"step ",
					step + 1,
					" / ",
					all.length
				]
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "lab-chip",
				onClick: () => setStep((s) => Math.min(all.length - 1, s + 1)),
				disabled: step >= all.length - 1,
				children: "Next →"
			})
		] }) : void 0,
		children: figure
	});
}

//#endregion
export { Derivation };