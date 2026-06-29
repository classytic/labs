'use client';

import { StatusPill } from "../../kit/controls.mjs";
import { LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { dirFor, seededShuffle } from "../deck.mjs";
import { Icon } from "../icon.mjs";
import { Speaker } from "../ui.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/language/word-match/preset.tsx
/**
* WordMatch, pair each word with its meaning (or picture).
*
* Tap a word on the left, then its match on the right; a correct pair locks
* green, a wrong pair flashes. Right side shows the translation, or, for kids /
* concrete vocab, the item's icon (emoji/SVG), which is where image-based
* learning genuinely helps (dual coding). Reads its whole content from a `Deck`,
* so a new language pair is just new data.
*/
function WordMatchLab({ deck, count, show = "translation", title = "Match the pairs", prompt = "Tap a word, then tap its match." }) {
	const n = Math.min(count ?? 6, deck.items.length);
	const items = useMemo(() => deck.items.slice(0, n), [deck, n]);
	const rightOrder = useMemo(() => seededShuffle(items.map((_, i) => i), n * 13 + 5), [items, n]);
	const termDir = dirFor(deck.termLang);
	const transDir = dirFor(deck.transLang);
	const [matched, setMatched] = useState(/* @__PURE__ */ new Set());
	const [pending, setPending] = useState(null);
	const [wrong, setWrong] = useState(null);
	const wrongTimer = useRef(null);
	useEffect(() => {
		setMatched(/* @__PURE__ */ new Set());
		setPending(null);
		setWrong(null);
	}, [items]);
	useEffect(() => () => {
		if (wrongTimer.current) clearTimeout(wrongTimer.current);
	}, []);
	const allDone = matched.size === items.length && items.length > 0;
	useCheckpoint({
		solved: allDone,
		activity: "word-match",
		score: {
			raw: items.length,
			max: items.length
		}
	});
	const flashWrong = (idx) => {
		setWrong(idx);
		if (wrongTimer.current) clearTimeout(wrongTimer.current);
		wrongTimer.current = setTimeout(() => setWrong(null), 520);
	};
	const tap = (side, idx) => {
		if (matched.has(idx)) return;
		if (!pending) {
			setPending({
				side,
				idx
			});
			return;
		}
		if (pending.side === side) {
			setPending({
				side,
				idx
			});
			return;
		}
		if (pending.idx === idx) {
			setMatched((m) => new Set(m).add(idx));
			setPending(null);
		} else {
			flashWrong(idx);
			flashWrong(pending.idx);
			setPending(null);
		}
	};
	const cellState = (side, idx) => matched.has(idx) ? "ok" : wrong === idx ? "no" : pending && pending.side === side && pending.idx === idx ? "sel" : "idle";
	const figure = /* @__PURE__ */ jsxs("div", {
		className: "lang-lab",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "lang-match",
			children: [/* @__PURE__ */ jsx("div", {
				className: "lang-col",
				"aria-label": "words",
				children: items.map((it, i) => /* @__PURE__ */ jsxs("div", {
					className: "lang-match-row",
					children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "lang-match-cell",
						"data-state": cellState("L", i),
						disabled: matched.has(i),
						onClick: () => tap("L", i),
						"aria-label": `${it.term}${matched.has(i) ? ", matched" : ""}`,
						children: [/* @__PURE__ */ jsx("span", {
							className: "lang-cell-text",
							dir: termDir,
							children: it.term
						}), it.transliteration ? /* @__PURE__ */ jsx("span", {
							className: "lang-cell-sub",
							children: it.transliteration
						}) : null]
					}), /* @__PURE__ */ jsx(Speaker, {
						item: it,
						lang: deck.termLang
					})]
				}, `L${i}`))
			}), /* @__PURE__ */ jsx("div", {
				className: "lang-col",
				"aria-label": "matches",
				children: rightOrder.map((i) => {
					const it = items[i];
					return /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lang-match-cell",
						"data-state": cellState("R", i),
						disabled: matched.has(i),
						onClick: () => tap("R", i),
						"aria-label": show === "icon" ? `picture for ${it.translation}` : it.translation,
						children: show === "icon" && it.icon ? /* @__PURE__ */ jsx(Icon, {
							icon: it.icon,
							className: "lang-cell-icon",
							size: 36,
							decorative: true
						}) : /* @__PURE__ */ jsx("span", {
							className: "lang-cell-text",
							dir: transDir,
							children: it.translation
						})
					}, `R${i}`);
				})
			})]
		}), /* @__PURE__ */ jsx(LiveRegion, { children: allDone ? "All pairs matched" : "" })]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: /* @__PURE__ */ jsx(StatusPill, {
			ok: allDone,
			children: allDone ? "✓ All matched" : `${matched.size} / ${items.length} matched`
		}),
		children: figure
	});
}

//#endregion
export { WordMatchLab };