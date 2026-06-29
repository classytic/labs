'use client';

import { CheckButton, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/language/agreement/preset.tsx
/**
* AgreementLab, make the verb agree with its subject.
*
* Bangla drops the present copula ("He doctor") and has no 3rd-person -s
* ("She go"), so subject–verb agreement is a core English error. The learner
* picks the verb form that matches the subject; on a correct pick the pair links
* up (color + connector) and the full sentence assembles, making concord visible.
*/
function AgreementLab({ items, title = "Make them agree", prompt = "Pick the verb form that matches the subject." }) {
	const [idx, setIdx] = useState(0);
	const [picked, setPicked] = useState(null);
	const [solvedCount, setSolvedCount] = useState(0);
	useEffect(() => {
		setIdx(0);
		setPicked(null);
		setSolvedCount(0);
	}, [items]);
	const item = items[idx];
	const correct = picked !== null && item !== void 0 && picked === item.correct;
	const total = items.length;
	const allDone = solvedCount >= total && total > 0;
	useCheckpoint({
		solved: allDone,
		activity: "agreement",
		score: {
			raw: total,
			max: total
		}
	});
	if (!item) return null;
	const pick = (v) => {
		if (correct) return;
		setPicked(v);
		if (v === item.correct) setSolvedCount((s) => Math.min(total, s + 1));
	};
	const next = () => {
		setPicked(null);
		setIdx((i) => Math.min(total - 1, i + 1));
	};
	const isLast = idx === total - 1;
	const figure = /* @__PURE__ */ jsxs("div", {
		className: "lang-lab",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "lang-sentence",
				"aria-label": "sentence",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "lang-subject",
						"data-ok": correct ? "true" : void 0,
						children: item.subject
					}),
					correct ? /* @__PURE__ */ jsx("span", {
						className: "lang-link",
						"aria-hidden": true,
						children: "↔"
					}) : null,
					/* @__PURE__ */ jsx("span", {
						className: "lang-blank",
						"data-state": picked === null ? "idle" : correct ? "ok" : "no",
						children: picked ?? "▢"
					}),
					item.tail ? /* @__PURE__ */ jsx("span", { children: item.tail }) : null
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lang-choices",
				role: "group",
				"aria-label": "verb forms",
				children: item.options.map((v) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lang-choice",
					"data-state": picked === v ? correct ? "ok" : "no" : "idle",
					disabled: correct,
					onClick: () => pick(v),
					"aria-label": v,
					children: v
				}, v))
			}),
			picked !== null && /* @__PURE__ */ jsx("p", {
				className: "lang-why",
				"data-state": correct ? "ok" : "no",
				"aria-live": "polite",
				children: correct ? item.note ?? `${item.subject} ${item.correct}${item.tail ? " " + item.tail : ""}.` : "Not quite, try another."
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: /* @__PURE__ */ jsx(StatusPill, {
			ok: allDone,
			children: allDone ? "✓ All correct" : `${solvedCount} / ${total}`
		}),
		controls: correct && !isLast ? /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(CheckButton, {
			onClick: next,
			children: "Next"
		}) }) : void 0,
		children: figure
	});
}

//#endregion
export { AgreementLab };