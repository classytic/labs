//#region src/language/deck.ts
const POS_LABEL = {
	noun: "noun",
	verb: "verb",
	article: "article",
	adjective: "adjective",
	preposition: "preposition",
	pronoun: "pronoun",
	conjunction: "conjunction",
	adverb: "adverb",
	other: "word"
};
/** Text direction for a BCP-47 language tag (RTL scripts → 'rtl'). */
function dirFor(lang) {
	return /^(ar|fa|ur|he|ps|sd)\b/i.test(lang) ? "rtl" : "ltr";
}
function hasVoiceFor(lang) {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
	const base = lang.toLowerCase().split("-")[0] ?? lang.toLowerCase();
	return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(base));
}
/** Can this item be voiced at all (own audio, or a matching browser voice)? */
function canSpeak(item, lang) {
	return Boolean(item.audioUrl) || hasVoiceFor(lang);
}
/** Play an item's audio. Returns false if nothing was playable. */
function speak(item, lang) {
	if (typeof window === "undefined") return false;
	if (item.audioUrl) {
		new Audio(item.audioUrl).play().catch(() => {});
		return true;
	}
	if ("speechSynthesis" in window && hasVoiceFor(lang)) {
		const u = new SpeechSynthesisUtterance(item.term);
		u.lang = lang;
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(u);
		return true;
	}
	return false;
}
/** Deterministic shuffle (seeded LCG), same input+seed → same order, so SSR
*  and client agree. Never uses Math.random at module scope. */
function seededShuffle(arr, seed = 1) {
	const a = arr.slice();
	let s = Math.abs(Math.trunc(seed)) * 1103515245 + 12345 & 2147483647;
	const rnd = () => {
		s = s * 1103515245 + 12345 & 2147483647;
		return s / 2147483647;
	};
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		const t = a[i];
		a[i] = a[j];
		a[j] = t;
	}
	return a;
}

//#endregion
export { POS_LABEL, canSpeak, dirFor, hasVoiceFor, seededShuffle, speak };