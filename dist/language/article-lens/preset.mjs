'use client';

import { CheckButton, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/language/article-lens/preset.tsx
/**
* ArticleLens, choose a / an / the /, (no article).
*
* Bangla has no articles, so this is the highest-novelty English error for
* Bangla speakers. The "lens" framing: tap the article that fits, and on a
* correct pick the rule surfaces (new → a/an, known/specific → the, general →
* no article). Choice-based recall, distinct from the tile-building labs.
*/
const CHOICES = [
	"a",
	"an",
	"the",
	", "
];
const RULE = {
	a: "a → any one (new), before a consonant sound",
	an: "an → any one (new), before a vowel sound",
	the: "the → the specific one we both know",
	", ": "no article → general or uncountable"
};
function ArticleLensLab({ items, objectives, hints: hintList, title = "Choose the article", prompt = "Bangla has no a/an/the: pick what English needs." }) {
	const [idx, setIdx] = useState(0);
	const [picked, setPicked] = useState(null);
	const [solvedCount, setSolvedCount] = useState(0);
	useEffect(() => {
		setIdx(0);
		setPicked(null);
		setSolvedCount(0);
	}, [items]);
	const item = items[idx];
	const correct = picked !== null && item !== void 0 && picked === item.answer;
	const total = items.length;
	const allDone = solvedCount >= total && total > 0;
	const hints = useHints(hintList);
	useCheckpoint({
		solved: allDone,
		activity: "article-lens",
		score: {
			raw: total,
			max: total
		},
		hintsUsed: hints.count
	});
	const blank = useMemo(() => picked === null ? "▢" : picked === ", " ? "∅" : picked, [picked]);
	if (!item) return null;
	const pick = (a) => {
		if (correct) return;
		setPicked(a);
		if (a === item.answer) setSolvedCount((s) => Math.min(total, s + 1));
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
					/* @__PURE__ */ jsx("span", { children: item.before }),
					/* @__PURE__ */ jsx("span", {
						className: "lang-blank",
						"data-state": picked === null ? "idle" : correct ? "ok" : "no",
						children: blank
					}),
					/* @__PURE__ */ jsx("span", {
						className: "lang-noun",
						children: item.noun
					}),
					item.after ? /* @__PURE__ */ jsx("span", { children: item.after }) : null
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lang-choices",
				role: "group",
				"aria-label": "articles",
				children: CHOICES.map((a) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lang-choice",
					"data-state": picked === a ? correct ? "ok" : "no" : "idle",
					disabled: correct,
					onClick: () => pick(a),
					"aria-label": a === ", " ? "no article" : a,
					children: a === ", " ? "no article" : a
				}, a))
			}),
			picked !== null && /* @__PURE__ */ jsx("p", {
				className: "lang-why",
				"data-state": correct ? "ok" : "no",
				"aria-live": "polite",
				children: correct ? item.why ?? RULE[item.answer] : "Not quite, try another."
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsx(StatusPill, {
			ok: allDone,
			children: allDone ? "✓ All correct" : `${solvedCount} / ${total}`
		}),
		controls: correct && !isLast ? /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(CheckButton, {
			onClick: next,
			children: "Next"
		}) }) : void 0,
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { ArticleLensLab };