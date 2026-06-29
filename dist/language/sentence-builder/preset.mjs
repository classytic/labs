'use client';

import { CheckButton, Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { seededShuffle } from "../deck.mjs";
import { Tile } from "../ui.mjs";
import { useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/language/sentence-builder/preset.tsx
/**
* SentenceBuilder, order the words into a correct sentence.
*
* The flagship grammar lab: tiles are colour-coded by part of speech and carry
* an optional L1 gloss, so a learner SEES the structure while building it. The
* `prompt` shows the meaning (e.g. the learner's-language sentence) above , 
* which is exactly how a Bangla speaker meets English word order: same meaning,
* different slot order (SOV → SVO).
*
* Tap a tile in the bank to place it; tap a placed tile to take it back. No
* drag, buttons are touch- and keyboard-friendly. Validates by resulting text,
* so duplicate/interchangeable words still pass.
*/
function SentenceBuilderLab({ tiles, prompt, promptDir = "ltr", targetDir = "ltr", title = "Build the sentence", hint = "Tap the words in the right order." }) {
	const target = useMemo(() => tiles.map((t) => t.text).join(" "), [tiles]);
	const initialBank = useMemo(() => {
		let order = seededShuffle(tiles.map((_, i) => i), tiles.length * 7 + 3);
		if (tiles.length > 1 && order.map((i) => tiles[i].text).join(" ") === target) order = order.slice().reverse();
		return order;
	}, [tiles, target]);
	const [bank, setBank] = useState(initialBank);
	const [line, setLine] = useState([]);
	const [checked, setChecked] = useState(false);
	useEffect(() => {
		setBank(initialBank);
		setLine([]);
		setChecked(false);
	}, [initialBank]);
	const attempt = line.map((i) => tiles[i].text).join(" ");
	const full = line.length === tiles.length;
	const correct = full && attempt === target;
	useCheckpoint({
		solved: correct,
		activity: "sentence-builder"
	});
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
			prompt ? /* @__PURE__ */ jsx("p", {
				className: "lang-prompt",
				dir: promptDir,
				children: prompt
			}) : null,
			/* @__PURE__ */ jsx("div", {
				className: "lang-line",
				"data-state": checked ? correct ? "ok" : "no" : "idle",
				"aria-label": "your sentence",
				children: line.length === 0 ? /* @__PURE__ */ jsx("span", {
					className: "lang-line-empty",
					children: hint
				}) : line.map((i) => /* @__PURE__ */ jsx(Tile, {
					pos: tiles[i].pos,
					text: tiles[i].text,
					gloss: tiles[i].gloss,
					dir: targetDir,
					onClick: () => take(i),
					ariaLabel: `${tiles[i].text}, tap to remove`
				}, i))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lang-bank",
				"aria-label": "word bank",
				children: bank.map((i) => /* @__PURE__ */ jsx(Tile, {
					pos: tiles[i].pos,
					text: tiles[i].text,
					gloss: tiles[i].gloss,
					dir: targetDir,
					onClick: () => place(i),
					ariaLabel: `${tiles[i].text}, tap to place`
				}, i))
			}),
			/* @__PURE__ */ jsx(LiveRegion, { children: checked ? correct ? "Correct word order" : "Not the right order yet" : "" })
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: hint,
		aside: checked ? /* @__PURE__ */ jsx(StatusPill, {
			ok: correct,
			children: correct ? "✓ Correct word order" : "Not the right order yet"
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
export { SentenceBuilderLab };