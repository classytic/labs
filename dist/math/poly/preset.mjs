'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { toStr } from "../complex/core.mjs";
import { factorTex, fromAst, polyTex, solve } from "./core.mjs";
import { factorSteps, solveSteps } from "./steps.mjs";
import { WorkedSteps } from "../../kit/rule.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { compileExpr } from "@classytic/stage";

//#region src/math/poly/preset.tsx
/**
* PolynomialSolverLab, the dynamic "factor & solve" TOOL (the solver path, vs the
* curated lesson path). Type or author a polynomial; the engine factors it / solves
* it = 0 and SHOWS THE WORKING using the school method (split the middle term;
* factor theorem for higher degree). Runs entirely client-side on the canonical
* poly core — no heavy CAS dependency. "Show the steps" is a reveal so the learner
* can try first.
*/
function PolynomialSolverLab({ expr = "x^2 + 5x + 6", mode = "factor", editable = true, title = mode === "solve" ? "Solve the polynomial" : "Factor the polynomial", prompt = mode === "solve" ? "Type a polynomial; see it solved step by step." : "Type a polynomial; see it factored step by step." } = {}) {
	const [src, setSrc] = useState(expr);
	const [show, setShow] = useState(false);
	const result = useMemo(() => {
		const c = compileExpr(src);
		if (c.error || !c.ast) return { error: "Could not read that expression." };
		const p = fromAst(c.ast);
		if (!p) return { error: "That is not a polynomial in x." };
		if (p.length <= 1) return { error: "Enter a polynomial in x (degree ≥ 1)." };
		const sol = solve(p);
		return {
			p,
			sol,
			worked: mode === "solve" ? solveSteps(p) : factorSteps(p),
			answerTex: mode === "solve" ? sol.roots.map((r) => `x = ${toStr(r)}`).join(" \\quad\\text{or}\\quad ") : factorTex(p),
			polyTex: polyTex(p)
		};
	}, [src, mode]);
	const figure = "error" in result ? /* @__PURE__ */ jsxs("p", {
		className: "lab-misconception",
		role: "status",
		children: [
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": true,
				children: "⚠"
			}),
			" ",
			result.error
		]
	}) : /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 14
		},
		children: [/* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				justifyContent: "center",
				alignItems: "baseline",
				gap: 12,
				flexWrap: "wrap",
				fontSize: 19,
				padding: "6px 4px"
			},
			children: [
				/* @__PURE__ */ jsx(Tex$1, {
					tex: `${result.polyTex}${mode === "solve" ? " = 0" : ""}`,
					block: true
				}),
				/* @__PURE__ */ jsx("span", {
					style: {
						color: "var(--stage-muted)",
						fontSize: 22
					},
					children: "→"
				}),
				/* @__PURE__ */ jsx(Tex$1, {
					tex: result.answerTex,
					block: true
				})
			]
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-chip",
			onClick: () => setShow((s) => !s),
			"aria-expanded": show,
			children: show ? "▾ hide the steps" : "▸ show the steps"
		}), show && /* @__PURE__ */ jsx("div", {
			style: {
				marginTop: 10,
				border: "1px solid var(--stage-grid)",
				borderRadius: 12,
				padding: "12px 14px"
			},
			children: /* @__PURE__ */ jsx(WorkedSteps, { worked: result.worked })
		})] })]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: editable ? /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsxs("label", {
			style: {
				display: "inline-flex",
				alignItems: "center",
				gap: 8,
				flex: 1
			},
			children: [/* @__PURE__ */ jsx("span", {
				style: {
					color: "var(--stage-muted)",
					fontSize: 13
				},
				children: mode === "solve" ? "solve" : "factor"
			}), /* @__PURE__ */ jsx("input", {
				value: src,
				onChange: (e) => {
					setSrc(e.target.value);
					setShow(false);
				},
				"aria-label": "polynomial in x",
				spellCheck: false,
				style: {
					flex: 1,
					minWidth: 180,
					padding: "6px 10px",
					borderRadius: 8,
					border: "1px solid var(--stage-grid)",
					background: "var(--stage-bg)",
					color: "var(--stage-fg)",
					fontFamily: "ui-monospace, monospace",
					fontSize: 14
				}
			})]
		}) }) : void 0,
		children: figure
	});
}

//#endregion
export { PolynomialSolverLab };