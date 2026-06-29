'use client';

import { CheckButton, Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { seededShuffle } from "../deck.mjs";
import { Tile } from "../ui.mjs";
import { useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/language/transform/preset.tsx
/**
* TransformLab, change one sentence into another and SEE what changed.
*
* Shows the source sentence (read-only), an instruction ("Make it a question"),
* and the learner rebuilds the target by tapping tiles. On success the words
* that are NEW vs the source are ringed, so the rule (e.g. English injects
* "Do" for a question; Bangla has no do-support) is visible, not just stated.
*/
function TransformLab({ from, to, instruction = "Change the sentence.", note, title = "Transform it", targetDir = "ltr" }) {
	const target = useMemo(() => to.map((t) => t.text).join(" "), [to]);
	const initialBank = useMemo(() => {
		let order = seededShuffle(to.map((_, i) => i), to.length * 11 + 2);
		if (to.length > 1 && order.map((i) => to[i].text).join(" ") === target) order = order.slice().reverse();
		return order;
	}, [to, target]);
	const [bank, setBank] = useState(initialBank);
	const [line, setLine] = useState([]);
	const [checked, setChecked] = useState(false);
	useEffect(() => {
		setBank(initialBank);
		setLine([]);
		setChecked(false);
	}, [initialBank]);
	const attempt = line.map((i) => to[i].text).join(" ");
	const full = line.length === to.length;
	const correct = full && attempt === target;
	useCheckpoint({
		solved: correct,
		activity: "transform"
	});
	const fromWords = useMemo(() => new Set(from.map((t) => t.text.toLowerCase())), [from]);
	const isNew = (i) => !fromWords.has(to[i].text.toLowerCase());
	const place = (i) => {
		setBank((b) => b.filter((x) => x !== i));
		setLine((l) => [...l, i]);
		setChecked(false);
	};
	const take = (i) => {
		setLine((l) => l.filter((x) => x !== i));
		setBank((b) => [...b, i]);
		setChecked(false);
	};
	const reset = () => {
		setBank(initialBank);
		setLine([]);
		setChecked(false);
	};
	const figure = /* @__PURE__ */ jsxs("div", {
		className: "lang-lab",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "lang-from",
				dir: targetDir,
				"aria-label": "given sentence",
				children: from.map((t, i) => /* @__PURE__ */ jsx(Tile, {
					pos: t.pos,
					text: t.text,
					gloss: t.gloss,
					dir: targetDir,
					ariaLabel: `${t.text} (given)`
				}, i))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lang-arrow",
				"aria-hidden": true,
				children: "↓"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lang-line",
				"data-state": checked ? correct ? "ok" : "no" : "idle",
				"aria-label": "your sentence",
				children: line.length === 0 ? /* @__PURE__ */ jsx("span", {
					className: "lang-line-empty",
					children: "Tap the words to build it."
				}) : line.map((i) => /* @__PURE__ */ jsx(Tile, {
					pos: to[i].pos,
					text: to[i].text,
					gloss: to[i].gloss,
					dir: targetDir,
					selected: checked && correct && isNew(i),
					onClick: () => take(i),
					ariaLabel: `${to[i].text}, tap to remove`
				}, i))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lang-bank",
				"aria-label": "word bank",
				children: bank.map((i) => /* @__PURE__ */ jsx(Tile, {
					pos: to[i].pos,
					text: to[i].text,
					gloss: to[i].gloss,
					dir: targetDir,
					onClick: () => place(i),
					ariaLabel: `${to[i].text}, tap to place`
				}, i))
			}),
			checked && correct && note ? /* @__PURE__ */ jsx("p", {
				className: "lang-why",
				"data-state": "ok",
				"aria-live": "polite",
				children: note
			}) : null
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: instruction,
		aside: checked ? /* @__PURE__ */ jsx(StatusPill, {
			ok: correct,
			children: correct ? "✓ Done, see what changed" : "Not the right order yet"
		}) : void 0,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(CheckButton, {
			onClick: () => setChecked(true),
			disabled: !full,
			children: "Check"
		}), /* @__PURE__ */ jsx(Chip, {
			selected: false,
			onClick: reset,
			children: "Reset"
		})] }),
		children: figure
	});
}

//#endregion
export { TransformLab };