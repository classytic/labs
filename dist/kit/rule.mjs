'use client';

import { Tex } from "../core/tex.mjs";
import { Stepper } from "./controls.mjs";
import { LabFrame } from "./frame.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/rule.tsx
/**
* RuleCard, the authorable CONCEPT engine. A bare formula is inert; a Rule bundles
* everything a learner needs to actually UNDERSTAND it, and an author supplies it
* all as data, no bespoke code per concept:
*
*   • formula     , the headline identity (LaTeX).
*   • analogy     , the one-line intuition ("a combination is a team: order
*                   doesn't matter").
*   • calculator  , live input knobs + a worked computation that SHOWS its working
*                   (every substitution + simplification), via kit/calc's Worked.
*   • derivation  , the proof / why-it's-true, revealed on demand.
*   • tricks      , the identities, shortcuts and traps that make someone fluent.
*
* One reusable component renders all of it (Brilliant-style concept card). Domains
* declare their rules as data (see discrete/rules.ts) and drop them in a lab or a
* lesson. Pure presentation over <Tex> + kit controls.
*/
/** Render a worked calculation's steps (LaTeX line + note, last one highlighted).
*  The shared step view for both authored lessons and the dynamic solvers. */
function WorkedSteps({ worked, accent = true }) {
	return /* @__PURE__ */ jsx(StepList, {
		steps: worked.steps,
		accent
	});
}
function StepList({ steps, accent }) {
	return /* @__PURE__ */ jsx("ol", {
		style: {
			listStyle: "none",
			margin: 0,
			padding: 0,
			display: "flex",
			flexDirection: "column",
			gap: 6
		},
		children: steps.map((s, i) => /* @__PURE__ */ jsxs("li", {
			style: {
				display: "flex",
				flexWrap: "wrap",
				alignItems: "baseline",
				gap: "4px 14px",
				padding: "5px 10px",
				borderRadius: 8,
				background: accent && i === steps.length - 1 ? "color-mix(in oklab, var(--stage-good) 14%, transparent)" : "transparent"
			},
			children: [/* @__PURE__ */ jsx("span", {
				style: { fontSize: 15 },
				children: /* @__PURE__ */ jsx(Tex, { tex: s.tex })
			}), s.note && /* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12.5,
					color: "var(--stage-muted)"
				},
				children: s.note
			})]
		}, i))
	});
}
/** The card body (no frame) — embed in a lesson, a RuleLab, or beside a widget. */
function RuleCard({ rule }) {
	const [vals, setVals] = useState(() => Object.fromEntries((rule.inputs ?? []).map((f) => [f.key, f.default])));
	const [showProof, setShowProof] = useState(false);
	const worked = useMemo(() => rule.compute ? rule.compute(vals) : null, [rule, vals]);
	return /* @__PURE__ */ jsx("div", {
		style: {
			border: "1px solid var(--stage-grid)",
			borderRadius: 14,
			background: "var(--stage-bg)",
			overflow: "hidden"
		},
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				padding: "14px 16px",
				display: "grid",
				gap: 12
			},
			children: [
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					style: {
						fontWeight: 800,
						fontSize: 16
					},
					children: rule.name
				}), rule.analogy && /* @__PURE__ */ jsxs("div", {
					style: {
						marginTop: 3,
						fontSize: 13.5,
						color: "var(--stage-muted)"
					},
					children: [/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 10,
							fontWeight: 800,
							letterSpacing: .4,
							textTransform: "uppercase",
							color: "var(--stage-accent)",
							marginRight: 8
						},
						children: "analogy"
					}), rule.analogy]
				})] }),
				/* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						padding: "8px 4px",
						fontSize: 18
					},
					children: /* @__PURE__ */ jsx(Tex, {
						tex: rule.formula,
						block: true
					})
				}),
				rule.figure != null && /* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						justifyContent: "center"
					},
					children: typeof rule.figure === "function" ? rule.figure(vals) : rule.figure
				}),
				rule.inputs && rule.inputs.length > 0 && worked && /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gap: 10,
						borderTop: "1px solid var(--stage-grid)",
						paddingTop: 12
					},
					children: [/* @__PURE__ */ jsx("div", {
						style: {
							display: "flex",
							flexWrap: "wrap",
							gap: 14
						},
						children: rule.inputs.map((f) => /* @__PURE__ */ jsx(Stepper, {
							label: f.label,
							value: vals[f.key] ?? f.default,
							min: f.min ?? 0,
							max: f.max ?? 99,
							step: f.step ?? 1,
							onChange: (v) => setVals((s) => ({
								...s,
								[f.key]: v
							}))
						}, f.key))
					}), /* @__PURE__ */ jsx(StepList, {
						steps: worked.steps,
						accent: true
					})]
				}),
				rule.derivation && rule.derivation.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						borderTop: "1px solid var(--stage-grid)",
						paddingTop: 10
					},
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lab-chip",
						onClick: () => setShowProof((p) => !p),
						"aria-expanded": showProof,
						children: showProof ? "▾ why it works" : "▸ why it works"
					}), showProof && /* @__PURE__ */ jsx("div", {
						style: { marginTop: 8 },
						children: /* @__PURE__ */ jsx(StepList, { steps: rule.derivation })
					})]
				}),
				rule.tricks && rule.tricks.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						borderTop: "1px solid var(--stage-grid)",
						paddingTop: 10
					},
					children: [/* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 10,
							fontWeight: 800,
							letterSpacing: .4,
							textTransform: "uppercase",
							color: "var(--stage-muted)",
							marginBottom: 6
						},
						children: "tricks & traps"
					}), /* @__PURE__ */ jsx("ul", {
						style: {
							margin: 0,
							paddingLeft: 18,
							display: "grid",
							gap: 4,
							fontSize: 13.5
						},
						children: rule.tricks.map((t, i) => /* @__PURE__ */ jsx("li", { children: t }, i))
					})]
				})
			]
		})
	});
}
/** A RuleCard wrapped in a LabFrame — the standalone lab / CMS-block form. */
function RuleLab({ rule, title, prompt }) {
	return /* @__PURE__ */ jsx(LabFrame, {
		title: title ?? rule.name,
		prompt: prompt ?? "Plug in numbers to see the rule work, then reveal why it is true.",
		children: /* @__PURE__ */ jsx(RuleCard, { rule })
	});
}

//#endregion
export { RuleCard, RuleLab, WorkedSteps };