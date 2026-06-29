'use client';

import { POS_LABEL, hasVoiceFor, speak } from "./deck.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/language/ui.tsx
/**
* Shared DOM UI for the language labs, Speaker button + POS-coloured Tile.
* Themed via the `.lang-*` classes shipped in `@classytic/labs/styles.css`
* (POS colours come from `--lang-pos-*` tokens). Kept here, not in the generic
* `kit/controls`, so non-language labs pay nothing for it.
*/
/**
* True once the browser's TTS voice list is populated (it loads async).
*
* Starts `false`, NOT seeded from `getVoices()`, so the first client render
* matches the server (where there's no `speechSynthesis`). Seeding from the
* live voice list would make a TTS-only item render its speaker button on the
* client but not the server → a hydration mismatch that forces React to
* regenerate the whole subtree on the client. The effect flips it true after
* mount, which is a normal post-mount update, not a hydration diff.
*/
function useVoicesReady() {
	const [ready, setReady] = useState(false);
	useEffect(() => {
		if (ready || typeof window === "undefined" || !("speechSynthesis" in window)) return;
		const sync = () => {
			if (window.speechSynthesis.getVoices().length > 0) setReady(true);
		};
		sync();
		window.speechSynthesis.addEventListener("voiceschanged", sync);
		return () => window.speechSynthesis.removeEventListener("voiceschanged", sync);
	}, [ready]);
	return ready;
}
/**
* A speaker button, renders nothing if the item can't be voiced.
*
* `audioUrl` items can voice on the server too (no browser needed), so they
* render the button consistently across SSR/hydration. Browser-TTS items only
* become voiceable once `voicesReady` flips post-mount, gating on it (instead
* of querying `window.speechSynthesis` during render) keeps the first client
* render identical to the server.
*/
function Speaker({ item, lang }) {
	const voicesReady = useVoicesReady();
	if (!(Boolean(item.audioUrl) || voicesReady && hasVoiceFor(lang))) return null;
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "lang-speak",
		"aria-label": `Play pronunciation of ${item.term}`,
		onClick: (e) => {
			e.stopPropagation();
			speak(item, lang);
		},
		children: /* @__PURE__ */ jsx("span", {
			"aria-hidden": true,
			children: "🔊"
		})
	});
}
/** A word tile coloured by part of speech, with an optional L1 gloss beneath. */
function Tile({ pos = "other", text, gloss, dir = "ltr", selected, dimmed, onClick, ariaLabel }) {
	const style = { "--pos": `var(--lang-pos-${pos})` };
	const label = ariaLabel ?? `${text}${gloss ? `, ${gloss}` : ""} (${POS_LABEL[pos]})`;
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		className: "lang-tile",
		style,
		"data-sel": selected ? "true" : void 0,
		"data-dim": dimmed ? "true" : void 0,
		onClick,
		"aria-label": label,
		"aria-pressed": selected,
		children: [/* @__PURE__ */ jsx("span", {
			className: "lang-tile-text",
			dir,
			children: text
		}), gloss ? /* @__PURE__ */ jsx("span", {
			className: "lang-tile-gloss",
			children: gloss
		}) : null]
	});
}

//#endregion
export { Speaker, Tile, useVoicesReady };